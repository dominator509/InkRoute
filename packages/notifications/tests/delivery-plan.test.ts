import { describe, expect, it } from "vitest";
import {
  buildAftercareSequence,
  buildDeliveryPlan,
  buildProviderEventReconciliationPlan,
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
});
