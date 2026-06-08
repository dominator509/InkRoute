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
