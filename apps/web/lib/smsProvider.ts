import {
  buildProviderEventReconciliationPlan,
  buildSmsProviderSendPlan,
  buildSmsWebhookRuntimeReadinessPlan,
  type ClientConsentSnapshot,
  type NotificationTemplateContext,
  type ProviderEventReconciliationPlan,
  type SmsProviderSendPlan,
  type SmsProviderSendPlanInput,
  type SmsWebhookRuntimeReadinessPlan,
} from "@inkroute/notifications";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type SmsProviderMutationInput = SmsProviderSendPlanInput & {
  providerRequestId: string;
};

export interface SmsProviderSendResult {
  providerMessageId: string;
  providerMessageIdHash?: string;
  rawProviderMessageIdEchoed?: false;
  redactedPayload: Record<string, unknown>;
}

export interface SmsProviderRepository {
  assertTenantSmsDeliveryAllowed(input: {
    tenantId: string;
    notificationId: string;
    deliveryId: string;
  }): Promise<void>;
  hasStoredConsentProof(input: {
    tenantId: string;
    destinationHash: string;
  }): Promise<boolean>;
  isDestinationSuppressed(input: {
    tenantId: string;
    destinationHash: string;
  }): Promise<boolean>;
  claimIdempotencyKey(input: {
    tenantId: string;
    key: string;
    requestId: string;
  }): Promise<"claimed" | "duplicate">;
  persistQueuedDelivery(input: {
    tenantId: string;
    plan: SmsProviderSendPlan;
  }): Promise<void>;
  persistProviderSendResult(input: {
    tenantId: string;
    deliveryId: string;
    result: SmsProviderSendResult;
  }): Promise<void>;
  persistWebhookReconciliation(input: {
    tenantId: string;
    readiness: SmsWebhookRuntimeReadinessPlan;
    reconciliation: ProviderEventReconciliationPlan;
    redactedPayload: Record<string, unknown>;
  }): Promise<void>;
  persistInboundThread(input: {
    tenantId: string;
    readiness: SmsWebhookRuntimeReadinessPlan;
    redactedPayload: Record<string, unknown>;
  }): Promise<void>;
}

export interface InMemorySmsProviderRepositoryState {
  readonly allowedDeliveryKeys: Set<string>;
  readonly consentProofDestinationHashes: Set<string>;
  readonly suppressedDestinationHashes: Set<string>;
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly requestId: string }>;
  readonly queuedDeliveries: { readonly tenantId: string; readonly plan: SmsProviderSendPlan }[];
  readonly providerSendResults: {
    readonly tenantId: string;
    readonly deliveryId: string;
    readonly result: SmsProviderSendResult;
  }[];
  readonly webhookReconciliations: {
    readonly tenantId: string;
    readonly readiness: SmsWebhookRuntimeReadinessPlan;
    readonly reconciliation: ProviderEventReconciliationPlan;
    readonly redactedPayload: Record<string, unknown>;
  }[];
  readonly inboundThreads: {
    readonly tenantId: string;
    readonly readiness: SmsWebhookRuntimeReadinessPlan;
    readonly redactedPayload: Record<string, unknown>;
  }[];
}

export interface SmsProviderContract {
  sendPlan: SmsProviderSendPlan;
  stopWebhookReadiness: SmsWebhookRuntimeReadinessPlan;
  helpWebhookReadiness: SmsWebhookRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof SmsProviderRepository)[];
}

export interface SmsWebhookSignatureVerificationInput {
  readonly requestUrl: string;
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly authToken?: string;
  readonly contentType?: string;
}

export interface SmsWebhookSignatureVerification {
  readonly verifierConfigured: boolean;
  readonly twilioAuthTokenConfigured: boolean;
  readonly requestUrlValidated: boolean;
  readonly verified: boolean;
  readonly reason: "verified" | "missing-auth-token" | "missing-signature" | "signature-mismatch";
}

export const sampleSmsContext: NotificationTemplateContext = {
  artistName: "Mara Vale",
  clientName: "Riley",
  tenantName: "InkRoute Demo Studio",
  city: "Seattle",
  appointmentDate: "2026-07-10",
  appointmentStartsAt: "2026-07-10T15:00:00-07:00",
  bookingUrl: "https://example.test/bookings/demo",
  supportEmail: "support@example.test",
  policyUrl: "https://example.test/policies/sms",
};

export const sampleSmsConsent: ClientConsentSnapshot = {
  clientId: "client_demo",
  phone: "+12065550142",
  emailOptIn: false,
  smsOptIn: true,
  pushOptIn: false,
  marketingOptIn: false,
  transactionalAllowed: true,
};

function safeSignatureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function buildTwilioSignatureBaseString(input: Pick<SmsWebhookSignatureVerificationInput, "requestUrl" | "rawBody" | "contentType">): string {
  if ((input.contentType ?? "").includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(input.rawBody);
    const sortedPairs = [...params.entries()].sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
    return `${input.requestUrl}${sortedPairs.map(([key, value]) => `${key}${value}`).join("")}`;
  }

  return `${input.requestUrl}${input.rawBody}`;
}

