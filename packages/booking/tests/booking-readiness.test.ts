import { describe, expect, it } from "vitest";
import {
  buildBookingPostSubmitPlan,
  buildBookingContactRuntimeEvidencePlan,
  buildBookingProviderHandoffRuntimeEvidencePlan,
  buildBookingProviderFailurePlan,
  buildDashboardMutationPlan,
  buildDashboardMutationExecutionEvidencePlan,
  buildDashboardMutationRuntimeReadinessPlan,
  buildDomainEventAuditReadinessPlan,
  buildDomainEventAuditTransactionEvidencePlan,
  calculateTattooReadinessScore,
  createBookingTransitionPlan,
  emptyBookingDraft,
  getAvailableBookingActions,
  getTravelBookingCta,
  transitionBookingStatus,
} from "../src/index";

describe("booking readiness", () => {
  it("flags an empty booking draft as not artist-ready", () => {
    const result = calculateTattooReadinessScore(emptyBookingDraft);

    expect(result.label).toBe("Needs essentials");
    expect(result.percentage).toBeLessThan(50);
    expect(result.checks.some((check) => check.id === "client" && !check.passed)).toBe(true);
  });

  it("scores a complete tattoo request as artist-ready", () => {
    const result = calculateTattooReadinessScore({
      ...emptyBookingDraft,
      preferredCitySlug: "seattle-wa",
      preferredDateWindow: "June 10-14",
      locationPreference: "Guest spot",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "Palm-sized",
      budgetRange: "$500-$900",
      ideaSummary: "Blackwork botanical forearm piece with reference direction, negative space, and healed portfolio examples to avoid overly dense shading.",
      referenceImages: [{ localId: "ref-1", filename: "reference.jpg", mimeType: "image/jpeg", sizeBytes: 320000, uploadStatus: "local_only" }],
      clientName: "Avery Client",
      clientEmail: "avery@example.com",
      policyAccepted: true,
      ageAcknowledged: true,
      privacyAcknowledged: true,
      depositBoundaryAcknowledged: true,
    });

    expect(result.label).toBe("Artist-ready");
    expect(result.percentage).toBeGreaterThanOrEqual(90);
  });

  it("applies supported lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionBookingStatus("draft", "submit")).toBe("submitted");
    expect(transitionBookingStatus("submitted", "accept")).toBe("accepted");
    expect(transitionBookingStatus("draft", "complete")).toBe("draft");
  });

  it("lists available lifecycle actions by status", () => {
    expect(getAvailableBookingActions("submitted").map((transition) => transition.action)).toEqual([
      "request_more_info",
      "accept",
      "decline",
    ]);
    expect(getAvailableBookingActions("archived")).toEqual([]);
  });

  it("keeps lifecycle audit metadata attached to transitions", () => {
    const depositTransition = getAvailableBookingActions("deposit_pending").find(
      (transition) => transition.action === "record_deposit_paid",
    );

    expect(depositTransition).toMatchObject({
      to: "deposit_paid",
      eventType: "deposit_paid",
      actor: "system",
      requiresAudit: true,
    });
  });

  it("plans booking status, state event, and audit writes as one atomic transition", () => {
    const plan = createBookingTransitionPlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      from: "submitted",
      action: "accept",
      actorId: "artist_001",
      actorType: "artist",
      occurredAt: "2026-06-08T12:00:00.000Z",
      reason: "Accepted after reviewing references.",
      idempotencyKey: "transition_001",
    });

    expect(plan).toMatchObject({
      status: "ready",
      canCommit: true,
      requiresAtomicTransaction: true,
      transition: {
        from: "submitted",
        to: "accepted",
        eventType: "accepted",
      },
    });
    expect(plan.writes.map((write) => write.model)).toEqual(["BookingRequest", "BookingStateEvent", "AuditLog"]);
    expect(plan.writes.every((write) => write.tenantId === "tenant_001")).toBe(true);
    expect(plan.writes.find((write) => write.model === "AuditLog")?.payload).toMatchObject({
      action: "booking.accept",
      entityType: "BookingRequest",
      entityId: "booking_001",
      idempotencyKey: "transition_001",
    });
  });

  it("refuses invalid or unauditable booking transition plans", () => {
    expect(
      createBookingTransitionPlan({
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        from: "draft",
        action: "complete",
        actorId: "artist_001",
        occurredAt: "2026-06-08T12:00:00.000Z",
      }),
    ).toMatchObject({
      status: "invalid_transition",
      canCommit: false,
      writes: [],
    });

    expect(
      createBookingTransitionPlan({
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        from: "submitted",
        action: "accept",
        occurredAt: "2026-06-08T12:00:00.000Z",
      }),
    ).toMatchObject({
      status: "missing_actor",
      canCommit: false,
      writes: [],
    });
  });

  it("plans post-submit upload, deposit, notification, and calendar handoffs", () => {
    const plan = buildBookingPostSubmitPlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      submittedAt: "2026-06-08T12:00:00.000Z",
      draft: {
        ...emptyBookingDraft,
        preferredCitySlug: "seattle-wa",
        preferredDateWindow: "July 10-15",
        style: "blackwork",
        placement: "forearm",
        sizeEstimate: "Palm-sized",
        budgetRange: "$500-$900",
        ideaSummary: "Blackwork botanical forearm piece with reference direction and clear placement notes.",
        referenceImages: [{ localId: "ref-1", filename: "reference.jpg", mimeType: "image/jpeg", sizeBytes: 300000, uploadStatus: "local_only" }],
        clientName: "Avery Client",
        clientEmail: "avery@example.com",
        smsOptIn: true,
        policyAccepted: true,
        ageAcknowledged: true,
        privacyAcknowledged: true,
        depositBoundaryAcknowledged: true,
      },
    });

    expect(plan).toMatchObject({
      status: "ready",
      canPersistWorkflowRecords: true,
      blockers: [],
    });
    expect(plan.workflows.map((workflow) => workflow.type)).toEqual([
      "reference-upload",
      "deposit-handoff",
      "notification-bootstrap",
      "calendar-hold",
    ]);
    expect(plan.workflows.every((workflow) => workflow.status === "provider_gated")).toBe(true);
    expect(plan.workflows.find((workflow) => workflow.type === "reference-upload")?.payload).toMatchObject({
      referenceCount: 1,
      signedUploadRequired: true,
    });
  });

  it("blocks workflow record persistence when tenant, booking, or client contact are missing", () => {
    const plan = buildBookingPostSubmitPlan({
      tenantId: "",
      bookingRequestId: "",
      submittedAt: "2026-06-08T12:00:00.000Z",
      draft: {
        ...emptyBookingDraft,
        clientEmail: "not-an-email",
      },
    });

    expect(plan.status).toBe("blocked");
    expect(plan.canPersistWorkflowRecords).toBe(false);
    expect(plan.blockers).toEqual([
      "Tenant scope is required before post-submit workflows can be recorded.",
      "Booking request id is required before post-submit workflows can be recorded.",
      "A valid client email is required for notification bootstrap.",
    ]);
    expect(plan.workflows.find((workflow) => workflow.type === "notification-bootstrap")?.status).toBe("blocked_missing_data");
    expect(plan.workflows.find((workflow) => workflow.type === "calendar-hold")?.required).toBe(false);
  });

  it("plans audit-first rollback for deposit and calendar provider failures", () => {
    const depositFailure = buildBookingProviderFailurePlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      failedWorkflow: "deposit-handoff",
      failedAt: "2026-06-08T12:30:00.000Z",
      provider: "stripe",
      providerErrorCode: "stripe_timeout",
      retryable: false,
    });

    expect(depositFailure).toMatchObject({
      status: "ready",
      canRetry: false,
      requiresAudit: true,
      rollbackRequired: true,
      actions: ["mark_workflow_failed", "write_audit_log", "void_deposit_session", "queue_operator_review"],
      auditPayload: {
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        failedWorkflow: "deposit-handoff",
        provider: "stripe",
        providerErrorCode: "stripe_timeout",
      },
    });

    const calendarFailure = buildBookingProviderFailurePlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      failedWorkflow: "calendar-hold",
      failedAt: "2026-06-08T12:35:00.000Z",
      provider: "calendar",
      retryable: false,
    });

    expect(calendarFailure.actions).toEqual(["mark_workflow_failed", "write_audit_log", "cancel_calendar_hold", "queue_operator_review"]);
  });

  it("allows retryable notification failures without rollback-first handling", () => {
    const plan = buildBookingProviderFailurePlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      failedWorkflow: "notification-bootstrap",
      failedAt: "2026-06-08T12:40:00.000Z",
      provider: "notification",
      retryable: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      canRetry: true,
      rollbackRequired: false,
      actions: ["mark_workflow_failed", "write_audit_log", "retry_notification"],
    });
  });

  it("plans dashboard lifecycle mutations with audit, idempotency, and atomic booking writes", () => {
    const plan = buildDashboardMutationPlan({
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      currentStatus: "submitted",
      action: "accept",
      actorId: "artist_001",
      actorType: "artist",
      occurredAt: "2026-06-08T13:00:00.000Z",
      idempotencyKey: "dashboard_accept_001",
    });

    expect(plan).toMatchObject({
      status: "ready",
      providerBoundary: "database",
      requiresAudit: true,
      requiresIdempotency: true,
      canCommit: true,
      auditAction: "dashboard.booking.accept",
      idempotencyKey: "dashboard_accept_001",
    });
    expect(plan.writes).toEqual(["BookingRequest", "BookingStateEvent", "AuditLog"]);
  });

  it("blocks dashboard mutations missing tenant, actor, idempotency, or booking scope", () => {
    const plan = buildDashboardMutationPlan({
      tenantId: "",
      action: "create_deposit_session",
      occurredAt: "2026-06-08T13:00:00.000Z",
    });

    expect(plan).toMatchObject({
      status: "blocked",
      providerBoundary: "stripe",
      requiresAudit: true,
      requiresIdempotency: true,
      canCommit: false,
      writes: ["Payment", "AuditLog"],
    });
    expect(plan.blockers).toEqual([
      "Tenant scope is required before dashboard mutations can run.",
      "Actor identity is required before dashboard mutations can run.",
      "Idempotency key is required before dashboard mutations can run.",
      "Booking request id is required for booking-scoped dashboard provider actions.",
    ]);
  });

  it("maps provider dashboard actions to explicit write and provider boundaries", () => {
    expect(
      buildDashboardMutationPlan({
        tenantId: "tenant_001",
        bookingRequestId: "booking_001",
        action: "create_reference_upload_intent",
        actorId: "artist_001",
        occurredAt: "2026-06-08T13:00:00.000Z",
        idempotencyKey: "upload_intent_001",
      }),
    ).toMatchObject({
      status: "ready",
      providerBoundary: "storage",
      writes: ["FileAsset", "AuditLog"],
      auditAction: "dashboard.reference_upload_intent.create",
    });

    expect(
      buildDashboardMutationPlan({
        tenantId: "tenant_001",
        action: "rollback_release",
        actorId: "owner_001",
        actorType: "owner",
        occurredAt: "2026-06-08T13:00:00.000Z",
        idempotencyKey: "rollback_release_001",
      }),
    ).toMatchObject({
      status: "ready",
      providerBoundary: "release",
      writes: ["ReleaseRecord", "AuditLog"],
      auditAction: "dashboard.release.rollback",
    });
  });

  it("blocks dashboard mutation runtime readiness until routes, tests, transactions, and provider rollback exist", () => {
    const plan = buildDashboardMutationRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      actionsWithServerRoutes: ["accept", "decline", "create_deposit_session"],
      actionsWithRouteTests: ["accept"],
      prismaTransactionsConfigured: false,
      tenantIsolationTestsPassed: false,
      rbacDenialTestsPassed: false,
      idempotencyStoreConfigured: true,
      auditLogPersistenceConfigured: false,
      providerRollbackTestsPassed: false,
      disabledPlaceholdersRemoved: false,
      userFeedbackStatesCovered: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingServerRoutes).toContain("create_calendar_hold");
    expect(plan.missingRouteTests).toContain("rollback_release");
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/dashboard test -- dashboard-mutations");
    expect(plan.requiredEvidence).toContain("tenant isolation and RBAC denial test output for dashboard mutations");
    expect(plan.blockers).toContain("Disabled dashboard action placeholders must be replaced by gated actions before runtime readiness.");
  });

  it("blocks dashboard mutation execution evidence until routes, transactions, RBAC, rollback, UI states, CI, and artifacts exist", () => {
    const plan = buildDashboardMutationExecutionEvidencePlan({
      packageScripts: { test: "vitest run" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      serverActionsImplemented: ["accept", "decline"],
      apiRoutesImplemented: ["accept"],
      routeTestsPassed: ["accept"],
      prismaTransactionsPassed: false,
      idempotencyPersistencePassed: false,
      auditLogPersistencePassed: false,
      tenantIsolationTestsPassed: false,
      rbacDenialTestsPassed: false,
      providerRollbackTestsPassed: false,
      disabledPlaceholdersRemoved: false,
      uiFeedbackStatesPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingServerActions).toContain("create_deposit_session");
    expect(plan.missingApiRoutes).toContain("rollback_release");
    expect(plan.missingRouteTests).toContain("update_settings");
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "dashboard mutation server-action/API route tests",
      "dashboard mutation Prisma transaction tests",
      "dashboard mutation tenant-isolation and RBAC tests",
      "provider mutation rollback/retry tests",
      "dashboard mutation UI feedback-state tests",
    ]));
    expect(plan.requiredControls).toContain("Use buildDashboardMutationPlan before every server action or API mutation side effect.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "server action, API route, and route-test matrix for every dashboard mutation",
      "Prisma transaction, idempotency, and AuditLog persistence evidence",
      "tenant-isolation and RBAC-denial mutation test evidence",
      "provider rollback/retry evidence for storage, Stripe, notification, calendar, release, and settings actions",
      "gated mutation UI replacement plus loading/success/denial/failure/retry state evidence",
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
    ]));
    expect(plan.blockers).toContain("Disabled dashboard placeholders must be replaced with gated mutation UI.");
    expect(plan.blockers).toContain("Dashboard mutation artifacts must be redacted and free of secrets, provider tokens, raw PII, medical notes, payment data, and private file URLs.");
  });

  it("marks dashboard mutation execution evidence ready when routes, transactions, RBAC, rollback, UI states, CI, and artifacts align", () => {
    const allActions = [
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
    ] as const;
    const plan = buildDashboardMutationExecutionEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      serverActionsImplemented: allActions,
      apiRoutesImplemented: allActions,
      routeTestsPassed: allActions,
      prismaTransactionsPassed: true,
      idempotencyPersistencePassed: true,
      auditLogPersistencePassed: true,
      tenantIsolationTestsPassed: true,
      rbacDenialTestsPassed: true,
      providerRollbackTestsPassed: true,
      disabledPlaceholdersRemoved: true,
      uiFeedbackStatesPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      missingServerActions: [],
      missingApiRoutes: [],
      missingRouteTests: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Replace disabled placeholders with gated UI actions and explicit loading/success/denial/failure/retry states.");
  });

  it("blocks booking/contact runtime evidence until route, UI, persistence, provider, E2E, CI, and artifact proof exist", () => {
    const plan = buildBookingContactRuntimeEvidencePlan({
      packageScripts: { test: "vitest run" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: false,
      webTypecheckPassed: false,
      webBuildPassed: false,
      bookingRouteUsesPostSubmitPlan: false,
      confirmationUiUsesWorkflowState: false,
      contactFormPersistenceConfigured: false,
      databasePersistenceIntegrationPassed: false,
      tenantIsolationIntegrationPassed: false,
      referenceUploadHandoffGated: true,
      depositHandoffGated: false,
      notificationHandoffGated: false,
      calendarHandoffGated: false,
      noLivePaymentBoundaryPreserved: false,
      browserE2ePassed: false,
      apiE2ePassed: false,
      providerSandboxEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "booking/contact API E2E tests",
      "booking/contact browser E2E tests",
      "provider sandbox handoff boundary tests",
    ]));
    expect(plan.requiredControls).toContain("Preserve no-live-payment behavior until Stripe sandbox credentials and reviewed deposit copy are configured.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "public route, confirmation UI, and contact persistence wiring evidence",
      "tenant-scoped booking/contact database integration evidence",
      "provider-gated upload, deposit, notification, calendar, and no-live-payment boundary evidence",
      "browser E2E, API E2E, and provider sandbox transcript evidence",
      "web typecheck/build, CI, and secret-safe artifact evidence",
    ]));
    expect(plan.blockers).toContain("Contact form submissions must persist through a tenant-scoped pathway with audit metadata.");
    expect(plan.blockers).toContain("Deposit handoff must preserve the no-live-payment boundary until Stripe test credentials and sandbox evidence exist.");
    expect(plan.blockers).toContain("Booking/contact artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("marks booking/contact runtime evidence ready when persistence, providers, E2E, CI, and artifacts align", () => {
    const plan = buildBookingContactRuntimeEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      bookingRouteUsesPostSubmitPlan: true,
      confirmationUiUsesWorkflowState: true,
      contactFormPersistenceConfigured: true,
      databasePersistenceIntegrationPassed: true,
      tenantIsolationIntegrationPassed: true,
      referenceUploadHandoffGated: true,
      depositHandoffGated: true,
      notificationHandoffGated: true,
      calendarHandoffGated: true,
      noLivePaymentBoundaryPreserved: true,
      browserE2ePassed: true,
      apiE2ePassed: true,
      providerSandboxEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Persist booking/contact submissions before creating upload, deposit, notification, or calendar handoff work.");
  });

  it("blocks booking provider handoff evidence until accepted gates, workers, provider sandboxes, rollback, CI, and artifacts exist", () => {
    const plan = buildBookingProviderHandoffRuntimeEvidencePlan({
      packageScripts: { test: "vitest run" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: false,
      paymentsTestsPassed: false,
      notificationsTestsPassed: false,
      calendarTestsPassed: false,
      acceptedBookingGateEnforced: false,
      persistedWorkerQueueConfigured: false,
      referenceUploadWorkerExecuted: false,
      stripeDepositSessionSandboxPassed: false,
      notificationQueueDeliverySandboxPassed: false,
      calendarHoldSandboxPassed: false,
      auditPayloadsPersisted: false,
      retryPolicyVerified: false,
      rollbackPathsVerified: false,
      operatorReviewQueueConfigured: false,
      providerIdempotencyConfigured: false,
      providerSandboxEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "Stripe CLI deposit session sandbox test",
      "email/SMS/push notification sandbox delivery tests",
      "Google Calendar tentative hold sandbox test",
      "persisted provider worker execution tests",
      "provider rollback/retry integration tests",
    ]));
    expect(plan.requiredControls).toContain("Create Stripe deposit sessions only after accepted booking state and policy approval.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "accepted-booking gate, persisted worker queue, and provider idempotency evidence",
      "reference upload, Stripe, notification, and calendar sandbox execution evidence",
      "audit persistence, retry, rollback, and operator-review queue evidence",
      "booking, payments, notifications, and calendar package test/typecheck evidence",
      "provider sandbox, CI, and secret-safe artifact evidence",
    ]));
    expect(plan.blockers).toContain("Deposit and calendar handoffs must run only after an accepted booking state.");
    expect(plan.blockers).toContain("Stripe deposit session sandbox test must pass without live-payment mode.");
    expect(plan.blockers).toContain("Provider handoff artifacts must be redacted and free of secrets, provider tokens, payment data, private URLs, and raw client PII.");
  });

  it("marks booking provider handoff evidence ready when workers, sandboxes, rollback, CI, and artifacts align", () => {
    const plan = buildBookingProviderHandoffRuntimeEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: true,
      paymentsTestsPassed: true,
      notificationsTestsPassed: true,
      calendarTestsPassed: true,
      acceptedBookingGateEnforced: true,
      persistedWorkerQueueConfigured: true,
      referenceUploadWorkerExecuted: true,
      stripeDepositSessionSandboxPassed: true,
      notificationQueueDeliverySandboxPassed: true,
      calendarHoldSandboxPassed: true,
      auditPayloadsPersisted: true,
      retryPolicyVerified: true,
      rollbackPathsVerified: true,
      operatorReviewQueueConfigured: true,
      providerIdempotencyConfigured: true,
      providerSandboxEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Persist audit payloads and idempotency keys before invoking external providers.");
  });

  it("summarizes domain event and audit readiness across booking, payment, transactions, idempotency, and rollback", () => {
    const plan = buildDomainEventAuditReadinessPlan({
      packageScripts: { test: "vitest run" },
      bookingPackageTestsPassed: true,
      bookingPackageTypecheckPassed: false,
      paymentPackageTestsPassed: true,
      bookingTransitionPlansCovered: true,
      paymentLifecyclePlansCovered: true,
      prismaTransactionServicesConfigured: false,
      tenantScopedRepositoriesConfigured: false,
      idempotencyStoreConfigured: false,
      auditLogPersistenceConfigured: false,
      bookingStateEventPersistenceConfigured: false,
      paymentAuditLogPersistenceConfigured: false,
      rollbackFailurePlansConfigured: true,
      databaseIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("booking/payment lifecycle Prisma transaction integration tests");
    expect(plan.requiredControls).toContain("Make invalid state transitions impossible through the service layer, not just through UI disabled states.");
    expect(plan.blockers).toContain("Prisma service layer must execute state changes and event/audit writes in one transaction.");
    expect(plan.blockers).toContain("Idempotency store must reject replayed booking/payment lifecycle mutations.");
    expect(plan.blockers).toContain("Database integration tests must prove state mutation, event row, audit row, idempotency, and rollback behavior atomically.");
  });

  it("blocks domain event/audit transaction evidence until atomic booking/payment writes, idempotency, rollback, denials, CI, and safe artifacts exist", () => {
    const plan = buildDomainEventAuditTransactionEvidencePlan({
      packageScripts: { test: "vitest run" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: false,
      paymentTestsPassed: true,
      paymentTypecheckPassed: false,
      prismaTransactionServicesImplemented: false,
      tenantScopedRepositoriesImplemented: false,
      bookingStateMutationAtomicityPassed: false,
      paymentStateMutationAtomicityPassed: false,
      bookingStateEventRowsPersisted: false,
      auditLogRowsPersisted: false,
      paymentAuditLogRowsPersisted: false,
      idempotencyPersistenceEnforced: false,
      replayedMutationReturnsOriginalResult: false,
      providerRollbackIntegrationPassed: false,
      invalidTransitionDenialPassed: false,
      crossTenantMutationDenialPassed: false,
      databaseIntegrationEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "booking/payment package test and typecheck evidence",
      "Prisma transaction service and tenant-scoped repository evidence",
      "atomic booking/payment state, event, audit, and payment-audit persistence evidence",
      "idempotency persistence and replay original-result evidence",
      "provider rollback, invalid-transition denial, and cross-tenant denial evidence",
      "database integration, CI, and secret-safe artifact evidence",
    ]);
    expect(plan.blockers).toContain("Booking/payment lifecycle services must execute writes inside Prisma transactions.");
    expect(plan.blockers).toContain("Replayed lifecycle mutations must return the original committed result without duplicate writes.");
    expect(plan.blockers).toContain("Domain event/audit artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });

  it("marks domain event/audit transaction evidence ready when atomic writes, idempotency, rollback, denials, CI, and safe artifacts align", () => {
    const plan = buildDomainEventAuditTransactionEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      bookingTestsPassed: true,
      bookingTypecheckPassed: true,
      paymentTestsPassed: true,
      paymentTypecheckPassed: true,
      prismaTransactionServicesImplemented: true,
      tenantScopedRepositoriesImplemented: true,
      bookingStateMutationAtomicityPassed: true,
      paymentStateMutationAtomicityPassed: true,
      bookingStateEventRowsPersisted: true,
      auditLogRowsPersisted: true,
      paymentAuditLogRowsPersisted: true,
      idempotencyPersistenceEnforced: true,
      replayedMutationReturnsOriginalResult: true,
      providerRollbackIntegrationPassed: true,
      invalidTransitionDenialPassed: true,
      crossTenantMutationDenialPassed: true,
      databaseIntegrationEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Commit state mutation, domain event, audit row, payment audit row, and idempotency key in the same tenant-scoped transaction.");
  });

  it("returns travel booking calls to action for open, waitlist, and closed statuses", () => {
    expect(getTravelBookingCta("open")).toBe("Request this city");
    expect(getTravelBookingCta("waitlist")).toBe("Join the waitlist");
    expect(getTravelBookingCta("closed")).toBe("View travel notes");
  });
});
