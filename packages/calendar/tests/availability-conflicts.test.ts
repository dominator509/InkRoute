import { describe, expect, it } from "vitest";
import {
  travelPublishMutationRequiredControls,
  travelPublishRuntimeReadinessRequiredEvidence,
  timezoneRecurrenceQaRequiredControls,
  timezoneRuntimeReadinessRequiredEvidence,
  googleCalendarProviderSyncRequiredControls,
  googleCalendarRuntimeReadinessRequiredCommands,
  googleCalendarRuntimeReadinessRequiredEvidence,
  calendarRuntimeReadinessRequiredControls,
  calendarRuntimeReadinessRequiredCommands,
  calendarLaunchEvidenceRequiredCommands,
  calendarLaunchEvidenceRequiredEvidence,
  calendarAutomatedTestReadinessRequiredCommands,
  calendarAutomatedTestReadinessRequiredEvidence,
  availabilityPersistenceRequiredControls,
  availabilityRuntimeReadinessRequiredCommands,
  availabilityRuntimeReadinessRequiredEvidence,
  signedIcsFeedRuntimeReadinessRequiredCommands,
  signedIcsFeedRuntimeReadinessRequiredEvidence,
  timezoneRuntimeReadinessRequiredCommands,
  travelPublishRuntimeReadinessRequiredCommands,
  buildAvailabilitySlots,
  buildAvailabilityPersistencePlan,
  buildAvailabilityRuntimeReadinessPlan,
  buildCalendarAutomatedTestReadinessPlan,
  buildCalendarLaunchEvidencePlan,
  buildCalendarRuntimeReadinessPlan,
  buildGoogleCalendarRuntimeReadinessPlan,
  buildGoogleCalendarProviderSyncPlan,
  buildSignedIcsFeedRuntimeReadinessPlan,
  buildSignedIcsFeedDraft,
  buildSignedIcsFeedTokenHash,
  buildExplicitTimezoneDateBoundaryEvidence,
  buildTimezoneRecurrenceQaPlan,
  buildTimezoneRuntimeReadinessPlan,
  buildTravelPublishMutationPlan,
  buildTravelPublishRuntimeReadinessPlan,
  auditCalendarTimezones,
  detectCalendarConflicts,
  evaluateSignedIcsFeedAccess,
  explicitTimezoneDateBoundaryStrategy,
  isValidIanaTimezone,
  type CalendarTimeBlock,
} from "../src/index";
import type { AvailabilityWindow } from "@inkroute/types";
import type { TravelStop } from "@inkroute/types";

const window: AvailabilityWindow = {
  id: "window_1",
  tenantId: "tenant_1",
  artistId: "artist_1",
  kind: "booking",
  status: "open",
  startsAt: "2026-06-10T16:00:00.000Z",
  endsAt: "2026-06-10T22:00:00.000Z",
  timezone: "America/Los_Angeles",
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15
};

const busy: CalendarTimeBlock = {
  id: "appointment_1",
  title: "Booked tattoo",
  startsAt: "2026-06-10T18:00:00.000Z",
  endsAt: "2026-06-10T20:00:00.000Z",
  timezone: "America/Los_Angeles",
  source: "appointment",
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 30,
  blocksBooking: true
};

const demoTravelStop: TravelStop = {
  id: "travel_seattle_001",
  tenantId: "tenant_demo",
  artistId: "artist_demo",
  city: "Seattle",
  region: "WA",
  country: "US",
  startsAt: "2026-07-10T17:00:00.000Z",
  endsAt: "2026-07-14T02:00:00.000Z",
  timezone: "America/Los_Angeles",
  bookingStatus: "open",
  studioName: "Needle House",
  publicNotes: "Books open for flash and custom work.",
};

