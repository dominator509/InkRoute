import { NextResponse, type NextRequest } from "next/server";
import { buildBookingPostSubmitPlan, calculateTattooReadinessScore, emptyBookingDraft, type BookingDraft } from "@inkroute/booking";
import { bookingRequestInputSchema, type BookingRequestInput } from "@inkroute/validators";
import {
  evaluateEncryptionPolicy,
  encryptTextField,
  evaluateProviderTokenEncryptionPolicy,
  getEncryptionCacheVersion,
  invalidateEncryptionCache,
  verifyEncryptionRoundTrip,
  type EncryptionPolicyResult,
} from "@inkroute/security";
import {
  checkRateLimit,
  getBookingPostPersistWorkflows,
  getClientIp,
  executeBookingPostPersistWorkflowConsumers,
  persistBookingPostPersistWorkflow,
  persistBookingRequest,
  resolveTenant,
  type LocalBookingWorkflowRecord,
} from "../../../../../lib/localRuntimeState";
import { prisma } from "@inkroute/db";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

const BOT_PROOF_HEADER = "x-inkroute-bot-proof";
const BOT_PROOF_TTL_SECONDS = 300;
const BOT_SECRET_ENV = "BOOKING_SUBMISSION_BOT_SECRET";
const ENCRYPTION_CACHE_REFRESH_HEADER = "x-inkroute-encryption-cache-refresh";

type BotProofStatus = "passed" | "missing" | "expired" | "invalid" | "disabled";

interface BotProofResult {
  required: boolean;
  status: BotProofStatus;
  reason: string;
  requiredFor: "database" | "local-fallback";
  nowUnixSeconds: number;
  proofIssuedAt?: number;
  hasHeader: boolean;
  bodyHash: string;
  secretConfigured: boolean;
  skewSeconds?: number;
}

interface EncryptionAttemptRecord {
  status: "stored" | "redacted" | "not-required";
  keyVersion: string;
  reason?: string;
  roundTripVerified?: boolean;
}

interface ProviderTokenIntake {
  detected: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  providerHint: string | null;
}

interface ParsedBotProof {
  version: number;
  issuedAt: number;
  nonce: string;
  bodyHash: string;
  signature: string;
}

interface PostPersistWorkflowSummary {
  id: string;
  type: "notification" | "reference-upload" | "deposit" | "calendar";
  status: "pending" | "queued" | "blocked";
  payload: Record<string, unknown>;
}

type BookingInput = BookingRequestInput & {
  medicalNotes?: string | undefined;
};

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;
  if (error.message.includes("PRISMA_CLIENT_UNAVAILABLE")) return true;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function invalidateCacheIfRequested(request: NextRequest): Promise<{ before: number; after?: number } | undefined> {
  const refreshHeader = request.headers.get(ENCRYPTION_CACHE_REFRESH_HEADER)?.toLowerCase();
  if (!refreshHeader || (refreshHeader !== "1" && refreshHeader !== "true")) return undefined;
  const before = getEncryptionCacheVersion();
  const after = invalidateEncryptionCache();
  return { before, after };
}

async function toUtf8Bytes(value: string): Promise<Uint8Array> {
  return new TextEncoder().encode(value);
}

function bytesToHex(bytes: Uint8Array | ArrayLike<number>): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function computeSha256Hex(input: string): Promise<string> {
  const source = await toUtf8Bytes(input);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", source.slice().buffer);
    return bytesToHex(new Uint8Array(digest));
  }

  try {
    const nodeCrypto = await import("node:crypto");
    return nodeCrypto.createHash("sha256").update(input).digest("hex");
  } catch {
    return "";
  }
}

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const keyMaterial = await toUtf8Bytes(secret);
  const payload = await toUtf8Bytes(message);

  if (globalThis.crypto?.subtle) {
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      keyMaterial.slice().buffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, payload.slice().buffer);
    return bytesToHex(new Uint8Array(signature));
  }

  try {
    const nodeCrypto = await import("node:crypto");
    return nodeCrypto.createHmac("sha256", secret).update(message).digest("hex");
  } catch {
    return "";
  }
}

function parseBotProofHeader(headerValue: string): ParsedBotProof | null {
  const [versionRaw, issuedAtRaw, nonce, bodyHash, signature] = headerValue.split("|");
  if (!versionRaw || !issuedAtRaw || !nonce || !bodyHash || !signature) return null;
  if (versionRaw !== "1") return null;
  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return null;
  if (nonce.length < 6) return null;
  if (signature.length < 16) return null;
  return {
    version: 1,
    issuedAt,
    nonce,
    bodyHash,
    signature: signature.toLowerCase(),
  };
}

function safeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let delta = 0;
  for (let index = 0; index < left.length; index += 1) {
    delta |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return delta === 0;
}

