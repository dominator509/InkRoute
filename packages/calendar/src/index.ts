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
  tokenStorage: "hashed_database_token";
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

export interface ExplicitTimezoneDateBoundaryEvidence {
  status: "ready" | "blocked";
  strategy: "intl-datetimeformat";
  sampleInstant: ISODateString;
  sampleTimezone: string;
  renderedLabel: string | null;
  boundarySources: readonly ["route", "persistence", "provider", "render"];
  storesUtcInstants: true;
  requiresIanaTimezoneAtBoundaries: true;
  blockers: readonly string[];
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
  requiredControls: typeof availabilityPersistenceRequiredControls;
  blockers: readonly string[];
}

export interface AvailabilityRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTestsPassed: boolean;
  calendarTypecheckPassed: boolean;
  dbSchemaIncludesAvailabilityModels: boolean;
  repositoriesImplemented: boolean;
  tenantScopedQueriesEnforced: boolean;
  transactionalWindowCreationImplemented: boolean;
  transactionalSlotHoldImplemented: boolean;
  appointmentConfirmationImplemented: boolean;
  holdReleaseImplemented: boolean;
  auditLogPersistenceConfigured: boolean;
  idempotencyStoreConfigured: boolean;
  conflictDetectionAgainstPersistedRows: boolean;
  concurrentHoldProtectionConfigured: boolean;
  overlappingSlotDbRejectionTested: boolean;
  crossTenantIsolationTestsPassed: boolean;
  seededPostgresIntegrationTestsPassed: boolean;
  dashboardAndApiUseRepository: boolean;
}

export interface AvailabilityRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof availabilityRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly AvailabilityRuntimeReadinessRequiredEvidence[];
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
  requiredControls: typeof googleCalendarProviderSyncRequiredControls;
  blockers: readonly string[];
}

export interface GoogleCalendarRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTestsPassed: boolean;
  calendarTypecheckPassed: boolean;
  googleSdkInstalled: boolean;
  oauthAppConfigured: boolean;
  oauthCallbackRouteImplemented: boolean;
  requiredScopesConfigured: boolean;
  encryptedTokenRepositoryImplemented: boolean;
  providerWorkerImplemented: boolean;
  freebusySmokeTested: boolean;
  eventInsertUpdateDeleteSmokeTested: boolean;
  fullSyncImplemented: boolean;
  incrementalSyncTokenPersisted: boolean;
  invalidSyncTokenFullResyncTested: boolean;
  pushChannelRenewalImplemented: boolean;
  pushWebhookHandlerImplemented: boolean;
  retryBackoffConfigured: boolean;
  idempotencyStoreConfigured: boolean;
  calendarAuditLogPersistenceConfigured: boolean;
  tenantIsolationTestsPassed: boolean;
  googleTestCalendarEvidenceAttached: boolean;
}

export interface GoogleCalendarRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof googleCalendarRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly GoogleCalendarRuntimeReadinessRequiredEvidence[];
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
  requiredControls: typeof timezoneRecurrenceQaRequiredControls;
  blockers: readonly string[];
}

export interface TimezoneRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTestsPassed: boolean;
  calendarTypecheckPassed: boolean;
  timezoneStrategySelected: boolean;
  temporalOrDateLibraryImplemented: boolean;
  routeIanaValidationEnforced: boolean;
  persistenceIanaValidationEnforced: boolean;
  storedUtcAndTimezoneVerified: boolean;
  dstSpringForwardTested: boolean;
  dstFallBackTested: boolean;
  recurringAvailabilityExpansionTested: boolean;
  allDayTravelWindowTested: boolean;
  crossCityRenderingTested: boolean;
  providerRenderSmokeTested: boolean;
  googleProviderTimezoneSmokeTested: boolean;
  icsProviderTimezoneSmokeTested: boolean;
  seededPersistenceBoundaryTestsPassed: boolean;
}

export interface TimezoneRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof timezoneRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly TimezoneRuntimeReadinessRequiredEvidence[];
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
  requiredControls: typeof travelPublishMutationRequiredControls;
  rollbackPlan: readonly string[];
  blockers: readonly string[];
}

export interface TravelPublishRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTestsPassed: boolean;
  calendarTypecheckPassed: boolean;
  dashboardMutationRouteImplemented: boolean;
  dashboardAuthorizationEnforced: boolean;
  persistedTravelRepositoryImplemented: boolean;
  publicDataApiImplemented: boolean;
  cacheRevalidationCalledAfterCommit: boolean;
  cityWaitlistMatchingImplemented: boolean;
  consentFilteredNotificationQueueImplemented: boolean;
  notificationProviderQueueTested: boolean;
  mobileSyncTransportImplemented: boolean;
  dashboardSyncTransportImplemented: boolean;
  webSyncEventPersistenceConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  rollbackExecutorImplemented: boolean;
  failedProviderRollbackTested: boolean;
  tenantIsolationTestsPassed: boolean;
  e2eTravelPublishFlowPassed: boolean;
}

