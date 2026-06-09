import { describe, expect, it } from "vitest";
import {
  buildAftercareSequence,
  buildDeliveryPlan,
  buildEmailWebhookRuntimeReadinessPlan,
  buildEmailProviderSendPlan,
  buildExpoPushProviderRuntimeReadinessPlan,
  buildExpoPushDeliveryPlan,
  buildExpoPushReceiptProcessingPlan,
  buildExpoPushRegistrationPlan,
  buildExpoPushTapRoutingPlan,
  buildNotificationPersistencePlan,
  buildNotificationPersistenceRuntimeReadinessPlan,
  buildNotificationSchedulerPlan,
  buildNotificationSchedulerRuntimeReadinessPlan,
  buildAppointmentNotificationSequence,
  buildPreferenceMutationPlan,
  buildPreferenceCenterRuntimeReadinessPlan,
  buildPreferenceTokenHash,
  buildMessagingPrivacyPlan,
  buildMessagingPrivacyRuntimeReadinessPlan,
  buildMobilePushRuntimeReadinessPlan,
  buildNotificationAutomatedTestReadinessPlan,
  buildNotificationRuntimeReadinessPlan,
  buildProviderEventReconciliationPlan,
  buildProviderWebhookRuntimeReadinessPlan,
  buildSmsWebhookRuntimeReadinessPlan,
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

  it("plans production email webhook reconciliation with raw-body signatures, replay protection, delivery logs, and suppression writes", () => {
    const plan = buildEmailWebhookRuntimeReadinessPlan({
      tenantId: "tenant_001",
      eventId: "evt_email_complained",
      eventType: "email.complained",
      providerMessageId: "email_msg_001",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
      signatureVerifierConfigured: true,
      webhookSecretConfigured: true,
      signatureTimestampWithinTolerance: true,
      tenantResolved: true,
      deliveryLogPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      suppressionPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      payloadRedacted: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      provider: "resend",
      normalizedStatus: "failed",
      idempotencyKey: "notification-provider-event:resend:evt_email_complained",
      shouldUpdateDeliveryLog: true,
      shouldSuppressDestination: true,
      requiredWrites: ["ProviderEvent", "NotificationDelivery", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"],
    });
    expect(plan.requiredControls).toContain("Verify Resend/Svix signatures against the exact raw request body before JSON parsing is trusted.");
  });

  it("blocks production email webhook reconciliation without signature, tenant, persistence, redaction, or replay clearance", () => {
    const plan = buildEmailWebhookRuntimeReadinessPlan({
      tenantId: "",
      eventId: "evt_email_replay",
      eventType: "email.bounced",
      providerMessageId: "",
      rawBodyCaptured: false,
      signatureHeaderPresent: false,
      signatureVerifierConfigured: false,
      webhookSecretConfigured: false,
      signatureTimestampWithinTolerance: false,
      tenantResolved: false,
      deliveryLogPersistenceAvailable: false,
      providerEventPersistenceAvailable: false,
      suppressionPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      payloadRedacted: false,
      alreadyProcessedEventIds: ["evt_email_replay"],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.shouldUpdateDeliveryLog).toBe(false);
    expect(plan.shouldSuppressDestination).toBe(false);
    expect(plan.blockers).toEqual([
      "Tenant scope is required before email webhook reconciliation.",
      "Provider event id was already processed.",
      "Provider message id is required to update an existing delivery log.",
      "Raw email webhook body must be captured before signature verification.",
      "Email provider signature header is required.",
      "Resend/Svix webhook verifier must be configured before trusting webhook payloads.",
      "Email webhook secret must be configured in a secret store.",
      "Email webhook signature timestamp must be inside replay tolerance.",
      "Webhook payload must resolve to a tenant before delivery mutation.",
      "NotificationDelivery persistence must be available before webhook reconciliation.",
      "ProviderEvent persistence must be available for webhook replay protection.",
      "Suppression persistence must be available for bounce, complaint, or unsubscribe events.",
      "Idempotency store must be available before applying email webhook side effects.",
      "Email webhook payload must be redacted before audit logging or previews.",
    ]);
  });

  it("plans production SMS STOP webhook reconciliation with Twilio signatures, consent proof, and suppression writes", () => {
    const plan = buildSmsWebhookRuntimeReadinessPlan({
      tenantId: "tenant_001",
      eventId: "evt_sms_stop",
      eventType: "message.received",
      providerMessageId: "sms_msg_001",
      inboundBody: "STOP",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
      signatureVerifierConfigured: true,
      twilioAuthTokenConfigured: true,
      requestUrlValidated: true,
      tenantResolved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      suppressionPersistenceAvailable: true,
      inboundThreadPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      payloadRedacted: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      provider: "twilio",
      normalizedStatus: "queued",
      idempotencyKey: "notification-provider-event:twilio:evt_sms_stop",
      shouldUpdateDeliveryLog: false,
      shouldSuppressDestination: true,
      shouldCreateInboundThread: false,
      requiredWrites: ["ProviderEvent", "SuppressionListEntry", "ClientNotificationPreference", "NotificationAuditLog", "IdempotencyKey"],
    });
    expect(plan.requiredControls).toContain("Apply STOP and unsubscribe callbacks to suppression state before future SMS sends.");
  });

  it("blocks production SMS webhook reconciliation without signature, consent proof, persistence, redaction, or replay clearance", () => {
    const plan = buildSmsWebhookRuntimeReadinessPlan({
      tenantId: "",
      eventId: "evt_sms_replay",
      eventType: "message.received",
      providerMessageId: "",
      inboundBody: "HELP",
      rawBodyCaptured: false,
      signatureHeaderPresent: false,
      signatureVerifierConfigured: false,
      twilioAuthTokenConfigured: false,
      requestUrlValidated: false,
      tenantResolved: false,
      consentProofAvailable: false,
      quietHoursPolicyConfigured: false,
      deliveryLogPersistenceAvailable: false,
      providerEventPersistenceAvailable: false,
      suppressionPersistenceAvailable: false,
      inboundThreadPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      payloadRedacted: false,
      alreadyProcessedEventIds: ["evt_sms_replay"],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.shouldUpdateDeliveryLog).toBe(false);
    expect(plan.shouldCreateInboundThread).toBe(false);
    expect(plan.blockers).toEqual([
      "Tenant scope is required before SMS webhook reconciliation.",
      "Provider event id was already processed.",
      "Raw SMS webhook body must be captured before signature verification.",
      "Twilio signature header is required.",
      "Twilio webhook verifier must be configured before trusting callback payloads.",
      "Twilio auth token must be configured in a secret store for webhook verification.",
      "Twilio webhook request URL must be validated as part of signature verification.",
      "SMS webhook payload must resolve to a tenant before delivery or suppression mutation.",
      "Stored SMS consent proof must be available before applying inbound SMS state changes.",
      "Quiet-hours policy must be configured before SMS callback processing is promoted.",
      "NotificationDelivery persistence must be available before SMS callback reconciliation.",
      "ProviderEvent persistence must be available for SMS callback replay protection.",
      "Inbound message thread persistence must be available for HELP or client replies.",
      "Idempotency store must be available before applying SMS callback side effects.",
      "SMS webhook payload must be redacted before audit logging or previews.",
    ]);
  });

  it("summarizes provider webhook runtime readiness across signatures, replay storage, exactly-once reconciliation, suppression, inbound routing, push receipts, and alerting", () => {
    const plan = buildProviderWebhookRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      webRouteTestsPassed: true,
      emailSignatureVerificationImplemented: true,
      smsSignatureVerificationImplemented: true,
      pushReceiptTrustedSourceVerified: true,
      rawBodyPreservedForVerification: true,
      webhookSecretsConfigured: true,
      replayProtectionPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      deliveryLogPersistenceAvailable: true,
      exactlyOnceDeliveryUpdatesEnforced: true,
      suppressionPersistenceAvailable: true,
      inboundRoutingPersistenceAvailable: true,
      invalidPushTokenPersistenceAvailable: true,
      tenantResolutionEnforced: true,
      payloadRedactionEnforced: true,
      failedWebhookAlertingConfigured: true,
      providerSandboxWebhookTestsPassed: true,
      routeInvalidSignatureTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Apply exactly-once delivery status updates under replayed and concurrent provider callbacks.");
    expect(plan.requiredCommands).toContain("concurrent provider callback exactly-once delivery-log test");
  });

  it("blocks provider webhook runtime readiness until cryptographic verification, durable replay protection, reconciliation persistence, sandbox tests, and alerting exist", () => {
    const plan = buildProviderWebhookRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      webRouteTestsPassed: false,
      emailSignatureVerificationImplemented: false,
      smsSignatureVerificationImplemented: false,
      pushReceiptTrustedSourceVerified: false,
      rawBodyPreservedForVerification: false,
      webhookSecretsConfigured: false,
      replayProtectionPersistenceAvailable: false,
      providerEventPersistenceAvailable: false,
      deliveryLogPersistenceAvailable: false,
      exactlyOnceDeliveryUpdatesEnforced: false,
      suppressionPersistenceAvailable: false,
      inboundRoutingPersistenceAvailable: false,
      invalidPushTokenPersistenceAvailable: false,
      tenantResolutionEnforced: false,
      payloadRedactionEnforced: false,
      failedWebhookAlertingConfigured: false,
      providerSandboxWebhookTestsPassed: false,
      routeInvalidSignatureTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "provider signature verification and raw-body route evidence",
      "durable replay protection and exactly-once ProviderEvent evidence",
      "delivery, suppression, inbound routing, and invalid-token persistence evidence",
      "provider sandbox, invalid-signature, and failed-webhook alerting evidence",
    ]);
    expect(plan.blockers).toContain("Email provider cryptographic signature verification must be implemented.");
    expect(plan.blockers).toContain("Delivery-log updates must be exactly-once under replay and concurrent callbacks.");
    expect(plan.blockers).toContain("Provider sandbox webhook and receipt tests must pass.");
    expect(plan.blockers).toContain("Failed webhook verification or reconciliation must emit alerting.");
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

  it("summarizes Expo push provider runtime readiness across credentials, persistence, workers, receipts, and device QA", () => {
    const plan = buildExpoPushProviderRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      mobileTypecheckPassed: true,
      expoProjectIdConfigured: true,
      expoAccessTokenConfigured: true,
      nativePushCredentialsConfigured: true,
      permissionRuntimeImplemented: true,
      tokenRegistrationRuntimeImplemented: true,
      pushTokenPersistenceAvailable: true,
      optOutPersistenceAvailable: true,
      deliveryWorkerConfigured: true,
      deliveryLogPersistenceAvailable: true,
      auditLogPersistenceAvailable: true,
      expoSendSmokePassed: true,
      receiptWorkerConfigured: true,
      receiptReplayProtectionAvailable: true,
      invalidTokenSuppressionPersistenceAvailable: true,
      deepLinkHandlerImplemented: true,
      foregroundDeviceQaPassed: true,
      backgroundDeviceQaPassed: true,
      tapNavigationDeviceQaPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      provider: "expo",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Poll Expo receipts, apply replay protection, and suppress DeviceNotRegistered or invalid tokens before future sends.");
    expect(plan.requiredCommands).toContain("Expo push send smoke test against a real device token");
  });

  it("blocks Expo push provider runtime readiness until credentials, token stores, workers, receipts, deep links, and device evidence exist", () => {
    const plan = buildExpoPushProviderRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      mobileTypecheckPassed: false,
      expoProjectIdConfigured: false,
      expoAccessTokenConfigured: false,
      nativePushCredentialsConfigured: false,
      permissionRuntimeImplemented: false,
      tokenRegistrationRuntimeImplemented: false,
      pushTokenPersistenceAvailable: false,
      optOutPersistenceAvailable: false,
      deliveryWorkerConfigured: false,
      deliveryLogPersistenceAvailable: false,
      auditLogPersistenceAvailable: false,
      expoSendSmokePassed: false,
      receiptWorkerConfigured: false,
      receiptReplayProtectionAvailable: false,
      invalidTokenSuppressionPersistenceAvailable: false,
      deepLinkHandlerImplemented: false,
      foregroundDeviceQaPassed: false,
      backgroundDeviceQaPassed: false,
      tapNavigationDeviceQaPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Expo project, secret, APNs, and FCM configuration evidence",
      "tenant/user/device push token and opt-out persistence evidence",
      "Expo delivery worker, receipt polling, and invalid-token suppression evidence",
      "foreground/background/tap-navigation iOS and Android device QA evidence",
    ]);
    expect(plan.blockers).toContain("Expo receipt polling worker must be configured.");
    expect(plan.blockers).toContain("Push tap navigation must pass iOS/Android device QA.");
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

  it("blocks mobile push runtime readiness until Expo config, token storage, receipts, opt-out, and device evidence exist", () => {
    const plan = buildMobilePushRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      mobileTypecheckPassed: false,
      mobileDeviceTestsPassed: false,
      expoProjectConfigured: false,
      expoAccessTokenConfigured: false,
      permissionPromptImplemented: true,
      deviceTokenRegistrationImplemented: false,
      pushTokenStoreConfigured: false,
      pushOptOutUiImplemented: false,
      deliveryLogPersistenceConfigured: false,
      auditLogPersistenceConfigured: false,
      receiptWorkerConfigured: false,
      invalidTokenSuppressionTested: false,
      tapRoutingImplemented: true,
      foregroundDeliveryTested: false,
      backgroundDeliveryTested: false,
      deepLinkRoutingTested: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("Expo push tap deep-link smoke test");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "Expo project and secret configuration evidence",
      "tenant/user/device push-token persistence evidence",
      "foreground/background push and tap-routing device evidence",
    ]));
    expect(plan.blockers).toContain("Mobile push opt-out UI must be implemented and persisted.");
    expect(plan.blockers).toContain("Invalid Expo token receipts must suppress or deactivate tokens.");
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

  it("summarizes notification persistence runtime readiness across repositories, transactions, redaction, RBAC, and Postgres isolation", () => {
    const plan = buildNotificationPersistenceRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      prismaModelsMigrated: true,
      repositoriesImplemented: true,
      tenantScopedQueriesEnforced: true,
      transactionalWritesConfigured: true,
      messageThreadPersistenceAvailable: true,
      messagePersistenceAvailable: true,
      notificationPersistenceAvailable: true,
      deliveryPersistenceAvailable: true,
      deliveryStatusTransitionPersistenceAvailable: true,
      readStatePersistenceAvailable: true,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      destinationHashingEnforced: true,
      bodyPreviewRedactionEnforced: true,
      rbacIntegrationEnforced: true,
      postgresIntegrationTestsPassed: true,
      crossTenantIsolationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Require tenant id in every repository filter and reject unscoped reads or writes.");
    expect(plan.requiredCommands).toContain("cross-tenant notification/message isolation tests");
  });

  it("blocks notification persistence runtime readiness until real repositories, transactions, redaction, audit logs, and Postgres isolation exist", () => {
    const plan = buildNotificationPersistenceRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      prismaModelsMigrated: false,
      repositoriesImplemented: false,
      tenantScopedQueriesEnforced: false,
      transactionalWritesConfigured: false,
      messageThreadPersistenceAvailable: false,
      messagePersistenceAvailable: false,
      notificationPersistenceAvailable: false,
      deliveryPersistenceAvailable: false,
      deliveryStatusTransitionPersistenceAvailable: false,
      readStatePersistenceAvailable: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      destinationHashingEnforced: false,
      bodyPreviewRedactionEnforced: false,
      rbacIntegrationEnforced: false,
      postgresIntegrationTestsPassed: false,
      crossTenantIsolationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "Prisma migration and repository implementation evidence",
      "transactional audit/idempotency write evidence",
      "redacted destination and body-preview persistence evidence",
      "Postgres tenant-isolation and persistence integration test evidence",
    ]);
    expect(plan.blockers).toContain("All notification/message repository queries must enforce tenant scope.");
    expect(plan.blockers).toContain("Notification/message mutations must be committed in database transactions.");
    expect(plan.blockers).toContain("Message and notification body previews must be redacted before persistence.");
    expect(plan.blockers).toContain("Cross-tenant notification/message isolation tests must pass.");
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

  it("summarizes notification scheduler runtime readiness across queue backend, workers, retries, dead letters, audits, and persisted cancellations", () => {
    const plan = buildNotificationSchedulerRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      queueStrategySelected: true,
      queueBackendConfigured: true,
      schedulerProcessConfigured: true,
      workerProcessConfigured: true,
      notificationJobPersistenceAvailable: true,
      appointmentRelativeSchedulingImplemented: true,
      aftercareSequenceSchedulingImplemented: true,
      marketingSequenceSchedulingImplemented: true,
      cancellationOnAppointmentChangeImplemented: true,
      dueJobClaimingTransactional: true,
      providerReadyGateEnforced: true,
      idempotencyStoreAvailable: true,
      retryBackoffExecutorConfigured: true,
      deadLetterPersistenceAvailable: true,
      workerAuditLogPersistenceAvailable: true,
      clockSkewPolicyConfigured: true,
      postgresQueueIntegrationTestsPassed: true,
      retryDeadLetterIntegrationTestsPassed: true,
      cancellationIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Claim due jobs transactionally so concurrent workers cannot dispatch duplicate provider sends.");
    expect(plan.requiredCommands).toContain("idempotent due-job worker concurrency test");
  });

  it("blocks notification scheduler runtime readiness until queue backend, workers, retries, dead letters, audits, and integration evidence exist", () => {
    const plan = buildNotificationSchedulerRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      queueStrategySelected: false,
      queueBackendConfigured: false,
      schedulerProcessConfigured: false,
      workerProcessConfigured: false,
      notificationJobPersistenceAvailable: false,
      appointmentRelativeSchedulingImplemented: false,
      aftercareSequenceSchedulingImplemented: false,
      marketingSequenceSchedulingImplemented: false,
      cancellationOnAppointmentChangeImplemented: false,
      dueJobClaimingTransactional: false,
      providerReadyGateEnforced: false,
      idempotencyStoreAvailable: false,
      retryBackoffExecutorConfigured: false,
      deadLetterPersistenceAvailable: false,
      workerAuditLogPersistenceAvailable: false,
      clockSkewPolicyConfigured: false,
      postgresQueueIntegrationTestsPassed: false,
      retryDeadLetterIntegrationTestsPassed: false,
      cancellationIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "queue backend and NotificationJob persistence evidence",
      "scheduler/worker process and transactional due-job claiming evidence",
      "retry, dead-letter, and worker audit persistence evidence",
      "queue, retry/dead-letter, and appointment cancellation integration test evidence",
    ]);
    expect(plan.blockers).toContain("Due-job claiming must be transactional to prevent duplicate sends.");
    expect(plan.blockers).toContain("Scheduler worker must require a ready provider send plan before dispatch.");
    expect(plan.blockers).toContain("DeadLetterJob persistence must be available.");
    expect(plan.blockers).toContain("Persisted appointment reschedule/cancel integration tests must pass.");
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

  it("summarizes preference center runtime readiness across UI, APIs, signed tokens, suppression, tenant settings, audit, idempotency, and legal copy", () => {
    const plan = buildPreferenceCenterRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      webRouteTestsPassed: true,
      dashboardTestsPassed: true,
      preferenceCenterPageImplemented: true,
      unsubscribePageImplemented: true,
      preferenceApiImplemented: true,
      signedPreferenceTokensIssued: true,
      preferenceTokenHashPersistenceAvailable: true,
      tokenExpiryEnforced: true,
      forgedTokenRejectionTested: true,
      listUnsubscribeHeadersConfigured: true,
      emailUnsubscribePersistenceAvailable: true,
      smsStopPersistenceAvailable: true,
      smsStartPersistenceAvailable: true,
      tenantChannelSettingsUiImplemented: true,
      tenantChannelSettingsPersistenceAvailable: true,
      transactionalVsMarketingControlsEnforced: true,
      suppressionAppliedBeforeSend: true,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      legalApprovedPreferenceCopyAvailable: true,
      routeApiTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Reject expired, forged, reused, or tenant/client-mismatched preference tokens before mutation.");
    expect(plan.requiredCommands).toContain("pre-send suppression integration tests");
  });

  it("blocks preference center runtime readiness until UI, APIs, signed tokens, suppression persistence, tenant settings, legal copy, and route tests exist", () => {
    const plan = buildPreferenceCenterRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      webRouteTestsPassed: false,
      dashboardTestsPassed: false,
      preferenceCenterPageImplemented: false,
      unsubscribePageImplemented: false,
      preferenceApiImplemented: false,
      signedPreferenceTokensIssued: false,
      preferenceTokenHashPersistenceAvailable: false,
      tokenExpiryEnforced: false,
      forgedTokenRejectionTested: false,
      listUnsubscribeHeadersConfigured: false,
      emailUnsubscribePersistenceAvailable: false,
      smsStopPersistenceAvailable: false,
      smsStartPersistenceAvailable: false,
      tenantChannelSettingsUiImplemented: false,
      tenantChannelSettingsPersistenceAvailable: false,
      transactionalVsMarketingControlsEnforced: false,
      suppressionAppliedBeforeSend: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      legalApprovedPreferenceCopyAvailable: false,
      routeApiTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "client preference center, unsubscribe page, preference API, and tenant settings UI evidence",
      "signed preference token issuance, hash persistence, expiry, and forgery rejection evidence",
      "email unsubscribe, SMS STOP/START, and pre-send suppression persistence evidence",
      "audit, idempotency, legal copy, and route/API test evidence",
    ]);
    expect(plan.blockers).toContain("Client preference center page must be implemented.");
    expect(plan.blockers).toContain("Preference token hashes must be persisted instead of raw tokens.");
    expect(plan.blockers).toContain("Email unsubscribe and SMS STOP suppression must be applied immediately before provider sends.");
    expect(plan.blockers).toContain("Preference, unsubscribe, SMS STOP/START, and tenant settings copy must be legal-approved.");
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

  it("summarizes messaging privacy runtime readiness across redaction, role gates, attachments, retention, exports, moderation, audit, and idempotency", () => {
    const plan = buildMessagingPrivacyRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: true,
      dashboardTestsPassed: true,
      messagingApiTestsPassed: true,
      redactionServiceImplemented: true,
      piiDetectionConfigured: true,
      medicalPaymentPrivateUrlDetectionConfigured: true,
      bodyPreviewRedactionEnforced: true,
      roleGatedMessageUiImplemented: true,
      roleGatedApiAuthorizationEnforced: true,
      unauthorizedRoleDenialTestsPassed: true,
      secureAttachmentAuthorizationImplemented: true,
      attachmentPolicyTestsPassed: true,
      exportWorkflowPersistenceAvailable: true,
      deleteWorkflowPersistenceAvailable: true,
      retentionWorkflowPersistenceAvailable: true,
      retentionJobConfigured: true,
      providerPayloadExportOmissionEnforced: true,
      privateUrlExportOmissionEnforced: true,
      moderationRateLimitIntegrationConfigured: true,
      spamModerationTestsPassed: true,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      postgresRetentionIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Enforce role-based field visibility in both dashboard UI and messaging APIs.");
    expect(plan.requiredCommands).toContain("message export/delete/retention Postgres integration tests");
  });

  it("blocks messaging privacy runtime readiness until production redaction, role denial, attachment authorization, retention workflows, moderation, audit, and integration evidence exist", () => {
    const plan = buildMessagingPrivacyRuntimeReadinessPlan({
      packageScripts: ["test"],
      notificationTestsPassed: true,
      notificationTypecheckPassed: false,
      dashboardTestsPassed: false,
      messagingApiTestsPassed: false,
      redactionServiceImplemented: false,
      piiDetectionConfigured: false,
      medicalPaymentPrivateUrlDetectionConfigured: false,
      bodyPreviewRedactionEnforced: false,
      roleGatedMessageUiImplemented: false,
      roleGatedApiAuthorizationEnforced: false,
      unauthorizedRoleDenialTestsPassed: false,
      secureAttachmentAuthorizationImplemented: false,
      attachmentPolicyTestsPassed: false,
      exportWorkflowPersistenceAvailable: false,
      deleteWorkflowPersistenceAvailable: false,
      retentionWorkflowPersistenceAvailable: false,
      retentionJobConfigured: false,
      providerPayloadExportOmissionEnforced: false,
      privateUrlExportOmissionEnforced: false,
      moderationRateLimitIntegrationConfigured: false,
      spamModerationTestsPassed: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      postgresRetentionIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "production redaction service and sensitive-content detection evidence",
      "role-gated messaging UI/API and unauthorized-role denial evidence",
      "secure attachment authorization and policy test evidence",
      "persistence-backed export, delete, retention job, and Postgres integration evidence",
      "moderation/rate-limit, audit, idempotency, and spam test evidence",
    ]);
    expect(plan.blockers).toContain("Production message redaction service must be implemented.");
    expect(plan.blockers).toContain("Messaging APIs must enforce role-based authorization before returning fields.");
    expect(plan.blockers).toContain("Message retention job must be configured.");
    expect(plan.blockers).toContain("Messaging spam moderation and rate-limit integration must be configured.");
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

  it("summarizes Phase 9 notification automated test readiness across package, route, queue, dashboard, mobile, provider, persistence, E2E, and CI evidence", () => {
    const plan = buildNotificationAutomatedTestReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationUnitTestsPassed: true,
      notificationTypecheckPassed: true,
      publicRouteContractTestsPassed: true,
      providerWebhookRouteTestsPassed: true,
      queueIntegrationTestsPassed: true,
      dashboardTemplateSmokeTestsPassed: true,
      dashboardMessageSmokeTestsPassed: true,
      mobileNotificationSmokeTestsPassed: true,
      expoPushDeviceQaPassed: true,
      providerSandboxEmailTestsPassed: true,
      providerSandboxSmsTestsPassed: true,
      providerSandboxPushReceiptTestsPassed: true,
      preferenceOptOutPersistenceTestsPassed: true,
      smsStopPersistenceTestsPassed: true,
      bookingToAftercareE2ePassed: true,
      bookingToDepositNotificationE2ePassed: true,
      travelWaitlistNotificationE2ePassed: true,
      retentionExportDeleteIntegrationTestsPassed: true,
      ciPhase9NotificationJobConfigured: true,
      testArtifactsPublished: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredSuites).toContain("booking-to-deposit, booking-to-aftercare, and travel waitlist notification E2E flows");
    expect(plan.requiredCommands).toContain("Expo iOS/Android push device QA");
  });

  it("blocks Phase 9 notification automated test readiness until queue, dashboard, mobile, provider, persistence, E2E, CI, and artifact evidence exist", () => {
    const plan = buildNotificationAutomatedTestReadinessPlan({
      packageScripts: ["test"],
      notificationUnitTestsPassed: true,
      notificationTypecheckPassed: false,
      publicRouteContractTestsPassed: true,
      providerWebhookRouteTestsPassed: true,
      queueIntegrationTestsPassed: false,
      dashboardTemplateSmokeTestsPassed: false,
      dashboardMessageSmokeTestsPassed: false,
      mobileNotificationSmokeTestsPassed: false,
      expoPushDeviceQaPassed: false,
      providerSandboxEmailTestsPassed: false,
      providerSandboxSmsTestsPassed: false,
      providerSandboxPushReceiptTestsPassed: false,
      preferenceOptOutPersistenceTestsPassed: false,
      smsStopPersistenceTestsPassed: false,
      bookingToAftercareE2ePassed: false,
      bookingToDepositNotificationE2ePassed: false,
      travelWaitlistNotificationE2ePassed: false,
      retentionExportDeleteIntegrationTestsPassed: false,
      ciPhase9NotificationJobConfigured: false,
      testArtifactsPublished: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "queue, opt-out, STOP, and retention/export/delete integration test evidence",
      "dashboard/mobile smoke and Expo device QA evidence",
      "email, SMS, and push provider sandbox evidence",
      "booking, deposit, aftercare, and travel notification E2E evidence",
      "CI Phase 9 notification job and published artifact evidence",
    ]);
    expect(plan.blockers).toContain("Notification queue integration tests must pass.");
    expect(plan.blockers).toContain("Expo push iOS/Android device QA must pass.");
    expect(plan.blockers).toContain("Booking-to-aftercare notification E2E flow must pass.");
    expect(plan.blockers).toContain("Phase 9 notification/messaging test artifacts must be published.");
  });
});
