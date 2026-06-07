import { calculateTattooReadinessScore, emptyBookingDraft } from "@inkroute/booking";
import { inkrouteDemoTenant } from "@inkroute/config";
import { redactRecord } from "@inkroute/security";
import { rateLimitRules } from "@inkroute/security";
import type { BookingRequestInput } from "@inkroute/validators";
import type {
  BookingEventType,
  BookingStatus,
  BookingRequest,
  MessageChannel,
  MessageStatus,
} from "@inkroute/types";

type MaybeTenantSlug = string;

export interface LocalRateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  status: "allow" | "throttle" | "rule_not_found";
  warning: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface LocalBookingEventRecord {
  id: string;
  eventType: BookingEventType;
  actor: "client" | "artist" | "system" | "admin";
  at: string;
  note: string;
}

export interface LocalBookingRecord {
  request: BookingRequest;
  readinessScore: number;
  events: LocalBookingEventRecord[];
}

export interface LocalDepositSessionRecord {
  id: string;
  tenantId: string;
  bookingRequestId: string;
  amountCents: number;
  currency: string;
  checkoutUrl: string;
  providerSessionId: string;
  status: "created" | "reconciled";
  createdAt: string;
}

export interface LocalMessageRecord {
  id: string;
  tenantId: string;
  subject: string;
  body: string;
  status: MessageStatus;
  channel: MessageChannel;
  relatedBookingRequestId?: string;
  relatedAppointmentId?: string;
  redactedPayload: Record<string, unknown>;
  createdAt: string;
}

export interface LocalUploadIntentRecord {
  id: string;
  tenantId: string;
  kind: string;
  objectKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  visibility: string;
  signedUploadUrl: string;
  expiresAt: string;
  createdAt: string;
  status: "pending" | "consumed" | "expired";
}

export interface LocalErrorReportRecord {
  id: string;
  tenantId: string;
  release?: string;
  message: string;
  redactedRecord: Record<string, unknown>;
  route?: string;
  createdAt: string;
}

export interface LocalWebhookEventRecord {
  id: string;
  tenantId: string;
  source: "stripe" | "email" | "sms";
  eventType: string;
  receivedSignatureHeader: string;
  payloadLength: number;
  interpretation?: string;
  createdAt: string;
}

export interface LocalTenantState {
  bookings: Map<string, LocalBookingRecord>;
  depositSessions: Map<string, LocalDepositSessionRecord>;
  messages: Map<string, LocalMessageRecord>;
  uploadIntents: Map<string, LocalUploadIntentRecord>;
  errorReports: Map<string, LocalErrorReportRecord>;
  webhookEvents: Map<string, LocalWebhookEventRecord>;
}

type TenantStore = Map<MaybeTenantSlug, LocalTenantState>;

interface RateLimitBucket {
  windowStart: number;
  count: number;
  windowSeconds: number;
}