export interface TravelPublishRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof travelPublishRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly TravelPublishRuntimeReadinessRequiredEvidence[];
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
  requiredCommands: typeof calendarRuntimeReadinessRequiredCommands;
  requiredControls: typeof calendarRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface CalendarAutomatedTestReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarHelperTestsPassed: boolean;
  signedIcsRouteTestsPassed: boolean;
  availabilityPreviewRouteTestsPassed: boolean;
  postgresIntegrationTestsPassed: boolean;
  googleProviderTestsPassed: boolean;
  timezoneProviderMatrixTestsPassed: boolean;
  dashboardCalendarPlaywrightPassed: boolean;
  publicTravelPlaywrightPassed: boolean;
  concurrentHoldRaceTestsPassed: boolean;
  signedIcsRevocationDbTestsPassed: boolean;
  ciCalendarTestJobConfigured: boolean;
  artifactsCaptured: boolean;
}

export interface CalendarAutomatedTestReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof calendarAutomatedTestReadinessRequiredCommands;
  requiredEvidence: readonly CalendarAutomatedTestReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export interface CalendarLaunchEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTypecheckPassed: boolean;
  calendarTestsPassed: boolean;
  availabilityRepositoriesImplemented: boolean;
  availabilityPostgresIntegrationPassed: boolean;
  concurrentHoldRaceTestsPassed: boolean;
  tenantIsolationTestsPassed: boolean;
  googleOauthConfigured: boolean;
  googleEncryptedTokensConfigured: boolean;
  googleWorkerEnabled: boolean;
  googleFreebusySmokePassed: boolean;
  googleEventSyncSmokePassed: boolean;
  googlePushOrIncrementalSyncVerified: boolean;
  signedIcsTokenPersistenceConfigured: boolean;
  signedIcsAccessSmokePassed: boolean;
  signedIcsClientImportSmokePassed: boolean;
  timezoneDstQaPassed: boolean;
  providerRenderMatrixPassed: boolean;
  travelPublishPersistencePassed: boolean;
  cacheRevalidationVerified: boolean;
  dashboardCalendarSmokePassed: boolean;
  publicTravelSmokePassed: boolean;
  ciEvidenceCaptured: boolean;
  calendarArtifactsSecretSafe: boolean;
}

export interface CalendarLaunchEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof calendarLaunchEvidenceRequiredCommands;
  requiredEvidence: readonly CalendarLaunchEvidenceRequiredEvidence[];
  blockers: readonly string[];
}

export interface SignedIcsFeedRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  calendarTestsPassed: boolean;
  calendarTypecheckPassed: boolean;
  webRouteTestsPassed: boolean;
  webTypecheckPassed: boolean;
  tokenCreationImplemented: boolean;
  hashedTokenPersistenceConfigured: boolean;
  expiryRotationPersistenceConfigured: boolean;
  revocationUiImplemented: boolean;
  revocationApiImplemented: boolean;
  revokedTokenRouteRejectionTested: boolean;
  tenantArtistScopeEnforced: boolean;
  durableAccessLogPersistenceConfigured: boolean;
  privateCacheHeadersVerified: boolean;
  appleCalendarImportTested: boolean;
  googleCalendarImportTested: boolean;
  outlookCalendarImportTested: boolean;
}

export interface SignedIcsFeedRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof signedIcsFeedRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly SignedIcsFeedRuntimeReadinessRequiredEvidence[];
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

export const explicitTimezoneDateBoundaryStrategy = {
  strategy: "intl-datetimeformat",
  boundarySources: ["route", "persistence", "provider", "render"],
  storesUtcInstants: true,
  requiresIanaTimezoneAtBoundaries: true,
  proofArtifact: "coverage/timezone-recurrence-temporal-library.json",
} as const;

export function buildExplicitTimezoneDateBoundaryEvidence(input: {
  sampleInstant?: ISODateString;
  sampleTimezone?: string;
} = {}): ExplicitTimezoneDateBoundaryEvidence {
  const sampleInstant = input.sampleInstant ?? "2026-06-08T16:00:00.000Z";
  const sampleTimezone = input.sampleTimezone ?? "America/Los_Angeles";
  const blockers: string[] = [];
  let renderedLabel: string | null = null;

  if (!sampleInstant.endsWith("Z") || Number.isNaN(Date.parse(sampleInstant))) {
    blockers.push("Timezone/date boundary samples must use canonical UTC instants.");
  }
  if (!isValidIanaTimezone(sampleTimezone)) {
    blockers.push("Timezone/date boundary samples must use trimmed region-style IANA identifiers.");
  }

  if (blockers.length === 0) {
    renderedLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: sampleTimezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(sampleInstant));
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    strategy: explicitTimezoneDateBoundaryStrategy.strategy,
    sampleInstant,
    sampleTimezone,
    renderedLabel,
    boundarySources: explicitTimezoneDateBoundaryStrategy.boundarySources,
    storesUtcInstants: true,
    requiresIanaTimezoneAtBoundaries: true,
    blockers,
  };
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

export const timezoneRecurrenceQaRequiredControls = [
      "Use one explicit timezone strategy consistently at route, persistence, provider, and render boundaries.",
      "Store canonical UTC instants plus IANA timezone identifiers for appointments, holds, travel, and availability.",
      "Test DST spring-forward and fall-back boundaries before expanding recurring availability.",
      "Render Los Angeles, Arizona, and New York examples through internal, Google, and ICS outputs.",
      "Keep all-day travel windows timezone-aware and avoid converting them to floating local times.",
    ] as const;

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
    requiredControls: timezoneRecurrenceQaRequiredControls,
    blockers,
  };
}

export const timezoneRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "timezone route/persistence boundary tests",
      "stored recurrence expansion integration tests",
      "Google Calendar timezone render smoke",
      "ICS timezone import/render smoke",
    ] as const;