function buildBotProofFailureDetails(check: BotProofResult) {
  return {
    status: check.status,
    requiredFor: check.requiredFor,
    reason: check.reason,
    skewSeconds: check.skewSeconds,
    required: check.required,
    hasHeader: check.hasHeader,
    secretConfigured: check.secretConfigured,
    bodyHash: check.bodyHash,
  };
}

async function evaluateBotProof(request: NextRequest, tenantSlug: string, bodyText: string, scope: TenantResolution["source"]): Promise<BotProofResult> {
  const nowUnixSeconds = Math.floor(Date.now() / 1000);
  const secret = process.env[ BOT_SECRET_ENV ];
  const bodyHash = await computeSha256Hex(bodyText);
  const header = request.headers.get(BOT_PROOF_HEADER);
  const required = scope === "database";

  if (!secret) {
    return {
      required,
      status: required ? "disabled" : "disabled",
      reason: required ? "Missing bot secret prevents production DB persistence checks." : "No bot proof secret is configured for this scope.",
      requiredFor: scope,
      nowUnixSeconds,
      hasHeader: Boolean(header),
      bodyHash,
      secretConfigured: false,
    };
  }

  if (!header) {
    return {
      required,
      status: required ? "missing" : "missing",
      reason: required ? "Missing x-inkroute-bot-proof header." : "No bot proof header was submitted.",
      requiredFor: scope,
      nowUnixSeconds,
      hasHeader: false,
      bodyHash,
      secretConfigured: true,
    };
  }

  const parsed = parseBotProofHeader(header);
  if (!parsed) {
    return {
      required,
      status: "invalid",
      reason: "Malformed x-inkroute-bot-proof header.",
      requiredFor: scope,
      nowUnixSeconds,
      hasHeader: true,
      bodyHash,
      secretConfigured: true,
    };
  }

  if (parsed.bodyHash !== bodyHash) {
    return {
      required,
      status: "invalid",
      reason: "Body hash in proof does not match this request payload.",
      requiredFor: scope,
      nowUnixSeconds,
      proofIssuedAt: parsed.issuedAt,
      hasHeader: true,
      bodyHash,
      secretConfigured: true,
    };
  }

  const skewSeconds = Math.abs(nowUnixSeconds - parsed.issuedAt);
  if (skewSeconds > BOT_PROOF_TTL_SECONDS) {
    return {
      required,
      status: "expired",
      reason: `Bot proof timestamp is outside ${BOT_PROOF_TTL_SECONDS}s TTL.`,
      requiredFor: scope,
      nowUnixSeconds,
      proofIssuedAt: parsed.issuedAt,
      hasHeader: true,
      bodyHash,
      secretConfigured: true,
      skewSeconds,
    };
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const message = `${tenantSlug}|${clientIp}|${parsed.issuedAt}|${parsed.nonce}|${parsed.bodyHash}`;
  const expectedSignature = await computeHmacSha256Hex(secret, message);
  if (!safeEquals(expectedSignature, parsed.signature)) {
    return {
      required,
      status: "invalid",
      reason: "Bot proof signature mismatch.",
      requiredFor: scope,
      nowUnixSeconds,
      proofIssuedAt: parsed.issuedAt,
      hasHeader: true,
      bodyHash,
      secretConfigured: true,
      skewSeconds,
    };
  }

  return {
    required,
    status: "passed",
    reason: "HMAC bot proof accepted.",
    requiredFor: scope,
    nowUnixSeconds,
    proofIssuedAt: parsed.issuedAt,
    hasHeader: true,
    bodyHash,
    secretConfigured: true,
    skewSeconds,
  };
}

function shouldCollectReferenceUpload(input: BookingInput): boolean {
  const intent = `${input.ideaSummary} ${input.style} ${input.placement}`.toLowerCase();
  return ["reference", "reference photo", "reference image", "reference pictures", "photo", "upload", "inspo", "inspiration", "example"].some((keyword) => intent.includes(keyword));
}


function buildBookingDraftFromInput(input: BookingInput): BookingDraft {
  return {
    ...emptyBookingDraft,
    preferredCitySlug: input.preferredCity,
    preferredDateWindow: input.preferredDate ? new Date(input.preferredDate).toISOString() : "Flexible",
    style: input.style,
    placement: input.placement,
    sizeEstimate: input.sizeEstimate,
    budgetRange:
      input.budgetMin !== undefined && input.budgetMax !== undefined
        ? `$${input.budgetMin}-${input.budgetMax}`
        : input.budgetMin !== undefined
          ? `From $${input.budgetMin}`
          : input.budgetMax !== undefined
            ? `Up to $${input.budgetMax}`
            : "Requested after consultation",
    ideaSummary: input.ideaSummary,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    policyAccepted: input.policyAccepted,
    ageAcknowledged: true,
    privacyAcknowledged: true,
    depositBoundaryAcknowledged: true,
    ...(input.portfolioAttributionId ? { portfolioAttributionId: input.portfolioAttributionId } : {}),
  };
}

function buildReadinessScore(input: BookingInput): number {
  const draft = {
    ...emptyBookingDraft,
    preferredCitySlug: input.preferredCity,
    preferredDateWindow: input.preferredDate ? new Date(input.preferredDate).toISOString() : "Flexible",
    style: input.style,
    placement: input.placement,
    sizeEstimate: input.sizeEstimate,
    budgetRange:
      input.budgetMin !== undefined && input.budgetMax !== undefined
        ? `$${input.budgetMin}-${input.budgetMax}`
        : input.budgetMin !== undefined
          ? `From $${input.budgetMin}`
          : input.budgetMax !== undefined
            ? `Up to $${input.budgetMax}`
            : "Requested after consultation",
    ideaSummary: input.ideaSummary,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    policyAccepted: input.policyAccepted,
    ageAcknowledged: true,
    privacyAcknowledged: true,
    depositBoundaryAcknowledged: true,
  };
  return calculateTattooReadinessScore(draft).percentage;
}

function buildKeyLifecycleSnapshot(
  encryptionPolicy: EncryptionPolicyResult,
  providerTokenPolicy: EncryptionPolicyResult,
  cacheVersion: { before: number; after?: number } | undefined,
) {
  const before = cacheVersion?.before ?? encryptionPolicy.rotation.cacheVersion;
  const after = cacheVersion?.after ?? before;

  return {
    encryptionReady: encryptionPolicy.readiness.ready,
    encryptionStatus: encryptionPolicy.status,
    encryptionReadinessStatus: encryptionPolicy.readiness.status,
    encryptionReadinessReason: encryptionPolicy.readiness.reason,
    providerTokenReady: providerTokenPolicy.readiness.ready,
    providerTokenStatus: providerTokenPolicy.status,
    providerTokenReadinessStatus: providerTokenPolicy.readiness.status,
    providerTokenReadinessReason: providerTokenPolicy.readiness.reason,
    scope: encryptionPolicy.scope,
    cacheVersion: {
      before,
      after,
      rotationRefreshed: after !== before,
    },
    encryptionRotation: encryptionPolicy.rotation,
    providerTokenRotation: providerTokenPolicy.rotation,
  };
}

function detectProviderTokenIntake(payload: unknown): ProviderTokenIntake {
  const root = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const raw = root.providerTokenIntake ?? root.providerToken ?? root.providerTokens;
  if (!raw || typeof raw !== "object") {
    return { detected: false, hasAccessToken: false, hasRefreshToken: false, providerHint: null };
  }

  const tokenPayload = raw as Record<string, unknown>;
  const hasAccessToken = typeof tokenPayload.accessToken === "string" && tokenPayload.accessToken.trim().length > 0;
  const hasRefreshToken = typeof tokenPayload.refreshToken === "string" && tokenPayload.refreshToken.trim().length > 0;
  return {
    detected: hasAccessToken || hasRefreshToken,
    hasAccessToken,
    hasRefreshToken,
    providerHint: typeof tokenPayload.provider === "string" && tokenPayload.provider.trim() ? tokenPayload.provider.trim() : null,
  };
}

function buildReferenceUploadContract(tenantSlug: string, bookingRequestId: string, scope: TenantResolution["source"]) {
  const isDbScope = scope === "database";
  const contract = {
    required: true,
    status: isDbScope ? "queued" : "local-runtime-ready",
    consumer: isDbScope ? "reference-upload-worker" : "reference-upload-intent-route",
    endpoint: `/api/public/${encodeURIComponent(tenantSlug)}/secure-upload-intents`,
    method: "POST",
    queueHint: "reference-upload-intent",
    handoffReference: {
      requiredBookingRequestId: bookingRequestId,
      signedIntentRoute: `/api/public/${encodeURIComponent(tenantSlug)}/secure-upload-intents`,
      handoffHeaders: ["x-inkroute-upload-intent", "x-inkroute-upload-signature"],
      expiresAfterSeconds: 900,
      grantType: "single-use-signed-intent",
    },
    expectedPayload: {
      kind: "reference_private",
      declaredByAuthenticatedUser: false,
      filename: "string",
      mimeType: "image/png|image/jpeg|image/webp|image/heic",
      sizeBytes: "0 < sizeBytes <= 15728640",
    },
    notes: [
      "Treat returned draft as a short-lived handoff input to signed upload route and queue worker.",
      "Production should require authenticated user OR protected upload token and provider signature on intent creation.",
      isDbScope
        ? "Production should persist signed intent contract + queue message before upload is accepted."
        : "Local runtime should persist intent stub and return signedUploadUrl/intent contract fields from local runtime state.",
    ],
    gapIds: ["GAP-005", "GAP-021", "GAP-033", "GAP-096", "GAP-097"],
  };
  return contract;
}

function buildNotificationQueueContract(input: BookingInput) {
  return {
    queued: true,
    consumer: "notification-worker",
    contract: "notification-queue-stub",
    trigger: "booking_request_submitted",
    templateKeys: ["booking_request_received"],
    channels: ["email", "sms", "push", "in_app"],
    requiresConsentAwareRoutes: true,
    reasons: ["Persist MessageThread and Notification records in producer transaction in production.", "Use provider credentials and suppression rules before delivery."],
    destinationData: {
      artistId: input.artistId,
      preferredCity: input.preferredCity,
      style: input.style,
      placement: input.placement,
    },
    gapIds: ["GAP-064", "GAP-061", "GAP-010", "GAP-063"],
  };
}

function buildDepositQueueContract(input: BookingInput) {
  return {
    queued: false,
    status: "blocked",
    consumer: "checkout/session-worker",
    contract: "deposit-policy-evaluation-stub",
    trigger: "booking_request_submitted",
    requiredBeforeEnablement: [
      "Artist/client policy acceptance and deposit policy snapshot persistence",
      "Dashboard action or short-lived signed deposit token gate",
      "Stripe Checkout/session creation",
      "Payment audit and provider reconciliation webhooks",
    ],
    fallbackState: {
      artistId: input.artistId,
      preferredCity: input.preferredCity,
    },
    gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-069"],
  };
}

function buildCalendarQueueContract(input: BookingInput) {
  return {
    queued: false,
    status: "blocked",
    consumer: "calendar-sync-worker",
    contract: "calendar-hold-stub",
    trigger: "booking_request_submitted",
    requiredBeforeEnablement: [
      "Calendar hold creation under transaction",
      "Artist/team scheduling intent resolution",
      "Timezone/DST-safe availability reconciliation",
      "Encrypted calendar provider token checks",
    ],
    artistPreference: {
      preferredCity: input.preferredCity,
      preferredDate: input.preferredDate,
      sizeEstimate: input.sizeEstimate,
    },
    gapIds: ["GAP-008", "GAP-009", "GAP-055", "GAP-057"],
  };
}

function normalizeBookingInput(input: BookingInput) {
  return {
    ...input,
    medicalNotesProvided: Boolean(input.medicalNotes && input.medicalNotes.trim().length > 0),
  };
}

function normalizeTenantSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function buildWorkflowSummary(records: ReturnType<typeof getBookingPostPersistWorkflows>): PostPersistWorkflowSummary[] {
  return records.map((record) => ({
    id: record.id,
    type: record.type,
    status: record.status,
    payload: record.payload,
  }));
}

async function resolveTenantScope(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    if (tenant?.id) {
      return { tenantId: tenant.id, source: "database" };
    }
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

function buildPostPersistWorkflowPlans(
  input: BookingInput,
  tenantSlug: string,
  bookingRequestId: string,
  workflowScope: TenantResolution["source"],
) {
  const referenceUploadRequested = shouldCollectReferenceUpload(input);
  const summaries: Array<Omit<LocalBookingWorkflowRecord, "tenantId" | "createdAt" | "id">> = [
    { bookingRequestId, type: "notification", status: "queued", payload: buildNotificationQueueContract(input) },
    { bookingRequestId, type: "deposit", status: "blocked", payload: buildDepositQueueContract(input) },
    { bookingRequestId, type: "calendar", status: "blocked", payload: buildCalendarQueueContract(input) },
  ];

  if (referenceUploadRequested) {
    summaries.push({
      bookingRequestId,
      type: "reference-upload",
      status: "queued",
      payload: buildReferenceUploadContract(tenantSlug, bookingRequestId, workflowScope),
    });
  }
  return summaries;
}

function persistBookingPostPersistWorkflows(
  tenantSlug: string,
  bookingRequestId: string,
  input: BookingInput,
  workflowScope: TenantResolution["source"],
) {
  const summaries = buildPostPersistWorkflowPlans(input, tenantSlug, bookingRequestId, workflowScope);

  for (const summary of summaries) {
    persistBookingPostPersistWorkflow(tenantSlug, summary);
  }

  return getBookingPostPersistWorkflows(tenantSlug, bookingRequestId);
}

function countPlannedPostPersistWorkflows(
  input: BookingInput,
  tenantSlug: string,
  bookingRequestId: string,
  workflowScope: TenantResolution["source"],
) {
  return buildPostPersistWorkflowPlans(input, tenantSlug, bookingRequestId, workflowScope).length;
}

async function persistBookingRequestToDatabase(
  tenantSlug: string,
  tenantId: string,
  input: BookingInput,
  encryptionPolicy: EncryptionPolicyResult,
  encryptionAttempt: EncryptionAttemptRecord,
  providerTokenPolicy: EncryptionPolicyResult,
  providerTokenIntake: ProviderTokenIntake,
  cacheVersion: { before: number; after?: number } | undefined,
  medicalNotesEncrypted: string | null,
  antiBot: BotProofResult,
) {
  return prisma.$transaction(async (tx) => {
    const artist = await tx.artist.findFirst({
      where: {
        id: input.artistId,
        tenantId,
      },
      select: { id: true },
    });
    if (!artist) throw new Error("ARTIST_NOT_FOUND");

    let travelCityId: string | null = null;
    if (input.travelCityId) {
      const city = await tx.travelCity.findFirst({
        where: { id: input.travelCityId, tenantId },
        select: { id: true },
      });
      if (!city) throw new Error("TRAVEL_CITY_NOT_FOUND");
      travelCityId = city.id;
    }

    let portfolioAttributionId: string | null = null;
    if (input.portfolioAttributionId) {
      const portfolio = await tx.portfolioItem.findFirst({
        where: { id: input.portfolioAttributionId, tenantId },
        select: { id: true },
      });
      if (!portfolio) throw new Error("PORTFOLIO_ITEM_NOT_FOUND");
      portfolioAttributionId = portfolio.id;
    }

    const normalizedEmail = input.clientEmail.toLowerCase();
    const client = await tx.client.upsert({
      where: { tenantId_email: { tenantId, email: normalizedEmail } },
      update: {
        preferredName: input.clientName,
        phone: input.clientPhone ?? null,
      },
      create: {
        tenantId,
        email: normalizedEmail,
        preferredName: input.clientName,
        phone: input.clientPhone ?? null,
      },
    });
    if (!client.id) {
      throw new Error("CLIENT_UPSERT_FAILED");
    }

    const booking = await tx.bookingRequest.create({
      data: {
        tenantId,
        artistId: input.artistId,
        clientId: client.id,
        travelCityId,
        status: "submitted",
        clientNameSnapshot: input.clientName,
        clientEmailSnapshot: normalizedEmail,
        clientPhoneSnapshot: input.clientPhone ?? null,
        preferredCity: input.preferredCity,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        style: input.style,
        placement: input.placement,
        sizeEstimate: input.sizeEstimate,
        budgetMinCents: input.budgetMin ?? null,
        budgetMaxCents: input.budgetMax ?? null,
        ideaSummary: input.ideaSummary,
        medicalNotesEncrypted: medicalNotesEncrypted,
        readinessScore: buildReadinessScore(input),
        policyAcceptedAt: new Date(),
        portfolioAttributionId,
        source: "public_site",
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
      },
    });

    const workflowCount = countPlannedPostPersistWorkflows(input, tenantSlug, booking.id, "database");

    const event = await tx.bookingStateEvent.create({
      data: {
        tenantId: booking.tenantId,
        bookingRequestId: booking.id,
        actorUserId: null,
        type: "submitted",
        toStatus: booking.status,
        note: "Booking request persisted from public route and workflow stubs recorded.",
        metadata: { workflowCount },
      },
      select: { id: true, type: true, actorUserId: true, toStatus: true, note: true, createdAt: true, metadata: true },
    });

    const audit = await tx.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        action: "booking_request:create",
        entityType: "BookingRequest",
        entityId: booking.id,
        metadata: toJsonValue({
          source: "public_api",
          tenantId,
          artistId: input.artistId,
          travelCityId,
          portfolioAttributionId,
          preferredCity: input.preferredCity,
          route: "/api/public/[tenantSlug]/booking-requests",
          readinessScore: booking.readinessScore,
          providerTokenIntake: {
            detected: providerTokenIntake.detected,
            hasAccessToken: providerTokenIntake.hasAccessToken,
            hasRefreshToken: providerTokenIntake.hasRefreshToken,
            providerHint: providerTokenIntake.providerHint,
          },
          antiBot: {
            requiredFor: antiBot.requiredFor,
            status: antiBot.status,
            reason: antiBot.reason,
            skewSeconds: antiBot.skewSeconds,
          },
          encryption: {
            policy: encryptionPolicy,
            medicalNotes: encryptionAttempt,
            providerToken: providerTokenPolicy,
          },
          keyLifecycle: buildKeyLifecycleSnapshot(encryptionPolicy, providerTokenPolicy, cacheVersion),
        }),
      },
    });

    return {
      booking,
      event,
      auditId: audit.id,
      readinessScore: booking.readinessScore,
      source: "database",
      workflowCount,
    };
  });
}