export function verifySmsWebhookSignature(input: SmsWebhookSignatureVerificationInput): SmsWebhookSignatureVerification {
  if (!input.authToken) {
    return {
      verifierConfigured: false,
      twilioAuthTokenConfigured: false,
      requestUrlValidated: false,
      verified: false,
      reason: "missing-auth-token",
    };
  }

  if (!input.signatureHeader) {
    return {
      verifierConfigured: true,
      twilioAuthTokenConfigured: true,
      requestUrlValidated: false,
      verified: false,
      reason: "missing-signature",
    };
  }

  const baseString = buildTwilioSignatureBaseString(input);
  const expectedSignature = createHmac("sha1", input.authToken).update(baseString).digest("base64");
  const verified = safeSignatureEquals(input.signatureHeader, expectedSignature);

  return {
    verifierConfigured: true,
    twilioAuthTokenConfigured: true,
    requestUrlValidated: true,
    verified,
    reason: verified ? "verified" : "signature-mismatch",
  };
}

export function buildSmsProviderContract(): SmsProviderContract {
  return {
    sendPlan: buildSmsProviderSendPlan({
      tenantId: "tenant_demo",
      notificationId: "notification_demo",
      deliveryId: "delivery_sms_demo",
      templateKey: "appointment_confirmed",
      context: sampleSmsContext,
      consent: sampleSmsConsent,
      requestId: "request_sms_demo",
      providerSdkInstalled: false,
      accountSidConfigured: false,
      authTokenConfigured: false,
      messagingServiceConfigured: false,
      legalConsentCopyApproved: false,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
    }),
    stopWebhookReadiness: buildSmsWebhookRuntimeReadinessPlan({
      tenantId: "tenant_demo",
      eventId: "sms_stop_event_demo",
      eventType: "inbound",
      inboundBody: "STOP",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
      signatureVerifierConfigured: false,
      twilioAuthTokenConfigured: false,
      requestUrlValidated: false,
      tenantResolved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      suppressionPersistenceAvailable: true,
      inboundThreadPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      payloadRedacted: true,
    }),
    helpWebhookReadiness: buildSmsWebhookRuntimeReadinessPlan({
      tenantId: "tenant_demo",
      eventId: "sms_help_event_demo",
      eventType: "inbound",
      providerMessageId: "SMdemo",
      inboundBody: "HELP",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
      signatureVerifierConfigured: false,
      twilioAuthTokenConfigured: false,
      requestUrlValidated: false,
      tenantResolved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      suppressionPersistenceAvailable: true,
      inboundThreadPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      payloadRedacted: true,
    }),
    requiredRepositoryMethods: [
      "assertTenantSmsDeliveryAllowed",
      "hasStoredConsentProof",
      "isDestinationSuppressed",
      "claimIdempotencyKey",
      "persistQueuedDelivery",
      "persistProviderSendResult",
      "persistWebhookReconciliation",
      "persistInboundThread",
    ],
  };
}

export function buildSmsWebhookReadinessFromPayload(input: {
  tenantId?: string;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  inboundBody?: string;
  rawBodyCaptured: boolean;
  signatureHeaderPresent: boolean;
  signatureVerification?: SmsWebhookSignatureVerification;
  alreadyProcessedEventIds?: readonly string[];
}): SmsWebhookRuntimeReadinessPlan {
  return buildSmsWebhookRuntimeReadinessPlan({
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.inboundBody ? { inboundBody: input.inboundBody } : {}),
    rawBodyCaptured: input.rawBodyCaptured,
    signatureHeaderPresent: input.signatureHeaderPresent,
    signatureVerifierConfigured: input.signatureVerification?.verifierConfigured ?? false,
    twilioAuthTokenConfigured: input.signatureVerification?.twilioAuthTokenConfigured ?? false,
    requestUrlValidated: input.signatureVerification?.requestUrlValidated ?? false,
    tenantResolved: Boolean(input.tenantId),
    consentProofAvailable: true,
    quietHoursPolicyConfigured: true,
    deliveryLogPersistenceAvailable: false,
    providerEventPersistenceAvailable: false,
    suppressionPersistenceAvailable: false,
    inboundThreadPersistenceAvailable: false,
    idempotencyStoreAvailable: false,
    payloadRedacted: true,
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });
}

const smsProviderPrivatePayloadKeys = new Set([
  "accountSid",
  "authToken",
  "authorization",
  "signature",
  "rawBody",
  "phone",
  "from",
  "to",
  "body",
  "clientName",
  "tenantSecret",
]);

function redactSmsProviderPayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSmsProviderPayloadValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        smsProviderPrivatePayloadKeys.has(key) ? "[redacted]" : redactSmsProviderPayloadValue(entry),
      ]),
    );
  }

  return value;
}

export function sanitizeSmsProviderSendResult(result: SmsProviderSendResult | null): SmsProviderSendResult | null {
  if (!result) {
    return null;
  }

  const providerMessageIdHash =
    result.rawProviderMessageIdEchoed === false && result.providerMessageIdHash
      ? result.providerMessageIdHash
      : createHash("sha256").update(result.providerMessageId).digest("hex");

  return {
    providerMessageId: "[redacted-provider-message-id]",
    providerMessageIdHash,
    rawProviderMessageIdEchoed: false,
    redactedPayload: redactSmsProviderPayloadValue(result.redactedPayload) as Record<string, unknown>,
  };
}

