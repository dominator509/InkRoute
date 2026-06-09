import type { Appointment, AvailabilityWindow, ISODateString, TravelStop } from "@inkroute/types";

export type CalendarProviderKind = "internal" | "google" | "ics" | "caldav";
export type CalendarBusySource = "appointment" | "availability_hold" | "travel_blackout" | "external_google" | "manual";
export type CalendarConflictSeverity = "blocking" | "warning";
export type CalendarSyncDirection = "one_way_push" | "one_way_pull" | "two_way";
export type CalendarSyncStatus = "not_configured" | "draft_ready" | "credential_gated" | "active" | "failed";

export interface CalendarTimeBlock {
  id: string;
  title: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  source: CalendarBusySource;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  blocksBooking?: boolean;
}

export interface BufferedCalendarBlock extends CalendarTimeBlock {
  bufferedStartsAt: ISODateString;
  bufferedEndsAt: ISODateString;
}

export interface AvailabilitySlot {
  id: string;
  availabilityWindowId: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  status: "open" | "conflicted" | "outside_window";
  conflictIds: string[];
}

export interface CalendarConflict {
  candidateId: string;
  conflictingBlockId: string;
  conflictingTitle: string;
  severity: CalendarConflictSeverity;
  reason: string;
  overlapStartsAt: ISODateString;
  overlapEndsAt: ISODateString;
}

export interface GoogleCalendarEventDraft {
  summary: string;
  description: string;
  location?: string;
  start: { dateTime: ISODateString; timeZone: string };
  end: { dateTime: ISODateString; timeZone: string };
  reminders: { useDefault: boolean; overrides: Array<{ method: "email" | "popup"; minutes: number }> };
  extendedProperties: { private: Record<string, string> };
}

export interface GoogleFreeBusyRequestDraft {
  timeMin: ISODateString;
  timeMax: ISODateString;
  timeZone: string;
  items: Array<{ id: string }>;
}

export interface CalendarSyncPlan {
  provider: CalendarProviderKind;
  direction: CalendarSyncDirection;
  status: CalendarSyncStatus;
  requiresCredentialKeys: string[];
  storesSyncToken: boolean;
  supportsPushChannels: boolean;
  nextAction: string;
  riskNotes: string[];
}

export interface TravelPublishPlan {
  travelStopId: string;
  publicPath: string;
  cityLabel: string;
  timezone: string;
  publishActions: string[];
  revalidationTags: string[];
  waitlistNotificationCandidate: boolean;
  calendarBlock: CalendarTimeBlock;
}

export interface SignedIcsFeedDraft {
  path: string;
  expiresInDays: number;
  tokenStorage: "not_implemented" | "hashed_database_token";
  visibility: "public_demo" | "tenant_signed_feed";
  gapIds: string[];
}

export interface SignedIcsFeedTokenRecord {
  tokenHash: string;
  tenantSlug: string;
  artistSlug: string;
  expiresAt: ISODateString;
  revokedAt?: ISODateString;
}

export interface SignedIcsFeedAccessDecision {
  allowed: boolean;
  status: "allowed" | "missing_token" | "invalid_token" | "expired" | "revoked" | "scope_mismatch";
  cacheControl: string;
  shouldLogAccess: boolean;
  reason: string;
}

export interface CalendarTimezoneFinding {
  id: string;
  timezone: string;
  status: "pass" | "fail";
  message: string;
}

export interface CalendarTimezoneAuditSummary {
  status: "pass" | "fail";
  checkedCount: number;
  uniqueTimezones: string[];
  findings: CalendarTimezoneFinding[];
}

export type AvailabilityPersistenceAction =
  | "create_availability_window"
  | "create_slot_hold"
  | "confirm_appointment"
  | "release_slot_hold";

export type AvailabilityPersistenceWriteModel =
  | "AvailabilityWindow"
  | "AvailabilityHold"
  | "Appointment"
  | "BookingRequest"
  | "CalendarAuditLog"
  | "IdempotencyKey";

export interface AvailabilityPersistencePlanInput {
  tenantId: string;
  artistId: string;
  action: AvailabilityPersistenceAction;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  actorId?: string;
  bookingRequestId?: string;
  availabilityWindowId?: string;
  holdId?: string;
  appointmentId?: string;
  idempotencyKey?: string;
  conflictIds?: readonly string[];
  existingHoldIds?: readonly string[];
}