function buildResponseBase(
  input: BookingInput,
  tenantSlug: string,
  resolvedTenant: TenantResolution,
  antiBot: BotProofResult,
  encryptionPolicy: EncryptionPolicyResult,
  encryptionAttempt: EncryptionAttemptRecord,
  providerTokenPolicy: EncryptionPolicyResult,
  providerTokenIntake: ProviderTokenIntake,
  cacheRefresh?: { before: number; after?: number },
  bookingRequestId?: string,
) {
  const postPersistWorkflows = {
    notification: buildNotificationQueueContract(input),
    deposit: buildDepositQueueContract(input),
    calendar: buildCalendarQueueContract(input),
  };
  const antiBotDetails = {
    requiredFor: antiBot.requiredFor,
    status: antiBot.status,
    required: antiBot.required,
    reason: antiBot.reason,
    hasHeader: antiBot.hasHeader,
    header: BOT_PROOF_HEADER,
    bodyHash: antiBot.bodyHash,
    secretConfigured: antiBot.secretConfigured,
    proofWindowSeconds: BOT_PROOF_TTL_SECONDS,
    requestNowUnixSeconds: antiBot.nowUnixSeconds,
    ...(antiBot.proofIssuedAt !== undefined ? { proofIssuedAtUnixSeconds: antiBot.proofIssuedAt } : {}),
    ...(antiBot.skewSeconds !== undefined ? { skewSeconds: antiBot.skewSeconds } : {}),
  };
  const encryptionDetails = {
    policy: encryptionPolicy.status,
    canPersist: encryptionPolicy.canPersist,
    requiredFields: encryptionPolicy.requiredFields,
    readiness: encryptionPolicy.readiness,
    rotation: encryptionPolicy.rotation,
    attempt: encryptionAttempt,
    providerTokenPolicy: providerTokenPolicy,
    providerTokenIntake: {
      detected: providerTokenIntake.detected,
      hasAccessToken: providerTokenIntake.hasAccessToken,
      hasRefreshToken: providerTokenIntake.hasRefreshToken,
      providerHint: providerTokenIntake.providerHint,
    },
    ...(cacheRefresh !== undefined ? { cacheRefresh } : {}),
    lifecycle: buildKeyLifecycleSnapshot(encryptionPolicy, providerTokenPolicy, cacheRefresh),
  };

  return {
    tenantSlug,
    tenantId: resolvedTenant.tenantId,
    antiBot: antiBotDetails,
    encryption: encryptionDetails,
    workflows: {
      packagePostSubmitPlan: buildBookingPostSubmitPlan({
        tenantId: resolvedTenant.tenantId,
        bookingRequestId: bookingRequestId ?? "pending",
        submittedAt: new Date().toISOString(),
        draft: buildBookingDraftFromInput(input),
      }),
      queueContract: {
        ...postPersistWorkflows,
        referenceUpload: shouldCollectReferenceUpload(input)
          ? buildReferenceUploadContract(tenantSlug, bookingRequestId ?? "pending", resolvedTenant.source)
          : undefined,
      },
    },
  };
}

