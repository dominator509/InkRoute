import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardMutationArtifactReview,
  buildDashboardMutationEvidenceDecision,
  buildDashboardMutationExecutionPlan,
  buildRedactedDashboardMutationArtifact,
  dashboardMutationActions,
  dashboardMutationArtifactPaths,
  dashboardMutationEvidenceFlags,
  dashboardMutationExternalCommands,
  dashboardMutationExecutionPolicy,
  dashboardMutationLocalCommands,
  dashboardMutationRequiredExternalEvidence,
  dashboardMutationRuntimeCommands,
  dashboardMutationRuntimeMatrix,
  dashboardMutationRuntimeProofFiles,
  dashboardMutationRuntimeReadiness,
} from "../lib/dashboardMutationRuntime";
import { dashboardMutationExecutionRequiredEvidence } from "@inkroute/booking";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard mutation runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingStateRoute = readRepoFile("apps/dashboard/app/api/bookings/[bookingId]/state/route.ts");
  const appointmentRoute = readRepoFile("apps/dashboard/app/api/appointments/route.ts");
  const bookingStateRouteTest = readRepoFile("apps/dashboard/tests/booking-state-route-static.test.ts");
  const messageRoute = readRepoFile("apps/dashboard/app/api/messages/route.ts");
  const messageActionPanel = readRepoFile("apps/dashboard/components/MessageActionPanel.tsx");
  const notificationPersistenceTest = readRepoFile("apps/dashboard/tests/notification-persistence-static.test.ts");
  const notificationQueueRoute = readRepoFile("apps/dashboard/app/api/notifications/queue/route.ts");
  const notificationPreviewRoute = readRepoFile("apps/dashboard/app/api/notifications/preview/route.ts");
  const calendarHoldRoute = readRepoFile("apps/dashboard/app/api/calendar/holds/route.ts");
  const availabilityPersistenceTest = readRepoFile("apps/dashboard/tests/availability-persistence-static.test.ts");
  const availabilityRoute = readRepoFile("apps/dashboard/app/api/availability/route.ts");
  const intakeFormRoute = readRepoFile("apps/dashboard/app/api/intake/forms/route.ts");
  const consentFormRoute = readRepoFile("apps/dashboard/app/api/consent/forms/route.ts");
  const travelCityRoute = readRepoFile("apps/dashboard/app/api/travel/cities/route.ts");
  const travelScheduleRoute = readRepoFile("apps/dashboard/app/api/travel/schedules/route.ts");
  const travelPublishRoute = readRepoFile("apps/dashboard/app/api/travel/publish/route.ts");
  const travelPublishActionPanel = readRepoFile("apps/dashboard/components/TravelPublishActionPanel.tsx");
  const travelPublishTest = readRepoFile("apps/dashboard/tests/travel-publish-static.test.ts");
  const portfolioRoute = readRepoFile("apps/dashboard/app/api/portfolio/route.ts");
  const portfolioImageRoute = readRepoFile("apps/dashboard/app/api/portfolio/[portfolioId]/images/route.ts");
  const imageSeoRoute = readRepoFile("apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts");
  const imageSeoActionPanel = readRepoFile("apps/dashboard/components/ImageSeoActionPanel.tsx");
  const imageSeoTest = readRepoFile("apps/dashboard/tests/image-seo-pipeline-static.test.ts");
  const refundRoute = readRepoFile("apps/dashboard/app/api/refunds/route.ts");
  const settingsRoute = readRepoFile("apps/dashboard/app/api/settings/route.ts");
  const settingsActionPanel = readRepoFile("apps/dashboard/components/SettingsActionPanel.tsx");
  const settingsTest = readRepoFile("apps/dashboard/tests/settings-read-route-static.test.ts");
  const clientRoute = readRepoFile("apps/dashboard/app/api/clients/route.ts");
  const clientDetailRoute = readRepoFile("apps/dashboard/app/api/clients/[clientId]/route.ts");
  const clientDetailActionPanel = readRepoFile("apps/dashboard/components/ClientDetailActionPanel.tsx");
  const clientReadRouteTest = readRepoFile("apps/dashboard/tests/client-read-route-static.test.ts");
  const paymentsPage = readRepoFile("apps/dashboard/app/payments/page.tsx");
  const paymentActionPanel = readRepoFile("apps/dashboard/components/PaymentActionPanel.tsx");
  const depositSessionRoute = readRepoFile("apps/dashboard/app/api/payments/deposit-session/route.ts");
  const paymentReadRouteTest = readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts");
  const formDetailRoute = readRepoFile("apps/dashboard/app/api/forms/[formId]/route.ts");
  const formActionPanel = readRepoFile("apps/dashboard/components/FormActionPanel.tsx");
  const formReadRouteTest = readRepoFile("apps/dashboard/tests/form-read-route-static.test.ts");
  const featureFlagRoute = readRepoFile("apps/dashboard/app/api/feature-flags/route.ts");
  const featureFlagRouteTest = readRepoFile("apps/dashboard/tests/feature-flag-route-static.test.ts");
  const releaseRoute = readRepoFile("apps/dashboard/app/api/releases/route.ts");
  const releaseRouteTest = readRepoFile("apps/dashboard/tests/release-route-static.test.ts");
  const notificationPreferenceRoute = readRepoFile("apps/dashboard/app/api/notification-preferences/[clientId]/route.ts");
  const signedUploadRoute = readRepoFile("apps/dashboard/app/api/files/signed-upload/route.ts");
  const bookingLifecycleActionPanel = readRepoFile("apps/dashboard/components/BookingLifecycleActionPanel.tsx");
  const disabledActionPanel = readRepoFile("apps/dashboard/components/DisabledActionPanel.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-038 actions, commands, matrix rows, and artifacts", () => {
    expect(dashboardMutationActions).toEqual([
      "accept",
      "decline",
      "request_changes",
      "mark_deposit_paid",
      "confirm_appointment",
      "complete",
      "create_reference_upload_intent",
      "create_deposit_session",
      "send_client_notification",
      "create_calendar_hold",
      "publish_travel_stop",
      "publish_portfolio_item",
      "toggle_feature_flag",
      "rollback_release",
      "update_settings",
    ]);
    expect(dashboardMutationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard mutation server-action/API route tests",
      "dashboard mutation Prisma transaction tests",
      "dashboard mutation tenant-isolation and RBAC tests",
      "provider mutation rollback/retry tests",
      "dashboard mutation UI feedback-state tests",
      "GitHub Actions dashboard mutation execution evidence job",
    ]);
    expect(dashboardMutationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-typecheck",
      "booking-tests",
      "dashboard-typecheck-build",
      "booking-state-api-route",
      "all-action-route-matrix",
      "prisma-transaction-idempotency-audit",
      "tenant-rbac-denial",
      "provider-rollback-retry",
      "gated-ui-feedback",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardMutationArtifactPaths).toContain("coverage/dashboard-mutation-runtime.json");
    expect(dashboardMutationArtifactPaths).toContain("test-results/dashboard-mutation-runtime");
  });

  it("pins current GAP-038 proof files", () => {
    expect(dashboardMutationRuntimeProofFiles).toContain("packages/booking/package.json");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts");
    for (const file of dashboardMutationRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package mutation helpers and booking lifecycle API route wired", () => {
    expect(bookingPackageJson).toContain('"typecheck"');
    expect(bookingPackageJson).toContain('"test"');
    expect(bookingSource).toContain("buildDashboardMutationPlan");
    expect(bookingSource).toContain("buildDashboardMutationExecutionEvidencePlan");
    expect(bookingTests).toContain("buildDashboardMutationExecutionEvidencePlan");
    expect(bookingStateRoute).toContain("buildDashboardMutationPlan");
    expect(bookingStateRoute).toContain("dashboardMutationPlan");
    expect(bookingStateRoute).toContain("buildBookingLifecycleResponseProjection");
    expect(bookingStateRoute).toContain("bookingLifecycleResponseAllowlisted: true");
    expect(bookingStateRoute).toContain("tenantIdEchoed: false");
    expect(bookingStateRoute).toContain("bookingRequestIdEchoed: false");
    expect(bookingStateRoute).toContain("tenantScope: { actorTenantMatched: true");
    expect(bookingStateRoute).toContain("bookingTenantMatched: true");
    expect(bookingStateRoute).toContain("prisma.$transaction");
    expect(bookingStateRoute).toContain("tx.idempotencyKey.upsert");
    expect(bookingStateRoute).toContain("tx.idempotencyKey.update");
    expect(bookingStateRoute).toContain("existingIdempotency?.status");
    expect(bookingStateRoute).toContain("tx.bookingStateEvent.create");
    expect(bookingStateRoute).toContain("tx.auditLog.create");
    expect(bookingStateRoute).toContain("bookingStateEventPersisted: true");
    expect(bookingStateRoute).toContain("auditLogged: true");
    expect(bookingStateRoute).toContain("internalPersistenceIdsStored: false");
    expect(bookingStateRoute).not.toContain("eventId: event.id,\n            auditId: audit.id");
    expect(bookingStateRoute).toContain("idempotencyPersisted: true");
    expect(bookingStateRoute).toContain("rawIdempotencyKeyStored: false");
    expect(bookingStateRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(bookingStateRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(bookingStateRoute).not.toContain("eventId: event.id");
    expect(bookingStateRoute).not.toContain("tenantId,\n          bookingId");
    expect(bookingStateRoute).not.toContain("tenantId,\n        booking:");
    expect(appointmentRoute).toContain('export const runtime = "nodejs"');
    expect(appointmentRoute).toContain("dashboard-appointment-create");
    expect(appointmentRoute).toContain("buildSafeBookingTransitionPlanResponse");
    expect(appointmentRoute).toContain("buildSafeDashboardMutationPlanResponse");
    expect(appointmentRoute).toContain("buildSafeAppointmentReceipt");
    expect(appointmentRoute).toContain("buildAppointmentCreateResponseProjection");
    expect(appointmentRoute).toContain("buildSafeAppointmentBookingReceipt");
    expect(appointmentRoute).toContain("buildSafeBookingStateEventReceipt");
    expect(appointmentRoute).toContain("buildSafeDepositDraftReceipt");
    expect(appointmentRoute).toContain("buildSafeNotificationJobReceipt");
    expect(appointmentRoute).toContain("plan: buildSafeBookingTransitionPlanResponse(result.transitionPlan)");
    expect(appointmentRoute).toContain("dashboardMutationPlan: buildSafeDashboardMutationPlanResponse(result.dashboardMutationPlan)");
    expect(appointmentRoute).toContain("rawTransitionEchoed: false");
    expect(appointmentRoute).toContain("rawWritePayloadsEchoed: false");
    expect(appointmentRoute).toContain("rawBookingRequestIdEchoed: false");
    expect(appointmentRoute).toContain("rawActorIdEchoed: false");
    expect(appointmentRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(appointmentRoute).toContain("rawDashboardMutationPlanEchoed: false");
    expect(appointmentRoute).toContain("tx.idempotencyKey.upsert");
    expect(appointmentRoute).toContain('idempotency.status === "completed"');
    expect(appointmentRoute).toContain("tx.appointment.findFirst");
    expect(appointmentRoute).toContain("tx.appointment.create");
    expect(appointmentRoute).toContain("tx.bookingStateEvent.create");
    expect(appointmentRoute).toContain("tx.auditLog.create");
    expect(appointmentRoute).toContain("tx.deposit.create");
    expect(appointmentRoute).toContain("tx.paymentAuditLog.create");
    expect(appointmentRoute).toContain('action: "deposit:draft:create_from_appointment"');
    expect(appointmentRoute).toContain("depositDraftPersisted");
    expect(appointmentRoute).toContain("stripeCheckoutCreated: false");
    expect(appointmentRoute).toContain("tx.notificationJob.create");
    expect(appointmentRoute).toContain('sourceAction: "appointment.create.notification"');
    expect(appointmentRoute).toContain('templateKey: "appointment_created"');
    expect(appointmentRoute).toContain('providerExecution: "deferred"');
    expect(appointmentRoute).toContain("notificationJobQueued: true");
    expect(appointmentRoute).toContain("tx.idempotencyKey.update");
    expect(appointmentRoute).toContain("appointmentPersisted: true");
    expect(appointmentRoute).toContain("bookingStateEventPersisted: true");
    expect(appointmentRoute).toContain("idempotencyPersisted: true");
    expect(appointmentRoute).toContain("rawIdempotencyKeyStored: false");
    expect(appointmentRoute).toContain("bookingRequestMatched: true");
    expect(appointmentRoute).toContain("auditLogged: true");
    expect(appointmentRoute).toContain("depositAuditPersisted");
    expect(appointmentRoute).toContain("internalPersistenceIdsStored: false");
    expect(appointmentRoute).toContain("calendarProviderInserted: false");
    expect(appointmentRoute).toContain("depositSessionCreated: false");
    expect(appointmentRoute).toContain("notificationProviderExecution");
    expect(appointmentRoute).toContain("appointmentCreateResponseAllowlisted: true");
    expect(appointmentRoute).toContain("tenantIdEchoed: false");
    expect(appointmentRoute).toContain("auditIdEchoed: false");
    expect(appointmentRoute).toContain("depositAuditIdEchoed: false");
    expect(appointmentRoute).toContain("appointmentIdEchoed: false");
    expect(appointmentRoute).toContain("duplicateAppointmentIdEchoed: false");
    expect(appointmentRoute).toContain("artistIdEchoed: false");
    expect(appointmentRoute).toContain("clientIdEchoed: false");
    expect(appointmentRoute).toContain("travelCityIdEchoed: false");
    expect(appointmentRoute).toContain("studioIdEchoed: false");
    expect(appointmentRoute).toContain("eventIdEchoed: false");
    expect(appointmentRoute).toContain("depositDraftIdEchoed: false");
    expect(appointmentRoute).toContain("notificationJobIdEchoed: false");
    expect(appointmentRoute).toContain("rawNotificationJobPayloadEchoed: false");
    expect(appointmentRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(appointmentRoute).toContain("tenantScope: { actorTenantMatched: true");
    expect(appointmentRoute).toContain("appointmentRelatedRecordsTenantMatched: true");
    expect(appointmentRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(appointmentRoute).not.toContain("function resultAppointmentId");
    expect(appointmentRoute).not.toContain("appointmentId: appointment.id,\n            bookingRequestId: booking.id,\n            eventId: event.id,\n            auditId: audit.id");
    expect(appointmentRoute).not.toContain("appointmentId: result.appointmentId");
    expect(appointmentRoute).not.toContain("appointment: result.appointment");
    expect(appointmentRoute).not.toContain("booking: result.booking");
    expect(appointmentRoute).not.toContain("event: result.event");
    expect(appointmentRoute).not.toContain("depositDraft: result.depositDraft");
    expect(appointmentRoute).not.toContain("notificationJob: result.notificationJob");
    expect(appointmentRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(appointmentRoute).not.toContain("eventId: event.id");
    expect(appointmentRoute).not.toContain("bookingRequestId: booking.id,\n            fromStatus: booking.status");
    expect(appointmentRoute).not.toContain("metadata: {\n                  source: \"dashboard-api\",\n                  appointmentId: appointment.id,\n                  bookingRequestId: booking.id");
    expect(appointmentRoute).not.toContain("depositDraftId: depositDraft?.id");
    expect(appointmentRoute).not.toContain("depositAuditId: depositAudit?.id");
    expect(appointmentRoute).not.toContain("notificationJobId: notificationJob.id");
    expect(appointmentRoute).not.toContain("auditId: result.status");
    expect(appointmentRoute).not.toContain("depositAuditId: result.status");
    expect(appointmentRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(appointmentRoute).not.toContain("tenantId,\n        appointment:");
    expect(appointmentRoute).not.toContain("tenantId,\n          error:");
    expect(appointmentRoute).toContain("idempotencyReplay");
    expect(bookingLifecycleActionPanel).toContain("fetch(`/api/bookings/${bookingId}/state`");
    expect(bookingLifecycleActionPanel).toContain("idempotencyKey");
    expect(bookingLifecycleActionPanel).toContain("BookingStateEvent writes");
    expect(bookingLifecycleActionPanel).toContain("AuditLog persistence");
    expect(bookingStateRoute).toContain('return "create_deposit_session"');
    expect(bookingStateRoute).toContain('return "mark_deposit_paid"');
    expect(bookingStateRoute).toContain('return "confirm_appointment"');
    expect(bookingStateRouteTest).toContain("persists booking status, idempotency, state event, and audit log in one tenant-scoped transaction");
    expect(messageRoute).toContain("buildDashboardMessagePersistencePlan");
    expect(messageRoute).toContain("export async function POST");
    expect(messageRoute).toContain("providerHandoffPersisted: true");
    expect(messageRoute).toContain("idempotencyPersisted: true");
    expect(messageRoute).toContain("rawIdempotencyKeyStored: false");
    expect(messageRoute).toContain("internalPersistenceIdsStored: false");
    expect(messageRoute).not.toContain("metadata: {\n            messageId: message.id");
    expect(messageRoute).not.toContain("notificationId: notification.id,\n            redactedFields");
    expect(messageRoute).not.toContain("providerHandoffId: providerHandoff.id,\n            idempotencyKey: plan.idempotencyKey");
    expect(messageActionPanel).toContain('fetch("/api/messages"');
    expect(messageActionPanel).toContain("Queue safe follow-up");
    expect(notificationPersistenceTest).toContain("wires dashboard message POST");
    expect(notificationQueueRoute).toContain('export const runtime = "nodejs"');
    expect(notificationQueueRoute).toContain("tx.idempotencyKey.upsert");
    expect(notificationQueueRoute).toContain("requestHash");
    expect(notificationQueueRoute).toContain('status: "idempotency_conflict"');
    expect(notificationQueueRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(notificationQueueRoute).toContain("tx.idempotencyKey.update");
    expect(notificationQueueRoute).toContain("buildNotificationQueueResponseProjection");
    expect(notificationQueueRoute).toContain("notificationResponseAllowlisted: true");
    expect(notificationQueueRoute).toContain("notificationQueueIdempotencyConflictResponseAllowlisted: true");
    expect(notificationQueueRoute).toContain("notificationIdEchoed: false");
    expect(notificationQueueRoute).toContain("deliveryIdsEchoed: false");
    expect(notificationQueueRoute).toContain("handoffIdsEchoed: false");
    expect(notificationQueueRoute).toContain("auditIdEchoed: false");
    expect(notificationQueueRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(notificationQueueRoute).toContain("tenantIdEchoed: false");
    expect(notificationQueueRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(notificationQueueRoute).toContain("idempotencyReplay");
    expect(notificationQueueRoute).toContain("summarizeDeliveryPlanForResponse");
    expect(notificationQueueRoute).toContain("rawDestinationsEchoed: false");
    expect(notificationQueueRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(notificationQueueRoute).toContain("rawIdempotencyResultEchoed: false");
    expect(notificationQueueRoute).toContain("bodyPreviewEchoed: false");
    expect(notificationQueueRoute).toContain("notificationPersisted: true");
    expect(notificationQueueRoute).toContain("providerDispatchDeferred: true");
    expect(notificationQueueRoute).toContain("idempotencyPersisted: true");
    expect(notificationQueueRoute).toContain("rawIdempotencyKeyStored: false");
    expect(notificationQueueRoute).toContain("internalPersistenceIdsStored: false");
    expect(notificationQueueRoute).toContain("queuedDeliveryCount: deliveries.length");
    expect(notificationQueueRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(notificationQueueRoute).not.toContain("ok: true,\n          source: actor.source,\n          tenantId,");
    expect(notificationQueueRoute).not.toContain("ok: false,\n          source: actor.source,\n          tenantId,");
    expect(notificationQueueRoute).not.toContain("idempotencyKey,\n            queuedDeliveryCount");
    expect(notificationQueueRoute).not.toContain("auditId: result.audit.id");
    expect(notificationQueueRoute).not.toContain(
      "sanitizedPayload: {\n                notificationId: notification.id",
    );
    expect(notificationQueueRoute).not.toContain("metadata: { notificationId: notification.id");
    expect(notificationQueueRoute).not.toContain("deliveryIds: deliveries.map");
    expect(notificationQueueRoute).not.toContain("handoffIds: handoffs.map");
    expect(notificationQueueRoute).not.toContain("auditId: audit.id");
    expect(notificationQueueRoute).not.toContain("deliveries: result.deliveries");
    expect(notificationQueueRoute).not.toContain("handoffs: result.handoffs");
    expect(notificationQueueRoute).not.toContain("id: result.notification.id");
    expect(notificationPreviewRoute).toContain("plan: buildSafeNotificationPreviewPlanResponse(plan)");
    expect(notificationPreviewRoute).toContain("renderedBodyEchoed: false");
    expect(notificationPreviewRoute).toContain("destinationMaskedEchoed: false");
    expect(notificationPreviewRoute).toContain("rawTemplateContextEchoed: false");
    expect(notificationPreviewRoute).toContain("rawDestinationEchoed: false");
    expect(notificationPreviewRoute).toContain("tenantIdEchoed: false");
    expect(notificationPreviewRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(notificationPreviewRoute).not.toContain("tenantId,");
    expect(notificationPreviewRoute).not.toMatch(/^\s+plan,\s*$/m);
    expect(calendarHoldRoute).toContain("buildAvailabilityPersistencePlan");
    expect(calendarHoldRoute).toContain('export const runtime = "nodejs"');
    expect(calendarHoldRoute).toContain("create_slot_hold");
    expect(calendarHoldRoute).toContain("tx.idempotencyKey.upsert");
    expect(calendarHoldRoute).toContain('idempotency.status === "completed"');
    expect(calendarHoldRoute).toContain('status: "idempotency_conflict"');
    expect(calendarHoldRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(calendarHoldRoute).toContain("tx.availabilityWindow.create");
    expect(calendarHoldRoute).toContain("tx.auditLog.create");
    expect(calendarHoldRoute).toContain("tx.idempotencyKey.update");
    expect(calendarHoldRoute).toContain("buildSafeCalendarHoldResponse");
    expect(calendarHoldRoute).toContain("buildCalendarHoldResponseProjection");
    expect(calendarHoldRoute).toContain("calendarHoldResponseAllowlisted: true");
    expect(calendarHoldRoute).toContain("calendarHoldConflictResponseAllowlisted: true");
    expect(calendarHoldRoute).toContain("calendarHoldIdempotencyConflictResponseAllowlisted: true");
    expect(calendarHoldRoute).toContain("auditIdEchoed: false");
    expect(calendarHoldRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(calendarHoldRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(calendarHoldRoute).toContain("rawPlanPayloadEchoed: false");
    expect(calendarHoldRoute).toContain("rawHoldRecordEchoed: false");
    expect(calendarHoldRoute).toContain("availabilityWindowIdEchoed: false");
    expect(calendarHoldRoute).toContain('availabilityWindowPersisted: "true"');
    expect(calendarHoldRoute).toContain('auditLogged: "true"');
    expect(calendarHoldRoute).toContain('internalPersistenceIdsStored: "false"');
    expect(calendarHoldRoute).toContain("idempotencyPersisted: true");
    expect(calendarHoldRoute).toContain("rawIdempotencyKeyStored: false");
    expect(calendarHoldRoute).toContain("rawRequestHashStored: false");
    expect(calendarHoldRoute).toContain('rawRequestHashStored: "false"');
    expect(calendarHoldRoute).toContain("idempotencyReplay");
    expect(calendarHoldRoute).toContain("localCalendarHoldFallbackDisabled");
    expect(calendarHoldRoute).not.toContain("availabilityWindowId: result.status ===");
    expect(calendarHoldRoute).not.toContain("result: { availabilityWindowId: hold.id, auditId: audit.id");
    expect(calendarHoldRoute).not.toContain("hold: result.status ===");
    expect(calendarHoldRoute).not.toContain("auditId: result.auditId");
    expect(calendarHoldRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(calendarHoldRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(calendarHoldRoute).not.toContain("internalPersistenceIdsStored: \"false\",\n              requestHash,");
    expect(calendarHoldRoute).not.toContain("conflictId: result.conflictId");
    expect(availabilityPersistenceTest).toContain("apps/dashboard/app/api/calendar/holds/route.ts");
    expect(availabilityRoute).toContain("buildSafeAvailabilityWindowResponse");
    expect(availabilityRoute).toContain("buildSafeAvailabilityConflictResponse");
    expect(availabilityRoute).toContain("buildAvailabilityWindowResponseProjection");
    expect(availabilityRoute).toContain("buildAvailabilityConflictResponseProjection");
    expect(availabilityRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(availabilityRoute).toContain("availabilityWindowResponseAllowlisted: true");
    expect(availabilityRoute).toContain("availabilityConflictResponseAllowlisted: true");
    expect(availabilityRoute).toContain("availabilityWindowIdEchoed: false");
    expect(availabilityRoute).toContain("tenantIdEchoed: false");
    expect(availabilityRoute).toContain("artistIdEchoed: false");
    expect(availabilityRoute).toContain("travelCityIdEchoed: false");
    expect(availabilityRoute).toContain("travelScheduleIdEchoed: false");
    expect(availabilityRoute).toContain("conflictingAvailabilityWindowIdEchoed: false");
    expect(availabilityRoute).toContain("auditIdEchoed: false");
    expect(availabilityRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(availabilityRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(availabilityRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(availabilityRoute).toContain("availabilityWindowPersisted: true");
    expect(availabilityRoute).toContain("auditLogged: true");
    expect(availabilityRoute).toContain("idempotencyPersisted: true");
    expect(availabilityRoute).toContain("rawIdempotencyKeyStored: false");
    expect(availabilityRoute).toContain("artistMatched: true");
    expect(availabilityRoute).toContain("travelCityMatched: Boolean");
    expect(availabilityRoute).toContain("travelScheduleMatched: Boolean");
    expect(availabilityRoute).toContain("internalPersistenceIdsStored: false");
    expect(availabilityRoute).toContain("artistId: input.artistId");
    expect(availabilityRoute).toContain("travelCityId: input.travelCityId ?? null");
    expect(availabilityRoute).toContain("travelScheduleId: input.travelScheduleId ?? null");
    expect(availabilityRoute).not.toContain("function resultAvailabilityWindowId");
    expect(availabilityRoute).not.toContain("availabilityWindowId: availabilityWindow.id,\n            auditId: audit.id");
    expect(availabilityRoute).not.toContain("availabilityWindowId: result.conflictingAvailabilityWindow.id");
    expect(availabilityRoute).not.toContain("id: result.availabilityWindow.id");
    expect(availabilityRoute).not.toContain("tenantId: result.availabilityWindow.tenantId");
    expect(availabilityRoute).not.toContain("tenantId,\n        persistence");
    expect(availabilityRoute).not.toContain("tenantId,\n          error");
    expect(availabilityRoute).not.toContain("artistId: result.availabilityWindow.artistId");
    expect(availabilityRoute).not.toContain("travelCityId: result.availabilityWindow.travelCityId");
    expect(availabilityRoute).not.toContain("travelScheduleId: result.availabilityWindow.travelScheduleId");
    expect(availabilityRoute).not.toContain("auditId: result.status");
    expect(availabilityRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(availabilityRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(intakeFormRoute).toContain("buildSafeIntakeFormResponse");
    expect(intakeFormRoute).toContain("buildIntakeFormResponseProjection");
    expect(intakeFormRoute).toContain("buildIntakeFormDuplicateResponseProjection");
    expect(intakeFormRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(intakeFormRoute).toContain("intakeFormResponseAllowlisted: true");
    expect(intakeFormRoute).toContain("intakeFormDuplicateResponseAllowlisted: true");
    expect(intakeFormRoute).toContain("formIdEchoed: false");
    expect(intakeFormRoute).toContain("tenantIdEchoed: false");
    expect(intakeFormRoute).toContain("existingFormIdEchoed: false");
    expect(intakeFormRoute).toContain("auditIdEchoed: false");
    expect(intakeFormRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(intakeFormRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(intakeFormRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(intakeFormRoute).toContain("intakeFormPersisted: true");
    expect(intakeFormRoute).toContain("auditLogged: true");
    expect(intakeFormRoute).toContain("idempotencyPersisted: true");
    expect(intakeFormRoute).toContain("rawIdempotencyKeyStored: false");
    expect(intakeFormRoute).toContain("internalPersistenceIdsStored: false");
    expect(intakeFormRoute).toContain("where: { tenantId, key: input.key, version: input.version }");
    expect(intakeFormRoute).not.toContain("function resultFormId");
    expect(intakeFormRoute).not.toContain("formId: form.id,\n            auditId: audit.id");
    expect(intakeFormRoute).not.toContain("formId: result.formId");
    expect(intakeFormRoute).not.toContain("id: result.form.id");
    expect(intakeFormRoute).not.toContain("tenantId: result.form.tenantId");
    expect(intakeFormRoute).not.toContain("tenantId,\n        persistence");
    expect(intakeFormRoute).not.toContain("tenantId,\n          error");
    expect(intakeFormRoute).not.toContain("auditId: result.status");
    expect(intakeFormRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(intakeFormRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(consentFormRoute).toContain("buildSafeConsentFormResponse");
    expect(consentFormRoute).toContain("buildConsentFormResponseProjection");
    expect(consentFormRoute).toContain("buildConsentFormDuplicateResponseProjection");
    expect(consentFormRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(consentFormRoute).toContain("consentFormResponseAllowlisted: true");
    expect(consentFormRoute).toContain("consentFormDuplicateResponseAllowlisted: true");
    expect(consentFormRoute).toContain("formIdEchoed: false");
    expect(consentFormRoute).toContain("tenantIdEchoed: false");
    expect(consentFormRoute).toContain("existingFormIdEchoed: false");
    expect(consentFormRoute).toContain("auditIdEchoed: false");
    expect(consentFormRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(consentFormRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(consentFormRoute).toContain("rawBodyEchoed: false");
    expect(consentFormRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(consentFormRoute).toContain("consentFormPersisted: true");
    expect(consentFormRoute).toContain("auditLogged: true");
    expect(consentFormRoute).toContain("idempotencyPersisted: true");
    expect(consentFormRoute).toContain("rawIdempotencyKeyStored: false");
    expect(consentFormRoute).toContain("internalPersistenceIdsStored: false");
    expect(consentFormRoute).toContain("where: { tenantId, key: input.key, version: input.version }");
    expect(consentFormRoute).not.toContain("function resultFormId");
    expect(consentFormRoute).not.toContain("formId: form.id,\n            auditId: audit.id");
    expect(consentFormRoute).not.toContain("formId: result.formId");
    expect(consentFormRoute).not.toContain("id: result.form.id");
    expect(consentFormRoute).not.toContain("tenantId: result.form.tenantId");
    expect(consentFormRoute).not.toContain("tenantId,\n        persistence");
    expect(consentFormRoute).not.toContain("tenantId,\n          error");
    expect(consentFormRoute).not.toContain("auditId: result.status");
    expect(consentFormRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(consentFormRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(travelCityRoute).toContain("buildSafeTravelCityResponse");
    expect(travelCityRoute).toContain("buildTravelCityResponseProjection");
    expect(travelCityRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(travelCityRoute).toContain("travelCityResponseAllowlisted: true");
    expect(travelCityRoute).toContain("travelCityIdEchoed: false");
    expect(travelCityRoute).toContain("duplicateTravelCityIdEchoed: false");
    expect(travelCityRoute).toContain("tenantIdEchoed: false");
    expect(travelCityRoute).toContain("auditIdEchoed: false");
    expect(travelCityRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(travelCityRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(travelCityRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(travelCityRoute).toContain("travelCityPersisted: true");
    expect(travelCityRoute).toContain("auditLogged: true");
    expect(travelCityRoute).toContain("idempotencyPersisted: true");
    expect(travelCityRoute).toContain("rawIdempotencyKeyStored: false");
    expect(travelCityRoute).toContain("internalPersistenceIdsStored: false");
    expect(travelCityRoute).toContain("where: { tenantId, slug: input.slug }");
    expect(travelCityRoute).not.toContain("resultTravelCityId");
    expect(travelCityRoute).not.toContain("travelCityId: travelCity.id");
    expect(travelCityRoute).not.toContain("id: result.travelCity.id");
    expect(travelCityRoute).not.toContain("travelCityId: result.travelCityId");
    expect(travelCityRoute).not.toContain("tenantId: result.travelCity.tenantId");
    expect(travelCityRoute).not.toContain("tenantId,\n        persistence");
    expect(travelCityRoute).not.toContain("tenantId,\n          error");
    expect(travelCityRoute).not.toContain("auditId: audit.id");
    expect(travelCityRoute).not.toContain("auditId: result.status");
    expect(travelCityRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(travelCityRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(travelScheduleRoute).toContain("buildSafeTravelScheduleResponse");
    expect(travelScheduleRoute).toContain("buildTravelScheduleResponseProjection");
    expect(travelScheduleRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(travelScheduleRoute).toContain("travelScheduleResponseAllowlisted: true");
    expect(travelScheduleRoute).toContain("travelScheduleIdEchoed: false");
    expect(travelScheduleRoute).toContain("tenantIdEchoed: false");
    expect(travelScheduleRoute).toContain("artistIdEchoed: false");
    expect(travelScheduleRoute).toContain("travelCityIdEchoed: false");
    expect(travelScheduleRoute).toContain("studioIdEchoed: false");
    expect(travelScheduleRoute).toContain("auditIdEchoed: false");
    expect(travelScheduleRoute).toContain("notificationJobIdEchoed: false");
    expect(travelScheduleRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(travelScheduleRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(travelScheduleRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(travelScheduleRoute).toContain("travelSchedulePersisted: true");
    expect(travelScheduleRoute).toContain("auditLogged: true");
    expect(travelScheduleRoute).toContain("notificationFanoutIntentPersisted: true");
    expect(travelScheduleRoute).toContain("idempotencyPersisted: true");
    expect(travelScheduleRoute).toContain("rawIdempotencyKeyStored: false");
    expect(travelScheduleRoute).toContain("artistMatched: true");
    expect(travelScheduleRoute).toContain("travelCityMatched: true");
    expect(travelScheduleRoute).toContain("internalPersistenceIdsStored: false");
    expect(travelScheduleRoute).toContain("artistId: input.artistId");
    expect(travelScheduleRoute).toContain("startsAt: new Date(input.startsAt)");
    expect(travelScheduleRoute).not.toContain("resultTravelScheduleId");
    expect(travelScheduleRoute).not.toContain("result: toJsonValue({\n            travelScheduleId: travelSchedule.id");
    expect(travelScheduleRoute).not.toContain("id: result.travelSchedule.id");
    expect(travelScheduleRoute).not.toContain("tenantId: result.travelSchedule.tenantId");
    expect(travelScheduleRoute).not.toContain("tenantId,\n        persistence");
    expect(travelScheduleRoute).not.toContain("tenantId,\n          error");
    expect(travelScheduleRoute).not.toContain("artistId: result.travelSchedule.artistId");
    expect(travelScheduleRoute).not.toContain("travelCityId: result.travelSchedule.travelCityId");
    expect(travelScheduleRoute).not.toContain("studioId: result.travelSchedule.studioId");
    expect(travelScheduleRoute).not.toContain("auditId: audit.id");
    expect(travelScheduleRoute).not.toContain("notificationJobId: notificationJob.id");
    expect(travelScheduleRoute).not.toContain("auditId: result.status");
    expect(travelScheduleRoute).not.toContain("notificationJob: result.status");
    expect(travelScheduleRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(travelScheduleRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(travelPublishRoute).toContain("buildTravelPublishMutationPlan");
    expect(travelPublishRoute).toContain("database-persisted");
    expect(travelPublishRoute).toContain('export const runtime = "nodejs"');
    expect(travelPublishRoute).toContain("auditLog.create");
    expect(travelPublishRoute).toContain("idempotencyKey.upsert");
    expect(travelPublishRoute).toContain('idempotency.status === "completed"');
    expect(travelPublishRoute).toContain('status: "idempotency_conflict"');
    expect(travelPublishRoute).toContain("buildSafeTravelPublishResponse");
    expect(travelPublishRoute).toContain("buildTravelPublishResponseProjection");
    expect(travelPublishRoute).toContain("travelPublishResponseAllowlisted: true");
    expect(travelPublishRoute).toContain("travelPublishIdempotencyConflictResponseAllowlisted: true");
    expect(travelPublishRoute).toContain("auditIdEchoed: false");
    expect(travelPublishRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(travelPublishRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(travelPublishRoute).toContain("travelCityIdEchoed: false");
    expect(travelPublishRoute).toContain("travelScheduleIdEchoed: false");
    expect(travelPublishRoute).toContain("rawPlanPayloadEchoed: false");
    expect(travelPublishRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(travelPublishRoute).toContain("travelCityPersisted: true");
    expect(travelPublishRoute).toContain("travelSchedulePersisted: true");
    expect(travelPublishRoute).toContain('travelCityPersisted: resultString(idempotency.result, "travelCityPersisted") === "true"');
    expect(travelPublishRoute).toContain('travelSchedulePersisted: resultString(idempotency.result, "travelSchedulePersisted") === "true"');
    expect(travelPublishRoute).toContain('auditLogged: resultString(idempotency.result, "auditLogged") === "true"');
    expect(travelPublishRoute).toContain("idempotencyPersisted: true");
    expect(travelPublishRoute).toContain("requestHashPersisted: true");
    expect(travelPublishRoute).toContain("rawIdempotencyKeyStored: false");
    expect(travelPublishRoute).toContain("rawRequestHashStored: false");
    expect(travelPublishRoute).toContain("rawRevalidationTagsStored: false");
    expect(travelPublishRoute).toContain("revalidationTagCount: plan.revalidationTags.length");
    expect(travelPublishRoute).toContain("internalPersistenceIdsStored: false");
    expect(travelPublishRoute).toContain("idempotencyReplay");
    expect(travelPublishRoute).toContain("repository-required");
    expect(travelPublishRoute).not.toContain('travelScheduleId: resultString(idempotency.result, "travelScheduleId")');
    expect(travelPublishRoute).not.toContain('travelCityId: resultString(idempotency.result, "travelCityId")');
    expect(travelPublishRoute).not.toContain('auditId: resultString(idempotency.result, "auditId")');
    expect(travelPublishRoute).not.toContain("result: {\n              travelCityId: city.id");
    expect(travelPublishRoute).not.toContain("travelScheduleId: schedule.id,\n              auditId: audit.id");
    expect(travelPublishRoute).not.toContain("return { status: \"persisted\" as const, idempotency, travelCityId: city.id");
    expect(travelPublishRoute).not.toContain("travelCityId: result.travelCityId");
    expect(travelPublishRoute).not.toContain("travelScheduleId: result.travelScheduleId");
    expect(travelPublishRoute).not.toContain("auditId: result.auditId");
    expect(travelPublishRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(travelPublishRoute).not.toContain("idempotencyKey,\n              idempotencyKeyId");
    expect(travelPublishRoute).not.toContain("stopId: stop.id,\n              artistId: stop.artistId");
    expect(travelPublishRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(travelPublishActionPanel).toContain('fetch("/api/travel/publish"');
    expect(travelPublishActionPanel).toContain("Submit publish draft");
    expect(travelPublishTest).toContain("wires the dashboard travel publish API through the mutation plan");
    expect(portfolioRoute).toContain("buildPortfolioReadResponseProjection");
    expect(portfolioRoute).toContain("buildPortfolioCreateResponseProjection");
    expect(portfolioRoute).toContain("portfolioReadResponseAllowlisted: true");
    expect(portfolioRoute).toContain("portfolioItemResponseAllowlisted: true");
    expect(portfolioRoute).toContain("portfolioItemIdEchoed: false");
    expect(portfolioRoute).toContain("tenantIdEchoed: false");
    expect(portfolioRoute).toContain("artistIdEchoed: false");
    expect(portfolioRoute).toContain("rawPortfolioImagesEchoed: false");
    expect(portfolioRoute).toContain("auditIdEchoed: false");
    expect(portfolioRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(portfolioRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(portfolioRoute).toContain("duplicatePortfolioItemIdEchoed: false");
    expect(portfolioRoute).toContain("storageObjectKeysEchoed: false");
    expect(portfolioRoute).toContain("signedUrlsEchoed: false");
    expect(portfolioRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(portfolioRoute).toContain("portfolioItemPersisted: true");
    expect(portfolioRoute).toContain("auditLogged: true");
    expect(portfolioRoute).toContain("idempotencyPersisted: true");
    expect(portfolioRoute).toContain("rawIdempotencyKeyStored: false");
    expect(portfolioRoute).toContain("artistMatched: true");
    expect(portfolioRoute).toContain("internalPersistenceIdsStored: false");
    expect(portfolioRoute).toContain("where: { tenantId, slug: input.slug }");
    expect(portfolioRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(portfolioRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(portfolioRoute).not.toContain("tenantId,\n          error:");
    expect(portfolioRoute).not.toContain("function resultPortfolioItemId");
    expect(portfolioRoute).not.toContain("portfolioItemId: item.id,\n            auditId: audit.id");
    expect(portfolioRoute).not.toContain("id: result.item.id");
    expect(portfolioRoute).not.toContain("tenantId: result.item.tenantId");
    expect(portfolioRoute).not.toContain("artistId: result.item.artistId");
    expect(portfolioRoute).not.toContain("images: result.item.images");
    expect(portfolioRoute).not.toContain("auditId: result.audit.id");
    expect(portfolioRoute).not.toContain("auditId: result.status");
    expect(portfolioRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(portfolioRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(portfolioRoute).not.toContain("portfolioItemId: result.portfolioItemId");
    expect(portfolioImageRoute).toContain("buildSafePortfolioImageAttachResponse");
    expect(portfolioImageRoute).toContain("buildPortfolioImageAttachResponseProjection");
    expect(portfolioImageRoute).toContain("portfolioImageResponseAllowlisted: true");
    expect(portfolioImageRoute).toContain("tenantIdEchoed: false");
    expect(portfolioImageRoute).toContain("portfolioImageIdEchoed: false");
    expect(portfolioImageRoute).toContain("portfolioItemIdEchoed: false");
    expect(portfolioImageRoute).toContain("imageUrlEchoed: false");
    expect(portfolioImageRoute).toContain("fileAssetIdEchoed: false");
    expect(portfolioImageRoute).toContain("auditIdEchoed: false");
    expect(portfolioImageRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(portfolioImageRoute).toContain("rawImageUrlEchoed: false");
    expect(portfolioImageRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(portfolioImageRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(portfolioImageRoute).toContain("portfolioImagePersisted: true");
    expect(portfolioImageRoute).toContain("auditLogged: true");
    expect(portfolioImageRoute).toContain("idempotencyPersisted: true");
    expect(portfolioImageRoute).toContain("rawIdempotencyKeyStored: false");
    expect(portfolioImageRoute).toContain("portfolioItemMatched: true");
    expect(portfolioImageRoute).toContain("fileAssetMatched: Boolean");
    expect(portfolioImageRoute).toContain("internalPersistenceIdsStored: false");
    expect(portfolioImageRoute).toContain("portfolioItemId: portfolioId");
    expect(portfolioImageRoute).toContain("fileAssetId: input.fileAssetId ?? null");
    expect(portfolioImageRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(portfolioImageRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(portfolioImageRoute).not.toContain("tenantId,\n          error:");
    expect(portfolioImageRoute).not.toContain("function resultPortfolioImageId");
    expect(portfolioImageRoute).not.toContain("portfolioImageId: image.id,\n            auditId: audit.id");
    expect(portfolioImageRoute).not.toContain("imageUrl: result.image.imageUrl");
    expect(portfolioImageRoute).not.toContain("fileAssetId: result.image.fileAssetId");
    expect(portfolioImageRoute).not.toContain("id: result.image.id");
    expect(portfolioImageRoute).not.toContain("portfolioItemId: result.image.portfolioItemId");
    expect(portfolioImageRoute).not.toContain("auditId: result.status");
    expect(portfolioImageRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(portfolioImageRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(imageSeoRoute).toContain('assertPermission(actor, "portfolio:write")');
    expect(imageSeoRoute).toContain('export const runtime = "nodejs"');
    expect(imageSeoRoute).toContain("tx.portfolioItem.findFirst");
    expect(imageSeoRoute).toContain("tx.idempotencyKey.upsert");
    expect(imageSeoRoute).toContain('idempotency.status === "completed"');
    expect(imageSeoRoute).toContain('status: "idempotency_conflict"');
    expect(imageSeoRoute).toContain("tx.fileAsset.findUnique");
    expect(imageSeoRoute).toContain('status: "file_asset_tenant_conflict"');
    expect(imageSeoRoute).toContain("tx.idempotencyKey.update");
    expect(imageSeoRoute).toContain("buildImageSeoPipelineResponseProjection");
    expect(imageSeoRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(imageSeoRoute).toContain("tenantIdEchoed: false");
    expect(imageSeoRoute).toContain("fileAssetIdEchoed: false");
    expect(imageSeoRoute).toContain("portfolioImageIdEchoed: false");
    expect(imageSeoRoute).toContain("auditIdEchoed: false");
    expect(imageSeoRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(imageSeoRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(imageSeoRoute).toContain("internalPersistenceIdsStored: false");
    expect(imageSeoRoute).toContain("idempotencyPersisted: true");
    expect(imageSeoRoute).toContain("rawIdempotencyKeyStored: false");
    expect(imageSeoRoute).toContain("rawRequestHashStored: false");
    expect(imageSeoRoute).toContain("fileAssetMatched: true");
    expect(imageSeoRoute).toContain("portfolioItemMatched: true");
    expect(imageSeoRoute).toContain("portfolioItemIdEchoed: false");
    expect(imageSeoRoute).toContain("rawProviderPayloadEchoed: false");
    expect(imageSeoRoute).toContain("idempotencyReplay");
    expect(imageSeoRoute).not.toContain("tenantId: plan.tenantId");
    expect(imageSeoRoute).toContain("portfolioItemId: plan.portfolioItemId");
    expect(imageSeoRoute).not.toContain("tenantId,\n            error:");
    expect(imageSeoRoute).not.toContain("tenantId,\n        error:");
    expect(imageSeoRoute).not.toContain("portfolioItemId: plan.portfolioItemId,\n              objectKey");
    expect(imageSeoRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(imageSeoRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(imageSeoRoute).not.toContain("idempotencyKeyId: persisted?.idempotencyKeyId");
    expect(imageSeoRoute).not.toContain("fileAssetId: result.fileAssetId");
    expect(imageSeoRoute).not.toContain("portfolioImageId: result.portfolioImageId");
    expect(imageSeoRoute).not.toContain("auditId: result.auditId");
    expect(imageSeoRoute).toContain("PROVIDER_IMAGE_SEO_PERSISTENCE_NOT_CONFIGURED");
    expect(imageSeoActionPanel).toContain('fetch("/api/portfolio/image-seo-pipeline"');
    expect(imageSeoActionPanel).toContain("Generate derivative draft");
    expect(imageSeoTest).toContain("wires the portfolio dashboard action through the gated image SEO route");
    expect(refundRoute).toContain("buildSafeRefundResponse");
    expect(refundRoute).toContain("buildRefundResponseProjection");
    expect(refundRoute).toContain("refundResponseAllowlisted: true");
    expect(refundRoute).toContain("tenantIdEchoed: false");
    expect(refundRoute).toContain("refundIdEchoed: false");
    expect(refundRoute).toContain("paymentIdEchoed: false");
    expect(refundRoute).toContain("bookingRequestIdEchoed: false");
    expect(refundRoute).toContain("depositIdEchoed: false");
    expect(refundRoute).toContain("providerRefundIdEchoed: false");
    expect(refundRoute).toContain("auditIdEchoed: false");
    expect(refundRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(refundRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(refundRoute).toContain("rawReasonEchoed: false");
    expect(refundRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(refundRoute).toContain("refundPersisted: true");
    expect(refundRoute).toContain("auditLogged: true");
    expect(refundRoute).toContain("idempotencyPersisted: true");
    expect(refundRoute).toContain("rawIdempotencyKeyStored: false");
    expect(refundRoute).toContain("internalPersistenceIdsStored: false");
    expect(refundRoute).toContain("paymentId: input.paymentId");
    expect(refundRoute).toContain("providerRefundId: input.providerRefundId ?? null");
    expect(refundRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(refundRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(refundRoute).not.toContain("tenantId,\n          error:");
    expect(refundRoute).not.toContain("resultRefundId");
    expect(refundRoute).not.toContain("result: toJsonValue({\n            refundId: refund.id");
    expect(refundRoute).not.toContain("id: result.refund.id");
    expect(refundRoute).not.toContain("paymentId: result.refund.paymentId");
    expect(refundRoute).not.toContain("bookingRequestId: result.refund.bookingRequestId");
    expect(refundRoute).not.toContain("depositId: result.refund.depositId");
    expect(refundRoute).not.toContain("providerRefundId: result.refund.providerRefundId");
    expect(refundRoute).not.toContain("reason: result.refund.reason");
    expect(refundRoute).not.toContain("auditId: audit.id");
    expect(refundRoute).not.toContain("auditId: result.status");
    expect(refundRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(refundRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(settingsRoute).toContain("export async function PATCH");
    expect(settingsRoute).toContain('evaluateDashboardApiGuard(request, "settings:write"');
    expect(settingsRoute).toContain('dashboardMutationAction: "update_settings"');
    expect(settingsRoute).toContain("PROVIDER_SETTINGS_PERSISTENCE_NOT_CONFIGURED");
    expect(settingsRoute).toContain("tx.idempotencyKey.upsert");
    expect(settingsRoute).toContain("requestHash");
    expect(settingsRoute).toContain('idempotency.status === "completed"');
    expect(settingsRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(settingsRoute).toContain("tx.idempotencyKey.update");
    expect(settingsRoute).toContain("buildSettingsReadResponseProjection");
    expect(settingsRoute).toContain("buildSettingsMutationResponseProjection");
    expect(settingsRoute).toContain("settingsReadResponseAllowlisted: true");
    expect(settingsRoute).toContain("settingsMutationResponseAllowlisted: true");
    expect(settingsRoute).toContain("settingsIdempotencyConflictResponseAllowlisted: true");
    expect(settingsRoute).toContain("tenantRecordIdEchoed: false");
    expect(settingsRoute).toContain("tenantIdEchoed: false");
    expect(settingsRoute).toContain("auditIdEchoed: false");
    expect(settingsRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(settingsRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(settingsRoute).toContain("rawSecretsEchoed: false");
    expect(settingsRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(settingsRoute).toContain("tenantProfileUpdated: true");
    expect(settingsRoute).toContain("auditLogged: true");
    expect(settingsRoute).toContain('auditLogged: resultString(idempotency.result, "auditLogged") === "true"');
    expect(settingsRoute).toContain("auditLogged: Boolean(audit.id)");
    expect(settingsRoute).toContain("idempotencyPersisted: true");
    expect(settingsRoute).toContain("rawIdempotencyKeyStored: false");
    expect(settingsRoute).toContain("internalPersistenceIdsStored: false");
    expect(settingsRoute).toContain("contactFieldsEchoed: false");
    expect(settingsRoute).toContain("verificationTokenHashEchoed: false");
    expect(settingsRoute).toContain("studioStreetAddressEchoed: false");
    expect(settingsRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(settingsRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(settingsRoute).not.toContain("source: actor.source,\n          tenantId,");
    expect(settingsRoute).not.toContain("source: actor.source,\n        tenantId,");
    expect(settingsRoute).not.toContain("tenantId: tenant.id");
    expect(settingsRoute).not.toContain("id: result.tenant.id");
    expect(settingsRoute).not.toContain("auditId: audit.id");
    expect(settingsRoute).not.toContain('id: resultString(idempotency.result, "tenantId")');
    expect(settingsRoute).not.toContain('audit: { id: resultString(idempotency.result, "auditId") }');
    expect(settingsRoute).toContain("idempotencyReplay");
    expect(settingsRoute).not.toContain("auditId: result.audit.id");
    expect(settingsRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(settingsRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(settingsRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(settingsActionPanel).toContain('fetch("/api/settings"');
    expect(settingsActionPanel).toContain("Save settings draft");
    expect(settingsTest).toContain("guards safe settings writes");
    expect(clientRoute).toContain("buildClientReadResponseProjection");
    expect(clientRoute).toContain("buildClientCreateResponseProjection");
    expect(clientRoute).toContain("buildSafeClientCreateResponse");
    expect(clientRoute).toContain("clientReadResponseAllowlisted: true");
    expect(clientRoute).toContain("clientCreateResponseAllowlisted: true");
    expect(clientRoute).toContain("clientIdEchoed: false");
    expect(clientRoute).toContain("tenantRecordIdEchoed: false");
    expect(clientRoute).toContain("tenantIdEchoed: false");
    expect(clientRoute).toContain("auditIdEchoed: false");
    expect(clientRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(clientRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(clientRoute).toContain("duplicateClientIdEchoed: false");
    expect(clientRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(clientRoute).toContain("encryptedMedicalNotesEchoed: false");
    expect(clientRoute).toContain("privateNotesEchoed: false");
    expect(clientRoute).toContain("clientPersisted: true");
    expect(clientRoute).toContain("auditLogged: true");
    expect(clientRoute).toContain("idempotencyPersisted: true");
    expect(clientRoute).toContain("rawIdempotencyKeyStored: false");
    expect(clientRoute).toContain("internalPersistenceIdsStored: false");
    expect(clientRoute).toContain("where: { tenantId, email }");
    expect(clientRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(clientRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(clientRoute).not.toContain("tenantId,\n          error:");
    expect(clientRoute).not.toContain("function resultClientId");
    expect(clientRoute).not.toContain("clientId: client.id,\n            auditId: audit.id");
    expect(clientRoute).not.toContain("client: result.client");
    expect(clientRoute).not.toContain("id: result.client.id");
    expect(clientRoute).not.toContain("tenantId: result.client.tenantId");
    expect(clientRoute).not.toContain("auditId: result.audit.id");
    expect(clientRoute).not.toContain("auditId: result.status");
    expect(clientRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(clientRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(clientRoute).not.toContain("clientId: result.clientId");
    expect(clientDetailRoute).toContain("export async function PATCH");
    expect(clientDetailRoute).toContain('assertPermission(actor, "client:write")');
    expect(clientDetailRoute).toContain('dashboardMutationAction: "append_client_private_note"');
    expect(clientDetailRoute).toContain("PROVIDER_CLIENT_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(clientDetailRoute).toContain("tx.clientProfile.upsert");
    expect(clientDetailRoute).toContain("buildClientDetailReadResponseProjection");
    expect(clientDetailRoute).toContain("buildClientPrivateNoteResponseProjection");
    expect(clientDetailRoute).toContain("clientDetailReadResponseAllowlisted: true");
    expect(clientDetailRoute).toContain("clientPrivateNoteResponseAllowlisted: true");
    expect(clientDetailRoute).toContain("clientPrivateNoteIdempotencyConflictResponseAllowlisted: true");
    expect(clientDetailRoute).toContain("auditIdEchoed: false");
    expect(clientDetailRoute).toContain("clientIdEchoed: false");
    expect(clientDetailRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(clientDetailRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(clientDetailRoute).toContain("tenantIdEchoed: false");
    expect(clientDetailRoute).toContain("rawNoteEchoed: false");
    expect(clientDetailRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(clientDetailRoute).toContain("tenantScope: { actorTenantMatched: true");
    expect(clientDetailRoute).toContain("clientTenantMatched: true");
    expect(clientDetailRoute).toContain("internalPersistenceIdsStored: false");
    expect(clientDetailRoute).toContain("idempotencyPersisted: true");
    expect(clientDetailRoute).toContain("rawIdempotencyKeyStored: false");
    expect(clientDetailRoute).toContain("privateNoteStored: true");
    expect(clientDetailRoute).toContain("auditLogged: Boolean(audit.id)");
    expect(clientDetailRoute).toContain("auditLogged: true");
    expect(clientDetailRoute).toContain("encryptedMedicalNotesEchoed: false");
    expect(clientDetailRoute).toContain("privateNotesEchoed: false");
    expect(clientDetailRoute).not.toContain("function resultAuditId");
    expect(clientDetailRoute).not.toContain("clientId,\n            auditId: audit.id");
    expect(clientDetailRoute).not.toContain("return { status: \"updated\" as const, idempotency, auditId: audit.id }");
    expect(clientDetailRoute).not.toContain("auditId: result.audit.id");
    expect(clientDetailRoute).not.toContain("auditId: result.auditId");
    expect(clientDetailRoute).not.toContain("auditId: resultAuditId");
    expect(clientDetailRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(clientDetailRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(clientDetailRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(clientDetailRoute).not.toContain("tenantId,\n          clientId,\n          error");
    expect(clientDetailRoute).not.toContain("tenantId,\n        persistence: \"local-fallback\"");
    expect(clientDetailRoute).not.toContain("tenantId,\n        persistence: \"database\"");
    expect(clientDetailRoute).not.toContain("tenantId,\n        clientId,\n        persistence");
    expect(clientDetailRoute).toContain('persistence: "local-contract"');
    expect(clientDetailRoute).not.toContain('persistence: "local-plan-only"');
    expect(clientDetailActionPanel).toContain('fetch(`/api/clients/${clientId}`');
    expect(clientDetailActionPanel).toContain("Save private note");
    expect(clientReadRouteTest).toContain("wires a gated private-note client write seam");
    expect(paymentsPage).toContain("PaymentActionPanel");
    expect(paymentActionPanel).toContain('fetch(`/api/bookings/${bookingId}/state`');
    expect(paymentActionPanel).toContain('action: "request_deposit"');
    expect(paymentActionPanel).toContain("create_deposit_session");
    expect(depositSessionRoute).toContain("buildSafeDepositSessionResponse");
    expect(depositSessionRoute).toContain("buildDepositSessionResponseProjection");
    expect(depositSessionRoute).toContain("depositResponseAllowlisted: true");
    expect(depositSessionRoute).toContain("tenantIdEchoed: false");
    expect(depositSessionRoute).toContain("depositIdEchoed: false");
    expect(depositSessionRoute).toContain("bookingRequestIdEchoed: false");
    expect(depositSessionRoute).toContain("appointmentIdEchoed: false");
    expect(depositSessionRoute).toContain("auditIdEchoed: false");
    expect(depositSessionRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(depositSessionRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(depositSessionRoute).toContain("providerCheckoutUrlEchoed: false");
    expect(depositSessionRoute).toContain("providerSessionIdEchoed: false");
    expect(depositSessionRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(depositSessionRoute).toContain("depositPersisted: true");
    expect(depositSessionRoute).toContain("paymentAuditPersisted: true");
    expect(depositSessionRoute).toContain("stripeCheckoutCreated: false");
    expect(depositSessionRoute).toContain("webhookReconciled: false");
    expect(depositSessionRoute).toContain("idempotencyPersisted: true");
    expect(depositSessionRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(depositSessionRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(depositSessionRoute).not.toContain("source: actor.source, tenantId, error:");
    expect(depositSessionRoute).not.toContain("id: result.deposit.id");
    expect(depositSessionRoute).not.toContain("bookingRequestId: result.deposit.bookingRequestId");
    expect(depositSessionRoute).not.toContain("appointmentId: result.deposit.appointmentId");
    expect(depositSessionRoute).toContain("rawIdempotencyKeyStored: false");
    expect(depositSessionRoute).toContain("internalPersistenceIdsStored: false");
    expect(depositSessionRoute).toContain("bookingRequestId: input.bookingRequestId");
    expect(depositSessionRoute).toContain("appointmentId: input.appointmentId ?? null");
    expect(depositSessionRoute).not.toContain("function resultDepositId");
    expect(depositSessionRoute).not.toContain("depositId: deposit.id,\n            auditId: audit.id");
    expect(depositSessionRoute).not.toContain("auditId: result.status");
    expect(depositSessionRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(depositSessionRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(paymentReadRouteTest).toContain("gated deposit-session draft action");
    expect(formDetailRoute).toContain("export async function PATCH");
    expect(formDetailRoute).toContain('assertPermission(actor, "form:write")');
    expect(formDetailRoute).toContain('dashboardMutationAction: "archive_form_version"');
    expect(formDetailRoute).toContain("tx.idempotencyKey.upsert");
    expect(formDetailRoute).toContain("tx.idempotencyKey.update");
    expect(formDetailRoute).toContain("idempotencyKeyId");
    expect(formDetailRoute).toContain("formArchived: true");
    expect(formDetailRoute).toContain("auditLogged: true");
    expect(formDetailRoute).toContain("idempotencyPersisted: true");
    expect(formDetailRoute).toContain("rawIdempotencyKeyStored: false");
    expect(formDetailRoute).toContain("internalPersistenceIdsStored: false");
    expect(formDetailRoute).not.toContain("formId: params.formId,\n            action,\n            auditId: audit.id");
    expect(formDetailRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(formDetailRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(formDetailRoute).toContain("PROVIDER_FORM_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(formDetailRoute).toContain('persistence: "local-contract"');
    expect(formDetailRoute).not.toContain('persistence: "local-plan-only"');
    expect(formActionPanel).toContain('fetch("/api/forms/local-consent-form"');
    expect(formActionPanel).toContain("Archive form draft");
    expect(settingsActionPanel).toContain("safe profile metadata contract");
    expect(formActionPanel).toContain("archive metadata contract");
    expect(settingsRoute).toContain("settings mutation contract with validated safe profile metadata");
    expect(settingsRoute).not.toContain("settings mutation plan only");
    expect(formDetailRoute).toContain("archive-form metadata contract");
    expect(formDetailRoute).not.toContain("archive-form metadata write plan only");
    expect(formReadRouteTest).toContain("archive-only form metadata write seam");
    expect(featureFlagRoute).toContain("tx.featureFlag.upsert");
    expect(featureFlagRoute).toContain("feature_flag:update");
    expect(featureFlagRoute).toContain("requestHash");
    expect(featureFlagRoute).toContain('idempotency.status === "completed"');
    expect(featureFlagRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(featureFlagRoute).toContain("buildFeatureFlagReadResponseProjection");
    expect(featureFlagRoute).toContain("buildFeatureFlagMutationResponseProjection");
    expect(featureFlagRoute).toContain("buildSafeFeatureFlagConcurrencyResponse");
    expect(featureFlagRoute).toContain("featureFlagReadResponseAllowlisted: true");
    expect(featureFlagRoute).toContain("featureFlagMutationResponseAllowlisted: true");
    expect(featureFlagRoute).toContain("featureFlagIdempotencyConflictResponseAllowlisted: true");
    expect(featureFlagRoute).toContain("featureFlagConcurrencyConflictResponseAllowlisted: true");
    expect(featureFlagRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(featureFlagRoute).toContain("tenantIdEchoed: false");
    expect(featureFlagRoute).toContain("featureFlagIdEchoed: false");
    expect(featureFlagRoute).toContain("auditIdEchoed: false");
    expect(featureFlagRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(featureFlagRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(featureFlagRoute).toContain("rawProviderPayloadEchoed: false");
    expect(featureFlagRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(featureFlagRoute).toContain('invalidationTag: "feature-flags:tenant-scoped"');
    expect(featureFlagRoute).toContain('cacheKeyPrefix: "feature-flags:tenant-scoped:"');
    expect(featureFlagRoute).toContain('"/api/public/[tenantSlug]/release-health"');
    expect(featureFlagRoute).toContain('cacheKeyScope: "tenant-scoped"');
    expect(featureFlagRoute).not.toContain("cacheKey: `feature-flags:${tenantId}");
    expect(featureFlagRoute).not.toContain("tenantId,\n          error:");
    expect(featureFlagRoute).not.toContain("tenantId,\n        persistence");
    expect(featureFlagRoute).not.toContain("tenantId,\n      persistence");
    expect(featureFlagRoute).toContain("recordIdEchoed: false");
    expect(featureFlagRoute).toContain("idempotencyReplay");
    expect(featureFlagRoute).toContain("featureFlagPersisted: true");
    expect(featureFlagRoute).toContain("auditLogged: true");
    expect(featureFlagRoute).toContain("idempotencyPersisted: true");
    expect(featureFlagRoute).toContain("rawIdempotencyKeyStored: false");
    expect(featureFlagRoute).toContain("internalPersistenceIdsStored: false");
    expect(featureFlagRoute).toContain("replayFeatureFlag = await tx.featureFlag.findUnique");
    expect(featureFlagRoute).not.toContain("featureFlagId: featureFlag.id");
    expect(featureFlagRoute).not.toContain("auditId: audit.id");
    expect(featureFlagRoute).not.toContain("auditId: result.audit.id");
    expect(featureFlagRoute).not.toContain("auditId: persisted.audit.id");
    expect(featureFlagRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(featureFlagRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(featureFlagRoute).not.toContain("idempotencyKeyId: persisted.idempotency.id");
    expect(featureFlagRoute).not.toContain("concurrency: (error as { concurrency?: unknown }).concurrency");
    expect(featureFlagRouteTest).toContain("tx.auditLog.create");
    expect(releaseRoute).toContain("releaseRollbackInputSchema.safeParse");
    expect(releaseRoute).toContain("dashboard-release-rollback");
    expect(releaseRoute).toContain('dashboardMutationAction: "rollback_release"');
    expect(releaseRoute).toContain('action: "release:rollback:intent"');
    expect(releaseRoute).toContain("providerRollbackExecuted: false");
    expect(releaseRoute).toContain("protectedEnvironmentTouched: false");
    expect(releaseRoute).toContain("idempotencyRecorded: true");
    expect(releaseRoute).toContain("idempotencyPersisted: true");
    expect(releaseRoute).toContain("rawIdempotencyKeyStored: false");
    expect(releaseRoute).toContain("releaseRecordPersisted: true");
    expect(releaseRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(releaseRoute).toContain("tenantIdEchoed: false");
    expect(releaseRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(releaseRoute).toContain("auditIdEchoed: false");
    expect(releaseRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(releaseRoute).toContain("internalPersistenceIdsStored: false");
    expect(releaseRoute).toContain("sourceReleaseRecordIdEchoed: false");
    expect(releaseRoute).toContain("providerRollbackPayloadEchoed: false");
    expect(releaseRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(releaseRoute).not.toContain("idempotencyKey,\n            idempotencyKeyId");
    expect(releaseRoute).not.toContain("recordId: created.id");
    expect(releaseRoute).not.toContain("replayResultString(persisted.idempotency.result, \"auditId\")");
    expect(releaseRoute).not.toContain("idempotencyKeyId: persisted.idempotency.id");
    expect(releaseRoute).not.toContain("auditId: persisted.status");
    expect(releaseRoute).not.toContain("sourceReleaseRecordId: persisted.sourceRecord.id");
    expect(releaseRoute).not.toContain("providerRollbackPayload: rollbackPlan");
    expect(releaseRoute).not.toContain("source: actor.source,\n          tenantId,");
    expect(releaseRoute).not.toContain("source: actor.source,\n        tenantId,");
    expect(releaseRoute).not.toContain("source: actor.source,\n      tenantId,");
    expect(releaseRoute).toContain("rawIdempotencyResultEchoed: false");
    expect(releaseRoute).not.toContain("persisted.idempotency.result as Record");
    expect(releaseRouteTest).toContain("PROVIDER_RELEASE_ROLLBACK_NOT_CONFIGURED");
    expect(notificationPreferenceRoute).toContain("buildSafeNotificationPreferenceResponse");
    expect(notificationPreferenceRoute).toContain("buildNotificationPreferenceResponseProjection");
    expect(notificationPreferenceRoute).toContain("tenantIdEchoed: false");
    expect(notificationPreferenceRoute).toContain("clientIdEchoed: false");
    expect(notificationPreferenceRoute).toContain("clientContactFieldsEchoed: false");
    expect(notificationPreferenceRoute).toContain("rawDestinationEchoed: false");
    expect(notificationPreferenceRoute).toContain("destinationHashEchoed: false");
    expect(notificationPreferenceRoute).toContain("preferenceRowIdsEchoed: false");
    expect(notificationPreferenceRoute).toContain("suppressionRowIdsEchoed: false");
    expect(notificationPreferenceRoute).toContain("auditIdEchoed: false");
    expect(notificationPreferenceRoute).toContain("idempotencyKeyIdEchoed: false");
    expect(notificationPreferenceRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(notificationPreferenceRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(notificationPreferenceRoute).toContain("preferencesPersisted: true");
    expect(notificationPreferenceRoute).toContain("suppressionsEvaluated: true");
    expect(notificationPreferenceRoute).toContain("auditLogged: true");
    expect(notificationPreferenceRoute).toContain("clientMatched: true");
    expect(notificationPreferenceRoute).toContain("idempotencyPersisted: true");
    expect(notificationPreferenceRoute).toContain("internalPersistenceIdsStored: false");
    expect(notificationPreferenceRoute).toContain("tenantScope: { actorTenantMatched: true");
    expect(notificationPreferenceRoute).not.toContain('tenantId,\n        clientId,\n        persistence: "database"');
    expect(notificationPreferenceRoute).not.toContain("tenantId,\n          clientId,\n          error:");
    expect(notificationPreferenceRoute).not.toContain("preferences: result.preferences");
    expect(notificationPreferenceRoute).not.toContain("suppressions: result.suppressions");
    expect(notificationPreferenceRoute).not.toContain("id: result.client.id");
    expect(notificationPreferenceRoute).not.toContain("auditId: result.status");
    expect(notificationPreferenceRoute).not.toContain("clientId: client.id,\n            auditId: audit.id");
    expect(notificationPreferenceRoute).not.toContain("metadata: { clientId: client.id");
    expect(notificationPreferenceRoute).not.toContain("idempotencyKeyId: idempotency.id");
    expect(notificationPreferenceRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(signedUploadRoute).toContain("buildSignedUploadResponseProjection");
    expect(signedUploadRoute).toContain("tenantIdEchoed: false");
    expect(signedUploadRoute).toContain("fileAssetIdEchoed: false");
    expect(signedUploadRoute).toContain("signedUrlGrantIdEchoed: false");
    expect(signedUploadRoute).toContain("signedUploadUrlEchoed: false");
    expect(signedUploadRoute).toContain("signedUrlHashEchoed: false");
    expect(signedUploadRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(signedUploadRoute).toContain("tenantScope: { actorTenantMatched: true }");
    expect(signedUploadRoute).not.toContain('tenantId,\n        persistence: "database"');
    expect(signedUploadRoute).not.toContain("source: actor.source, tenantId, error:");
    expect(signedUploadRoute).not.toContain("fileAssetId: result.fileAsset.id");
    expect(signedUploadRoute).not.toContain("signedUrlGrantId: result.grant.id");
    expect(signedUploadRoute).not.toContain("id: result.fileAsset.id");
    expect(signedUploadRoute).not.toContain("id: result.grant.id");
  });

  it("keeps provider/UI blockers explicit until every dashboard mutation is executable and tested", () => {
    expect(dashboardMutationRuntimeReadiness.status).toBe("blocked");
    expect(dashboardMutationRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardMutationRuntimeReadiness.missingApiRoutes).not.toContain("create_reference_upload_intent");
    expect(dashboardMutationRuntimeReadiness.missingServerActions).not.toContain("create_reference_upload_intent");
    expect(dashboardMutationRuntimeReadiness.missingApiRoutes).not.toContain("publish_portfolio_item");
    expect(dashboardMutationRuntimeReadiness.missingServerActions).not.toContain("publish_portfolio_item");
    expect(dashboardMutationRuntimeReadiness.missingRouteTests).not.toContain("publish_portfolio_item");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/app/api/files/signed-upload/route.ts");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/app/api/portfolio/route.ts");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/tests/portfolio-read-route-static.test.ts");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/app/api/releases/route.ts");
    expect(dashboardMutationRuntimeProofFiles).toContain("apps/dashboard/tests/release-route-static.test.ts");
    expect(dashboardMutationRuntimeReadiness.missingRouteTests).not.toContain("update_settings");
    expect(dashboardMutationRuntimeReadiness.missingApiRoutes).not.toContain("rollback_release");
    expect(dashboardMutationRuntimeReadiness.missingServerActions).not.toContain("rollback_release");
    expect(dashboardMutationRuntimeReadiness.missingRouteTests).not.toContain("rollback_release");
    expect(dashboardMutationRuntimeReadiness.requiredCommands).toBe(dashboardMutationRuntimeCommands);
    expect(dashboardMutationRuntimeReadiness.requiredEvidence).toBe(dashboardMutationExecutionRequiredEvidence);
    expect(dashboardMutationRuntimeReadiness.blockers).toContain("Dashboard mutation surfaces must expose gated action UI and explicit feedback states before execution readiness.");
    expect(dashboardMutationRuntimeReadiness.blockers).not.toContain("Dashboard mutation surfaces must expose gated actions instead of disabled placeholder copy before runtime readiness.");
    expect(disabledActionPanel).toContain("disabled");
  });

  it("blocks dashboard mutation completion when action coverage, idempotency, provider rollback, UI, CI, or safe evidence is missing", () => {
    const decision = buildDashboardMutationEvidenceDecision({
      commands: ["pnpm --filter @inkroute/booking typecheck"],
      artifacts: ["coverage/dashboard-mutation-booking-typecheck.txt"],
      serverActionsImplemented: ["accept"],
      apiRoutesImplemented: ["accept"],
      routeTestsPassed: ["accept"],
      evidence: {
        bookingTypecheckPassed: true,
        prismaTransactionsPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("provider mutation rollback/retry tests");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-mutation-secret-safe-artifacts.json");
    expect(decision.missingServerActions).toContain("create_deposit_session");
    expect(decision.missingApiRoutes).toContain("rollback_release");
    expect(decision.missingRouteTests).toContain("update_settings");
    expect(decision.missingEvidence).toContain("idempotencyPersistencePassed");
    expect(decision.missingEvidence).toContain("disabledPlaceholdersRemoved");
    expect(decision.blockers).toContain(
      "Dashboard mutation idempotency persistence must be enforced before provider side effects.",
    );
    expect(decision.blockers).toContain("Dashboard mutation surfaces must expose gated action UI and explicit feedback states before runtime readiness.");
  });

  it("completes dashboard mutation readiness only when every command, artifact, action, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(dashboardMutationEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDashboardMutationEvidenceDecision({
      commands: dashboardMutationRuntimeCommands,
      artifacts: dashboardMutationArtifactPaths,
      serverActionsImplemented: dashboardMutationActions,
      apiRoutesImplemented: dashboardMutationActions,
      routeTestsPassed: dashboardMutationActions,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingServerActions).toEqual([]);
    expect(decision.missingApiRoutes).toEqual([]);
    expect(decision.missingRouteTests).toEqual([]);
    expect(decision.requiredEvidence).toEqual(dashboardMutationEvidenceFlags);
  });

  it("separates static dashboard mutation review from provider execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardMutationExecutionPlan();
    const artifactReview = buildDashboardMutationArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      stripeDepositSession: "stripe_pi_private",
      providerRollbackToken: "provider-token-private",
      nested: {
        idempotencyAuditPayload: "webhook_secret_private",
        publicSummary: "dashboard mutation evidence captured",
      },
      mutationRoutePayload: "POST /api/travel/cities wrote travel_city_01HZYXZYXZYXZYXZYXZYXZYXZ for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      transactionTrace: "serializable transaction created audit_01HZYXZYXZYXZYXZYXZYXZYXZ and idempotency_01HZYXZYXZYXZYXZYXZYXZYXZ",
      providerRollbackTranscript: "rollback provider_01HZYXZYXZYXZYXZYXZYXZYXZ for payment_01HZYXZYXZYXZYXZYXZYXZYXZ",
      uiFeedbackTrace: "mutation feedback displayed client_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciOutput: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ passed",
      safeNote: "evidence_dashboard_mutation_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/dashboard-mutation/private-proof.json",
      safeDatabaseTrace: "postgresql://tenant_demo:secret@db.example.com/inkroute",
    });
    const directRedaction = buildRedactedDashboardMutationArtifact({
      publicSummary: "safe dashboard mutation evidence",
      operatorReviewNote: "private operator note",
    });

    expect(executionPlan.localCommands).toBe(dashboardMutationLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "static booking lifecycle mutation route review",
      "static gated mutation UI inventory review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardMutationExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard mutation server-action/API route tests",
      "dashboard mutation Prisma transaction tests",
      "dashboard mutation tenant-isolation and RBAC tests",
      "provider mutation rollback/retry tests",
      "dashboard mutation UI feedback-state tests",
      "GitHub Actions dashboard mutation execution evidence job",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.rollbackExecutionAllowed).toBe(false);
    expect(executionPlan.uiExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardMutationExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticMutationReadiness: true,
      allMutationRoutesRequiredForClosure: true,
      idempotencyPersistenceRequiredBeforeProviderEffects: true,
      tenantIsolationRbacAuditRequiredForClosure: true,
      providerRollbackRetryRequiredForClosure: true,
      gatedUiFeedbackRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardMutationRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("idempotency persistence proof before provider side effects");
    expect(executionPlan.requiredExternalEvidence).toContain("provider rollback and retry integration evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard mutation artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardMutationRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "stripeDepositSession",
      "providerRollbackToken",
      "nested.idempotencyAuditPayload",
      "mutationRoutePayload",
      "transactionTrace",
      "providerRollbackTranscript",
      "uiFeedbackTrace",
      "ciOutput",
      "safeNote",
      "safeDatabaseTrace",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("stripe_pi_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("travel_city_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("audit_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("evidence_dashboard_mutation_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("artifacts/dashboard-mutation/private-proof.json");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("postgresql://tenant_demo:secret@db.example.com/inkroute");
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard mutation evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["operatorReviewNote"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard mutation evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider mutation readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard mutation runtime contracts");
    expect(ciWorkflow).toContain("dashboard-mutation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-mutation-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-mutation-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardMutationRuntime.ts");
    expect(gapTracker).toContain("buildDashboardMutationExecutionPlan");
    expect(gapTracker).toContain("dashboardMutationLocalCommands/dashboardMutationExternalCommands");
    expect(gapTracker).toContain("buildRedactedDashboardMutationArtifact");
    expect(gapTracker).toContain("buildDashboardMutationArtifactReview");
    expect(gapTracker).toContain("dashboardMutationExecutionPolicy");
    expect(gapTracker).toContain("dashboardMutationRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-038 is dashboard-mutation-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-038 is booking-lifecycle-route wired");
    expect(dashboardMutationArtifactPaths).toContain("coverage/dashboard-mutation-secret-safe-artifacts.json");
  });
});