export const timezoneRuntimeReadinessRequiredEvidence = [
      "documented Temporal/date-library strategy with route, persistence, provider, and render usage",
      "route and persistence tests proving valid IANA timezone enforcement and UTC+timezone storage",
      "DST, recurrence expansion, and all-day travel-window test output",
      "cross-city internal, Google, and ICS provider render smoke-test artifacts",
      "seeded persistence-boundary tests for stored availability, appointments, travel windows, and recurrence expansion",
    ] as const;

export type TimezoneRuntimeReadinessRequiredEvidence = (typeof timezoneRuntimeReadinessRequiredEvidence)[number];

export function buildTimezoneRuntimeReadinessPlan(input: TimezoneRuntimeReadinessInput): TimezoneRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: TimezoneRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar timezone tests must pass.");
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.timezoneStrategySelected) blockers.push("Timezone/date strategy must be selected before production scheduling.");
  if (!input.temporalOrDateLibraryImplemented) blockers.push("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
  if (!input.routeIanaValidationEnforced) blockers.push("Routes must reject missing, untrimmed, or non-IANA timezone identifiers.");
  if (!input.persistenceIanaValidationEnforced) blockers.push("Persistence layer must reject invalid timezone identifiers before writing scheduling records.");
  if (!input.storedUtcAndTimezoneVerified) blockers.push("Scheduling records must store canonical UTC instants plus IANA timezone identifiers.");
  if (!input.dstSpringForwardTested) blockers.push("DST spring-forward behavior must be tested.");
  if (!input.dstFallBackTested) blockers.push("DST fall-back behavior must be tested.");
  if (!input.recurringAvailabilityExpansionTested) blockers.push("Recurring availability expansion must be tested against stored windows.");
  if (!input.allDayTravelWindowTested) blockers.push("All-day/travel windows must be tested without floating-time drift.");
  if (!input.crossCityRenderingTested) blockers.push("Cross-city appointment rendering must be tested for Los Angeles, Phoenix, New York, and Chicago.");
  if (!input.providerRenderSmokeTested) blockers.push("Internal/provider rendered calendar labels must be smoke-tested.");
  if (!input.googleProviderTimezoneSmokeTested) blockers.push("Google Calendar timezone rendering smoke test must pass.");
  if (!input.icsProviderTimezoneSmokeTested) blockers.push("ICS timezone rendering/import smoke test must pass.");
  if (!input.seededPersistenceBoundaryTestsPassed) blockers.push("Seeded persistence-boundary tests must prove timezone validation and recurrence expansion against stored data.");

  if (!input.timezoneStrategySelected || !input.temporalOrDateLibraryImplemented) {
    requiredEvidence.push(timezoneRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.routeIanaValidationEnforced || !input.persistenceIanaValidationEnforced || !input.storedUtcAndTimezoneVerified) {
    requiredEvidence.push(timezoneRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.dstSpringForwardTested || !input.dstFallBackTested || !input.recurringAvailabilityExpansionTested || !input.allDayTravelWindowTested) {
    requiredEvidence.push(timezoneRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.crossCityRenderingTested || !input.providerRenderSmokeTested || !input.googleProviderTimezoneSmokeTested || !input.icsProviderTimezoneSmokeTested) {
    requiredEvidence.push(timezoneRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.seededPersistenceBoundaryTestsPassed) {
    requiredEvidence.push(timezoneRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: timezoneRuntimeReadinessRequiredCommands,
    requiredEvidence,
    blockers,
  };
}

export const calendarRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm db:generate",
      "pnpm db:migrate",
      "pnpm test:unit -- packages/db/tests/tenant-scope.test.ts",
      "Google Calendar test-mode event create/update/delete smoke",
      "Signed ICS feed valid/revoked/expired token smoke",
    ] as const;

export const calendarRuntimeReadinessRequiredControls = [
      "Persist availability windows, holds, appointments, travel blocks, sync state, and audit logs in tenant-scoped transactions.",
      "Claim idempotency keys before creating slot holds, appointments, provider events, or sync-state writes.",
      "Encrypt provider refresh tokens and never expose Google tokens to clients.",
      "Recover from Google invalid sync tokens by running full resync before incremental sync resumes.",
      "Validate signed ICS feed token hash, tenant/artist scope, expiry, and revocation before returning private feeds.",
      "Run DST, recurrence, provider render, and all-day travel timezone QA before launch.",
      "Emit dashboard/mobile/public revalidation events after committed travel and scheduling mutations.",
    ] as const;

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
  if (!input.availabilityTransactionsConfigured) blockers.push("Availability mutations require transactional persistence and idempotency enforcement.");
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
    requiredCommands: calendarRuntimeReadinessRequiredCommands,
    requiredControls: calendarRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const calendarAutomatedTestReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
      "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
      "calendar Postgres integration tests",
      "Google test-calendar provider tests",
      "Playwright dashboard/public travel calendar smoke",
    ] as const;

export const calendarAutomatedTestReadinessRequiredEvidence = [
      "calendar helper and public route test output",
      "Postgres integration output for availability persistence, concurrent holds, audit logs, and signed-feed revocation",
      "Google test-calendar provider integration transcript",
      "DST/recurrence provider matrix output for internal, Google, and ICS render paths",
      "Playwright dashboard calendar and public travel smoke-test artifacts",
      "CI calendar test job configuration and retained artifacts",
    ] as const;

export type CalendarAutomatedTestReadinessRequiredEvidence = (typeof calendarAutomatedTestReadinessRequiredEvidence)[number];

export function buildCalendarAutomatedTestReadinessPlan(
  input: CalendarAutomatedTestReadinessInput,
): CalendarAutomatedTestReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: CalendarAutomatedTestReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarHelperTestsPassed) blockers.push("@inkroute/calendar helper/planning tests must pass.");
  if (!input.signedIcsRouteTestsPassed) blockers.push("Signed ICS feed route tests must pass.");
  if (!input.availabilityPreviewRouteTestsPassed) blockers.push("Availability preview route tests must pass.");
  if (!input.postgresIntegrationTestsPassed) blockers.push("Postgres calendar integration tests must pass for availability, holds, appointments, audit logs, and feed tokens.");
  if (!input.googleProviderTestsPassed) blockers.push("Google provider integration tests must pass against a test calendar.");
  if (!input.timezoneProviderMatrixTestsPassed) blockers.push("DST/recurrence provider matrix tests must pass across internal, Google, and ICS outputs.");
  if (!input.dashboardCalendarPlaywrightPassed) blockers.push("Playwright dashboard calendar smoke tests must pass.");
  if (!input.publicTravelPlaywrightPassed) blockers.push("Playwright public travel page smoke tests must pass.");
  if (!input.concurrentHoldRaceTestsPassed) blockers.push("Concurrent hold race-condition tests must pass.");
  if (!input.signedIcsRevocationDbTestsPassed) blockers.push("Signed ICS revocation DB tests must pass.");
  if (!input.ciCalendarTestJobConfigured) blockers.push("CI must run calendar helper, route, DB, provider, timezone, and Playwright smoke tests.");
  if (!input.artifactsCaptured) blockers.push("Calendar test artifacts must capture DB logs, Google provider transcripts, Playwright traces, and ICS import output.");

  if (!input.calendarHelperTestsPassed || !input.signedIcsRouteTestsPassed || !input.availabilityPreviewRouteTestsPassed) {
    requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[0]);
  }
  if (!input.postgresIntegrationTestsPassed || !input.concurrentHoldRaceTestsPassed || !input.signedIcsRevocationDbTestsPassed) {
    requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[1]);
  }
  if (!input.googleProviderTestsPassed) requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[2]);
  if (!input.timezoneProviderMatrixTestsPassed) {
    requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[3]);
  }
  if (!input.dashboardCalendarPlaywrightPassed || !input.publicTravelPlaywrightPassed) {
    requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[4]);
  }
  if (!input.ciCalendarTestJobConfigured || !input.artifactsCaptured) {
    requiredEvidence.push(calendarAutomatedTestReadinessRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: calendarAutomatedTestReadinessRequiredCommands,
    requiredEvidence,
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

export const googleCalendarProviderSyncRequiredControls = [
      "Authorize tenant and artist ownership before using stored Google provider credentials.",
      "Encrypt refresh tokens before persistence and never return provider tokens to clients.",
      "Claim idempotency key before provider mutations or sync-state writes.",
      "On Google 410 invalid sync token, stop incremental sync and run full resync.",
      "Renew push channels before expiration and validate webhook resource/channel ids before processing notifications.",
      "Persist redacted CalendarAuditLog for every provider call, retry, failure, and recovery path.",
    ] as const;

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
    requiredControls: googleCalendarProviderSyncRequiredControls,
    blockers,
  };
}