function buildLocalResponse(
  tenantSlug: string,
  tenantId: string,
  input: BookingInput,
  antiBot: BotProofResult,
  encryptionPolicy: EncryptionPolicyResult,
  encryptionAttempt: EncryptionAttemptRecord,
  providerTokenPolicy: EncryptionPolicyResult,
  providerTokenIntake: ProviderTokenIntake,
  cacheRefresh?: { before: number; after?: number },
) {
  const persisted = persistBookingRequest(tenantSlug, input);
  const workflowRecords = persistBookingPostPersistWorkflows(tenantSlug, persisted.request.id, input, "local-fallback");
  const workflowExecutions = executeBookingPostPersistWorkflowConsumers(tenantSlug, persisted.request.id, "local-fallback");
  const responseBase = buildResponseBase(
    input,
    tenantSlug,
    { tenantId, source: "local-fallback" },
    antiBot,
    encryptionPolicy,
    encryptionAttempt,
    providerTokenPolicy,
    providerTokenIntake,
    cacheRefresh,
    persisted.request.id,
  );
  const workflowPlanned = buildWorkflowSummary(workflowRecords);
  const workflowReference = workflowPlanned.find((summary) => summary.type === "reference-upload");
  const referenceUpload = workflowReference
    ? workflowReference.payload
    : shouldCollectReferenceUpload(input)
      ? buildReferenceUploadContract(tenantSlug, persisted.request.id, "local-fallback")
      : undefined;
  return {
    ...responseBase,
    persistence: "local-runtime",
    booking: persisted.request,
    readinessScore: persisted.readinessScore,
    events: persisted.events,
    workflows: {
      ...responseBase.workflows,
      planned: workflowPlanned,
      referenceUpload,
      executed: workflowExecutions,
    },
    warning: "Database was unavailable or unresolved at request time; booking request persisted in local runtime.",
    gapIds: ["GAP-004", "GAP-017", "GAP-021", "GAP-031", "GAP-033"],
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
  let bodyText = "";

  try {
    bodyText = await request.text();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must be readable as UTF-8 text.",
        },
      },
      { status: 400 },
    );
  }

  if (!bodyText.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body is required and must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(bodyText) as unknown;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = bookingRequestInputSchema.safeParse(parsedPayload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Booking request input did not pass shared schema validation.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const payload = normalizeBookingInput(parsed.data);
  const resolvedTenant = await resolveTenantScope(normalizedTenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TENANT_NOT_FOUND",
          message: "Booking submission is available only for tenant-known routes in DB-backed mode or demo local tenant.",
        },
      },
      { status: 404 },
    );
  }

  const cacheVersion = await invalidateCacheIfRequested(request);
  if (cacheVersion) {
    console.info(
      `encryption cache invalidated before booking request persistence: before=${cacheVersion.before}, after=${cacheVersion.after}`,
    );
  }

  const antiBot = await evaluateBotProof(request, normalizedTenantSlug, bodyText, resolvedTenant.source);
  if (antiBot.required && antiBot.status !== "passed") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOT_PROTECTION_REQUIRED",
          message: "Booking persistence was blocked by anti-bot policy.",
          details: {
            ...buildBotProofFailureDetails(antiBot),
            header: BOT_PROOF_HEADER,
            expectedWindowSeconds: BOT_PROOF_TTL_SECONDS,
            gapIds: ["GAP-031", "GAP-095"],
          },
        },
      },
      { status: 403 },
    );
  }

  const requiredEncryptionFields = payload.medicalNotesProvided ? ["medicalNotesEncrypted"] : [];
  const encryptionPolicy = await evaluateEncryptionPolicy({
    operation: "booking-request:create",
    scope: resolvedTenant.source,
    requiredFields: requiredEncryptionFields,
  });
  const providerTokenPolicy = await evaluateProviderTokenEncryptionPolicy(resolvedTenant.source);
  const providerTokenIntake = detectProviderTokenIntake(parsedPayload);

  if (providerTokenIntake.detected && !providerTokenPolicy.readiness.ready) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_TOKEN_ENCRYPTION_POLICY_DENIED",
          message: "Provider token payload was supplied but provider-token encryption readiness is not valid.",
          details: {
            providerTokenIntake: {
              providerHint: providerTokenIntake.providerHint,
              hasAccessToken: providerTokenIntake.hasAccessToken,
              hasRefreshToken: providerTokenIntake.hasRefreshToken,
            },
            providerTokenPolicy,
            gapIds: ["GAP-021", "GAP-057", "GAP-101"],
          },
        },
      },
      { status: 503 },
    );
  }

  if (resolvedTenant.source === "database" && !encryptionPolicy.canPersist) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ENCRYPTION_POLICY_DENIED",
          message: "Booking submission was denied by key-policy enforcement.",
          details: {
            ...encryptionPolicy,
            requiredFields: encryptionPolicy.requiredFields,
            gapIds: ["GAP-021"],
          },
        },
      },
      { status: 503 },
    );
  }

  let encryptedMedicalNotes: string | null = null;
  let encryptionAttempt: EncryptionAttemptRecord = {
    status: "not-required",
    keyVersion: encryptionPolicy.readiness.keyVersion,
    reason: payload.medicalNotesProvided ? "Medical notes encryption will be applied for persistence." : "No medical notes provided.",
  };

  if (payload.medicalNotesProvided) {
    if (resolvedTenant.source === "database") {
      const encryptAttempt = await encryptTextField(payload.medicalNotes);
      const roundTripProof = await verifyEncryptionRoundTrip(payload.medicalNotes, encryptAttempt.encryptedValue);
      encryptionAttempt = {
        status: encryptAttempt.status,
        keyVersion: encryptAttempt.keyVersion,
        ...(encryptAttempt.reason ? { reason: encryptAttempt.reason } : {}),
        roundTripVerified: roundTripProof.ok,
      };

      if (!roundTripProof.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "ENCRYPTION_DECRYPTION_MISMATCH",
              message: "Booking request was rejected because encryption round-trip proof failed.",
              details: {
                reason: roundTripProof.reason,
                status: encryptAttempt.status,
                keyVersion: encryptAttempt.keyVersion,
                gapIds: ["GAP-021"],
              },
            },
          },
          { status: 500 },
        );
      }

      if (encryptAttempt.status !== "stored") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "MEDICAL_NOTES_ENCRYPTION_FAILED",
              message: "Booking was not persisted because medical notes encryption was unavailable.",
              details: {
                status: encryptAttempt.status,
                reason: encryptAttempt.reason,
                encryptionReady: encryptAttempt.keyVersion,
                gapIds: ["GAP-021"],
              },
            },
          },
          { status: 503 },
        );
      }

      encryptedMedicalNotes = encryptAttempt.encryptedValue;
    } else {
      encryptionAttempt = {
        status: "redacted",
        keyVersion: encryptionPolicy.readiness.keyVersion,
        reason: "Local fallback does not persist medical notes in durable local runtime storage.",
        roundTripVerified: false,
      };
    }
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-booking-submit", normalizedTenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Booking submission is temporarily limited by anti-abuse rule.",
          details: {
            gapIds: ["GAP-031", "GAP-095"],
            maxRequests: rateLimit.maxRequests,
            windowSeconds: rateLimit.windowSeconds,
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (resolvedTenant.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        data: buildLocalResponse(
          normalizedTenantSlug,
          resolvedTenant.tenantId,
          payload,
          antiBot,
          encryptionPolicy,
          encryptionAttempt,
          providerTokenPolicy,
          providerTokenIntake,
          cacheVersion,
        ),
      },
      { status: 201 },
    );
  }

  try {
    const persisted = await persistBookingRequestToDatabase(
      normalizedTenantSlug,
      resolvedTenant.tenantId,
      payload,
      encryptionPolicy,
      encryptionAttempt,
      providerTokenPolicy,
      providerTokenIntake,
      cacheVersion,
      encryptedMedicalNotes,
      antiBot,
    );
    const workflowRecords = persistBookingPostPersistWorkflows(normalizedTenantSlug, persisted.booking.id, payload, resolvedTenant.source);
    const workflowExecutions = executeBookingPostPersistWorkflowConsumers(normalizedTenantSlug, persisted.booking.id, resolvedTenant.source);
    const responseBase = buildResponseBase(
      payload,
      normalizedTenantSlug,
      resolvedTenant,
      antiBot,
      encryptionPolicy,
      encryptionAttempt,
      providerTokenPolicy,
      providerTokenIntake,
      cacheVersion,
      persisted.booking.id,
    );
    return NextResponse.json(
      {
        ok: true,
        data: {
          ...responseBase,
          persistence: "database",
          booking: {
            id: persisted.booking.id,
            tenantId: persisted.booking.tenantId,
            artistId: persisted.booking.artistId,
            clientId: persisted.booking.clientId,
            ...(persisted.booking.travelCityId ? { travelCityId: persisted.booking.travelCityId } : {}),
            status: persisted.booking.status,
            clientName: persisted.booking.clientNameSnapshot,
            clientEmail: persisted.booking.clientEmailSnapshot,
            preferredCity: persisted.booking.preferredCity,
            ...(persisted.booking.preferredDate ? { preferredDate: persisted.booking.preferredDate.toISOString() } : {}),
            style: persisted.booking.style,
            placement: persisted.booking.placement,
            sizeEstimate: persisted.booking.sizeEstimate,
            ...(persisted.booking.budgetMinCents !== null ? { budgetMin: persisted.booking.budgetMinCents } : {}),
            ...(persisted.booking.budgetMaxCents !== null ? { budgetMax: persisted.booking.budgetMaxCents } : {}),
            ideaSummary: persisted.booking.ideaSummary,
            readinessScore: persisted.readinessScore,
            policyAccepted: Boolean(persisted.booking.policyAcceptedAt),
            ...(persisted.booking.portfolioAttributionId ? { portfolioAttributionId: persisted.booking.portfolioAttributionId } : {}),
            createdAt: persisted.booking.createdAt.toISOString(),
          },
          auditId: persisted.auditId,
          event: {
            id: persisted.event.id,
            eventType: persisted.event.type,
            actor: "client",
            at: persisted.event.createdAt.toISOString(),
            note: persisted.event.note ?? "Booking request persisted from public route.",
          },
          workflows: {
            ...responseBase.workflows,
            planned: buildWorkflowSummary(workflowRecords),
            executed: workflowExecutions,
          },
          antiBot: responseBase.antiBot,
          encryption: {
            ...responseBase.encryption,
            keyCacheVersion: cacheVersion ? (cacheVersion.after ?? cacheVersion.before) : encryptionPolicy.rotation.cacheVersion,
          },
          gapIds: ["GAP-004", "GAP-017", "GAP-021", "GAP-031", "GAP-032", "GAP-033"],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: true,
          data: buildLocalResponse(
            normalizedTenantSlug,
            resolvedTenant.tenantId,
            payload,
            antiBot,
            encryptionPolicy,
            encryptionAttempt,
            providerTokenPolicy,
            providerTokenIntake,
            cacheVersion,
          ),
          warning: "Database was temporarily unavailable; request persisted to local runtime.",
        },
        { status: 201 },
      );
    }

    if (error instanceof Error) {
      type KnownPersistenceCode = "ARTIST_NOT_FOUND" | "TRAVEL_CITY_NOT_FOUND" | "PORTFOLIO_ITEM_NOT_FOUND";
      const knownMessages: Record<KnownPersistenceCode, string> = {
        ARTIST_NOT_FOUND: "Selected artistId was not found for this tenant.",
        TRAVEL_CITY_NOT_FOUND: "Selected travelCityId was not found for this tenant.",
        PORTFOLIO_ITEM_NOT_FOUND: "Selected portfolioAttributionId was not found for this tenant.",
      };
      const knownCode: KnownPersistenceCode | undefined =
        error.message === "ARTIST_NOT_FOUND" || error.message === "TRAVEL_CITY_NOT_FOUND" || error.message === "PORTFOLIO_ITEM_NOT_FOUND"
          ? error.message
          : undefined;
      if (knownCode) {
        return NextResponse.json({ ok: false, error: { code: knownCode, message: knownMessages[knownCode], antiBot: buildBotProofFailureDetails(antiBot) } }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_PERSISTENCE_FAILED",
          message: "Booking route accepted input but persistence failed while writing production records.",
          antiBot: buildBotProofFailureDetails(antiBot),
          encryption: encryptionPolicy.status,
        },
      },
      { status: 500 },
    );
  }
}



