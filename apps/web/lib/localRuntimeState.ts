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

export type LocalBookingWorkflowType = "notification" | "reference-upload" | "deposit" | "calendar";
export type LocalWorkflowExecutionScope = "database" | "local-fallback";

export type LocalBookingWorkflowConsumerType = LocalBookingWorkflowType;
export type LocalBookingWorkflowConsumerStatus = "queued" | "succeeded" | "blocked";

export interface LocalBookingWorkflowRecord {
  id: string;
  tenantId: string;
  bookingRequestId: string;
  type: LocalBookingWorkflowType;
  status: "pending" | "queued" | "blocked";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface LocalBookingWorkflowConsumerRecord {
  id: string;
  tenantId: string;
  bookingRequestId: string;
  workflowRecordId: string;
  scope: LocalWorkflowExecutionScope;
  type: LocalBookingWorkflowConsumerType;
  status: LocalBookingWorkflowConsumerStatus;
  result: Record<string, unknown>;
  createdAt: string;
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

export interface LocalContactSubmissionRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  subject: string;
  redactedSubmission: Record<string, unknown>;
  auditMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface LocalTenantState {
  bookings: Map<string, LocalBookingRecord>;
  depositSessions: Map<string, LocalDepositSessionRecord>;
  messages: Map<string, LocalMessageRecord>;
  uploadIntents: Map<string, LocalUploadIntentRecord>;
  postPersistWorkflows: Map<string, LocalBookingWorkflowRecord>;
  postPersistWorkflowConsumers: Map<string, LocalBookingWorkflowConsumerRecord>;
  errorReports: Map<string, LocalErrorReportRecord>;
  webhookEvents: Map<string, LocalWebhookEventRecord>;
  contactSubmissions: Map<string, LocalContactSubmissionRecord>;
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
    postPersistWorkflows: new Map(),
    postPersistWorkflowConsumers: new Map(),
    errorReports: new Map(),
    webhookEvents: new Map(),
    contactSubmissions: new Map(),
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
    status: "submitted" as BookingStatus,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    preferredCity: input.preferredCity,
    style: input.style,
    placement: input.placement,
    sizeEstimate: input.sizeEstimate,
    ideaSummary: input.ideaSummary,
    readinessScore: buildReadiness(input),
    policyAccepted: input.policyAccepted,
    createdAt: now,
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.travelCityId ? { travelCityId: input.travelCityId } : {}),
    ...(input.preferredDate ? { preferredDate: input.preferredDate } : {}),
    ...(input.budgetMin !== undefined ? { budgetMin: input.budgetMin } : {}),
    ...(input.budgetMax !== undefined ? { budgetMax: input.budgetMax } : {}),
    ...(input.portfolioAttributionId ? { portfolioAttributionId: input.portfolioAttributionId } : {}),
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

export function persistBookingPostPersistWorkflow(
  tenantSlug: string,
  input: Omit<LocalBookingWorkflowRecord, "id" | "tenantId" | "createdAt">,
): LocalBookingWorkflowRecord {
  const tenant = getTenantState(tenantSlug);
  const now = nowIsoDate();
  const id = nextId("workflow");
  const record: LocalBookingWorkflowRecord = {
    ...input,
    id,
    tenantId: resolveTenant(tenantSlug)?.tenantId ?? tenantSlug,
    createdAt: now,
  };

  tenant.postPersistWorkflows.set(id, record);
  return record;
}

export function getBookingPostPersistWorkflows(tenantSlug: string, bookingRequestId: string): LocalBookingWorkflowRecord[] {
  return Array.from(getTenantState(tenantSlug).postPersistWorkflows.values())
    .filter((record) => record.bookingRequestId === bookingRequestId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function resolveWorkflowResultMessage(workflowPayload: Record<string, unknown>): string {
  const subject = safeString(workflowPayload.subject);
  return subject ?? "Workflow produced by booking persistence contract.";
}

export function executeBookingPostPersistWorkflowConsumers(
  tenantSlug: string,
  bookingRequestId: string,
  scope: LocalWorkflowExecutionScope,
): LocalBookingWorkflowConsumerRecord[] {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const workflows = getBookingPostPersistWorkflows(tenantSlug, bookingRequestId);
  const executed: LocalBookingWorkflowConsumerRecord[] = [];

  for (const workflow of workflows) {
    const result: Record<string, unknown> = {
      workflowType: workflow.type,
      bookingRequestId,
      consumerScope: scope,
    };
    let status: LocalBookingWorkflowConsumerStatus = "queued";

    if (workflow.type === "notification") {
      const consumedMessage = persistMessage(tenantSlug, {
        subject: `Booking workflow: ${resolveWorkflowResultMessage(workflow.payload as Record<string, unknown>)}`,
        body: "Workflow consumer queued a placeholder notification artifact for producer/tenant handoff.",
        channel: "email",
      });
      status = "succeeded";
      result.messageId = consumedMessage.id;
      result.status = consumedMessage.status;
      result.redactedPayload = consumedMessage.redactedPayload;
      result.deliveryGapIds = workflow.payload.gapIds ?? [];
    } else if (workflow.type === "reference-upload") {
      if (scope === "local-fallback") {
        const upload = persistUploadIntent(tenantSlug, {
          kind: "reference_private",
          filename: `${bookingRequestId}-reference.jpg`,
          mimeType: "image/jpeg",
          sizeBytes: 65536,
          visibility: "client_private",
        });
        status = "succeeded";
        result.uploadIntentId = upload.id;
        result.signedUploadUrl = upload.signedUploadUrl;
        result.uploadVisibility = upload.visibility;
      } else {
        status = "blocked";
        result.expectedHandoff = workflow.payload;
        result.reason =
          "Database-scope reference-upload workflow should be handed to an external reference-upload worker that validates and persists signed intents.";
      }
    } else if (workflow.type === "deposit") {
      status = "blocked";
      result.reason = "Deposit workflow is gated behind GAP-004 provider and policy readiness.";
    } else if (workflow.type === "calendar") {
      status = "blocked";
      result.reason = "Calendar workflow is gated behind GAP-009 provider token and hold persistence readiness.";
    }

    const execution: LocalBookingWorkflowConsumerRecord = {
      id: nextId("consumer"),
      tenantId,
      bookingRequestId,
      workflowRecordId: workflow.id,
      scope,
      type: workflow.type,
      status,
      result,
      createdAt: nowIsoDate(),
    };

    tenant.postPersistWorkflowConsumers.set(execution.id, execution);
    executed.push(execution);
  }

  return executed.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export function getBookingPostPersistWorkflowConsumers(tenantSlug: string, bookingRequestId?: string): LocalBookingWorkflowConsumerRecord[] {
  const all = Array.from(getTenantState(tenantSlug).postPersistWorkflowConsumers.values());
  const filtered = bookingRequestId ? all.filter((record) => record.bookingRequestId === bookingRequestId) : all;
  return filtered.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
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
    redactedPayload,
    createdAt: now,
    ...(input.relatedBookingRequestId ? { relatedBookingRequestId: input.relatedBookingRequestId } : {}),
    ...(input.relatedAppointmentId ? { relatedAppointmentId: input.relatedAppointmentId } : {}),
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
    message: input.message,
    redactedRecord,
    createdAt: now,
    ...(input.route ? { route: input.route } : {}),
    ...(input.release ? { release: input.release } : {}),
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
    createdAt: now,
    ...(input.interpretation ? { interpretation: input.interpretation } : {}),
  };

  tenant.webhookEvents.set(id, record);
  return record;
}


export function persistContactSubmission(
  tenantSlug: string,
  input: { name: string; email: string; subject?: string; message: string; source?: string; clientIp?: string },
): LocalContactSubmissionRecord {
  const tenant = getTenantState(tenantSlug);
  const tenantId = resolveTenant(tenantSlug)?.tenantId ?? tenantSlug;
  const now = nowIsoDate();
  const id = nextId("contact");
  const subject = safeText(input.subject, "General contact");
  const redactedSubmission = redactRecord({
    name: input.name,
    email: input.email,
    subject,
    message: input.message,
  });
  const record: LocalContactSubmissionRecord = {
    id,
    tenantId,
    name: input.name,
    email: input.email,
    subject,
    redactedSubmission,
    auditMetadata: {
      route: "/api/public/[tenantSlug]/contact",
      source: input.source ?? "public_contact_form",
      clientIp: input.clientIp ?? "unknown-ip",
      persistence: "local-runtime",
      notificationBoundary: "provider-gated",
    },
    createdAt: now,
  };
  tenant.contactSubmissions.set(id, record);
  return record;
}

export function getContactSubmissions(tenantSlug: string): LocalContactSubmissionRecord[] {
  return Array.from(getTenantState(tenantSlug).contactSubmissions.values()).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}