describe("calendar availability", () => {
  it("marks generated slots that conflict with booked appointments", () => {
    const slots = buildAvailabilitySlots({ window, durationMinutes: 120, stepMinutes: 120, existingBlocks: [busy] });

    expect(slots).toHaveLength(3);
    expect(slots.some((slot) => slot.status === "conflicted")).toBe(true);
    expect(slots.some((slot) => slot.status === "open")).toBe(true);
  });

  it("distinguishes buffer overlap from direct overlap", () => {
    const conflicts = detectCalendarConflicts(
      {
        id: "candidate",
        title: "Candidate",
        startsAt: "2026-06-10T20:10:00.000Z",
        endsAt: "2026-06-10T21:00:00.000Z",
        timezone: "America/Los_Angeles",
        source: "availability_hold",
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        blocksBooking: true
      },
      [busy]
    );

    expect(conflicts[0]?.severity).toBe("warning");
  });

  it("creates signed ICS feed drafts as security-gated metadata", () => {
    const draft = buildSignedIcsFeedDraft({ tenantSlug: "mara-vale", artistSlug: "mara", expiresInDays: 30 });

    expect(draft.path).toContain("/calendar/mara/travel.ics");
    expect(draft.tokenStorage).toBe("hashed_database_token");
    expect(draft.gapIds).toEqual(expect.arrayContaining(["GAP-055"]))
  });

  it("evaluates signed ICS feed token access and cache policy", () => {
    const token = "feed-token-001";
    const record = {
      tokenHash: buildSignedIcsFeedTokenHash(token),
      tenantSlug: "mara-vale",
      artistSlug: "mara",
      expiresAt: "2026-07-01T00:00:00.000Z",
    };

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record,
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }),
    ).toMatchObject({
      allowed: true,
      status: "allowed",
      cacheControl: "private, max-age=300, stale-while-revalidate=60",
      shouldLogAccess: true,
    });

    expect(
      evaluateSignedIcsFeedAccess({
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("missing_token");

    expect(
      evaluateSignedIcsFeedAccess({
        token: "wrong",
        record,
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("invalid_token");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, tenantSlug: "other" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("scope_mismatch");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, revokedAt: "2026-06-01T00:00:00.000Z" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("revoked");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, expiresAt: "2026-06-01T00:00:00.000Z" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("expired");
  });

  it("blocks signed ICS feed runtime readiness until durable tokens, revocation, access logs, and calendar imports are proven", () => {
    const plan = buildSignedIcsFeedRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      webRouteTestsPassed: true,
      webTypecheckPassed: false,
      tokenCreationImplemented: false,
      hashedTokenPersistenceConfigured: false,
      expiryRotationPersistenceConfigured: false,
      revocationUiImplemented: true,
      revocationApiImplemented: false,
      revokedTokenRouteRejectionTested: false,
      tenantArtistScopeEnforced: true,
      durableAccessLogPersistenceConfigured: false,
      privateCacheHeadersVerified: true,
      appleCalendarImportTested: false,
      googleCalendarImportTested: false,
      outlookCalendarImportTested: false,
    });
    const allMissingEvidencePlan = buildSignedIcsFeedRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      webRouteTestsPassed: true,
      webTypecheckPassed: false,
      tokenCreationImplemented: false,
      hashedTokenPersistenceConfigured: false,
      expiryRotationPersistenceConfigured: false,
      revocationUiImplemented: false,
      revocationApiImplemented: false,
      revokedTokenRouteRejectionTested: false,
      tenantArtistScopeEnforced: false,
      durableAccessLogPersistenceConfigured: false,
      privateCacheHeadersVerified: false,
      appleCalendarImportTested: false,
      googleCalendarImportTested: false,
      outlookCalendarImportTested: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(signedIcsFeedRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(signedIcsFeedRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      signedIcsFeedRuntimeReadinessRequiredEvidence[0],
      signedIcsFeedRuntimeReadinessRequiredEvidence[1],
      signedIcsFeedRuntimeReadinessRequiredEvidence[2],
      signedIcsFeedRuntimeReadinessRequiredEvidence[3],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(signedIcsFeedRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Hashed signed-feed token persistence must be configured.");
    expect(plan.blockers).not.toContain("Feed-token revocation UI/API proof must be captured before signed ICS feed readiness.");
    expect(plan.blockers).not.toContain("Feed-token revocation UI must be implemented.");
    expect(plan.blockers).toContain("Feed-token revocation API proof must be captured before signed ICS feed readiness.");
    expect(plan.blockers).not.toContain("Feed-token revocation API must be implemented.");
    expect(plan.blockers).toContain("Durable ICS feed access-log persistence must be configured.");
  });

  it("audits IANA timezones across blocks, windows, travel stops, and required city matrix", () => {
    expect(isValidIanaTimezone("America/Los_Angeles")).toBe(true);
    expect(isValidIanaTimezone("America/Phoenix")).toBe(true);
    expect(isValidIanaTimezone("PST")).toBe(false);
    expect(isValidIanaTimezone(" America/New_York")).toBe(false);

    const summary = auditCalendarTimezones({
      blocks: [busy],
      windows: [window],
      travelStops: [
        {
          id: "stop_1",
          timezone: "America/New_York",
        },
      ],
      requiredTimezones: ["America/Los_Angeles", "America/Phoenix", "America/New_York", "America/Chicago"],
    });

    expect(summary.status).toBe("pass");
    expect(summary.checkedCount).toBe(7);
    expect(summary.uniqueTimezones).toEqual([
      "America/Chicago",
      "America/Los_Angeles",
      "America/New_York",
      "America/Phoenix",
    ]);

    const failing = auditCalendarTimezones({
      blocks: [{ ...busy, id: "bad_block", timezone: "US/Pacific Time" }],
    });
    expect(failing.status).toBe("fail");
    expect(failing.findings[0]).toMatchObject({
      id: "block:bad_block",
      status: "fail",
    });
  });

  it("exports an explicit dependency-light timezone/date boundary strategy", () => {
    const evidence = buildExplicitTimezoneDateBoundaryEvidence({
      sampleInstant: "2026-06-08T16:00:00.000Z",
      sampleTimezone: "America/Los_Angeles",
    });

    expect(explicitTimezoneDateBoundaryStrategy).toMatchObject({
      strategy: "intl-datetimeformat",
      storesUtcInstants: true,
      requiresIanaTimezoneAtBoundaries: true,
      proofArtifact: "coverage/timezone-recurrence-temporal-library.json",
    });
    expect(evidence.status).toBe("ready");
    expect(evidence.boundarySources).toEqual(["route", "persistence", "provider", "render"]);
    expect(evidence.renderedLabel).toContain("2026");
  });

  it("plans transactional availability window and slot hold persistence", () => {
    const windowPlan = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "create_availability_window",
      startsAt: "2026-06-10T16:00:00.000Z",
      endsAt: "2026-06-10T22:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      idempotencyKey: "availability-window:tenant_demo:artist_demo:2026-06-10",
    });
    const holdPlan = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "create_slot_hold",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      bookingRequestId: "booking_demo",
      availabilityWindowId: "window_demo",
      idempotencyKey: "slot-hold:tenant_demo:artist_demo:booking_demo",
    });

    expect(windowPlan).toMatchObject({
      status: "ready",
      requiresTransaction: true,
      idempotencyKey: "availability-window:tenant_demo:artist_demo:2026-06-10",
    });
    expect(windowPlan.writes.map((write) => write.model)).toEqual(["AvailabilityWindow", "CalendarAuditLog", "IdempotencyKey"]);
    expect(holdPlan.writes.map((write) => write.model)).toEqual(["AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"]);
    expect(holdPlan.writes.every((write) => write.tenantId === "tenant_demo")).toBe(true);
    expect(holdPlan.requiredControls).toBe(availabilityPersistenceRequiredControls);
    expect(holdPlan.blockers).toEqual([]);
  });

  it("plans appointment confirmation and hold release audit writes", () => {
    const confirmation = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "confirm_appointment",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      bookingRequestId: "booking_demo",
      availabilityWindowId: "window_demo",
      holdId: "hold_demo",
      appointmentId: "appointment_demo",
      idempotencyKey: "appointment-confirm:tenant_demo:appointment_demo",
    });
    const release = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "release_slot_hold",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      holdId: "hold_demo",
      idempotencyKey: "hold-release:tenant_demo:hold_demo",
    });

    expect(confirmation.writes.map((write) => write.model)).toEqual(["Appointment", "AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"]);
    expect(confirmation.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      action: "confirm_appointment",
      bookingRequestId: "booking_demo",
      holdId: "hold_demo",
      appointmentId: "appointment_demo",
    });
    expect(release.writes.map((write) => write.model)).toEqual(["AvailabilityHold", "CalendarAuditLog", "IdempotencyKey"]);
  });

  it("blocks availability persistence without tenant scope, actor, valid time, timezone, and concurrency controls", () => {
    const blocked = buildAvailabilityPersistencePlan({
      tenantId: " ",
      artistId: "",
      action: "create_slot_hold",
      startsAt: "2026-06-10T20:00:00.000Z",
      endsAt: "2026-06-10T18:00:00.000Z",
      timezone: "PST",
      conflictIds: ["appointment_1"],
      existingHoldIds: ["hold_1"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "Missing tenant scope.",
      "Missing artist id.",
      "Availability mutations require an actor id for audit attribution.",
      "Missing idempotency key for availability mutation.",
      "Availability time range must have a valid start before end.",
      "Availability timezone must be a valid IANA identifier.",
      "Availability mutation has blocking calendar conflicts.",
      "Slot hold and appointment confirmation require a booking request id.",
      "Slot hold and appointment confirmation require an availability window id.",
      "Concurrent slot hold already exists for this tenant, artist, and time range.",
    ]);
  });

  it("blocks availability runtime readiness until repositories, transactions, persisted conflicts, concurrency, audit, and tenant isolation are proven", () => {
    const plan = buildAvailabilityRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      dbSchemaIncludesAvailabilityModels: false,
      repositoriesImplemented: false,
      tenantScopedQueriesEnforced: false,
      transactionalWindowCreationImplemented: false,
      transactionalSlotHoldImplemented: false,
      appointmentConfirmationImplemented: false,
      holdReleaseImplemented: false,
      auditLogPersistenceConfigured: false,
      idempotencyStoreConfigured: false,
      conflictDetectionAgainstPersistedRows: false,
      concurrentHoldProtectionConfigured: false,
      overlappingSlotDbRejectionTested: false,
      crossTenantIsolationTestsPassed: false,
      seededPostgresIntegrationTestsPassed: false,
      dashboardAndApiUseRepository: false,
    });
    const allMissingEvidencePlan = buildAvailabilityRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      dbSchemaIncludesAvailabilityModels: false,
      repositoriesImplemented: false,
      tenantScopedQueriesEnforced: false,
      transactionalWindowCreationImplemented: false,
      transactionalSlotHoldImplemented: false,
      appointmentConfirmationImplemented: false,
      holdReleaseImplemented: false,
      auditLogPersistenceConfigured: false,
      idempotencyStoreConfigured: false,
      conflictDetectionAgainstPersistedRows: false,
      concurrentHoldProtectionConfigured: false,
      overlappingSlotDbRejectionTested: false,
      crossTenantIsolationTestsPassed: false,
      seededPostgresIntegrationTestsPassed: false,
      dashboardAndApiUseRepository: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(availabilityRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(availabilityRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      availabilityRuntimeReadinessRequiredEvidence[0],
      availabilityRuntimeReadinessRequiredEvidence[1],
      availabilityRuntimeReadinessRequiredEvidence[2],
      availabilityRuntimeReadinessRequiredEvidence[3],
      availabilityRuntimeReadinessRequiredEvidence[4],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(availabilityRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Tenant-scoped availability repository/service evidence must be captured before availability persistence readiness.");
    expect(plan.blockers).not.toContain("Tenant-scoped availability repositories/services must be implemented.");
    expect(plan.blockers).toContain("Concurrent slot hold protection must lock or constrain tenant/artist/time ranges.");
    expect(plan.blockers).toContain("Seeded Postgres integration tests must prove availability persistence lifecycle.");
  });

  it("plans Google OAuth connection and event upsert with encrypted token and audit writes", () => {
    const oauth = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "oauth_connect",
      occurredAt: "2026-06-08T10:00:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: false,
      providerWorkerEnabled: true,
      idempotencyKey: "google-oauth:tenant_demo:artist_demo",
    });
    const upsert = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "upsert_event",
      occurredAt: "2026-06-08T10:05:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      appointmentId: "appointment_demo",
      providerEventId: "event_demo",
      idempotencyKey: "google-event-upsert:tenant_demo:appointment_demo",
    });

    expect(oauth.status).toBe("ready");
    expect(oauth.providerCall).toBe("google.oauth.exchangeCode");
    expect(oauth.writes.map((write) => write.model)).toEqual(["CalendarProviderConnection", "CalendarProviderToken", "CalendarAuditLog", "IdempotencyKey"]);
    expect(upsert.status).toBe("ready");
    expect(upsert.providerCall).toBe("google.events.insertOrUpdate");
    expect(upsert.writes.map((write) => write.model)).toEqual(["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"]);
    expect(upsert.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      action: "upsert_event",
      appointmentId: "appointment_demo",
      providerCall: "google.events.insertOrUpdate",
      providerEventIdHash: expect.any(String),
      rawProviderEventIdStored: false,
      rawSyncTokenStored: false,
      rawPushChannelIdStored: false,
      rawPushResourceIdStored: false,
    });
    expect(upsert.writes.find((write) => write.model === "CalendarAuditLog")?.payload).not.toHaveProperty("providerEventId");
  });

  it("plans incremental sync recovery and push channel renewal controls", () => {
    const invalidIncremental = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "incremental_sync",
      occurredAt: "2026-06-08T10:10:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      syncToken: "sync_token_001",
      syncTokenInvalid: true,
      idempotencyKey: "google-incremental:tenant_demo:sync_token_001",
    });
    const renewal = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "renew_push_channel",
      occurredAt: "2026-06-08T10:15:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      pushChannelId: "channel_001",
      pushResourceId: "resource_001",
      pushChannelExpiresAt: "2026-06-09T10:15:00.000Z",
      idempotencyKey: "google-channel-renew:tenant_demo:channel_001",
    });

    expect(invalidIncremental.status).toBe("blocked");
    expect(invalidIncremental.blockers).toContain("Google returned an invalid sync token; run full_resync before incremental sync.");
    expect(invalidIncremental.nextAction).toContain("Run full_resync");
    expect(invalidIncremental.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      syncTokenHash: expect.any(String),
      rawSyncTokenStored: false,
      rawProviderEventIdStored: false,
    });
    expect(invalidIncremental.writes.find((write) => write.model === "CalendarAuditLog")?.payload).not.toHaveProperty("syncToken");
    expect(renewal.status).toBe("ready");
    expect(renewal.providerCall).toBe("google.channels.watch");
    expect(renewal.writes.map((write) => write.model)).toEqual(["CalendarPushChannel", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"]);
    expect(renewal.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      pushChannelIdHash: expect.any(String),
      pushResourceIdHash: expect.any(String),
      rawPushChannelIdStored: false,
      rawPushResourceIdStored: false,
    });
    expect(renewal.writes.find((write) => write.model === "CalendarAuditLog")?.payload).not.toHaveProperty("pushChannelId");
    expect(renewal.writes.find((write) => write.model === "CalendarAuditLog")?.payload).not.toHaveProperty("pushResourceId");
    expect(renewal.requiredControls).toBe(googleCalendarProviderSyncRequiredControls);
  });

  it("blocks Google sync when credentials, encrypted tokens, ids, or idempotency are missing", () => {
    const blocked = buildGoogleCalendarProviderSyncPlan({
      tenantId: "",
      artistId: "",
      calendarId: "",
      action: "delete_event",
      occurredAt: "2026-06-08T10:20:00.000Z",
      oauthClientConfigured: false,
      requiredScopesGranted: false,
      refreshTokenEncrypted: false,
      providerWorkerEnabled: false,
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "Missing tenant scope.",
      "Missing artist id.",
      "Missing Google calendar id.",
      "Google OAuth client and redirect URI must be configured.",
      "Google Calendar scopes must be granted before provider sync.",
      "Google Calendar provider worker must be enabled before executing sync operations.",
      "Missing idempotency key for Google Calendar sync operation.",
      "Encrypted refresh token must be stored before Google Calendar provider calls.",
      "Appointment id is required before mutating Google Calendar events.",
      "Provider event id is required before deleting Google Calendar events.",
    ]);
  });

  it("blocks Google Calendar runtime readiness until SDK, OAuth, encrypted tokens, worker sync, push, idempotency, and provider evidence exist", () => {
    const plan = buildGoogleCalendarRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      googleSdkInstalled: false,
      oauthAppConfigured: false,
      oauthCallbackRouteImplemented: false,
      requiredScopesConfigured: false,
      encryptedTokenRepositoryImplemented: false,
      providerWorkerImplemented: false,
      freebusySmokeTested: false,
      eventInsertUpdateDeleteSmokeTested: false,
      fullSyncImplemented: false,
      incrementalSyncTokenPersisted: false,
      invalidSyncTokenFullResyncTested: false,
      pushChannelRenewalImplemented: false,
      pushWebhookHandlerImplemented: true,
      retryBackoffConfigured: false,
      idempotencyStoreConfigured: false,
      calendarAuditLogPersistenceConfigured: false,
      tenantIsolationTestsPassed: false,
      googleTestCalendarEvidenceAttached: false,
    });
    const allMissingEvidencePlan = buildGoogleCalendarRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: false,
      calendarTypecheckPassed: false,
      googleSdkInstalled: false,
      oauthAppConfigured: false,
      oauthCallbackRouteImplemented: false,
      requiredScopesConfigured: false,
      encryptedTokenRepositoryImplemented: false,
      providerWorkerImplemented: false,
      freebusySmokeTested: false,
      eventInsertUpdateDeleteSmokeTested: false,
      fullSyncImplemented: false,
      incrementalSyncTokenPersisted: false,
      invalidSyncTokenFullResyncTested: false,
      pushChannelRenewalImplemented: false,
      pushWebhookHandlerImplemented: false,
      retryBackoffConfigured: false,
      idempotencyStoreConfigured: false,
      calendarAuditLogPersistenceConfigured: false,
      tenantIsolationTestsPassed: false,
      googleTestCalendarEvidenceAttached: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(googleCalendarRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(googleCalendarRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      googleCalendarRuntimeReadinessRequiredEvidence[0],
      googleCalendarRuntimeReadinessRequiredEvidence[1],
      googleCalendarRuntimeReadinessRequiredEvidence[2],
      googleCalendarRuntimeReadinessRequiredEvidence[3],
      googleCalendarRuntimeReadinessRequiredEvidence[4],
      googleCalendarRuntimeReadinessRequiredEvidence[5],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(googleCalendarRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Google OAuth callback route must exchange code and persist encrypted tokens.");
    expect(plan.blockers).toContain("Invalid sync-token recovery must trigger and verify full resync.");
    expect(plan.blockers).toContain("Google test calendar evidence must be attached for OAuth, freebusy, event sync, push, and recovery flows.");
  });

  it("plans timezone recurrence QA across DST, recurrence, provider render, and all-day travel cases", () => {
    const plan = buildTimezoneRecurrenceQaPlan({
      temporalStrategySelected: true,
      providerRenderSmokeTested: true,
      requiredTimezones: ["America/Los_Angeles", "America/Phoenix", "America/New_York"],
      requiredChecks: ["iana_validation", "dst_transition", "recurrence_expansion", "provider_render_matrix", "all_day_travel_window"],
      cases: [
        {
          id: "la-spring-forward",
          timezone: "America/Los_Angeles",
          startsAt: "2026-03-08T09:30:00.000Z",
          endsAt: "2026-03-08T11:30:00.000Z",
          check: "dst_transition",
        },
        {
          id: "phoenix-no-dst",
          timezone: "America/Phoenix",
          startsAt: "2026-03-08T17:00:00.000Z",
          endsAt: "2026-03-08T19:00:00.000Z",
          check: "all_day_travel_window",
        },
        {
          id: "new-york-weekly",
          timezone: "America/New_York",
          startsAt: "2026-11-01T05:30:00.000Z",
          endsAt: "2026-11-01T07:30:00.000Z",
          check: "recurrence_expansion",
          recurrenceRule: "FREQ=WEEKLY;COUNT=4",
          expandedOccurrenceCount: 4,
        },
        {
          id: "google-render-la",
          timezone: "America/Los_Angeles",
          startsAt: "2026-06-10T18:00:00.000Z",
          endsAt: "2026-06-10T20:00:00.000Z",
          check: "provider_render_matrix",
          provider: "google",
          expectedLocalLabel: "Jun 10, 2026 11:00 AM PDT",
        },
        {
          id: "iana-base",
          timezone: "America/New_York",
          startsAt: "2026-06-10T18:00:00.000Z",
          endsAt: "2026-06-10T20:00:00.000Z",
          check: "iana_validation",
        },
      ],
    });

    expect(plan.status).toBe("ready");
    expect(plan.checkedCount).toBe(5);
    expect(plan.coveredTimezones).toEqual(["America/Los_Angeles", "America/New_York", "America/Phoenix"]);
    expect(plan.coveredChecks).toEqual(["all_day_travel_window", "dst_transition", "iana_validation", "provider_render_matrix", "recurrence_expansion"]);
    expect(plan.findings.every((finding) => finding.status === "pass")).toBe(true);
    expect(plan.requiredControls).toBe(timezoneRecurrenceQaRequiredControls);
  });

  it("plans aggregate calendar runtime readiness without claiming DB or Google provider proof", () => {
    const plan = buildCalendarRuntimeReadinessPlan({
      packageScripts: {
        build: "tsc --noEmit",
        typecheck: "tsc --noEmit",
        test: "vitest run",
      },
      packageTestsPassed: false,
      packageTypecheckPassed: false,
      databaseRepositoriesConfigured: false,
      postgresIntegrationVerified: false,
      tenantIsolationVerified: false,
      availabilityTransactionsConfigured: false,
      googleOauthConfigured: false,
      encryptedProviderTokensConfigured: false,
      googleWorkerEnabled: false,
      googleProviderSmokeVerified: false,
      signedIcsTokenStoreConfigured: false,
      signedIcsAccessVerified: false,
      timezoneQaReady: false,
      cacheRevalidationConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredCommands).toBe(calendarRuntimeReadinessRequiredCommands);
    expect(plan.requiredControls).toBe(calendarRuntimeReadinessRequiredControls);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Calendar package tests have not passed in the installed workspace.",
      "Tenant-scoped calendar repositories are not configured.",
      "Availability mutations require transactional persistence and idempotency enforcement.",
      "Google OAuth client, redirect URI, and scopes are not configured.",
      "Signed ICS feed token store is not configured.",
      "Timezone/DST/recurrence/provider-render QA matrix is not ready.",
    ]));
    expect(plan.blockers).not.toContain("Availability mutations are not wired to transactional persistence and idempotency enforcement.");
  });

  it("blocks calendar launch evidence until Postgres, Google, signed ICS, timezone, travel, CI, and artifacts are proven", () => {
    const plan = buildCalendarLaunchEvidencePlan({
      packageScripts: { test: "vitest run" },
      calendarTypecheckPassed: false,
      calendarTestsPassed: true,
      availabilityRepositoriesImplemented: false,
      availabilityPostgresIntegrationPassed: false,
      concurrentHoldRaceTestsPassed: false,
      tenantIsolationTestsPassed: false,
      googleOauthConfigured: false,
      googleEncryptedTokensConfigured: false,
      googleWorkerEnabled: false,
      googleFreebusySmokePassed: false,
      googleEventSyncSmokePassed: false,
      googlePushOrIncrementalSyncVerified: false,
      signedIcsTokenPersistenceConfigured: false,
      signedIcsAccessSmokePassed: false,
      signedIcsClientImportSmokePassed: false,
      timezoneDstQaPassed: false,
      providerRenderMatrixPassed: false,
      travelPublishPersistencePassed: false,
      cacheRevalidationVerified: false,
      dashboardCalendarSmokePassed: false,
      publicTravelSmokePassed: false,
      ciEvidenceCaptured: false,
      calendarArtifactsSecretSafe: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(calendarLaunchEvidenceRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      calendarLaunchEvidenceRequiredEvidence[0],
      calendarLaunchEvidenceRequiredEvidence[1],
      calendarLaunchEvidenceRequiredEvidence[2],
      calendarLaunchEvidenceRequiredEvidence[3],
      calendarLaunchEvidenceRequiredEvidence[4],
      calendarLaunchEvidenceRequiredEvidence[5],
      calendarLaunchEvidenceRequiredEvidence[6],
    ]);
    expect(plan.blockers).toContain("Google OAuth client, redirect URI, and scopes must be configured.");
    expect(plan.blockers).toContain("Signed ICS token hash, expiry, rotation, and revocation persistence must be configured.");
    expect(plan.blockers).toContain("Calendar artifacts must be redacted and free of provider tokens, client data, or private calendar details.");
  });

  it("marks calendar launch evidence ready when Postgres, Google, signed ICS, timezone, travel, CI, and artifacts align", () => {
    const plan = buildCalendarLaunchEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      availabilityRepositoriesImplemented: true,
      availabilityPostgresIntegrationPassed: true,
      concurrentHoldRaceTestsPassed: true,
      tenantIsolationTestsPassed: true,
      googleOauthConfigured: true,
      googleEncryptedTokensConfigured: true,
      googleWorkerEnabled: true,
      googleFreebusySmokePassed: true,
      googleEventSyncSmokePassed: true,
      googlePushOrIncrementalSyncVerified: true,
      signedIcsTokenPersistenceConfigured: true,
      signedIcsAccessSmokePassed: true,
      signedIcsClientImportSmokePassed: true,
      timezoneDstQaPassed: true,
      providerRenderMatrixPassed: true,
      travelPublishPersistencePassed: true,
      cacheRevalidationVerified: true,
      dashboardCalendarSmokePassed: true,
      publicTravelSmokePassed: true,
      ciEvidenceCaptured: true,
      calendarArtifactsSecretSafe: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks calendar automated test readiness until route, DB, Google, timezone matrix, Playwright, CI, and artifact evidence exist", () => {
    const plan = buildCalendarAutomatedTestReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarHelperTestsPassed: true,
      signedIcsRouteTestsPassed: true,
      availabilityPreviewRouteTestsPassed: true,
      postgresIntegrationTestsPassed: false,
      googleProviderTestsPassed: false,
      timezoneProviderMatrixTestsPassed: false,
      dashboardCalendarPlaywrightPassed: false,
      publicTravelPlaywrightPassed: false,
      concurrentHoldRaceTestsPassed: false,
      signedIcsRevocationDbTestsPassed: false,
      ciCalendarTestJobConfigured: false,
      artifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(calendarAutomatedTestReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(calendarAutomatedTestReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      calendarAutomatedTestReadinessRequiredEvidence[1],
      calendarAutomatedTestReadinessRequiredEvidence[2],
      calendarAutomatedTestReadinessRequiredEvidence[3],
      calendarAutomatedTestReadinessRequiredEvidence[4],
      calendarAutomatedTestReadinessRequiredEvidence[5],
    ]);
    expect(plan.blockers).toContain("Postgres calendar integration tests must pass for availability, holds, appointments, audit logs, and feed tokens.");
    expect(plan.blockers).toContain("Playwright public travel page smoke tests must pass.");
    expect(plan.blockers).toContain("Calendar test artifacts must capture DB logs, Google provider transcripts, Playwright traces, and ICS import output.");
  });

  it("blocks timezone recurrence QA when strategy, coverage, recurrence expansion, or provider labels are missing", () => {
    const plan = buildTimezoneRecurrenceQaPlan({
      temporalStrategySelected: false,
      providerRenderSmokeTested: false,
      requiredTimezones: ["America/Los_Angeles", "America/Phoenix"],
      requiredChecks: ["dst_transition", "recurrence_expansion", "provider_render_matrix"],
      cases: [
        {
          id: "bad-recurrence",
          timezone: "America/Los_Angeles",
          startsAt: "2026-03-08T09:30:00.000Z",
          endsAt: "2026-03-08T11:30:00.000Z",
          check: "recurrence_expansion",
        },
        {
          id: "bad-provider-render",
          timezone: "PST",
          startsAt: "2026-06-10T18:00:00.000Z",
          endsAt: "2026-06-10T20:00:00.000Z",
          check: "provider_render_matrix",
        },
      ],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Timezone QA requires an explicit timezone/date library or Temporal strategy before production scheduling.",
      "Provider render smoke tests must cover internal, Google, and ICS calendar outputs.",
      "Required timezone is missing from the QA matrix.",
      "Required timezone QA check is missing from the matrix.",
      "Recurring availability case must include a recurrence rule and expanded occurrence count.",
      "Timezone case must use a valid IANA timezone.",
    ]);
  });

  it("blocks timezone runtime readiness until strategy, boundary validation, DST, recurrence, provider render, and stored-data evidence exist", () => {
    const plan = buildTimezoneRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      timezoneStrategySelected: false,
      temporalOrDateLibraryImplemented: false,
      routeIanaValidationEnforced: false,
      persistenceIanaValidationEnforced: false,
      storedUtcAndTimezoneVerified: false,
      dstSpringForwardTested: true,
      dstFallBackTested: false,
      recurringAvailabilityExpansionTested: false,
      allDayTravelWindowTested: false,
      crossCityRenderingTested: false,
      providerRenderSmokeTested: false,
      googleProviderTimezoneSmokeTested: false,
      icsProviderTimezoneSmokeTested: false,
      seededPersistenceBoundaryTestsPassed: false,
    });
    const allMissingEvidencePlan = buildTimezoneRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: false,
      calendarTypecheckPassed: false,
      timezoneStrategySelected: false,
      temporalOrDateLibraryImplemented: false,
      routeIanaValidationEnforced: false,
      persistenceIanaValidationEnforced: false,
      storedUtcAndTimezoneVerified: false,
      dstSpringForwardTested: false,
      dstFallBackTested: false,
      recurringAvailabilityExpansionTested: false,
      allDayTravelWindowTested: false,
      crossCityRenderingTested: false,
      providerRenderSmokeTested: false,
      googleProviderTimezoneSmokeTested: false,
      icsProviderTimezoneSmokeTested: false,
      seededPersistenceBoundaryTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(timezoneRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(timezoneRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      timezoneRuntimeReadinessRequiredEvidence[0],
      timezoneRuntimeReadinessRequiredEvidence[1],
      timezoneRuntimeReadinessRequiredEvidence[2],
      timezoneRuntimeReadinessRequiredEvidence[3],
      timezoneRuntimeReadinessRequiredEvidence[4],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(timezoneRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
    expect(plan.blockers).toContain("Recurring availability expansion must be tested against stored windows.");
    expect(plan.blockers).toContain("ICS timezone rendering/import smoke test must pass.");
  });

  it("plans real-time travel publish writes with revalidation, waitlist, and sync events", () => {
    const plan = buildTravelPublishMutationPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      actorId: "artist_demo",
      action: "publish",
      stop: demoTravelStop,
      idempotencyKey: "travel-publish:tenant_demo:travel_seattle_001",
      consentedWaitlistClientIds: ["client_001", "client_001", "client_002"],
      providerActionsSucceeded: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.requiresTransaction).toBe(true);
    expect(plan.notificationJobCount).toBe(2);
    expect(plan.revalidationTags).toEqual([
      "travel",
      "city:seattle-wa",
      "artist:artist_demo",
      "tenant:tenant_demo",
    ]);
    expect(plan.writes.map((write) => write.model)).toEqual([
      "TravelStop",
      "PublicTravelPage",
      "CityWaitlistMatch",
      "NotificationJob",
      "WebRevalidationEvent",
      "MobileSyncEvent",
      "DashboardSyncEvent",
      "TravelAuditLog",
      "IdempotencyKey",
    ]);
    expect(plan.writes.find((write) => write.model === "NotificationJob")?.payload).toMatchObject({
      clientIds: ["client_001", "client_002"],
      consentRequired: true,
      count: 2,
    });
    expect(plan.requiredControls).toBe(travelPublishMutationRequiredControls);
    expect(plan.blockers).toEqual([]);
  });

  it("plans travel rollback with previous snapshot and compensating sync controls", () => {
    const plan = buildTravelPublishMutationPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      actorId: "artist_demo",
      action: "rollback",
      stop: { ...demoTravelStop, bookingStatus: "closed" },
      previousStop: demoTravelStop,
      idempotencyKey: "travel-rollback:tenant_demo:travel_seattle_001",
      rollbackReason: "Provider event insert failed.",
    });

    expect(plan.status).toBe("ready");
    expect(plan.writes.map((write) => write.model)).toEqual([
      "TravelStop",
      "PublicTravelPage",
      "WebRevalidationEvent",
      "MobileSyncEvent",
      "DashboardSyncEvent",
      "TravelAuditLog",
      "IdempotencyKey",
    ]);
    expect(plan.rollbackPlan).toContain("Restore previous TravelStop snapshot when provider or revalidation steps fail.");
    expect(plan.writes.find((write) => write.model === "TravelAuditLog")?.payload).toMatchObject({
      action: "rollback",
      previousStopId: "travel_seattle_001",
      rollbackReason: "Provider event insert failed.",
    });
  });

  it("blocks unsafe travel publish mutations without scope, audit actor, idempotency, valid timezone, or rollback path", () => {
    const blocked = buildTravelPublishMutationPlan({
      tenantId: "tenant_demo",
      artistId: "other_artist",
      action: "update",
      stop: {
        ...demoTravelStop,
        artistId: "artist_demo",
        timezone: "PST",
        startsAt: "2026-07-14T02:00:00.000Z",
        endsAt: "2026-07-10T17:00:00.000Z",
      },
      providerActionsSucceeded: false,
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "Travel publish mutation requires an actor id for audit attribution.",
      "Missing idempotency key for travel publish mutation.",
      "Travel stop artist does not match mutation artist scope.",
      "Travel stop timezone must be a valid IANA identifier.",
      "Travel stop must start before it ends.",
      "Travel update and rollback require the previous travel stop snapshot.",
      "Provider action failure requires rollback before publishing public state.",
    ]);
  });

  it("blocks travel publish runtime readiness until dashboard mutation, public data, revalidation, notification, sync, rollback, and E2E evidence exist", () => {
    const plan = buildTravelPublishRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: true,
      calendarTypecheckPassed: false,
      dashboardMutationRouteImplemented: false,
      dashboardAuthorizationEnforced: false,
      persistedTravelRepositoryImplemented: false,
      publicDataApiImplemented: false,
      cacheRevalidationCalledAfterCommit: false,
      cityWaitlistMatchingImplemented: false,
      consentFilteredNotificationQueueImplemented: false,
      notificationProviderQueueTested: false,
      mobileSyncTransportImplemented: false,
      dashboardSyncTransportImplemented: false,
      webSyncEventPersistenceConfigured: false,
      auditLogPersistenceConfigured: false,
      rollbackExecutorImplemented: false,
      failedProviderRollbackTested: false,
      tenantIsolationTestsPassed: false,
      e2eTravelPublishFlowPassed: false,
    });
    const allMissingEvidencePlan = buildTravelPublishRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      calendarTestsPassed: false,
      calendarTypecheckPassed: false,
      dashboardMutationRouteImplemented: false,
      dashboardAuthorizationEnforced: false,
      persistedTravelRepositoryImplemented: false,
      publicDataApiImplemented: false,
      cacheRevalidationCalledAfterCommit: false,
      cityWaitlistMatchingImplemented: false,
      consentFilteredNotificationQueueImplemented: false,
      notificationProviderQueueTested: false,
      mobileSyncTransportImplemented: false,
      dashboardSyncTransportImplemented: false,
      webSyncEventPersistenceConfigured: false,
      auditLogPersistenceConfigured: false,
      rollbackExecutorImplemented: false,
      failedProviderRollbackTested: false,
      tenantIsolationTestsPassed: false,
      e2eTravelPublishFlowPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(travelPublishRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(travelPublishRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toEqual([
      travelPublishRuntimeReadinessRequiredEvidence[0],
      travelPublishRuntimeReadinessRequiredEvidence[1],
      travelPublishRuntimeReadinessRequiredEvidence[2],
      travelPublishRuntimeReadinessRequiredEvidence[3],
      travelPublishRuntimeReadinessRequiredEvidence[4],
      travelPublishRuntimeReadinessRequiredEvidence[5],
    ]);
    expect(allMissingEvidencePlan.requiredEvidence).toBe(travelPublishRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard travel publish/update/unpublish/rollback mutation route evidence must be captured before travel publish readiness.");
    expect(plan.blockers).toContain("Tenant-scoped persisted TravelStop/PublicTravelPage repository execution evidence must be captured before travel publish readiness.");
    expect(plan.blockers).toContain("Travel publish rollback executor evidence must be captured before travel publish readiness.");
    expect(plan.blockers).not.toContain("Dashboard travel publish/update/unpublish/rollback mutation route must be implemented.");
    expect(plan.blockers).not.toContain("Tenant-scoped persisted TravelStop/PublicTravelPage repository must be implemented.");
    expect(plan.blockers).not.toContain("Travel publish rollback executor must be implemented.");
    expect(plan.blockers).toContain("Public page, city, artist, sitemap, and schema cache revalidation must run after commit.");
    expect(plan.blockers).toContain("End-to-end travel publish flow must prove dashboard edits update public site and waitlist jobs.");
  });
});
