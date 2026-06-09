import { describe, expect, it } from "vitest";
import {
  buildAftercareSequence,
  buildDeliveryPlan,
  buildEmailProviderSendPlan,
  buildExpoPushDeliveryPlan,
  buildExpoPushReceiptProcessingPlan,
  buildExpoPushRegistrationPlan,
  buildExpoPushTapRoutingPlan,
  buildNotificationPersistencePlan,
  buildNotificationSchedulerPlan,
  buildAppointmentNotificationSequence,
  buildPreferenceMutationPlan,
  buildPreferenceTokenHash,
  buildMessagingPrivacyPlan,
  buildNotificationRuntimeReadinessPlan,
  buildProviderEventReconciliationPlan,
  buildSmsProviderSendPlan,
  interpretSmsWebhook,
  renderTemplateText,
  type ClientConsentSnapshot,
  type NotificationTemplateContext,
} from "../src/index";

const context: NotificationTemplateContext = {
  artistName: "Mara Vale",
  clientName: "Avery",
  city: "Seattle",
  appointmentDate: "June 10",
  depositUrl: "https://example.test/deposit",
  aftercareUrl: "https://example.test/aftercare",
  bookingUrl: "https://example.test/booking",
  unsubscribeUrl: "https://example.test/unsubscribe"
};

const consent: ClientConsentSnapshot = {
  clientId: "client_1",
  email: "avery@example.com",
  phone: "+12065550123",
  inAppUserId: "user_1",
  emailOptIn: true,
  smsOptIn: true,
  pushOptIn: false,
  marketingOptIn: false,
  transactionalAllowed: true
};