const tenantStates: TenantStore = new Map();
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function normalizeTenantSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function nowIsoDate(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function budgetToRange(min?: number, max?: number): string {
  if (typeof min === "number" && typeof max === "number") return `$${min}-${max}`;
  if (typeof min === "number") return `From $${min}`;
  if (typeof max === "number") return `Up to $${max}`;
  return "Requested after consultation";
}

function buildReadiness(input: BookingRequestInput): number {
  const draft = {
    ...emptyBookingDraft,
    preferredCitySlug: input.preferredCity,
    preferredDateWindow: input.preferredDate ? new Date(input.preferredDate).toISOString() : "Flexible",
    style: input.style,
    placement: input.placement,
    sizeEstimate: input.sizeEstimate,
    budgetRange: budgetToRange(input.budgetMin, input.budgetMax),
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

function getTenantState(tenantSlug: string): LocalTenantState {
  const existing = tenantStates.get(tenantSlug);
  if (existing) return existing;

  const created: LocalTenantState = {
    bookings: new Map(),
    depositSessions: new Map(),
    messages: new Map(),
    uploadIntents: new Map(),
    errorReports: new Map(),
    webhookEvents: new Map(),
  };
  tenantStates.set(tenantSlug, created);
  return created;
}

export function resolveTenant(tenantSlug: string): { tenantId: string } | undefined {
  const normalized = normalizeTenantSlug(tenantSlug);
  return normalized === inkrouteDemoTenant.slug ? { tenantId: inkrouteDemoTenant.id } : undefined;
}

export function checkRateLimit(ruleId: string, tenantSlug: string, identifier: string): LocalRateLimitDecision {
  const rule = rateLimitRules.find((candidate) => candidate.id === ruleId);
  if (!rule) {
    return {
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
      status: "rule_not_found",
      warning: "No scaffolded rate-limit rule found; route is unmetered in local fallback.",
      maxRequests: 0,
      windowSeconds: 0,
    };
  }

  const key = `${ruleId}:${tenantSlug}:${identifier}`;
  const now = Date.now();
  const bucketWindowMs = rule.windowSeconds * 1000;
  const bucket = rateLimitBuckets.get(key);

  const nextBucket: RateLimitBucket =
    !bucket || now - bucket.windowStart >= bucketWindowMs
      ? { windowStart: now, count: 1, windowSeconds: rule.windowSeconds }
      : { ...bucket, count: bucket.count + 1 };

  rateLimitBuckets.set(key, nextBucket);

  const allowed = nextBucket.count <= rule.maxRequests;
  const remaining = Math.max(rule.maxRequests - nextBucket.count, 0);
  const elapsedMs = now - nextBucket.windowStart;
  const retryAfterSeconds = allowed ? 0 : Math.max(Math.ceil((bucketWindowMs - elapsedMs) / 1000), 1);

  return {
    allowed,
    remaining,
    retryAfterSeconds,
    status: allowed ? "allow" : "throttle",
    warning: allowed
      ? "Local scaffolded rate limit passed."
      : "Local scaffolding blocked this request because the rule threshold has been reached.",
    maxRequests: rule.maxRequests,
    windowSeconds: rule.windowSeconds,
  };
}

export function persistBookingRequest(tenantSlug: string, input: BookingRequestInput): LocalBookingRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const requestId = nextId("booking");
  const booking: BookingRequest = {
    id: requestId,
    tenantId,
    artistId: input.artistId,
    clientId: input.clientId,
    travelCityId: input.travelCityId,
    status: "submitted" as BookingStatus,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    preferredCity: input.preferredCity,
    preferredDate: input.preferredDate,
    style: input.style,
    placement: input.placement,
    sizeEstimate: input.sizeEstimate,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    ideaSummary: input.ideaSummary,
    readinessScore: buildReadiness(input),
    policyAccepted: input.policyAccepted,
    portfolioAttributionId: input.portfolioAttributionId,
    createdAt: now,
  };

  const record: LocalBookingRecord = {
    request: booking,
    readinessScore: booking.readinessScore,
    events: [
      {
        id: nextId("event"),
        eventType: "submitted",
        actor: "client",
        at: now,
        note: "Booking request validated and persisted in local demo runtime.",
      },
    ],
  };

  tenant.bookings.set(requestId, record);
  return record;
}

export function getBookingRequest(tenantSlug: string, bookingRequestId: string): LocalBookingRecord | undefined {
  return getTenantState(tenantSlug).bookings.get(bookingRequestId);
}

export function persistDepositSession(
  tenantSlug: string,
  bookingRequestId: string,
  amountCents: number,
  currency: string,
): LocalDepositSessionRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const id = nextId("deposit");
  const providerSessionId = `cs_mock_${id}`;
  const checkoutUrl = `/api/public/${encodeURIComponent(tenantSlug)}/checkout/${providerSessionId}`;

  const record: LocalDepositSessionRecord = {
    id,
    tenantId,
    bookingRequestId,
    amountCents,
    currency,
    checkoutUrl,
    providerSessionId,
    status: "created",
    createdAt: now,
  };

  tenant.depositSessions.set(id, record);
  return record;
}

export function getClientIp(source: Record<string, string | null>): string {
  return (
    source["x-forwarded-for"]?.split(",")[0]?.trim() ??
    source["x-real-ip"] ??
    source["x-client-ip"] ??
    source["cf-connecting-ip"] ??
    source["forwarded"] ??
    "unknown-ip"
  );
}

export function persistUploadIntent(
  tenantSlug: string,
  input: {
    kind: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    visibility: string;
  },
): LocalUploadIntentRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const createdAt = Date.now();
  const id = nextId("upload");
  const safeFileName = safeText(input.filename, "upload.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const objectKey = `${tenantId}/${createdAt}/${safeFileName}`;
  const signedUploadUrl = `https://mock-inkroute.local/upload/${tenantSlug}/${id}?signature=mock-scaffold`;

  const record: LocalUploadIntentRecord = {
    id,
    tenantId,
    kind: input.kind,
    objectKey,
    filename: safeFileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    visibility: input.visibility,
    signedUploadUrl,
    expiresAt: new Date(createdAt + 20 * 60 * 1000).toISOString(),
    createdAt: now,
    status: "pending",
  };

  tenant.uploadIntents.set(id, record);
  return record;
}

export function persistMessage(
  tenantSlug: string,
  input: { subject: string; body: string; channel: MessageChannel; relatedBookingRequestId?: string; relatedAppointmentId?: string },
): LocalMessageRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const id = nextId("message");

  const redactedPayload = redactRecord({
    subject: input.subject,
    body: input.body,
    relatedBookingRequestId: input.relatedBookingRequestId,
    relatedAppointmentId: input.relatedAppointmentId,
  });

  const record: LocalMessageRecord = {
    id,
    tenantId,
    subject: input.subject,
    body: input.body,
    status: "queued",
    channel: input.channel,
    relatedBookingRequestId: input.relatedBookingRequestId,
    relatedAppointmentId: input.relatedAppointmentId,
    redactedPayload,
    createdAt: now,
  };

  tenant.messages.set(id, record);
  return record;
}