export interface AvailabilityPersistenceWrite {
  model: AvailabilityPersistenceWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface AvailabilityPersistencePlan {
  status: "ready" | "blocked";
  action: AvailabilityPersistenceAction;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly AvailabilityPersistenceWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export type GoogleCalendarSyncAction =
  | "oauth_connect"
  | "freebusy_check"
  | "upsert_event"
  | "delete_event"
  | "incremental_sync"
  | "full_resync"
  | "renew_push_channel";

export type GoogleCalendarSyncWriteModel =
  | "CalendarProviderConnection"
  | "CalendarProviderToken"
  | "CalendarProviderEvent"
  | "CalendarSyncState"
  | "CalendarPushChannel"
  | "CalendarAuditLog"
  | "IdempotencyKey";

export interface GoogleCalendarSyncPlanInput {
  tenantId: string;
  artistId: string;
  calendarId: string;
  action: GoogleCalendarSyncAction;
  occurredAt: ISODateString;
  oauthClientConfigured: boolean;
  requiredScopesGranted: boolean;
  refreshTokenEncrypted: boolean;
  providerWorkerEnabled: boolean;
  idempotencyKey?: string;
  appointmentId?: string;
  providerEventId?: string;
  syncToken?: string;
  syncTokenInvalid?: boolean;
  pushChannelId?: string;
  pushResourceId?: string;
  pushChannelExpiresAt?: ISODateString;
  retryAttempt?: number;
}

export interface GoogleCalendarSyncWrite {
  model: GoogleCalendarSyncWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface GoogleCalendarProviderSyncPlan {
  status: "ready" | "blocked";
  action: GoogleCalendarSyncAction;
  providerCall: string;
  requiresTransaction: boolean;
  idempotencyKey: string | null;
  writes: readonly GoogleCalendarSyncWrite[];
  nextAction: string;
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export type TimezoneQaCheck =
  | "iana_validation"
  | "dst_transition"
  | "recurrence_expansion"
  | "provider_render_matrix"
  | "all_day_travel_window";

export interface TimezoneQaCase {
  id: string;
  timezone: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  check: TimezoneQaCheck;
  expectedLocalLabel?: string;
  provider?: "internal" | "google" | "ics";
  recurrenceRule?: string;
  expandedOccurrenceCount?: number;
}

export interface TimezoneRecurrenceQaPlanInput {
  cases: readonly TimezoneQaCase[];
  requiredTimezones: readonly string[];
  requiredChecks: readonly TimezoneQaCheck[];
  temporalStrategySelected: boolean;
  providerRenderSmokeTested: boolean;
}

export interface TimezoneRecurrenceQaFinding {
  id: string;
  status: "pass" | "fail";
  message: string;
}

export interface TimezoneRecurrenceQaPlan {
  status: "ready" | "blocked";
  checkedCount: number;
  coveredTimezones: readonly string[];
  coveredChecks: readonly TimezoneQaCheck[];
  findings: readonly TimezoneRecurrenceQaFinding[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export type TravelPublishMutationAction = "publish" | "update" | "unpublish" | "rollback";

export type TravelPublishMutationWriteModel =
  | "TravelStop"
  | "PublicTravelPage"
  | "CityWaitlistMatch"
  | "NotificationJob"
  | "MobileSyncEvent"
  | "DashboardSyncEvent"
  | "WebRevalidationEvent"
  | "TravelAuditLog"
  | "IdempotencyKey";

export interface TravelPublishMutationPlanInput {
  tenantId: string;
  artistId: string;
  actorId?: string;
  action: TravelPublishMutationAction;
  stop: TravelStop;
  previousStop?: TravelStop;
  idempotencyKey?: string;
  consentedWaitlistClientIds?: readonly string[];
  changedFieldNames?: readonly string[];
  providerActionsSucceeded?: boolean;
  rollbackReason?: string;
}

export interface TravelPublishMutationWrite {
  model: TravelPublishMutationWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface TravelPublishMutationPlan {
  status: "ready" | "blocked";
  action: TravelPublishMutationAction;
  requiresTransaction: true;
  idempotencyKey: string | null;
  revalidationTags: readonly string[];
  notificationJobCount: number;
  writes: readonly TravelPublishMutationWrite[];
  requiredControls: readonly string[];
  rollbackPlan: readonly string[];
  blockers: readonly string[];
}

export interface CalendarRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  databaseRepositoriesConfigured: boolean;
  postgresIntegrationVerified: boolean;
  tenantIsolationVerified: boolean;
  availabilityTransactionsConfigured: boolean;
  googleOauthConfigured: boolean;
  encryptedProviderTokensConfigured: boolean;
  googleWorkerEnabled: boolean;
  googleProviderSmokeVerified: boolean;
  signedIcsTokenStoreConfigured: boolean;
  signedIcsAccessVerified: boolean;
  timezoneQaReady: boolean;
  cacheRevalidationConfigured: boolean;
}

export interface CalendarRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function toIcsDate(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function addMinutes(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

function maxIso(a: string, b: string): string {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function minIso(a: string, b: string): string {
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function rangeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() && new Date(bStart).getTime() < new Date(aEnd).getTime();
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function isValidIanaTimezone(timezone: string): boolean {
  if (!timezone || timezone.trim() !== timezone) {
    return false;
  }
  if (!timezone.includes("/")) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date("2026-06-08T00:00:00.000Z"));
    return true;
  } catch {
    return false;
  }
}

export function auditCalendarTimezones(input: {
  blocks?: readonly CalendarTimeBlock[];
  windows?: readonly Pick<AvailabilityWindow, "id" | "timezone">[];
  travelStops?: readonly Pick<TravelStop, "id" | "timezone">[];
  requiredTimezones?: readonly string[];
}): CalendarTimezoneAuditSummary {
  const findings: CalendarTimezoneFinding[] = [];
  const add = (id: string, timezone: string) => {
    const valid = isValidIanaTimezone(timezone);
    findings.push({
      id,
      timezone,
      status: valid ? "pass" : "fail",
      message: valid ? "Timezone is a valid IANA identifier." : "Timezone must be a trimmed valid IANA identifier.",
    });
  };

  for (const block of input.blocks ?? []) add(`block:${block.id}`, block.timezone);
  for (const window of input.windows ?? []) add(`window:${window.id}`, window.timezone);
  for (const stop of input.travelStops ?? []) add(`travel:${stop.id}`, stop.timezone);
  for (const timezone of input.requiredTimezones ?? []) add(`required:${timezone}`, timezone);

  return {
    status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
    checkedCount: findings.length,
    uniqueTimezones: Array.from(new Set(findings.map((finding) => finding.timezone))).sort(),
    findings,
  };
}

export function buildTimezoneRecurrenceQaPlan(input: TimezoneRecurrenceQaPlanInput): TimezoneRecurrenceQaPlan {
  const findings: TimezoneRecurrenceQaFinding[] = [];
  const coveredTimezones = Array.from(new Set(input.cases.map((testCase) => testCase.timezone))).sort();
  const coveredChecks = Array.from(new Set(input.cases.map((testCase) => testCase.check))).sort() as TimezoneQaCheck[];

  if (!input.temporalStrategySelected) {
    findings.push({
      id: "temporal-strategy",
      status: "fail",
      message: "Timezone QA requires an explicit timezone/date library or Temporal strategy before production scheduling.",
    });
  }
  if (!input.providerRenderSmokeTested) {
    findings.push({
      id: "provider-render-smoke",
      status: "fail",
      message: "Provider render smoke tests must cover internal, Google, and ICS calendar outputs.",
    });
  }

  for (const timezone of input.requiredTimezones) {
    if (!coveredTimezones.includes(timezone)) {
      findings.push({
        id: `timezone:${timezone}`,
        status: "fail",
        message: "Required timezone is missing from the QA matrix.",
      });
    }
  }

  for (const check of input.requiredChecks) {
    if (!coveredChecks.includes(check)) {
      findings.push({
        id: `check:${check}`,
        status: "fail",
        message: "Required timezone QA check is missing from the matrix.",
      });
    }
  }

  for (const testCase of input.cases) {
    const startsAtMs = new Date(testCase.startsAt).getTime();
    const endsAtMs = new Date(testCase.endsAt).getTime();
    if (!isValidIanaTimezone(testCase.timezone)) {
      findings.push({
        id: testCase.id,
        status: "fail",
        message: "Timezone case must use a valid IANA timezone.",
      });
      continue;
    }
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs) || startsAtMs >= endsAtMs) {
      findings.push({
        id: testCase.id,
        status: "fail",
        message: "Timezone case must have a valid start before end.",
      });
      continue;
    }
    if (testCase.check === "recurrence_expansion" && (!testCase.recurrenceRule?.trim() || !testCase.expandedOccurrenceCount || testCase.expandedOccurrenceCount <= 0)) {
      findings.push({
        id: testCase.id,
        status: "fail",
        message: "Recurring availability case must include a recurrence rule and expanded occurrence count.",
      });
      continue;
    }
    if (testCase.check === "provider_render_matrix" && (!testCase.provider || !testCase.expectedLocalLabel?.trim())) {
      findings.push({
        id: testCase.id,
        status: "fail",
        message: "Provider render matrix case must include provider and expected local label.",
      });
      continue;
    }
    findings.push({
      id: testCase.id,
      status: "pass",
      message: "Timezone QA case is structurally ready for route/provider verification.",
    });
  }

  const blockers = findings.filter((finding) => finding.status === "fail").map((finding) => finding.message);
  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    checkedCount: input.cases.length,
    coveredTimezones,
    coveredChecks,
    findings,
    requiredControls: [
      "Use one explicit timezone strategy consistently at route, persistence, provider, and render boundaries.",
      "Store canonical UTC instants plus IANA timezone identifiers for appointments, holds, travel, and availability.",
      "Test DST spring-forward and fall-back boundaries before expanding recurring availability.",
      "Render Los Angeles, Arizona, and New York examples through internal, Google, and ICS outputs.",
      "Keep all-day travel windows timezone-aware and avoid converting them to floating local times.",
    ],
    blockers,
  };
}

export function buildCalendarRuntimeReadinessPlan(input: CalendarRuntimeReadinessInput): CalendarRuntimeReadinessPlan {
  const requiredScripts = ["build", "typecheck", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];

  if (missingScripts.length > 0) blockers.push("@inkroute/calendar package scripts are missing required verification commands.");
  if (!input.packageTestsPassed) blockers.push("Calendar package tests have not passed in the installed workspace.");
  if (!input.packageTypecheckPassed) blockers.push("Calendar package typecheck has not passed in the installed workspace.");
  if (!input.databaseRepositoriesConfigured) blockers.push("Tenant-scoped calendar repositories are not configured.");
  if (!input.postgresIntegrationVerified) blockers.push("Postgres integration tests have not verified availability windows, holds, appointments, and audit writes.");
  if (!input.tenantIsolationVerified) blockers.push("Calendar tenant isolation has not been verified against cross-tenant reads and mutations.");
  if (!input.availabilityTransactionsConfigured) blockers.push("Availability mutations are not wired to transactional persistence and idempotency enforcement.");
  if (!input.googleOauthConfigured) blockers.push("Google OAuth client, redirect URI, and scopes are not configured.");
  if (!input.encryptedProviderTokensConfigured) blockers.push("Google refresh tokens are not encrypted before persistence.");
  if (!input.googleWorkerEnabled) blockers.push("Google Calendar provider sync worker is not enabled.");
  if (!input.googleProviderSmokeVerified) blockers.push("Google test calendar smoke has not verified event create/update/delete and incremental sync.");
  if (!input.signedIcsTokenStoreConfigured) blockers.push("Signed ICS feed token store is not configured.");
  if (!input.signedIcsAccessVerified) blockers.push("Signed ICS feed access has not been verified with valid, revoked, expired, and scoped tokens.");
  if (!input.timezoneQaReady) blockers.push("Timezone/DST/recurrence/provider-render QA matrix is not ready.");
  if (!input.cacheRevalidationConfigured) blockers.push("Calendar/travel cache revalidation and sync events are not configured.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm db:generate",
      "pnpm db:migrate",
      "pnpm test:unit -- packages/db/tests/tenant-scope.test.ts",
      "Google Calendar test-mode event create/update/delete smoke",
      "Signed ICS feed valid/revoked/expired token smoke",
    ],
    requiredControls: [
      "Persist availability windows, holds, appointments, travel blocks, sync state, and audit logs in tenant-scoped transactions.",
      "Claim idempotency keys before creating slot holds, appointments, provider events, or sync-state writes.",
      "Encrypt provider refresh tokens and never expose Google tokens to clients.",
      "Recover from Google invalid sync tokens by running full resync before incremental sync resumes.",
      "Validate signed ICS feed token hash, tenant/artist scope, expiry, and revocation before returning private feeds.",
      "Run DST, recurrence, provider render, and all-day travel timezone QA before launch.",
      "Emit dashboard/mobile/public revalidation events after committed travel and scheduling mutations.",
    ],
    blockers,
  };
}

export function applyBuffers(block: CalendarTimeBlock): BufferedCalendarBlock {
  return {
    ...block,
    bufferedStartsAt: addMinutes(block.startsAt, -(block.bufferBeforeMinutes ?? 0)),
    bufferedEndsAt: addMinutes(block.endsAt, block.bufferAfterMinutes ?? 0),
  };
}

export function detectCalendarConflicts(candidate: CalendarTimeBlock, existingBlocks: CalendarTimeBlock[]): CalendarConflict[] {
  const candidateWithBuffer = applyBuffers(candidate);
  return existingBlocks.flatMap((block) => {
    if (block.id === candidate.id || block.blocksBooking === false) {
      return [];
    }
    const bufferedBlock = applyBuffers(block);
    if (!rangeOverlaps(candidateWithBuffer.bufferedStartsAt, candidateWithBuffer.bufferedEndsAt, bufferedBlock.bufferedStartsAt, bufferedBlock.bufferedEndsAt)) {
      return [];
    }
    const directOverlap = rangeOverlaps(candidate.startsAt, candidate.endsAt, block.startsAt, block.endsAt);
    return [{
      candidateId: candidate.id,
      conflictingBlockId: block.id,
      conflictingTitle: block.title,
      severity: directOverlap ? "blocking" : "warning",
      reason: directOverlap ? "Appointment times overlap." : "Appointment buffer overlaps another block.",
      overlapStartsAt: maxIso(candidateWithBuffer.bufferedStartsAt, bufferedBlock.bufferedStartsAt),
      overlapEndsAt: minIso(candidateWithBuffer.bufferedEndsAt, bufferedBlock.bufferedEndsAt),
    }];
  });
}

export function buildAvailabilitySlots(input: {
  window: AvailabilityWindow;
  durationMinutes: number;
  stepMinutes: number;
  existingBlocks: CalendarTimeBlock[];
  maxSlots?: number;
}): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const startMs = new Date(input.window.startsAt).getTime();
  const endMs = new Date(input.window.endsAt).getTime();
  const durationMs = input.durationMinutes * 60_000;
  const stepMs = input.stepMinutes * 60_000;

  for (let cursor = startMs, index = 1; cursor + durationMs <= endMs; cursor += stepMs, index += 1) {
    const startsAt = new Date(cursor).toISOString();
    const endsAt = new Date(cursor + durationMs).toISOString();
    const candidate: CalendarTimeBlock = {
      id: `${input.window.id}_slot_${index}`,
      title: `${input.window.kind} slot ${index}`,
      startsAt,
      endsAt,
      timezone: input.window.timezone,
      source: "availability_hold",
      bufferBeforeMinutes: input.window.bufferBeforeMinutes,
      bufferAfterMinutes: input.window.bufferAfterMinutes,
      blocksBooking: true,
    };
    const conflicts = detectCalendarConflicts(candidate, input.existingBlocks);
    slots.push({
      id: candidate.id,
      availabilityWindowId: input.window.id,
      startsAt,
      endsAt,
      timezone: input.window.timezone,
      status: conflicts.some((conflict) => conflict.severity === "blocking") ? "conflicted" : "open",
      conflictIds: conflicts.map((conflict) => conflict.conflictingBlockId),
    });
    if (input.maxSlots && slots.length >= input.maxSlots) {
      break;
    }
  }
  return slots;
}

export function appointmentToCalendarBlock(appointment: Appointment | CalendarTimeBlock): CalendarTimeBlock {
  return {
    id: appointment.id,
    title: "title" in appointment ? appointment.title : "Calendar block",
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    timezone: appointment.timezone,
    source: "appointment",
    bufferBeforeMinutes: "bufferBeforeMinutes" in appointment ? appointment.bufferBeforeMinutes : 0,
    bufferAfterMinutes: "bufferAfterMinutes" in appointment ? appointment.bufferAfterMinutes : 0,
    blocksBooking: true,
  };
}

export function travelStopToCalendarBlock(stop: TravelStop): CalendarTimeBlock {
  return {
    id: `${stop.id}_travel_block`,
    title: `${stop.city}, ${stop.region} travel window`,
    startsAt: stop.startsAt,
    endsAt: stop.endsAt,
    timezone: stop.timezone,
    source: stop.bookingStatus === "closed" ? "travel_blackout" : "manual",
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    blocksBooking: stop.bookingStatus === "closed",
  };
}

export function appointmentToGoogleCalendarEventDraft(input: {
  appointment: Appointment | CalendarTimeBlock;
  tenantId: string;
  bookingRequestId?: string;
  clientEmail?: string;
  location?: string;
  description?: string;
}): GoogleCalendarEventDraft {
  return {
    summary: "title" in input.appointment ? input.appointment.title : "InkRoute appointment",
    description: input.description ?? "InkRoute appointment draft. Final Google Calendar insert requires OAuth credentials and provider error handling.",
    ...(input.location ? { location: input.location } : {}),
    start: { dateTime: input.appointment.startsAt, timeZone: input.appointment.timezone },
    end: { dateTime: input.appointment.endsAt, timeZone: input.appointment.timezone },
    reminders: { useDefault: false, overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 120 }] },
    extendedProperties: {
      private: {
        inkrouteTenantId: input.tenantId,
        inkrouteAppointmentId: input.appointment.id,
        ...(input.bookingRequestId ? { inkrouteBookingRequestId: input.bookingRequestId } : {}),
        ...(input.clientEmail ? { inkrouteClientEmail: input.clientEmail } : {}),
      },
    },
  };
}

export function buildGoogleFreeBusyRequestDraft(input: {
  calendarIds: string[];
  timeMin: ISODateString;
  timeMax: ISODateString;
  timezone: string;
}): GoogleFreeBusyRequestDraft {
  return {
    timeMin: input.timeMin,
    timeMax: input.timeMax,
    timeZone: input.timezone,
    items: input.calendarIds.map((id) => ({ id })),
  };
}

export function buildCalendarSyncPlan(provider: CalendarProviderKind): CalendarSyncPlan {
  if (provider === "google") {
    return {
      provider,
      direction: "two_way",
      status: "credential_gated",
      requiresCredentialKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "CALENDAR_ENCRYPTION_KEY"],
      storesSyncToken: true,
      supportsPushChannels: true,
      nextAction: "Implement OAuth consent, encrypted refresh-token storage, initial full sync, incremental sync-token refresh, push-channel verification, and provider retry handling.",
      riskNotes: [
        "Provider tokens must be encrypted before persistence.",
        "Google incremental sync tokens can expire and require a full resync path.",
        "External event deletes and changed recurring events need reconciliation tests.",
      ],
    };
  }
  if (provider === "ics") {
    return {
      provider,
      direction: "one_way_push",
      status: "draft_ready",
      requiresCredentialKeys: ["ICS_FEED_SIGNING_SECRET"],
      storesSyncToken: false,
      supportsPushChannels: false,
      nextAction: "Replace public demo feed with tenant-scoped signed feed tokens, cache headers, and revocation controls.",
      riskNotes: ["ICS feeds are usually pull-based and can be stale depending on the subscriber calendar client."],
    };
  }
  return {
    provider,
    direction: "one_way_push",
    status: provider === "internal" ? "draft_ready" : "not_configured",
    requiresCredentialKeys: [],
    storesSyncToken: false,
    supportsPushChannels: false,
    nextAction: "Use the internal appointment table as the source of truth before enabling provider sync.",
    riskNotes: ["Internal-only scheduling still needs tenant isolation, audit logs, and conflict tests."],
  };
}