export const googleCalendarRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "Google OAuth callback smoke test",
      "Google FreeBusy test-calendar smoke",
      "Google event insert/update/delete smoke",
      "Google invalid sync-token full-resync smoke",
      "Google push channel renewal/webhook smoke",
    ] as const;

export const googleCalendarRuntimeReadinessRequiredEvidence = [
      "Google SDK/client setup plus OAuth app, scopes, and callback route evidence",
      "encrypted token repository, provider worker, and CalendarAuditLog persistence evidence",
      "Google test calendar FreeBusy and event insert/update/delete smoke-test output",
      "full sync, incremental sync-token persistence, and invalid-token recovery evidence",
      "Google push channel renewal and webhook handler test output",
      "retry/idempotency, tenant-isolation, and Google test-calendar artifact evidence",
    ] as const;

export type GoogleCalendarRuntimeReadinessRequiredEvidence = (typeof googleCalendarRuntimeReadinessRequiredEvidence)[number];

export function buildGoogleCalendarRuntimeReadinessPlan(input: GoogleCalendarRuntimeReadinessInput): GoogleCalendarRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: GoogleCalendarRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar Google sync tests must pass.");
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.googleSdkInstalled) blockers.push("Google Calendar SDK/client dependency must be installed and pinned.");
  if (!input.oauthAppConfigured) blockers.push("Google OAuth app, redirect URI, and client credentials must be configured.");
  if (!input.oauthCallbackRouteImplemented) blockers.push("Google OAuth callback route must exchange code and persist encrypted tokens.");
  if (!input.requiredScopesConfigured) blockers.push("Required Google Calendar scopes must be configured and consented.");
  if (!input.encryptedTokenRepositoryImplemented) blockers.push("Encrypted Google token repository must be implemented.");
  if (!input.providerWorkerImplemented) blockers.push("Google Calendar provider worker must execute sync operations.");
  if (!input.freebusySmokeTested) blockers.push("Google FreeBusy smoke test must pass against a test calendar.");
  if (!input.eventInsertUpdateDeleteSmokeTested) blockers.push("Google event insert/update/delete smoke test must pass.");
  if (!input.fullSyncImplemented) blockers.push("Full calendar sync must be implemented.");
  if (!input.incrementalSyncTokenPersisted) blockers.push("Incremental sync token persistence must be implemented.");
  if (!input.invalidSyncTokenFullResyncTested) blockers.push("Invalid sync-token recovery must trigger and verify full resync.");
  if (!input.pushChannelRenewalImplemented) blockers.push("Google push channel renewal must be implemented.");
  if (!input.pushWebhookHandlerImplemented) blockers.push("Google push webhook/channel handler must be implemented and verified.");
  if (!input.retryBackoffConfigured) blockers.push("Google provider retry/backoff policy must be configured.");
  if (!input.idempotencyStoreConfigured) blockers.push("Google provider operations must claim idempotency keys before provider calls.");
  if (!input.calendarAuditLogPersistenceConfigured) blockers.push("CalendarAuditLog persistence must be configured for every Google provider operation.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Google calendar provider tests must deny cross-tenant connection and event access.");
  if (!input.googleTestCalendarEvidenceAttached) blockers.push("Google test calendar evidence must be attached for OAuth, freebusy, event sync, push, and recovery flows.");

  if (!input.googleSdkInstalled || !input.oauthAppConfigured || !input.oauthCallbackRouteImplemented || !input.requiredScopesConfigured) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.encryptedTokenRepositoryImplemented || !input.providerWorkerImplemented || !input.calendarAuditLogPersistenceConfigured) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.freebusySmokeTested || !input.eventInsertUpdateDeleteSmokeTested) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.fullSyncImplemented || !input.incrementalSyncTokenPersisted || !input.invalidSyncTokenFullResyncTested) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.pushChannelRenewalImplemented || !input.pushWebhookHandlerImplemented) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[4]);
  }
  if (!input.retryBackoffConfigured || !input.idempotencyStoreConfigured || !input.tenantIsolationTestsPassed || !input.googleTestCalendarEvidenceAttached) {
    requiredEvidence.push(googleCalendarRuntimeReadinessRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: googleCalendarRuntimeReadinessRequiredCommands,
    requiredEvidence,
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

export const travelPublishMutationRequiredControls = [
      "Execute travel publish writes in one tenant-scoped transaction before cache revalidation.",
      "Write TravelAuditLog with actor, previous snapshot, changed fields, and rollback reason when applicable.",
      "Queue waitlist notifications only for clients with explicit matching city/travel consent.",
      "Emit web, dashboard, and mobile sync events after the travel stop mutation commits.",
      "Revalidate public travel, city, artist, tenant, sitemap, and schema cache tags after commit.",
      "Rollback public state and queued provider actions if any provider mutation fails before publish completion.",
    ] as const;

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
    requiredControls: travelPublishMutationRequiredControls,
    rollbackPlan: [
      "Restore previous TravelStop snapshot when provider or revalidation steps fail.",
      "Cancel unsent waitlist NotificationJob rows created by the failed publish.",
      "Emit compensating web/dashboard/mobile sync events with rollback status.",
      "Persist TravelAuditLog with rollback reason and failed provider action summary.",
    ],
    blockers,
  };
}