export function buildRedactedSmsWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return redactSmsProviderPayloadValue(payload) as Record<string, unknown>;
}

function buildSmsDeliveryKey(input: { readonly tenantId: string; readonly notificationId: string; readonly deliveryId: string }): string {
  return `sms-delivery:${createHash("sha256").update(JSON.stringify([input.tenantId, input.notificationId, input.deliveryId])).digest("hex")}`;
}

function buildSmsDestinationKey(input: { readonly tenantId: string; readonly destinationHash: string }): string {
  return `sms-destination:${createHash("sha256").update(JSON.stringify([input.tenantId, input.destinationHash])).digest("hex")}`;
}

function buildSmsIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `sms-idempotency:${createHash("sha256").update(JSON.stringify([input.tenantId, input.key])).digest("hex")}`;
}

export function createInMemorySmsProviderRepository(
  state: InMemorySmsProviderRepositoryState = {
    allowedDeliveryKeys: new Set(),
    consentProofDestinationHashes: new Set(),
    suppressedDestinationHashes: new Set(),
    idempotencyKeys: new Map(),
    queuedDeliveries: [],
    providerSendResults: [],
    webhookReconciliations: [],
    inboundThreads: [],
  },
): SmsProviderRepository & { readonly state: InMemorySmsProviderRepositoryState } {
  return {
    state,
    async assertTenantSmsDeliveryAllowed(input) {
      if (!state.allowedDeliveryKeys.has(buildSmsDeliveryKey(input))) {
        throw new Error("SMS_PROVIDER_DELIVERY_ACCESS_DENIED");
      }
    },
    async hasStoredConsentProof(input) {
      return state.consentProofDestinationHashes.has(buildSmsDestinationKey(input));
    },
    async isDestinationSuppressed(input) {
      return state.suppressedDestinationHashes.has(buildSmsDestinationKey(input));
    },
    async claimIdempotencyKey(input) {
      const key = buildSmsIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, { tenantId: input.tenantId, requestId: input.requestId });
        return "claimed";
      }

      if (existing.requestId === input.requestId) {
        return "duplicate";
      }

      throw new Error("SMS_PROVIDER_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistQueuedDelivery(input) {
      state.queuedDeliveries.push(input);
    },
    async persistProviderSendResult(input) {
      state.providerSendResults.push({
        ...input,
        result: sanitizeSmsProviderSendResult(input.result) ?? input.result,
      });
    },
    async persistWebhookReconciliation(input) {
      state.webhookReconciliations.push({
        ...input,
        redactedPayload: buildRedactedSmsWebhookPayload(input.redactedPayload),
      });
    },
    async persistInboundThread(input) {
      state.inboundThreads.push({
        ...input,
        redactedPayload: buildRedactedSmsWebhookPayload(input.redactedPayload),
      });
    },
  };
}

export async function executeSmsProviderSend(
  input: SmsProviderMutationInput,
  repository: SmsProviderRepository,
  sendWithProvider?: (plan: SmsProviderSendPlan) => Promise<SmsProviderSendResult>,
): Promise<{ status: "ready" | "blocked" | "duplicate"; plan: SmsProviderSendPlan; result: SmsProviderSendResult | null }> {
  await repository.assertTenantSmsDeliveryAllowed({
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    deliveryId: input.deliveryId,
  });

  const destinationHash = input.consent.phone ?? "missing-phone";
  const [consentProofAvailable, destinationSuppressed] = await Promise.all([
    repository.hasStoredConsentProof({ tenantId: input.tenantId, destinationHash }),
    repository.isDestinationSuppressed({ tenantId: input.tenantId, destinationHash }),
  ]);
  const plan = buildSmsProviderSendPlan({
    ...input,
    consentProofAvailable,
    destinationSuppressed,
  });

  if (plan.status === "blocked") {
    return { status: "blocked", plan, result: null };
  }

  const idempotency = await repository.claimIdempotencyKey({
    tenantId: input.tenantId,
    key: plan.idempotencyKey,
    requestId: input.providerRequestId,
  });
  if (idempotency === "duplicate") {
    return { status: "duplicate", plan, result: null };
  }

  await repository.persistQueuedDelivery({ tenantId: input.tenantId, plan });
  const result = sanitizeSmsProviderSendResult(sendWithProvider ? await sendWithProvider(plan) : null);
  if (result) {
    await repository.persistProviderSendResult({
      tenantId: input.tenantId,
      deliveryId: input.deliveryId,
      result,
    });
  }

  return { status: "ready", plan, result };
}

export function buildSmsProviderReconciliation(input: {
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  inboundBody?: string;
  alreadyProcessedEventIds?: readonly string[];
}): ProviderEventReconciliationPlan {
  return buildProviderEventReconciliationPlan({
    provider: "twilio",
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.inboundBody ? { inboundBody: input.inboundBody } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });
}

export const smsProviderContract = buildSmsProviderContract();