function googleCalendarProviderCall(action: GoogleCalendarSyncAction): string {
  switch (action) {
    case "oauth_connect":
      return "google.oauth.exchangeCode";
    case "freebusy_check":
      return "google.freebusy.query";
    case "upsert_event":
      return "google.events.insertOrUpdate";
    case "delete_event":
      return "google.events.delete";
    case "incremental_sync":
      return "google.events.listIncremental";
    case "full_resync":
      return "google.events.listFull";
    case "renew_push_channel":
      return "google.channels.watch";
  }
}

function googleCalendarSyncWriteModels(action: GoogleCalendarSyncAction): GoogleCalendarSyncWriteModel[] {
  switch (action) {
    case "oauth_connect":
      return ["CalendarProviderConnection", "CalendarProviderToken", "CalendarAuditLog", "IdempotencyKey"];
    case "freebusy_check":
      return ["CalendarAuditLog", "IdempotencyKey"];
    case "upsert_event":
      return ["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"];
    case "delete_event":
      return ["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"];
    case "incremental_sync":
      return ["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"];
    case "full_resync":
      return ["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"];
    case "renew_push_channel":
      return ["CalendarPushChannel", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"];
  }
}

export function buildGoogleCalendarProviderSyncPlan(input: GoogleCalendarSyncPlanInput): GoogleCalendarProviderSyncPlan {
  const blockers: string[] = [];

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.artistId.trim()) blockers.push("Missing artist id.");
  if (!input.calendarId.trim()) blockers.push("Missing Google calendar id.");
  if (!input.oauthClientConfigured) blockers.push("Google OAuth client and redirect URI must be configured.");
  if (!input.requiredScopesGranted) blockers.push("Google Calendar scopes must be granted before provider sync.");
  if (!input.providerWorkerEnabled) blockers.push("Google Calendar provider worker must be enabled before executing sync operations.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for Google Calendar sync operation.");

  const requiresStoredToken = input.action !== "oauth_connect";
  if (requiresStoredToken && !input.refreshTokenEncrypted) {
    blockers.push("Encrypted refresh token must be stored before Google Calendar provider calls.");
  }
  if ((input.action === "upsert_event" || input.action === "delete_event") && !input.appointmentId?.trim()) {
    blockers.push("Appointment id is required before mutating Google Calendar events.");
  }
  if (input.action === "delete_event" && !input.providerEventId?.trim()) {
    blockers.push("Provider event id is required before deleting Google Calendar events.");
  }
  if (input.action === "incremental_sync" && !input.syncToken?.trim()) {
    blockers.push("Incremental sync requires a stored sync token.");
  }
  if (input.action === "incremental_sync" && input.syncTokenInvalid) {
    blockers.push("Google returned an invalid sync token; run full_resync before incremental sync.");
  }
  if (input.action === "renew_push_channel") {
    if (!input.pushChannelId?.trim()) blockers.push("Push channel renewal requires a channel id.");
    if (!input.pushResourceId?.trim()) blockers.push("Push channel renewal requires a resource id.");
    if (!input.pushChannelExpiresAt?.trim()) blockers.push("Push channel renewal requires an expiration timestamp.");
  }

  const providerCall = googleCalendarProviderCall(input.action);
  const basePayload = {
    artistId: input.artistId,
    calendarId: input.calendarId,
    appointmentId: input.appointmentId ?? null,
    providerEventId: input.providerEventId ?? null,
    syncToken: input.syncToken ?? null,
    syncTokenInvalid: input.syncTokenInvalid ?? false,
    pushChannelId: input.pushChannelId ?? null,
    pushResourceId: input.pushResourceId ?? null,
    pushChannelExpiresAt: input.pushChannelExpiresAt ?? null,
    retryAttempt: input.retryAttempt ?? 0,
    providerCall,
    idempotencyKey: input.idempotencyKey ?? null,
    occurredAt: input.occurredAt,
  };
  const writes = googleCalendarSyncWriteModels(input.action).map((model): GoogleCalendarSyncWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "CalendarAuditLog"
      ? {
          ...basePayload,
          action: input.action,
        }
      : model === "IdempotencyKey"
        ? {
            key: input.idempotencyKey ?? null,
            action: input.action,
            calendarId: input.calendarId,
            appointmentId: input.appointmentId ?? null,
            occurredAt: input.occurredAt,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    providerCall,
    requiresTransaction: writes.some((write) => write.model !== "CalendarAuditLog" && write.model !== "IdempotencyKey"),
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    writes,
    nextAction: input.action === "incremental_sync" && input.syncTokenInvalid
      ? "Run full_resync, replace the stored sync token, and audit the invalid-token recovery."
      : "Execute provider call through the Google Calendar worker, then persist redacted provider state and audit outcome.",
    requiredControls: [
      "Authorize tenant and artist ownership before using stored Google provider credentials.",
      "Encrypt refresh tokens before persistence and never return provider tokens to clients.",
      "Claim idempotency key before provider mutations or sync-state writes.",
      "On Google 410 invalid sync token, stop incremental sync and run full resync.",
      "Renew push channels before expiration and validate webhook resource/channel ids before processing notifications.",
      "Persist redacted CalendarAuditLog for every provider call, retry, failure, and recovery path.",
    ],
    blockers,
  };
}

export function buildTravelPublishPlan(stop: TravelStop): TravelPublishPlan {
  const citySlug = slugify(`${stop.city}-${stop.region}`);
  return {
    travelStopId: stop.id,
    publicPath: `/cities/${citySlug}`,
    cityLabel: `${stop.city}, ${stop.region}`,
    timezone: stop.timezone,
    publishActions: [
      "Persist travel schedule mutation with tenant scope and audit log.",
      "Recompute availability windows and booking status.",
      "Revalidate public travel page, city landing page, sitemap, and schema payloads.",
      "Queue city waitlist notifications only for clients with consent.",
    ],
    revalidationTags: ["travel", `city:${citySlug}`, `artist:${stop.artistId}`, `tenant:${stop.tenantId}`],
    waitlistNotificationCandidate: stop.bookingStatus === "open" || stop.bookingStatus === "waitlist",
    calendarBlock: travelStopToCalendarBlock(stop),
  };
}

function travelPublishMutationWriteModels(action: TravelPublishMutationAction): TravelPublishMutationWriteModel[] {
  if (action === "rollback") {
    return ["TravelStop", "PublicTravelPage", "WebRevalidationEvent", "MobileSyncEvent", "DashboardSyncEvent", "TravelAuditLog", "IdempotencyKey"];
  }
  if (action === "unpublish") {
    return ["TravelStop", "PublicTravelPage", "WebRevalidationEvent", "MobileSyncEvent", "DashboardSyncEvent", "TravelAuditLog", "IdempotencyKey"];
  }
  return [
    "TravelStop",
    "PublicTravelPage",
    "CityWaitlistMatch",
    "NotificationJob",
    "WebRevalidationEvent",
    "MobileSyncEvent",
    "DashboardSyncEvent",
    "TravelAuditLog",
    "IdempotencyKey",
  ];
}

export function buildTravelPublishMutationPlan(input: TravelPublishMutationPlanInput): TravelPublishMutationPlan {
  const blockers: string[] = [];
  const publishPlan = buildTravelPublishPlan(input.stop);
  const notifyClientIds = input.stop.bookingStatus === "open" || input.stop.bookingStatus === "waitlist"
    ? [...new Set(input.consentedWaitlistClientIds ?? [])]
    : [];

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.artistId.trim()) blockers.push("Missing artist id.");
  if (!input.actorId?.trim()) blockers.push("Travel publish mutation requires an actor id for audit attribution.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for travel publish mutation.");
  if (input.stop.tenantId !== input.tenantId) blockers.push("Travel stop tenant does not match mutation tenant scope.");
  if (input.stop.artistId !== input.artistId) blockers.push("Travel stop artist does not match mutation artist scope.");
  if (!isValidIanaTimezone(input.stop.timezone)) blockers.push("Travel stop timezone must be a valid IANA identifier.");
  if (new Date(input.stop.startsAt).getTime() >= new Date(input.stop.endsAt).getTime()) blockers.push("Travel stop must start before it ends.");
  if ((input.action === "update" || input.action === "rollback") && !input.previousStop) blockers.push("Travel update and rollback require the previous travel stop snapshot.");
  if (input.action === "rollback" && !input.rollbackReason?.trim()) blockers.push("Travel rollback requires a rollback reason.");
  if (input.providerActionsSucceeded === false && input.action !== "rollback") blockers.push("Provider action failure requires rollback before publishing public state.");

  const changedFields = input.changedFieldNames?.length
    ? input.changedFieldNames
    : input.previousStop
      ? ["city", "region", "startsAt", "endsAt", "bookingStatus"].filter((field) => input.previousStop?.[field as keyof TravelStop] !== input.stop[field as keyof TravelStop])
      : ["created"];
  const basePayload = {
    action: input.action,
    stopId: input.stop.id,
    artistId: input.artistId,
    publicPath: publishPlan.publicPath,
    cityLabel: publishPlan.cityLabel,
    timezone: input.stop.timezone,
    bookingStatus: input.stop.bookingStatus,
    changedFields,
    consentedWaitlistClientIds: notifyClientIds,
    actorId: input.actorId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    rollbackReason: input.rollbackReason ?? null,
  };
  const writes = travelPublishMutationWriteModels(input.action).map((model): TravelPublishMutationWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "NotificationJob"
      ? {
          ...basePayload,
          clientIds: notifyClientIds,
          count: notifyClientIds.length,
          consentRequired: true,
        }
      : model === "WebRevalidationEvent"
        ? {
            ...basePayload,
            tags: publishPlan.revalidationTags,
          }
        : model === "TravelAuditLog"
          ? {
              ...basePayload,
              previousStopId: input.previousStop?.id ?? null,
            }
          : model === "IdempotencyKey"
            ? {
                key: input.idempotencyKey ?? null,
                action: input.action,
                stopId: input.stop.id,
              }
            : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    revalidationTags: publishPlan.revalidationTags,
    notificationJobCount: notifyClientIds.length,
    writes,
    requiredControls: [
      "Execute travel publish writes in one tenant-scoped transaction before cache revalidation.",
      "Write TravelAuditLog with actor, previous snapshot, changed fields, and rollback reason when applicable.",
      "Queue waitlist notifications only for clients with explicit matching city/travel consent.",
      "Emit web, dashboard, and mobile sync events after the travel stop mutation commits.",
      "Revalidate public travel, city, artist, tenant, sitemap, and schema cache tags after commit.",
      "Rollback public state and queued provider actions if any provider mutation fails before publish completion.",
    ],
    rollbackPlan: [
      "Restore previous TravelStop snapshot when provider or revalidation steps fail.",
      "Cancel unsent waitlist NotificationJob rows created by the failed publish.",
      "Emit compensating web/dashboard/mobile sync events with rollback status.",
      "Persist TravelAuditLog with rollback reason and failed provider action summary.",
    ],
    blockers,
  };
}