export const travelPublishRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/web typecheck",
      "travel publish repository integration tests",
      "Nomad Mode dashboard-to-public E2E smoke",
      "travel publish failed-provider rollback tests",
    ] as const;

export const travelPublishRuntimeReadinessRequiredEvidence = [
      "authorized dashboard travel mutation route and cross-tenant denial tests",
      "persisted travel repository, public data API, and post-commit revalidation evidence",
      "city waitlist matching and consent-filtered notification queue execution evidence",
      "mobile, dashboard, and web sync-event transport evidence",
      "TravelAuditLog persistence plus failed-provider rollback executor test output",
      "dashboard-to-public Nomad Mode publish E2E artifact with waitlist and rollback coverage",
    ] as const;

export type TravelPublishRuntimeReadinessRequiredEvidence = (typeof travelPublishRuntimeReadinessRequiredEvidence)[number];

export function buildTravelPublishRuntimeReadinessPlan(input: TravelPublishRuntimeReadinessInput): TravelPublishRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: TravelPublishRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar travel publish tests must pass.");
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.dashboardMutationRouteImplemented) blockers.push("Dashboard travel publish/update/unpublish/rollback mutation route evidence must be captured before travel publish readiness.");
  if (!input.dashboardAuthorizationEnforced) blockers.push("Dashboard travel publish mutations must enforce tenant, artist, and role authorization.");
  if (!input.persistedTravelRepositoryImplemented) blockers.push("Tenant-scoped persisted TravelStop/PublicTravelPage repository execution evidence must be captured before travel publish readiness.");
  if (!input.publicDataApiImplemented) blockers.push("Public travel data API must read committed travel publish state.");
  if (!input.cacheRevalidationCalledAfterCommit) blockers.push("Public page, city, artist, sitemap, and schema cache revalidation must run after commit.");
  if (!input.cityWaitlistMatchingImplemented) blockers.push("City waitlist matching must select eligible clients for changed travel stops.");
  if (!input.consentFilteredNotificationQueueImplemented) blockers.push("Waitlist notification queue must filter by explicit client consent.");
  if (!input.notificationProviderQueueTested) blockers.push("Notification provider queue execution must be tested for travel publish jobs.");
  if (!input.mobileSyncTransportImplemented) blockers.push("Mobile sync transport must receive committed travel changes.");
  if (!input.dashboardSyncTransportImplemented) blockers.push("Dashboard sync transport must reflect committed travel changes.");
  if (!input.webSyncEventPersistenceConfigured) blockers.push("Web revalidation/sync events must be persisted after travel mutations.");
  if (!input.auditLogPersistenceConfigured) blockers.push("TravelAuditLog persistence must be configured for publish/update/unpublish/rollback actions.");
  if (!input.rollbackExecutorImplemented) blockers.push("Travel publish rollback executor evidence must be captured before travel publish readiness.");
  if (!input.failedProviderRollbackTested) blockers.push("Failed provider action rollback tests must pass.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Cross-tenant travel publish mutation tests must be denied.");
  if (!input.e2eTravelPublishFlowPassed) blockers.push("End-to-end travel publish flow must prove dashboard edits update public site and waitlist jobs.");

  if (!input.dashboardMutationRouteImplemented || !input.dashboardAuthorizationEnforced || !input.tenantIsolationTestsPassed) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.persistedTravelRepositoryImplemented || !input.publicDataApiImplemented || !input.cacheRevalidationCalledAfterCommit) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.cityWaitlistMatchingImplemented || !input.consentFilteredNotificationQueueImplemented || !input.notificationProviderQueueTested) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.mobileSyncTransportImplemented || !input.dashboardSyncTransportImplemented || !input.webSyncEventPersistenceConfigured) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.auditLogPersistenceConfigured || !input.rollbackExecutorImplemented || !input.failedProviderRollbackTested) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[4]);
  }
  if (!input.e2eTravelPublishFlowPassed) {
    requiredEvidence.push(travelPublishRuntimeReadinessRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: travelPublishRuntimeReadinessRequiredCommands,
    requiredEvidence,
    blockers,
  };
}