describe("notification delivery planning", () => {
  it("renders transactional templates with tattoo-specific context", () => {
    const body = renderTemplateText("deposit_request", context);

    expect(body).toContain("Avery");
    expect(body).toContain("deposit");
  });

  it("allows transactional delivery while keeping provider work credential-gated", () => {
    const plan = buildDeliveryPlan({ key: "deposit_request", context, consent });

    expect(plan.requiresAuditLog).toBe(true);
    expect(plan.requiresProviderCredential).toBe(true);
    expect(plan.chosenChannels).toEqual(expect.arrayContaining(["email"]));
  });

  it("keeps marketing messages blocked without marketing opt-in", () => {
    const plan = buildDeliveryPlan({ key: "city_waitlist_opening", context, consent });

    expect(plan.blockedChannels.length).toBeGreaterThan(0);
    expect(plan.blockedChannels.map((candidate) => candidate.reason).join(" ")).toContain("Marketing opt-in missing");
  });

  it("includes aftercare automation and SMS STOP interpretation", () => {
    expect(buildAftercareSequence().some((step) => step.templateKey === "aftercare_day_2")).toBe(true);
    expect(interpretSmsWebhook("message.received", "STOP").requiresInboundMessageHandling).toBe(true);
  });

  it("plans provider event reconciliation with replay and suppression controls", () => {
    const bouncedEmail = buildProviderEventReconciliationPlan({
      provider: "resend",
      eventId: "evt_email_1",
      eventType: "email.bounced",
      providerMessageId: "email_msg_1",
    });

    expect(bouncedEmail.shouldUpdateDeliveryLog).toBe(true);
    expect(bouncedEmail.shouldSuppressDestination).toBe(true);
    expect(bouncedEmail.idempotencyKey).toBe("notification-provider-event:resend:evt_email_1");
    expect(bouncedEmail.requiredChecks.some((check) => check.includes("replay protection"))).toBe(true);

    const stopSms = buildProviderEventReconciliationPlan({
      provider: "twilio",
      eventId: "evt_sms_stop",
      eventType: "message.received",
      providerMessageId: "sms_msg_1",
      inboundBody: "STOP",
    });

    expect(stopSms.shouldSuppressDestination).toBe(true);
    expect(stopSms.shouldCreateInboundThread).toBe(false);
    expect(stopSms.interpretation.shouldUpdateDeliveryLog).toBe(false);

    const helpSms = buildProviderEventReconciliationPlan({
      provider: "twilio",
      eventId: "evt_sms_help",
      eventType: "message.received",
      providerMessageId: "sms_msg_2",
      inboundBody: "HELP",
    });

    expect(helpSms.shouldCreateInboundThread).toBe(true);
    expect(helpSms.shouldSuppressDestination).toBe(false);

    const invalidPush = buildProviderEventReconciliationPlan({
      provider: "expo",
      eventId: "evt_push_invalid",
      eventType: "DeviceNotRegistered",
      providerMessageId: "push_msg_1",
    });

    expect(invalidPush.shouldMarkPushTokenInactive).toBe(true);
    expect(invalidPush.shouldUpdateDeliveryLog).toBe(true);

    const replay = buildProviderEventReconciliationPlan({
      provider: "resend",
      eventId: "evt_email_1",
      eventType: "email.delivered",
      providerMessageId: "email_msg_1",
      alreadyProcessedEventIds: ["evt_email_1"],
    });

    expect(replay.shouldUpdateDeliveryLog).toBe(false);
    expect(replay.blockers).toContain("Provider event id was already processed.");
  });

  it("plans Expo push token registration with permission, opt-out, and redacted token controls", () => {
    const ready = buildExpoPushRegistrationPlan({
      tenantId: "tenant_001",
      userId: "user_001",
      deviceId: "device_001",
      permissionStatus: "granted",
      expoPushToken: "ExponentPushToken[abcdef123456]",
      pushOptIn: true,
      registeredAt: "2026-06-08T12:00:00.000Z",
    });

    expect(ready).toMatchObject({
      status: "ready",
      shouldPersistToken: true,
      shouldPersistOptOut: false,
      requiredWrites: ["PushToken", "NotificationPreference", "AuditLog"],
    });
    expect(ready.tokenMasked).toBe("push_Expone***");
    expect(ready.requiredControls).toContain("Respect push opt-out before delivery.");

    const denied = buildExpoPushRegistrationPlan({
      tenantId: "tenant_001",
      userId: "user_001",
      deviceId: "device_001",
      permissionStatus: "denied",
      pushOptIn: false,
      registeredAt: "2026-06-08T12:00:00.000Z",
    });

    expect(denied).toMatchObject({
      status: "blocked",
      shouldPersistToken: false,
      shouldPersistOptOut: true,
    });
    expect(denied.blockers).toEqual([
      "Expo push permission must be granted before token registration.",
      "Push opt-in is required before token registration.",
    ]);
  });

  it("plans Expo push delivery with opt-out blocking, delivery logs, and tap routing metadata", () => {
    const ready = buildExpoPushDeliveryPlan({
      tenantId: "tenant_001",
      notificationId: "notification_001",
      templateKey: "booking_request_accepted",
      context,
      consent: {
        ...consent,
        pushOptIn: true,
        pushToken: "ExponentPushToken[abcdef123456]",
      },
      requestId: "req_push_001",
      deepLinkPath: "/bookings/booking_001",
    });

    expect(ready).toMatchObject({
      status: "ready",
      provider: "expo",
      channel: "push",
      idempotencyKey: "expo-push:tenant_001:notification_001:req_push_001",
      requiredWrites: ["NotificationDelivery", "ProviderEvent", "AuditLog"],
      payloadPreview: {
        deepLinkPath: "/bookings/booking_001",
      },
    });
    expect(ready.toMasked).toBe("push_Expone***");
    expect(ready.requiredControls).toContain("Process Expo receipts for delivery state and invalid-token suppression.");

    const blocked = buildExpoPushDeliveryPlan({
      tenantId: "tenant_001",
      notificationId: "notification_002",
      templateKey: "city_waitlist_opening",
      context,
      consent: {
        ...consent,
        pushToken: "ExponentPushToken[abcdef123456]",
      },
      requestId: "req_push_002",
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers.join(" ")).toContain("Marketing opt-in missing");
  });

  it("plans Resend email provider send with verified sender, unsubscribe, idempotency, and redacted payload", () => {
    const plan = buildEmailProviderSendPlan({
      tenantId: "tenant_001",
      notificationId: "notification_001",
      deliveryId: "delivery_001",
      templateKey: "deposit_request",
      context,
      consent,
      requestId: "req_email_001",
      providerSdkInstalled: true,
      providerApiKeyConfigured: true,
      senderDomainVerified: true,
      unsubscribeFooterPresent: true,
      deliveryLogPersistenceAvailable: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      provider: "resend",
      channel: "email",
      idempotencyKey: "email-send:tenant_001:delivery_001:req_email_001",
      requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "AuditLog", "IdempotencyKey"],
    });
    expect(plan.toMasked).toBe("av***@example.com");
    expect(plan.payloadPreview.subject).toContain("Deposit requested");
    expect(plan.payloadPreview.unsubscribeFooterPresent).toBe(true);
    expect(plan.requiredControls).toContain("Check bounce, complaint, unsubscribe, and tenant suppression lists immediately before send.");
    expect(plan.blockers).toEqual([]);
  });

  it("blocks email provider send without provider readiness, verified sender, footer, persistence, or suppression clearance", () => {
    const plan = buildEmailProviderSendPlan({
      tenantId: "",
      notificationId: "",
      deliveryId: "",
      templateKey: "deposit_request",
      context,
      consent,
      requestId: "",
      providerSdkInstalled: false,
      providerApiKeyConfigured: false,
      senderDomainVerified: false,
      unsubscribeFooterPresent: false,
      destinationSuppressed: true,
      deliveryLogPersistenceAvailable: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Tenant scope is required before email delivery.",
      "Notification id is required before email delivery.",
      "Notification delivery id is required before email delivery.",
      "Request id is required for email delivery traceability.",
      "Email provider SDK must be installed before sending.",
      "Email provider API key must be configured in a secret store before sending.",
      "Email sender domain must be verified before sending.",
      "Email messages must include an unsubscribe or preference footer before sending.",
      "Email destination is suppressed and must not be sent.",
      "NotificationDelivery persistence must be available before provider send.",
    ]);
  });

  it("blocks email provider send when consent or destination rules reject the email candidate", () => {
    const plan = buildEmailProviderSendPlan({
      tenantId: "tenant_001",
      notificationId: "notification_002",
      deliveryId: "delivery_002",
      templateKey: "city_waitlist_opening",
      context,
      consent: {
        ...consent,
        email: undefined,
        emailOptIn: false,
        marketingOptIn: false,
      },
      requestId: "req_email_002",
      providerSdkInstalled: true,
      providerApiKeyConfigured: true,
      senderDomainVerified: true,
      unsubscribeFooterPresent: true,
      deliveryLogPersistenceAvailable: true,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.toMasked).toBeNull();
    expect(plan.blockers.join(" ")).toContain("Destination missing for this channel.");
  });

  it("plans Twilio SMS provider send with consent proof, quiet-hours controls, and redacted phone data", () => {
    const plan = buildSmsProviderSendPlan({
      tenantId: "tenant_001",
      notificationId: "notification_sms_001",
      deliveryId: "delivery_sms_001",
      templateKey: "appointment_confirmed",
      context,
      consent,
      requestId: "req_sms_001",
      providerSdkInstalled: true,
      accountSidConfigured: true,
      authTokenConfigured: true,
      messagingServiceConfigured: true,
      legalConsentCopyApproved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      provider: "twilio",
      channel: "sms",
      idempotencyKey: "sms-send:tenant_001:delivery_sms_001:req_sms_001",
      requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "ConsentSnapshot", "AuditLog", "IdempotencyKey"],
    });
    expect(plan.toMasked).toBe("***-***-0123");
    expect(plan.payloadPreview.bodyPreview).toContain("Confirmed");
    expect(plan.requiredControls).toContain("Apply tenant quiet-hours policy before Twilio API calls.");
    expect(plan.blockers).toEqual([]);
  });

  it("blocks Twilio SMS provider send without provider readiness, legal consent, quiet hours, persistence, or STOP clearance", () => {
    const plan = buildSmsProviderSendPlan({
      tenantId: "",
      notificationId: "",
      deliveryId: "",
      templateKey: "appointment_confirmed",
      context,
      consent: {
        ...consent,
        smsStoppedAt: "2026-06-08T12:00:00.000Z",
      },
      requestId: "",
      providerSdkInstalled: false,
      accountSidConfigured: false,
      authTokenConfigured: false,
      messagingServiceConfigured: false,
      legalConsentCopyApproved: false,
      consentProofAvailable: false,
      quietHoursPolicyConfigured: false,
      withinQuietHours: true,
      destinationSuppressed: true,
      deliveryLogPersistenceAvailable: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Tenant scope is required before SMS delivery.",
      "Notification id is required before SMS delivery.",
      "Notification delivery id is required before SMS delivery.",
      "Request id is required for SMS delivery traceability.",
      "SMS provider SDK must be installed before sending.",
      "Twilio account SID must be configured in a secret store before sending.",
      "Twilio auth token must be configured in a secret store before sending.",
      "Twilio messaging service SID must be configured before sending.",
      "SMS consent and compliance copy must be legal-approved before sending.",
      "SMS delivery requires stored consent proof for this destination.",
      "SMS quiet-hours policy must be configured before sending.",
      "SMS delivery is inside quiet hours and must be delayed.",
      "SMS destination is suppressed by STOP/unsubscribe state and must not be sent.",
      "NotificationDelivery persistence must be available before SMS provider send.",
      "Client has sent STOP or disabled SMS.",
    ]);
  });

  it("blocks Twilio SMS provider send when marketing consent or destination rules reject the SMS candidate", () => {
    const plan = buildSmsProviderSendPlan({
      tenantId: "tenant_001",
      notificationId: "notification_sms_002",
      deliveryId: "delivery_sms_002",
      templateKey: "city_waitlist_opening",
      context,
      consent: {
        ...consent,
        phone: undefined,
        smsOptIn: false,
        marketingOptIn: false,
      },
      requestId: "req_sms_002",
      providerSdkInstalled: true,
      accountSidConfigured: true,
      authTokenConfigured: true,
      messagingServiceConfigured: true,
      legalConsentCopyApproved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.toMasked).toBeNull();
    expect(plan.blockers.join(" ")).toContain("Destination missing for this channel.");
  });

  it("plans Expo push receipt processing with delivery-log updates and invalid-token suppression", () => {
    const delivered = buildExpoPushReceiptProcessingPlan({
      tenantId: "tenant_001",
      deliveryId: "delivery_push_001",
      receiptId: "receipt_001",
      receiptStatus: "ok",
      requestId: "req_receipt_001",
    });
    const invalidToken = buildExpoPushReceiptProcessingPlan({
      tenantId: "tenant_001",
      deliveryId: "delivery_push_002",
      receiptId: "receipt_002",
      receiptStatus: "error",
      errorCode: "DeviceNotRegistered",
      errorMessage: "The recipient device is not registered.",
      requestId: "req_receipt_002",
    });

    expect(delivered).toMatchObject({
      status: "ready",
      provider: "expo",
      normalizedStatus: "delivered",
      shouldUpdateDeliveryLog: true,
      shouldMarkPushTokenInactive: false,
      idempotencyKey: "expo-receipt:tenant_001:receipt_001:req_receipt_001",
    });
    expect(delivered.requiredWrites).toEqual(["NotificationDelivery", "ProviderEvent", "PushToken", "AuditLog", "IdempotencyKey"]);
    expect(invalidToken).toMatchObject({
      status: "ready",
      normalizedStatus: "failed",
      shouldUpdateDeliveryLog: true,
      shouldMarkPushTokenInactive: true,
    });
    expect(invalidToken.requiredControls).toContain("Mark push tokens inactive when Expo reports DeviceNotRegistered or invalid token errors.");
  });

  it("blocks replayed or incomplete Expo push receipt processing", () => {
    const plan = buildExpoPushReceiptProcessingPlan({
      tenantId: "",
      deliveryId: "",
      receiptId: "receipt_001",
      receiptStatus: "ok",
      requestId: "",
      alreadyProcessedReceiptIds: ["receipt_001"],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.shouldUpdateDeliveryLog).toBe(false);
    expect(plan.blockers).toEqual([
      "Tenant scope is required before processing Expo push receipts.",
      "Notification delivery id is required before processing Expo push receipts.",
      "Request id is required for Expo receipt traceability.",
      "Expo receipt id was already processed.",
    ]);
  });

  it("plans Expo push tap routing only for safe internal deep links", () => {
    const ready = buildExpoPushTapRoutingPlan({
      tenantId: "tenant_001",
      notificationId: "notification_push_001",
      userId: "user_001",
      deepLinkPath: "/bookings/booking_001",
      pushOptIn: true,
      requestId: "req_tap_001",
    });
    const unsafe = buildExpoPushTapRoutingPlan({
      tenantId: "tenant_001",
      notificationId: "notification_push_002",
      userId: "user_001",
      deepLinkPath: "https://storage.example/private.jpg?token=secret",
      pushOptIn: false,
      requestId: "req_tap_002",
    });

    expect(ready).toMatchObject({
      status: "ready",
      routePath: "/bookings/booking_001",
      idempotencyKey: "expo-push-tap:tenant_001:notification_push_001:req_tap_001",
      requiredWrites: ["NotificationInteraction", "AuditLog", "IdempotencyKey"],
    });
    expect(ready.requiredControls).toContain("Allow only internal relative deep links.");
    expect(unsafe.status).toBe("blocked");
    expect(unsafe.blockers).toEqual([
      "Push opt-in is required before honoring push tap routing.",
      "Push deep-link path must be an internal relative route.",
      "Push deep-link path must not contain private URLs, tokens, signatures, or secrets.",
    ]);
  });

  it("plans tenant-scoped message thread and message persistence with redaction and audit writes", () => {
    const thread = buildNotificationPersistencePlan({
      tenantId: "tenant_001",
      action: "create_thread",
      actorId: "artist_001",
      threadId: "thread_001",
      clientId: "client_001",
      idempotencyKey: "message-thread:tenant_001:thread_001",
    });
    const message = buildNotificationPersistencePlan({
      tenantId: "tenant_001",
      action: "append_message",
      actorId: "artist_001",
      threadId: "thread_001",
      messageId: "message_001",
      clientId: "client_001",
      bodyPreview: "Client asked about placement; payment URL redacted.",
      bodyRedacted: true,
      idempotencyKey: "message-append:tenant_001:message_001",
    });

    expect(thread).toMatchObject({
      status: "ready",
      requiresTransaction: true,
      idempotencyKey: "message-thread:tenant_001:thread_001",
    });
    expect(thread.writes.map((write) => write.model)).toEqual(["MessageThread", "NotificationAuditLog", "IdempotencyKey"]);
    expect(message.writes.map((write) => write.model)).toEqual(["Message", "MessageThread", "NotificationAuditLog", "IdempotencyKey"]);
    expect(message.writes.find((write) => write.model === "NotificationAuditLog")?.payload).toMatchObject({
      action: "append_message",
      threadId: "thread_001",
      messageId: "message_001",
    });
  });

  it("plans notification delivery persistence, status transitions, and read-state writes", () => {
    const delivery = buildNotificationPersistencePlan({
      tenantId: "tenant_001",
      action: "record_delivery",
      actorId: "system",
      notificationId: "notification_001",
      deliveryId: "delivery_001",
      clientId: "client_001",
      templateKey: "deposit_request",
      channel: "email",
      provider: "resend",
      status: "queued",
      destination: "avery@example.com",
      destinationRedacted: true,
      idempotencyKey: "delivery-record:tenant_001:delivery_001",
    });
    const statusUpdate = buildNotificationPersistencePlan({
      tenantId: "tenant_001",
      action: "update_delivery_status",
      actorId: "system",
      notificationId: "notification_001",
      deliveryId: "delivery_001",
      channel: "email",
      provider: "resend",
      status: "delivered",
      idempotencyKey: "delivery-status:tenant_001:delivery_001:delivered",
    });
    const readState = buildNotificationPersistencePlan({
      tenantId: "tenant_001",
      action: "mark_thread_read",
      actorId: "client_001",
      threadId: "thread_001",
      clientId: "client_001",
      status: "read",
      idempotencyKey: "thread-read:tenant_001:client_001:thread_001",
    });

    expect(delivery.writes.map((write) => write.model)).toEqual(["NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"]);
    expect(delivery.writes.find((write) => write.model === "NotificationDelivery")?.payload.destinationHash).toMatch(/^masked_/);
    expect(statusUpdate.writes.map((write) => write.model)).toEqual(["NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"]);
    expect(readState.writes.map((write) => write.model)).toEqual(["NotificationReadState", "MessageThread", "NotificationAuditLog", "IdempotencyKey"]);
    expect(readState.requiredControls).toContain("Update read/unread state per tenant user without exposing restricted message fields.");
  });

  it("blocks notification persistence without tenant scope, audit actor, idempotency, ids, or redaction", () => {
    const plan = buildNotificationPersistencePlan({
      tenantId: " ",
      action: "record_delivery",
      destination: "avery@example.com",
      bodyPreview: "Full unredacted client medical note and private file URL.",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Missing tenant scope.",
      "Notification persistence requires an actor id for audit attribution.",
      "Missing idempotency key for notification persistence mutation.",
      "Notification id is required for notification delivery persistence.",
      "Notification delivery id is required for delivery persistence.",
      "Notification delivery channel is required.",
      "Notification delivery provider is required.",
      "Notification delivery status is required.",
      "Notification destinations must be redacted or hashed before persistence.",
      "Message body previews must be redacted before persistence.",
    ]);
  });

  it("plans notification sequence scheduling with appointment-relative offsets and worker audit writes", () => {
    const steps = buildAppointmentNotificationSequence().filter((step) => step.status === "ready_to_queue");
    const plan = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "schedule_sequence",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "database_polling",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler:tenant_001:appointment_001",
      appointmentId: "appointment_001",
      appointmentStartsAt: "2026-06-10T18:00:00.000Z",
      sequenceSteps: steps,
    });

    expect(plan.status).toBe("ready");
    expect(plan.scheduledJobs.map((job) => job.templateKey)).toEqual(["appointment_prep_72h", "appointment_prep_24h", "reschedule_notice"]);
    expect(plan.scheduledJobs[0]).toMatchObject({
      scheduledAt: "2026-06-07T18:00:00.000Z",
      scheduledOffsetMinutes: -4320,
    });
    expect(plan.writes.map((write) => write.model)).toEqual(["NotificationJob", "NotificationWorkerAuditLog", "IdempotencyKey"]);
    expect(plan.requiredControls).toContain("Cancel future jobs when appointments are rescheduled, cancelled, or completed early.");
  });

  it("plans scheduler cancellation, retry backoff, and dead-letter audit writes", () => {
    const cancellation = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "cancel_scheduled_jobs",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "managed_queue",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler-cancel:tenant_001:appointment_001",
      actorId: "artist_001",
      appointmentId: "appointment_001",
      cancellationReason: "Appointment was rescheduled.",
    });
    const retry = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "retry_failed_job",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "managed_queue",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler-retry:tenant_001:job_001:2",
      jobId: "job_001",
      attempt: 2,
      maxAttempts: 5,
    });
    const deadLetter = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "dead_letter_job",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "managed_queue",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler-dead-letter:tenant_001:job_001",
      actorId: "system",
      jobId: "job_001",
      cancellationReason: "Provider failed after max attempts.",
    });

    expect(cancellation.writes.map((write) => write.model)).toEqual(["NotificationJob", "NotificationWorkerAuditLog", "IdempotencyKey"]);
    expect(retry.status).toBe("ready");
    expect(retry.retryDelaySeconds).toBe(120);
    expect(deadLetter.writes.map((write) => write.model)).toEqual(["NotificationJob", "DeadLetterJob", "NotificationWorkerAuditLog", "IdempotencyKey"]);
  });

  it("blocks scheduler work without queue strategy, worker, idempotency, audit logs, provider readiness, or dead-letter path", () => {
    const scheduleBlocked = buildNotificationSchedulerPlan({
      tenantId: "",
      action: "schedule_sequence",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "none",
      workerEnabled: false,
      idempotencyStoreAvailable: false,
      auditLogPersistenceAvailable: false,
      sequenceSteps: buildAppointmentNotificationSequence(),
    });
    const processBlocked = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "process_due_job",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "managed_queue",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler-process:tenant_001",
      providerReady: false,
    });
    const retryBlocked = buildNotificationSchedulerPlan({
      tenantId: "tenant_001",
      action: "retry_failed_job",
      now: "2026-06-08T10:00:00.000Z",
      queueStrategy: "managed_queue",
      workerEnabled: true,
      idempotencyStoreAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyKey: "scheduler-retry:tenant_001:job_001:5",
      jobId: "job_001",
      attempt: 5,
      maxAttempts: 5,
    });

    expect(scheduleBlocked.status).toBe("blocked");
    expect(scheduleBlocked.blockers).toContain("Notification queue strategy must be selected before scheduling jobs.");
    expect(scheduleBlocked.blockers).toContain("Blocked automation sequence steps cannot be scheduled.");
    expect(scheduleBlocked.blockers).toContain("Negative scheduled offsets require an appointment start timestamp.");
    expect(processBlocked.blockers).toEqual([
      "Scheduler job id is required for worker processing.",
      "Provider send plan must be ready before processing due notification jobs.",
    ]);
    expect(retryBlocked.blockers).toEqual(["Retry attempt has reached max attempts and must be dead-lettered."]);
  });

  it("plans preference token issuance and email unsubscribe suppression writes", () => {
    const token = "pref_token_001";
    const issued = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "issue_preference_token",
      clientId: "client_001",
      token,
      tokenExpiresAt: "2026-07-08T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
      idempotencyKey: "preference-token:tenant_001:client_001",
    });
    const unsubscribe = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "unsubscribe_email",
      clientId: "client_001",
      email: "avery@example.com",
      tokenHash: buildPreferenceTokenHash(token),
      tokenExpiresAt: "2026-07-08T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
      emailOptIn: false,
      marketingOptIn: false,
      transactionalAllowed: true,
      idempotencyKey: "unsubscribe-email:tenant_001:client_001",
    });

    expect(issued.status).toBe("ready");
    expect(issued.tokenHash).toBe(buildPreferenceTokenHash(token));
    expect(issued.writes.map((write) => write.model)).toEqual(["PreferenceToken", "NotificationAuditLog", "IdempotencyKey"]);
    expect(unsubscribe.status).toBe("ready");
    expect(unsubscribe.writes.map((write) => write.model)).toEqual(["ClientNotificationPreference", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"]);
    expect(unsubscribe.writes.find((write) => write.model === "SuppressionListEntry")?.payload).toMatchObject({
      emailOptIn: false,
      marketingOptIn: false,
      transactionalAllowed: true,
    });
  });

  it("plans SMS STOP and START preference mutations with legal consent gates", () => {
    const stop = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "record_sms_stop",
      clientId: "client_001",
      phone: "+12065550123",
      tokenHash: "provider-inbound-stop",
      tokenExpiresAt: "2026-07-08T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
      smsOptIn: false,
      marketingOptIn: false,
      idempotencyKey: "sms-stop:tenant_001:client_001",
    });
    const start = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "record_sms_start",
      clientId: "client_001",
      phone: "+12065550123",
      tokenHash: "provider-inbound-start",
      tokenExpiresAt: "2026-07-08T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
      smsOptIn: true,
      transactionalAllowed: true,
      legalCopyApproved: true,
      idempotencyKey: "sms-start:tenant_001:client_001",
    });

    expect(stop.status).toBe("ready");
    expect(stop.writes.map((write) => write.model)).toEqual(["ClientNotificationPreference", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"]);
    expect(start.status).toBe("ready");
    expect(start.writes.map((write) => write.model)).toEqual(["ClientNotificationPreference", "NotificationAuditLog", "IdempotencyKey"]);
  });

  it("plans tenant channel settings with legal-approved preference copy", () => {
    const plan = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "update_tenant_channel_settings",
      actorId: "admin_001",
      now: "2026-06-08T10:00:00.000Z",
      idempotencyKey: "tenant-channel-settings:tenant_001",
      tenantChannelSettingsConfigured: true,
      legalCopyApproved: true,
      emailOptIn: true,
      smsOptIn: true,
      pushOptIn: true,
      marketingOptIn: false,
      transactionalAllowed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.writes.map((write) => write.model)).toEqual(["TenantNotificationSetting", "NotificationAuditLog", "IdempotencyKey"]);
    expect(plan.requiredControls).toContain("Require legal-approved consent copy before SMS START or tenant preference setting changes.");
  });

  it("blocks preference mutations with missing client scope, forged or expired tokens, and missing legal approval", () => {
    const expired = buildPreferenceMutationPlan({
      tenantId: "",
      action: "unsubscribe_email",
      email: "avery@example.com",
      tokenHash: "",
      tokenExpiresAt: "2026-06-01T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
    });
    const start = buildPreferenceMutationPlan({
      tenantId: "tenant_001",
      action: "record_sms_start",
      clientId: "client_001",
      phone: "+12065550123",
      tokenHash: "provider-inbound-start",
      tokenExpiresAt: "2026-07-08T10:00:00.000Z",
      now: "2026-06-08T10:00:00.000Z",
      idempotencyKey: "sms-start:tenant_001:client_001",
      legalCopyApproved: false,
    });

    expect(expired.status).toBe("blocked");
    expect(expired.blockers).toEqual([
      "Missing tenant scope.",
      "Missing idempotency key for preference mutation.",
      "Client id is required for client preference mutations.",
      "Preference mutation requires a stored preference token hash.",
      "Preference token is expired or missing expiration.",
    ]);
    expect(start.status).toBe("blocked");
    expect(start.blockers).toEqual(["SMS START requires legal-approved consent copy before re-enabling SMS."]);
  });

  it("plans role-based message visibility and redacted export controls", () => {
    const artistView = buildMessagingPrivacyPlan({
      tenantId: "tenant_001",
      action: "authorize_message_view",
      role: "artist",
      actorId: "artist_001",
      messageId: "message_001",
      body: "Redacted message preview.",
      bodyRedacted: true,
      idempotencyKey: "message-view:tenant_001:message_001:artist_001",
    });
    const exportPlan = buildMessagingPrivacyPlan({
      tenantId: "tenant_001",
      action: "export_thread",
      role: "admin",
      actorId: "admin_001",
      threadId: "thread_001",
      body: "Redacted export body.",
      bodyRedacted: true,
      attachmentPolicyApproved: true,
      exportIncludesProviderPayloads: false,
      exportIncludesPrivateUrls: false,
      idempotencyKey: "message-export:tenant_001:thread_001",
    });

    expect(artistView.status).toBe("ready");
    expect(artistView.visibleFields).toEqual(["subject", "bodyPreview", "clientContactMasked", "attachments"]);
    expect(exportPlan.status).toBe("ready");
    expect(exportPlan.visibleFields).toContain("auditTrail");
    expect(exportPlan.requiredControls).toContain("Omit provider payloads, raw destinations, private URLs, and secrets from message exports.");
  });

  it("blocks message persistence or export when sensitive content and private URLs are not redacted", () => {
    const plan = buildMessagingPrivacyPlan({
      tenantId: "tenant_001",
      action: "export_thread",
      role: "admin",
      actorId: "admin_001",
      threadId: "thread_001",
      body: "Email avery@example.com, phone +1 206 555 0123, card cvv, allergy note, https://storage.example/private.jpg?token=secret",
      bodyRedacted: false,
      attachmentUrl: "https://storage.example/private-upload.jpg?signature=abc",
      attachmentPolicyApproved: false,
      exportIncludesProviderPayloads: true,
      exportIncludesPrivateUrls: true,
      idempotencyKey: "message-export:tenant_001:thread_001",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.redactionFindings).toEqual(["email", "phone", "sensitive_terms", "private_url", "private_attachment_url"]);
    expect(plan.blockers).toEqual([
      "Message body contains sensitive data and must be redacted before persistence or export.",
      "Message attachments require approved private attachment policy before access or export.",
      "Message export must omit raw provider payloads.",
      "Message export must omit private file URLs and signed upload URLs.",
    ]);
  });

  it("blocks retention/delete workflows without retention proof and moderation when spam is not rate-limited", () => {
    const deletion = buildMessagingPrivacyPlan({
      tenantId: "tenant_001",
      action: "delete_thread",
      role: "admin",
      actorId: "admin_001",
      threadId: "thread_001",
      idempotencyKey: "message-delete:tenant_001:thread_001",
    });
    const moderation = buildMessagingPrivacyPlan({
      tenantId: "tenant_001",
      action: "moderate_message",
      role: "studio_manager",
      actorId: "manager_001",
      messageId: "message_001",
      spamScore: 95,
      rateLimitAllowed: true,
      idempotencyKey: "message-moderate:tenant_001:message_001",
    });

    expect(deletion.status).toBe("blocked");
    expect(deletion.blockers).toEqual([
      "Retention/delete workflow requires a positive retention period.",
      "Delete workflow requires a deletion request timestamp.",
    ]);
    expect(moderation.status).toBe("blocked");
    expect(moderation.blockers).toEqual(["High spam score must trigger moderation or rate-limit blocking."]);
  });

  it("blocks message privacy actions without tenant, actor, idempotency, or required ids", () => {
    const plan = buildMessagingPrivacyPlan({
      tenantId: "",
      action: "redact_message",
      role: "assistant",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.visibleFields).toEqual(["subject", "bodyPreview", "clientContactMasked"]);
    expect(plan.blockers).toEqual([
      "Missing tenant scope.",
      "Messaging privacy action requires an actor id.",
      "Missing idempotency key for messaging privacy action.",
      "Message id is required for this privacy action.",
    ]);
  });

  it("summarizes notification runtime readiness across providers, persistence, consent, queues, and webhooks", () => {
    const plan = buildNotificationRuntimeReadinessPlan({
      packageScripts: ["test"],
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      providerCredentialsConfigured: false,
      providerSandboxSmokeVerified: false,
      queueWorkerConfigured: false,
      deliveryLogPersistenceConfigured: false,
      messageThreadPersistenceConfigured: false,
      consentStoreConfigured: false,
      unsubscribeStopConfigured: false,
      webhookSignatureVerificationConfigured: false,
      webhookReplayProtectionConfigured: false,
      pushTokenStoreConfigured: false,
      expoPushConfigured: false,
      retryBackoffConfigured: false,
      deadLetterQueueConfigured: false,
      tenantIsolationVerified: false,
      templateLegalReviewApproved: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/notifications typecheck");
    expect(plan.requiredControls).toContain("Verify Resend, Twilio, and Expo webhook signatures before reconciliation.");
    expect(plan.blockers).toContain("Notification queue worker must be configured before provider-backed automation.");
    expect(plan.blockers).toContain("Email unsubscribe, SMS STOP/HELP, and suppression controls must be configured.");
    expect(plan.blockers).toContain("Push token registration and revocation store must be configured.");
  });
});
