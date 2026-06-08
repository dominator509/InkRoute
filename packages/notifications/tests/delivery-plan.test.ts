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
});