export function buildSignedIcsFeedDraft(input: { tenantSlug: string; artistSlug: string; expiresInDays?: number }): SignedIcsFeedDraft {
  return {
    path: `/api/public/${input.tenantSlug}/calendar/${input.artistSlug}/travel.ics?token=SIGNED_FEED_TOKEN_PLACEHOLDER`,
    expiresInDays: input.expiresInDays ?? 90,
    tokenStorage: "hashed_database_token",
    visibility: "tenant_signed_feed",
    gapIds: ["GAP-009", "GAP-055"],
  };
}

export const calendarLaunchEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "availability Postgres integration tests",
      "concurrent slot hold race-condition tests",
      "Google Calendar OAuth/freebusy/event-sync smoke tests",
      "signed ICS token DB and route tests",
      "Apple/Google/Outlook ICS import smoke tests",
      "timezone DST and provider render matrix QA",
      "dashboard/public travel calendar smoke tests",
      "GitHub Actions calendar launch evidence job",
    ] as const;

export const calendarLaunchEvidenceRequiredEvidence = [
      "calendar package typecheck and unit/helper test output",
      "tenant-scoped availability repository, Postgres integration, race-condition, and tenant-isolation evidence",
      "Google OAuth, encrypted token, worker, FreeBusy, event sync, and push/incremental recovery evidence",
      "signed ICS token persistence, route access, and client import smoke evidence",
      "timezone/DST/recurrence and provider render matrix QA evidence",
      "travel publish persistence, cache revalidation, dashboard smoke, and public travel smoke evidence",
      "CI calendar job and secret-safe artifact evidence",
    ] as const;

export type CalendarLaunchEvidenceRequiredEvidence = (typeof calendarLaunchEvidenceRequiredEvidence)[number];