export function buildSignedIcsFeedDraft(input: { tenantSlug: string; artistSlug: string; expiresInDays?: number }): SignedIcsFeedDraft {
  return {
    path: `/api/public/${input.tenantSlug}/calendar/${input.artistSlug}/travel.ics?token=SIGNED_FEED_TOKEN_PLACEHOLDER`,
    expiresInDays: input.expiresInDays ?? 90,
    tokenStorage: "not_implemented",
    visibility: "tenant_signed_feed",
    gapIds: ["GAP-009", "GAP-055"],
  };
}

export function buildSignedIcsFeedTokenHash(token: string): string {
  const normalized = token.trim();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return `draft_hash_${hash.toString(16).padStart(8, "0")}`;
}

export function evaluateSignedIcsFeedAccess(input: {
  token?: string;
  record?: SignedIcsFeedTokenRecord;
  tenantSlug: string;
  artistSlug: string;
  now: ISODateString;
}): SignedIcsFeedAccessDecision {
  const denyCache = "private, no-store";
  const allowCache = "private, max-age=300, stale-while-revalidate=60";

  if (!input.token?.trim()) {
    return {
      allowed: false,
      status: "missing_token",
      cacheControl: denyCache,
      shouldLogAccess: true,
      reason: "Signed ICS feed token is required.",
    };
  }
  if (!input.record || buildSignedIcsFeedTokenHash(input.token) !== input.record.tokenHash) {
    return {
      allowed: false,
      status: "invalid_token",
      cacheControl: denyCache,
      shouldLogAccess: true,
      reason: "Signed ICS feed token does not match a stored token hash.",
    };
  }
  if (input.record.tenantSlug !== input.tenantSlug || input.record.artistSlug !== input.artistSlug) {
    return {
      allowed: false,
      status: "scope_mismatch",
      cacheControl: denyCache,
      shouldLogAccess: true,
      reason: "Signed ICS feed token is not scoped to this tenant and artist.",
    };
  }
  if (input.record.revokedAt) {
    return {
      allowed: false,
      status: "revoked",
      cacheControl: denyCache,
      shouldLogAccess: true,
      reason: "Signed ICS feed token has been revoked.",
    };
  }
  if (new Date(input.record.expiresAt).getTime() <= new Date(input.now).getTime()) {
    return {
      allowed: false,
      status: "expired",
      cacheControl: denyCache,
      shouldLogAccess: true,
      reason: "Signed ICS feed token has expired.",
    };
  }

  return {
    allowed: true,
    status: "allowed",
    cacheControl: allowCache,
    shouldLogAccess: true,
    reason: "Signed ICS feed token is valid for this tenant and artist.",
  };
}

