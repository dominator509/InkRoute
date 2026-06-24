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
  const calendarHoldRoute = readRepoFile("apps/dashboard/app/api/calendar/holds/route.ts");
  const availabilityPersistenceTest = readRepoFile("apps/dashboard/tests/availability-persistence-static.test.ts");
  const travelPublishRoute = readRepoFile("apps/dashboard/app/api/travel/publish/route.ts");
  const travelPublishActionPanel = readRepoFile("apps/dashboard/components/TravelPublishActionPanel.tsx");
  const travelPublishTest = readRepoFile("apps/dashboard/tests/travel-publish-static.test.ts");
  const imageSeoRoute = readRepoFile("apps/dashboard/app/api/portfolio/image-seo-pipeline/route.ts");
  const imageSeoActionPanel = readRepoFile("apps/dashboard/components/ImageSeoActionPanel.tsx");
  const imageSeoTest = readRepoFile("apps/dashboard/tests/image-seo-pipeline-static.test.ts");
  const settingsRoute = readRepoFile("apps/dashboard/app/api/settings/route.ts");
  const settingsActionPanel = readRepoFile("apps/dashboard/components/SettingsActionPanel.tsx");
  const settingsTest = readRepoFile("apps/dashboard/tests/settings-read-route-static.test.ts");
  const clientDetailRoute = readRepoFile("apps/dashboard/app/api/clients/[clientId]/route.ts");
  const clientDetailActionPanel = readRepoFile("apps/dashboard/components/ClientDetailActionPanel.tsx");
  const clientReadRouteTest = readRepoFile("apps/dashboard/tests/client-read-route-static.test.ts");
  const paymentsPage = readRepoFile("apps/dashboard/app/payments/page.tsx");
  const paymentActionPanel = readRepoFile("apps/dashboard/components/PaymentActionPanel.tsx");
  const paymentReadRouteTest = readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts");
  const formDetailRoute = readRepoFile("apps/dashboard/app/api/forms/[formId]/route.ts");
  const formActionPanel = readRepoFile("apps/dashboard/components/FormActionPanel.tsx");
  const formReadRouteTest = readRepoFile("apps/dashboard/tests/form-read-route-static.test.ts");
  const featureFlagRoute = readRepoFile("apps/dashboard/app/api/feature-flags/route.ts");
  const featureFlagRouteTest = readRepoFile("apps/dashboard/tests/feature-flag-route-static.test.ts");
  const releaseRoute = readRepoFile("apps/dashboard/app/api/releases/route.ts");
  const releaseRouteTest = readRepoFile("apps/dashboard/tests/release-route-static.test.ts");
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
    expect(bookingStateRoute).toContain("prisma.$transaction");
    expect(bookingStateRoute).toContain("tx.idempotencyKey.upsert");
    expect(bookingStateRoute).toContain("tx.idempotencyKey.update");
    expect(bookingStateRoute).toContain("existingIdempotency?.status");
    expect(bookingStateRoute).toContain("tx.bookingStateEvent.create");
    expect(bookingStateRoute).toContain("tx.auditLog.create");
    expect(appointmentRoute).toContain('export const runtime = "nodejs"');
    expect(appointmentRoute).toContain("dashboard-appointment-create");
    expect(appointmentRoute).toContain("tx.idempotencyKey.upsert");
    expect(appointmentRoute).toContain('idempotency.status === "completed"');
    expect(appointmentRoute).toContain("tx.appointment.findFirst");
    expect(appointmentRoute).toContain("tx.appointment.create");
    expect(appointmentRoute).toContain("tx.bookingStateEvent.create");
    expect(appointmentRoute).toContain("tx.auditLog.create");
    expect(appointmentRoute).toContain("tx.notificationJob.create");
    expect(appointmentRoute).toContain('sourceAction: "appointment.create.notification"');
    expect(appointmentRoute).toContain('templateKey: "appointment_created"');
    expect(appointmentRoute).toContain('providerExecution: "deferred"');
    expect(appointmentRoute).toContain("notificationJobQueued: true");
    expect(appointmentRoute).toContain("tx.idempotencyKey.update");
    expect(appointmentRoute).toContain("calendarProviderInserted: false");
    expect(appointmentRoute).toContain("depositSessionCreated: false");
    expect(appointmentRoute).toContain("notificationProviderExecution");
    expect(appointmentRoute).toContain("idempotencyKeyId");
    expect(appointmentRoute).toContain("idempotencyReplay");
    expect(bookingLifecycleActionPanel).toContain("fetch(`/api/bookings/${bookingId}/state`");
    expect(bookingLifecycleActionPanel).toContain("idempotencyKey");
    expect(bookingLifecycleActionPanel).toContain("BookingStateEvent writes");
    expect(bookingLifecycleActionPanel).toContain("AuditLog persistence");
    expect(bookingStateRoute).toContain('return "create_deposit_session"');
    expect(bookingStateRoute).toContain('return "mark_deposit_paid"');
    expect(bookingStateRoute).toContain('return "confirm_appointment"');
    expect(bookingStateRouteTest).toContain("persists booking status, state event, and audit log");
    expect(messageRoute).toContain("buildDashboardMessagePersistencePlan");
    expect(messageRoute).toContain("export async function POST");
    expect(messageActionPanel).toContain('fetch("/api/messages"');
    expect(messageActionPanel).toContain("Queue safe follow-up");
    expect(notificationPersistenceTest).toContain("wires dashboard message POST");
    expect(notificationQueueRoute).toContain('export const runtime = "nodejs"');
    expect(notificationQueueRoute).toContain("tx.idempotencyKey.upsert");
    expect(notificationQueueRoute).toContain("requestHash");
    expect(notificationQueueRoute).toContain('status: "idempotency_conflict"');
    expect(notificationQueueRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(notificationQueueRoute).toContain("tx.idempotencyKey.update");
    expect(notificationQueueRoute).toContain("idempotencyKeyId");
    expect(notificationQueueRoute).toContain("idempotencyReplay");
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
    expect(calendarHoldRoute).toContain("idempotencyKeyId");
    expect(calendarHoldRoute).toContain("idempotencyReplay");
    expect(calendarHoldRoute).toContain("localCalendarHoldFallbackDisabled");
    expect(availabilityPersistenceTest).toContain("apps/dashboard/app/api/calendar/holds/route.ts");
    expect(travelPublishRoute).toContain("buildTravelPublishMutationPlan");
    expect(travelPublishRoute).toContain("database-persisted");
    expect(travelPublishRoute).toContain('export const runtime = "nodejs"');
    expect(travelPublishRoute).toContain("auditLog.create");
    expect(travelPublishRoute).toContain("idempotencyKey.upsert");
    expect(travelPublishRoute).toContain('idempotency.status === "completed"');
    expect(travelPublishRoute).toContain('status: "idempotency_conflict"');
    expect(travelPublishRoute).toContain("idempotencyKeyId");
    expect(travelPublishRoute).toContain("idempotencyReplay");
    expect(travelPublishRoute).toContain("repository-required");
    expect(travelPublishActionPanel).toContain('fetch("/api/travel/publish"');
    expect(travelPublishActionPanel).toContain("Submit publish draft");
    expect(travelPublishTest).toContain("wires the dashboard travel publish API through the mutation plan");
    expect(imageSeoRoute).toContain('assertPermission(actor, "portfolio:write")');
    expect(imageSeoRoute).toContain('export const runtime = "nodejs"');
    expect(imageSeoRoute).toContain("tx.portfolioItem.findFirst");
    expect(imageSeoRoute).toContain("tx.idempotencyKey.upsert");
    expect(imageSeoRoute).toContain('idempotency.status === "completed"');
    expect(imageSeoRoute).toContain('status: "idempotency_conflict"');
    expect(imageSeoRoute).toContain("tx.fileAsset.findUnique");
    expect(imageSeoRoute).toContain('status: "file_asset_tenant_conflict"');
    expect(imageSeoRoute).toContain("tx.idempotencyKey.update");
    expect(imageSeoRoute).toContain("idempotencyKeyId");
    expect(imageSeoRoute).toContain("idempotencyReplay");
    expect(imageSeoRoute).toContain("PROVIDER_IMAGE_SEO_PERSISTENCE_NOT_CONFIGURED");
    expect(imageSeoActionPanel).toContain('fetch("/api/portfolio/image-seo-pipeline"');
    expect(imageSeoActionPanel).toContain("Generate derivative draft");
    expect(imageSeoTest).toContain("wires the portfolio dashboard action through the gated image SEO route");
    expect(settingsRoute).toContain("export async function PATCH");
    expect(settingsRoute).toContain('evaluateDashboardApiGuard(request, "settings:write"');
    expect(settingsRoute).toContain('dashboardMutationAction: "update_settings"');
    expect(settingsRoute).toContain("PROVIDER_SETTINGS_PERSISTENCE_NOT_CONFIGURED");
    expect(settingsRoute).toContain("tx.idempotencyKey.upsert");
    expect(settingsRoute).toContain("requestHash");
    expect(settingsRoute).toContain('idempotency.status === "completed"');
    expect(settingsRoute).toContain('code: "IDEMPOTENCY_CONFLICT"');
    expect(settingsRoute).toContain("tx.idempotencyKey.update");
    expect(settingsRoute).toContain("idempotencyKeyId");
    expect(settingsRoute).toContain("idempotencyReplay");
    expect(settingsActionPanel).toContain('fetch("/api/settings"');
    expect(settingsActionPanel).toContain("Save settings draft");
    expect(settingsTest).toContain("guards safe settings writes");
    expect(clientDetailRoute).toContain("export async function PATCH");
    expect(clientDetailRoute).toContain('assertPermission(actor, "client:write")');
    expect(clientDetailRoute).toContain('dashboardMutationAction: "append_client_private_note"');
    expect(clientDetailRoute).toContain("PROVIDER_CLIENT_WRITE_PERSISTENCE_NOT_CONFIGURED");
    expect(clientDetailRoute).toContain("tx.clientProfile.upsert");
    expect(clientDetailRoute).toContain('persistence: "local-contract"');
    expect(clientDetailRoute).not.toContain('persistence: "local-plan-only"');
    expect(clientDetailActionPanel).toContain('fetch(`/api/clients/${clientId}`');
    expect(clientDetailActionPanel).toContain("Save private note");
    expect(clientReadRouteTest).toContain("wires a gated private-note client write seam");
    expect(paymentsPage).toContain("PaymentActionPanel");
    expect(paymentActionPanel).toContain('fetch(`/api/bookings/${bookingId}/state`');
    expect(paymentActionPanel).toContain('action: "request_deposit"');
    expect(paymentActionPanel).toContain("create_deposit_session");
    expect(paymentReadRouteTest).toContain("gated deposit-session draft action");
    expect(formDetailRoute).toContain("export async function PATCH");
    expect(formDetailRoute).toContain('assertPermission(actor, "form:write")');
    expect(formDetailRoute).toContain('dashboardMutationAction: "archive_form_version"');
    expect(formDetailRoute).toContain("tx.idempotencyKey.upsert");
    expect(formDetailRoute).toContain("tx.idempotencyKey.update");
    expect(formDetailRoute).toContain("idempotencyKeyId");
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
    expect(featureFlagRoute).toContain("idempotencyReplay");
    expect(featureFlagRouteTest).toContain("tx.auditLog.create");
    expect(releaseRoute).toContain("releaseRollbackInputSchema.safeParse");
    expect(releaseRoute).toContain("dashboard-release-rollback");
    expect(releaseRoute).toContain('dashboardMutationAction: "rollback_release"');
    expect(releaseRoute).toContain('action: "release:rollback:intent"');
    expect(releaseRoute).toContain("providerRollbackExecuted: false");
    expect(releaseRoute).toContain("protectedEnvironmentTouched: false");
    expect(releaseRouteTest).toContain("PROVIDER_RELEASE_ROLLBACK_NOT_CONFIGURED");
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
    expect(dashboardMutationRuntimeReadiness.blockers).toContain("Dashboard mutation surfaces must expose gated action UI and explicit feedback states before runtime readiness.");
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
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("stripe_pi_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
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