export function buildCalendarLaunchEvidencePlan(input: CalendarLaunchEvidenceInput): CalendarLaunchEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: CalendarLaunchEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar tests must pass.");
  if (!input.availabilityRepositoriesImplemented) blockers.push("Tenant-scoped availability/calendar repository evidence must be captured before calendar launch readiness.");
  if (!input.availabilityPostgresIntegrationPassed) blockers.push("Postgres availability integration tests must pass.");
  if (!input.concurrentHoldRaceTestsPassed) blockers.push("Concurrent slot hold race-condition tests must pass.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Calendar tenant-isolation tests must pass.");
  if (!input.googleOauthConfigured) blockers.push("Google OAuth client, redirect URI, and scopes must be configured.");
  if (!input.googleEncryptedTokensConfigured) blockers.push("Google refresh tokens must be encrypted and persisted.");
  if (!input.googleWorkerEnabled) blockers.push("Google Calendar provider sync worker must be enabled.");
  if (!input.googleFreebusySmokePassed) blockers.push("Google FreeBusy test-calendar smoke must pass.");
  if (!input.googleEventSyncSmokePassed) blockers.push("Google event create/update/delete sync smoke must pass.");
  if (!input.googlePushOrIncrementalSyncVerified) blockers.push("Google push channel or incremental sync recovery must be verified.");
  if (!input.signedIcsTokenPersistenceConfigured) blockers.push("Signed ICS token hash, expiry, rotation, and revocation persistence must be configured.");
  if (!input.signedIcsAccessSmokePassed) blockers.push("Signed ICS access route smoke tests must pass.");
  if (!input.signedIcsClientImportSmokePassed) blockers.push("Apple/Google/Outlook signed ICS import smoke tests must pass.");
  if (!input.timezoneDstQaPassed) blockers.push("Timezone/DST/recurrence QA must pass.");
  if (!input.providerRenderMatrixPassed) blockers.push("Internal, Google, and ICS provider render matrix must pass.");
  if (!input.travelPublishPersistencePassed) blockers.push("Travel publish persistence and rollback tests must pass.");
  if (!input.cacheRevalidationVerified) blockers.push("Calendar/travel cache revalidation must be verified after committed mutations.");
  if (!input.dashboardCalendarSmokePassed) blockers.push("Dashboard calendar/travel smoke tests must pass.");
  if (!input.publicTravelSmokePassed) blockers.push("Public travel/calendar smoke tests must pass.");
  if (!input.ciEvidenceCaptured) blockers.push("CI calendar evidence must be captured.");
  if (!input.calendarArtifactsSecretSafe) blockers.push("Calendar artifacts must be redacted and free of provider tokens, client data, or private calendar details.");

  if (!input.calendarTypecheckPassed || !input.calendarTestsPassed) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[0]);
  }
  if (!input.availabilityRepositoriesImplemented || !input.availabilityPostgresIntegrationPassed || !input.concurrentHoldRaceTestsPassed || !input.tenantIsolationTestsPassed) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[1]);
  }
  if (!input.googleOauthConfigured || !input.googleEncryptedTokensConfigured || !input.googleWorkerEnabled || !input.googleFreebusySmokePassed || !input.googleEventSyncSmokePassed || !input.googlePushOrIncrementalSyncVerified) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[2]);
  }
  if (!input.signedIcsTokenPersistenceConfigured || !input.signedIcsAccessSmokePassed || !input.signedIcsClientImportSmokePassed) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[3]);
  }
  if (!input.timezoneDstQaPassed || !input.providerRenderMatrixPassed) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[4]);
  }
  if (!input.travelPublishPersistencePassed || !input.cacheRevalidationVerified || !input.dashboardCalendarSmokePassed || !input.publicTravelSmokePassed) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[5]);
  }
  if (!input.ciEvidenceCaptured || !input.calendarArtifactsSecretSafe) {
    requiredEvidence.push(calendarLaunchEvidenceRequiredEvidence[6]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: calendarLaunchEvidenceRequiredCommands,
    requiredEvidence,
    blockers,
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

export const signedIcsFeedRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
      "signed ICS token DB integration tests",
      "Apple/Google/Outlook ICS import smoke tests",
    ] as const;

export const signedIcsFeedRuntimeReadinessRequiredEvidence = [
      "tenant-scoped signed-feed token creation, hashed persistence, expiry, and rotation evidence",
      "revocation UI/API evidence and revoked-token route rejection test output",
      "tenant/artist scope enforcement, durable access-log persistence, and private cache-header route tests",
      "Apple, Google, and Outlook calendar import smoke-test artifacts",
    ] as const;

export type SignedIcsFeedRuntimeReadinessRequiredEvidence = (typeof signedIcsFeedRuntimeReadinessRequiredEvidence)[number];

export function buildSignedIcsFeedRuntimeReadinessPlan(
  input: SignedIcsFeedRuntimeReadinessInput,
): SignedIcsFeedRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SignedIcsFeedRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar signed ICS tests must pass.");
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.webRouteTestsPassed) blockers.push("Web ICS feed route tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with signed ICS route wiring.");
  if (!input.tokenCreationImplemented) blockers.push("Signed feed-token creation must be implemented.");
  if (!input.hashedTokenPersistenceConfigured) blockers.push("Hashed signed-feed token persistence must be configured.");
  if (!input.expiryRotationPersistenceConfigured) blockers.push("Signed feed-token expiry and rotation persistence must be configured.");
  if (!input.revocationUiImplemented) blockers.push("Feed-token revocation UI/API proof must be captured before signed ICS feed readiness.");
  if (!input.revocationApiImplemented) blockers.push("Feed-token revocation API proof must be captured before signed ICS feed readiness.");
  if (!input.revokedTokenRouteRejectionTested) blockers.push("Route tests must reject revoked tokens loaded from durable storage.");
  if (!input.tenantArtistScopeEnforced) blockers.push("ICS feed route must enforce tenant and artist token scope.");
  if (!input.durableAccessLogPersistenceConfigured) blockers.push("Durable ICS feed access-log persistence must be configured.");
  if (!input.privateCacheHeadersVerified) blockers.push("Private/no-store rejection and private short-cache success headers must be verified.");
  if (!input.appleCalendarImportTested) blockers.push("Apple Calendar import smoke test must pass.");
  if (!input.googleCalendarImportTested) blockers.push("Google Calendar import smoke test must pass.");
  if (!input.outlookCalendarImportTested) blockers.push("Outlook Calendar import smoke test must pass.");

  if (!input.tokenCreationImplemented || !input.hashedTokenPersistenceConfigured || !input.expiryRotationPersistenceConfigured) {
    requiredEvidence.push(signedIcsFeedRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.revocationUiImplemented || !input.revocationApiImplemented || !input.revokedTokenRouteRejectionTested) {
    requiredEvidence.push(signedIcsFeedRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.tenantArtistScopeEnforced || !input.durableAccessLogPersistenceConfigured || !input.privateCacheHeadersVerified) {
    requiredEvidence.push(signedIcsFeedRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.appleCalendarImportTested || !input.googleCalendarImportTested || !input.outlookCalendarImportTested) {
    requiredEvidence.push(signedIcsFeedRuntimeReadinessRequiredEvidence[3]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === signedIcsFeedRuntimeReadinessRequiredEvidence.length
      ? signedIcsFeedRuntimeReadinessRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: signedIcsFeedRuntimeReadinessRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    blockers,
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

export const availabilityPersistenceRequiredControls = [
      "Execute availability mutations in one tenant-scoped database transaction.",
      "Claim the idempotency key before creating holds or appointments.",
      "Reject cross-tenant booking, window, hold, and appointment ids before writes.",
      "Lock the tenant/artist/time range or use an equivalent exclusion constraint before inserting slot holds.",
      "Write CalendarAuditLog for every window, hold, appointment, and release mutation.",
    ] as const;

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
    requiredControls: availabilityPersistenceRequiredControls,
    blockers,
  };
}

export const availabilityRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/db prisma validate",
      "availability persistence seeded Postgres integration tests",
      "concurrent slot hold race-condition tests",
      "dashboard/API availability repository tests",
    ] as const;

export const availabilityRuntimeReadinessRequiredEvidence = [
      "Prisma availability models plus dashboard/API repository wiring evidence",
      "transactional availability window, hold, appointment confirmation, and release test output",
      "persisted conflict detection and concurrent hold rejection evidence",
      "CalendarAuditLog and IdempotencyKey persistence evidence for every availability mutation",
      "seeded Postgres tenant isolation and availability lifecycle integration test output",
    ] as const;

export type AvailabilityRuntimeReadinessRequiredEvidence = (typeof availabilityRuntimeReadinessRequiredEvidence)[number];

export function buildAvailabilityRuntimeReadinessPlan(input: AvailabilityRuntimeReadinessInput): AvailabilityRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: AvailabilityRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/calendar package script is missing ${script}.`);
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar availability tests must pass.");
  if (!input.calendarTypecheckPassed) blockers.push("@inkroute/calendar typecheck must pass.");
  if (!input.dbSchemaIncludesAvailabilityModels) blockers.push("Prisma schema must include AvailabilityWindow, AvailabilityHold, Appointment, CalendarAuditLog, and IdempotencyKey models.");
  if (!input.repositoriesImplemented) blockers.push("Tenant-scoped availability repository/service evidence must be captured before availability persistence readiness.");
  if (!input.tenantScopedQueriesEnforced) blockers.push("Availability repositories must enforce tenant scope on every read and write.");
  if (!input.transactionalWindowCreationImplemented) blockers.push("Availability window creation must run in a tenant-scoped transaction.");
  if (!input.transactionalSlotHoldImplemented) blockers.push("Slot hold creation must run in a tenant-scoped transaction.");
  if (!input.appointmentConfirmationImplemented) blockers.push("Appointment confirmation must persist Appointment, hold, booking, audit, and idempotency writes.");
  if (!input.holdReleaseImplemented) blockers.push("Hold release must persist hold release state, CalendarAuditLog, and idempotency writes.");
  if (!input.auditLogPersistenceConfigured) blockers.push("CalendarAuditLog persistence must be configured for every availability mutation.");
  if (!input.idempotencyStoreConfigured) blockers.push("Idempotency store must be configured before availability mutations execute.");
  if (!input.conflictDetectionAgainstPersistedRows) blockers.push("Conflict detection must query persisted appointments, holds, windows, and travel blocks.");
  if (!input.concurrentHoldProtectionConfigured) blockers.push("Concurrent slot hold protection must lock or constrain tenant/artist/time ranges.");
  if (!input.overlappingSlotDbRejectionTested) blockers.push("Overlapping slot persistence rejection must be tested against DB rows.");
  if (!input.crossTenantIsolationTestsPassed) blockers.push("Cross-tenant availability reads and mutations must be denied by tests.");
  if (!input.seededPostgresIntegrationTestsPassed) blockers.push("Seeded Postgres integration tests must prove availability persistence lifecycle.");
  if (!input.dashboardAndApiUseRepository) blockers.push("Dashboard and API availability surfaces must use the tenant-scoped repository/service layer.");

  if (!input.dbSchemaIncludesAvailabilityModels || !input.repositoriesImplemented || !input.dashboardAndApiUseRepository) {
    requiredEvidence.push(availabilityRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.transactionalWindowCreationImplemented || !input.transactionalSlotHoldImplemented || !input.appointmentConfirmationImplemented || !input.holdReleaseImplemented) {
    requiredEvidence.push(availabilityRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.conflictDetectionAgainstPersistedRows || !input.concurrentHoldProtectionConfigured || !input.overlappingSlotDbRejectionTested) {
    requiredEvidence.push(availabilityRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.auditLogPersistenceConfigured || !input.idempotencyStoreConfigured) {
    requiredEvidence.push(availabilityRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.crossTenantIsolationTestsPassed || !input.seededPostgresIntegrationTestsPassed) {
    requiredEvidence.push(availabilityRuntimeReadinessRequiredEvidence[4]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === availabilityRuntimeReadinessRequiredEvidence.length
      ? availabilityRuntimeReadinessRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: availabilityRuntimeReadinessRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
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
