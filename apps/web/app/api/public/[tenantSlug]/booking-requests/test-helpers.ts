import { type BookingRequestInput } from "@inkroute/validators";
import { getClientIp } from "../../../../../lib/localRuntimeState";
import type { LocalBookingWorkflowRecord } from "../../../../../lib/localRuntimeState";

export type BotProofStatus = "passed" | "missing" | "expired" | "invalid" | "disabled";

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

type BookingInput = BookingRequestInput & {
  medicalNotes?: string | undefined;
};

type WorkflowScope = "database" | "local-fallback";

const BOT_PROOF_HEADER = "x-inkroute-bot-proof";
const BOT_PROOF_TTL_SECONDS = 300;
const BOT_SECRET_ENV = "BOOKING_SUBMISSION_BOT_SECRET";

function toUtf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function bytesToHex(bytes: Uint8Array | ArrayLike<number>): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function computeSha256Hex(input: string): Promise<string> {
  const source = toUtf8Bytes(input);
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
  const keyMaterial = toUtf8Bytes(secret);
  const payload = toUtf8Bytes(message);

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

function parseBotProofHeader(headerValue: string): {
  version: number;
  issuedAt: number;
  nonce: string;
  bodyHash: string;
  signature: string;
} | null {
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

export function shouldCollectReferenceUpload(input: BookingInput): boolean {
  const intent = `${input.ideaSummary} ${input.style} ${input.placement}`.toLowerCase();
  return ["reference", "reference photo", "reference image", "reference pictures", "photo", "upload", "inspo", "inspiration", "example"].some((keyword) =>
    intent.includes(keyword),
  );
}

export async function evaluateBotProof(
  request: Request,
  tenantSlug: string,
  bodyText: string,
  scope: WorkflowScope,
): Promise<BotProofResult> {
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

export function buildReferenceUploadContract(tenantSlug: string, bookingRequestId: string, scope: WorkflowScope) {
  const isDbScope = scope === "database";
  return {
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

export function buildPostPersistWorkflowPlans(
  input: BookingInput,
  tenantSlug: string,
  bookingRequestId: string,
  workflowScope: WorkflowScope,
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

export function buildBotProofHeader() {
  return BOT_PROOF_HEADER;
}

export function botProofTtlSeconds() {
  return BOT_PROOF_TTL_SECONDS;
}

export interface BookingFlowRuntimeEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  dependenciesInstalled: boolean;
  prismaClientGenerated: boolean;
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  bookingRouteContractTestsPassed: boolean;
  bookingPageBrowserSmokePassed: boolean;
  confirmationPageBrowserSmokePassed: boolean;
  nextRouteRuntimeSmokePassed: boolean;
  localRuntimeFallbackVerified: boolean;
  databaseRuntimeSmokePassed: boolean;
  providerGatedBoundariesPreserved: boolean;
  clientServerComponentBoundaryVerified: boolean;
  ciArtifactsCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface BookingFlowRuntimeEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export function buildBookingFlowRuntimeEvidencePlan(
  input: BookingFlowRuntimeEvidenceInput,
): BookingFlowRuntimeEvidencePlan {
  const requiredScripts = ["typecheck", "build", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/web package script is missing ${script}.`);
  if (!input.dependenciesInstalled) blockers.push("Workspace dependencies must be installed with a committed lockfile before booking runtime evidence can close.");
  if (!input.prismaClientGenerated) blockers.push("Generated Prisma Client must be available before web typecheck/build runtime evidence can close.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass for booking route, booking page, and confirmation page.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass under Next with booking route and page runtime boundaries.");
  if (!input.bookingRouteContractTestsPassed) blockers.push("Booking route contract tests must pass for DB/local workflow parity and tenant isolation.");
  if (!input.bookingPageBrowserSmokePassed) blockers.push("Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.");
  if (!input.confirmationPageBrowserSmokePassed) blockers.push("Browser smoke must prove /booking/confirmation renders persisted or handoff workflow state.");
  if (!input.nextRouteRuntimeSmokePassed) blockers.push("Next route runtime smoke must exercise the public booking API route under real request handling.");
  if (!input.localRuntimeFallbackVerified) blockers.push("Local runtime fallback must be verified as explicit, tenant-scoped, and provider-gated.");
  if (!input.databaseRuntimeSmokePassed) blockers.push("Database runtime smoke must prove tenant-scoped booking persistence with generated Prisma Client.");
  if (!input.providerGatedBoundariesPreserved) blockers.push("Reference upload, deposit, notification, and calendar provider boundaries must remain explicit and fail-closed until configured.");
  if (!input.clientServerComponentBoundaryVerified) blockers.push("Client/server component boundaries must be verified for booking page, confirmation page, and API route imports.");
  if (!input.ciArtifactsCaptured) blockers.push("CI artifacts must capture booking route/runtime/browser smoke evidence.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");

  if (!input.dependenciesInstalled || !input.prismaClientGenerated) {
    requiredEvidence.push("dependency install and generated Prisma Client evidence");
  }
  if (!input.webTypecheckPassed || !input.webBuildPassed || !input.clientServerComponentBoundaryVerified) {
    requiredEvidence.push("web typecheck/build and client/server boundary evidence");
  }
  if (!input.bookingRouteContractTestsPassed || !input.nextRouteRuntimeSmokePassed) {
    requiredEvidence.push("booking API contract and Next route runtime smoke evidence");
  }
  if (!input.bookingPageBrowserSmokePassed || !input.confirmationPageBrowserSmokePassed) {
    requiredEvidence.push("booking and confirmation browser smoke evidence");
  }
  if (!input.localRuntimeFallbackVerified || !input.databaseRuntimeSmokePassed || !input.providerGatedBoundariesPreserved) {
    requiredEvidence.push("local fallback, database runtime, and provider-gated boundary evidence");
  }
  if (!input.ciArtifactsCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push("CI artifact bundle with redaction/secret-safety proof");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm install",
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test -- booking-requests-contract",
      "Playwright booking page smoke for /booking",
      "Playwright booking confirmation smoke for /booking/confirmation",
      "Next public booking API route runtime smoke",
      "dev-DB booking transaction smoke",
    ],
    requiredControls: [
      "Verify booking and confirmation pages in a real Next runtime, not only package helpers.",
      "Exercise public booking API route request handling with DB and local-runtime scopes.",
      "Preserve explicit provider-gated reference upload, deposit, notification, and calendar boundaries.",
      "Keep local-runtime fallback tenant-scoped and visibly non-production.",
      "Redact medical notes, payment data, provider tokens, private file URLs, and raw client PII from runtime artifacts.",
    ],
    requiredEvidence,
    blockers,
  };
}