export function persistErrorReport(
  tenantSlug: string,
  input: {
    message: string;
    route?: string;
    release?: string;
    metadata?: Record<string, unknown>;
  },
): LocalErrorReportRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const id = nextId("err");

  const redactedRecord = redactRecord({
    message: input.message,
    route: input.route ?? "unknown",
    release: input.release ?? "phase11-demo",
    metadata: input.metadata ?? {},
  });

  const record: LocalErrorReportRecord = {
    id,
    tenantId,
    release: input.release,
    message: input.message,
    redactedRecord,
    route: input.route,
    createdAt: now,
  };

  tenant.errorReports.set(id, record);
  return record;
}

export function persistPrivacyRequest(
  tenantSlug: string,
  input: { type: string; email: string; details?: Record<string, unknown> },
): { id: string; tenantId: string; requestType: string; redactedSubmission: Record<string, unknown>; receivedAt: string } {
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  return {
    id: nextId("privacy"),
    tenantId,
    requestType: input.type,
    redactedSubmission: redactRecord({ email: input.email, ...input.details }),
    receivedAt: nowIsoDate(),
  };
}

export function persistWebhookEvent(
  tenantSlug: string,
  input: { source: LocalWebhookEventRecord["source"]; eventType: string; signatureHeader: string; payloadLength: number; interpretation?: string },
): LocalWebhookEventRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const id = nextId("webhook");

  const record: LocalWebhookEventRecord = {
    id,
    tenantId,
    source: input.source,
    eventType: input.eventType,
    receivedSignatureHeader: input.signatureHeader,
    payloadLength: input.payloadLength,
    interpretation: input.interpretation,
    createdAt: now,
  };

  tenant.webhookEvents.set(id, record);
  return record;
}