function availabilityPersistenceWriteModels(action: AvailabilityPersistenceAction): AvailabilityPersistenceWriteModel[] {
  switch (action) {
    case "create_availability_window":
      return ["AvailabilityWindow", "CalendarAuditLog", "IdempotencyKey"];
    case "create_slot_hold":
      return ["AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"];
    case "confirm_appointment":
      return ["Appointment", "AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"];
    case "release_slot_hold":
      return ["AvailabilityHold", "CalendarAuditLog", "IdempotencyKey"];
  }
}

export function buildAvailabilityPersistencePlan(input: AvailabilityPersistencePlanInput): AvailabilityPersistencePlan {
  const blockers: string[] = [];
  const startsAtMs = new Date(input.startsAt).getTime();
  const endsAtMs = new Date(input.endsAt).getTime();

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.artistId.trim()) blockers.push("Missing artist id.");
  if (!input.actorId?.trim()) blockers.push("Availability mutations require an actor id for audit attribution.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for availability mutation.");
  if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs) || startsAtMs >= endsAtMs) blockers.push("Availability time range must have a valid start before end.");
  if (!isValidIanaTimezone(input.timezone)) blockers.push("Availability timezone must be a valid IANA identifier.");
  if ((input.conflictIds ?? []).length > 0) blockers.push("Availability mutation has blocking calendar conflicts.");

  if ((input.action === "create_slot_hold" || input.action === "confirm_appointment") && !input.bookingRequestId?.trim()) {
    blockers.push("Slot hold and appointment confirmation require a booking request id.");
  }
  if ((input.action === "create_slot_hold" || input.action === "confirm_appointment") && !input.availabilityWindowId?.trim()) {
    blockers.push("Slot hold and appointment confirmation require an availability window id.");
  }
  if ((input.action === "confirm_appointment" || input.action === "release_slot_hold") && !input.holdId?.trim()) {
    blockers.push("Appointment confirmation and hold release require a hold id.");
  }
  if (input.action === "confirm_appointment" && !input.appointmentId?.trim()) {
    blockers.push("Appointment confirmation requires an appointment id.");
  }
  if (input.action === "create_slot_hold" && (input.existingHoldIds ?? []).length > 0) {
    blockers.push("Concurrent slot hold already exists for this tenant, artist, and time range.");
  }

  const basePayload = {
    artistId: input.artistId,
    bookingRequestId: input.bookingRequestId ?? null,
    availabilityWindowId: input.availabilityWindowId ?? null,
    holdId: input.holdId ?? null,
    appointmentId: input.appointmentId ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: input.timezone,
    conflictIds: input.conflictIds ?? [],
    existingHoldIds: input.existingHoldIds ?? [],
    actorId: input.actorId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  };
  const writes = availabilityPersistenceWriteModels(input.action).map((model): AvailabilityPersistenceWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "CalendarAuditLog"
      ? {
          ...basePayload,
          action: input.action,
        }
      : model === "IdempotencyKey"
        ? {
            key: input.idempotencyKey ?? null,
            action: input.action,
            artistId: input.artistId,
            bookingRequestId: input.bookingRequestId ?? null,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    writes,
    requiredControls: [
      "Execute availability mutations in one tenant-scoped database transaction.",
      "Claim the idempotency key before creating holds or appointments.",
      "Reject cross-tenant booking, window, hold, and appointment ids before writes.",
      "Lock the tenant/artist/time range or use an equivalent exclusion constraint before inserting slot holds.",
      "Write CalendarAuditLog for every window, hold, appointment, and release mutation.",
    ],
    blockers,
  };
}

export function travelStopToIcsEvent(stop: TravelStop): string {
  const summary = `${stop.city} tattoo guest spot — ${stop.bookingStatus}`;
  const description = stop.publicNotes ?? "InkRoute travel schedule";
  return [
    "BEGIN:VEVENT",
    `UID:${stop.id}@inkroute-suite`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(stop.startsAt)}`,
    `DTEND:${toIcsDate(stop.endsAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText([stop.studioName, stop.city, stop.region].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ].join("\r\n");
}

export function buildTravelScheduleIcs(calendarName: string, stops: TravelStop[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//InkRoute Suite//Travel Schedule//EN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ...stops.map(travelStopToIcsEvent),
    "END:VCALENDAR",
  ].join("\r\n");
}
