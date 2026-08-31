import {
  buildEmailProviderSendPlan,
  buildEmailWebhookRuntimeReadinessPlan,
  type ClientConsentSnapshot,
  type EmailProviderSendPlan,
  type EmailProviderSendPlanInput,
  type EmailWebhookRuntimeReadinessPlan,
  type NotificationTemplateContext,
  type ProviderEventReconciliationPlan,
  buildProviderEventReconciliationPlan,
} from "@inkroute/notifications";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type EmailProviderMutationInput = EmailProviderSendPlanInput & {
  providerRequestId: string;
};

export interface EmailProviderSendResult {
  providerMessageId: string;
  providerMessageIdHash?: string;
  rawProviderMessageIdEchoed?: false;
  redactedPayload: Record<string, unknown>;
}

export interface EmailProviderRepository {
  assertTenantEmailDeliveryAllowed(input: {
    tenantId: string;
    notificationId: string;
    deliveryId: string;
  }): Promise<void>;
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
    plan: EmailProviderSendPlan;
  }): Promise<void>;
  persistProviderSendResult(input: {
    tenantId: string;
    deliveryId: string;
    result: EmailProviderSendResult;
  }): Promise<void>;
  persistWebhookReconciliation(input: {
    tenantId: string;
    readiness: EmailWebhookRuntimeReadinessPlan;
    reconciliation: ProviderEventReconciliationPlan;
    redactedPayload: Record<string, unknown>;
  }): Promise<void>;
}

export interface InMemoryEmailProviderRepositoryState {
  readonly allowedDeliveryKeys: Set<string>;
  readonly suppressedDestinationHashes: Set<string>;
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly requestId: string }>;
  readonly queuedDeliveries: { readonly tenantId: string; readonly plan: EmailProviderSendPlan }[];
  readonly providerSendResults: {
    readonly tenantId: string;
    readonly deliveryId: string;
    readonly result: EmailProviderSendResult;
  }[];
  readonly webhookReconciliations: {
    readonly tenantId: string;
    readonly readiness: EmailWebhookRuntimeReadinessPlan;
    readonly reconciliation: ProviderEventReconciliationPlan;
    readonly redactedPayload: Record<string, unknown>;
  }[];
}

export interface EmailProviderContract {
  sendPlan: EmailProviderSendPlan;
  webhookReadiness: EmailWebhookRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof EmailProviderRepository)[];
}

export interface EmailWebhookSignatureVerificationInput {
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly svixId: string | null;
  readonly svixTimestamp: string | null;
  readonly secret?: string;
  readonly nowMs?: number;
  readonly toleranceSeconds?: number;
}

export interface EmailWebhookSignatureVerification {
  readonly verifierConfigured: boolean;
  readonly webhookSecretConfigured: boolean;
  readonly timestampWithinTolerance: boolean;
  readonly verified: boolean;
  readonly reason: "verified" | "missing-secret" | "missing-signature" | "missing-svix-metadata" | "timestamp-out-of-tolerance" | "signature-mismatch";
}

export const sampleEmailContext: NotificationTemplateContext = {
  artistName: "Mara Vale",
  clientName: "Riley",
  tenantName: "InkRoute Demo Studio",
  city: "Seattle",
  bookingUrl: "https://example.test/bookings/demo",
  unsubscribeUrl: "https://example.test/preferences/email",
  supportEmail: "support@example.test",
};

export const sampleEmailConsent: ClientConsentSnapshot = {
  clientId: "client_demo",
  email: "riley@example.test",
  emailOptIn: true,
  smsOptIn: false,
  pushOptIn: false,
  marketingOptIn: false,
  transactionalAllowed: true,
};

function normalizeSvixSecret(secret: string): Buffer {
  const trimmed = secret.trim();
  const withoutPrefix = trimmed.startsWith("whsec_") ? trimmed.slice("whsec_".length) : trimmed;

  try {
    return Buffer.from(withoutPrefix, "base64");
  } catch {
    return Buffer.from(trimmed, "utf8");
  }
}

function safeSignatureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyEmailWebhookSignature(input: EmailWebhookSignatureVerificationInput): EmailWebhookSignatureVerification {
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const nowMs = input.nowMs ?? Date.now();

  if (!input.secret) {
    return {
      verifierConfigured: false,
      webhookSecretConfigured: false,
      timestampWithinTolerance: false,
      verified: false,
      reason: "missing-secret",
    };
  }

  if (!input.signatureHeader) {
    return {
      verifierConfigured: true,
      webhookSecretConfigured: true,
      timestampWithinTolerance: false,
      verified: false,
      reason: "missing-signature",
    };
  }

  if (!input.svixId || !input.svixTimestamp) {
    return {
      verifierConfigured: true,
      webhookSecretConfigured: true,
      timestampWithinTolerance: false,
      verified: false,
      reason: "missing-svix-metadata",
    };
  }

  const timestampSeconds = Number(input.svixTimestamp);
  const timestampWithinTolerance =
    Number.isFinite(timestampSeconds) && Math.abs(Math.floor(nowMs / 1000) - timestampSeconds) <= toleranceSeconds;

  if (!timestampWithinTolerance) {
    return {
      verifierConfigured: true,
      webhookSecretConfigured: true,
      timestampWithinTolerance: false,
      verified: false,
      reason: "timestamp-out-of-tolerance",
    };
  }

  const signedPayload = `${input.svixId}.${input.svixTimestamp}.${input.rawBody}`;
  const expectedSignature = createHmac("sha256", normalizeSvixSecret(input.secret)).update(signedPayload).digest("base64");
  const signatures = input.signatureHeader
    .split(" ")
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .map((part) => part.replace(/^v\d+,/, "").replace(/^v\d+=/, ""))
    .filter(Boolean);
  const verified = signatures.some((signature) => safeSignatureEquals(signature, expectedSignature));

  return {
    verifierConfigured: true,
    webhookSecretConfigured: true,
    timestampWithinTolerance,
    verified,
    reason: verified ? "verified" : "signature-mismatch",
  };
}

export function buildEmailProviderContract(): EmailProviderContract {
  return {
    sendPlan: buildEmailProviderSendPlan({
      tenantId: "tenant_demo",
      notificationId: "notification_demo",
      deliveryId: "delivery_demo",
      templateKey: "booking_request_received",
      context: sampleEmailContext,
      consent: sampleEmailConsent,
      requestId: "request_demo",
      providerSdkInstalled: true,
      providerApiKeyConfigured: false,
      senderDomainVerified: false,
      unsubscribeFooterPresent: true,
      deliveryLogPersistenceAvailable: true,
    }),
    webhookReadiness: buildEmailWebhookRuntimeReadinessPlan({
      tenantId: "tenant_demo",
      eventId: "email_event_demo",
      eventType: "email.delivered",
      providerMessageId: "resend_message_demo",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
      signatureVerifierConfigured: false,
      webhookSecretConfigured: false,
      signatureTimestampWithinTolerance: false,
      tenantResolved: true,
      deliveryLogPersistenceAvailable: true,
      providerEventPersistenceAvailable: true,
      suppressionPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      payloadRedacted: true,
    }),
    requiredRepositoryMethods: [
      "assertTenantEmailDeliveryAllowed",
      "isDestinationSuppressed",
      "claimIdempotencyKey",
      "persistQueuedDelivery",
      "persistProviderSendResult",
      "persistWebhookReconciliation",
    ],
  };
}

export function buildEmailWebhookReadinessFromPayload(input: {
  tenantId?: string;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  rawBodyCaptured: boolean;
  signatureHeaderPresent: boolean;
  signatureVerification?: EmailWebhookSignatureVerification;
  alreadyProcessedEventIds?: readonly string[];
}): EmailWebhookRuntimeReadinessPlan {
  return buildEmailWebhookRuntimeReadinessPlan({
    tenantId: input.tenantId ?? "",
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
    rawBodyCaptured: input.rawBodyCaptured,
    signatureHeaderPresent: input.signatureHeaderPresent,
    signatureVerifierConfigured: input.signatureVerification?.verifierConfigured ?? false,
    webhookSecretConfigured: input.signatureVerification?.webhookSecretConfigured ?? false,
    signatureTimestampWithinTolerance: input.signatureVerification?.timestampWithinTolerance ?? false,
    tenantResolved: Boolean(input.tenantId),
    deliveryLogPersistenceAvailable: false,
    providerEventPersistenceAvailable: false,
    suppressionPersistenceAvailable: false,
    idempotencyStoreAvailable: false,
    payloadRedacted: true,
  });
}

const emailProviderPrivatePayloadKeys = new Set([
  "apiKey",
  "authorization",
  "signature",
  "rawBody",
  "email",
  "recipientEmail",
  "destination",
  "clientName",
  "tenantSecret",
]);

function redactEmailProviderPayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactEmailProviderPayloadValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        emailProviderPrivatePayloadKeys.has(key) ? "[redacted]" : redactEmailProviderPayloadValue(entry),
      ]),
    );
  }

  return value;
}

export function sanitizeEmailProviderSendResult(result: EmailProviderSendResult | null): EmailProviderSendResult | null {
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
    redactedPayload: redactEmailProviderPayloadValue(result.redactedPayload) as Record<string, unknown>,
  };
}

export function buildRedactedEmailWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return redactEmailProviderPayloadValue(payload) as Record<string, unknown>;
}

function buildEmailDeliveryKey(input: { readonly tenantId: string; readonly notificationId: string; readonly deliveryId: string }): string {
  return `email-delivery:${createHash("sha256").update(JSON.stringify([input.tenantId, input.notificationId, input.deliveryId])).digest("hex")}`;
}

function buildEmailIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `email-idempotency:${createHash("sha256").update(JSON.stringify([input.tenantId, input.key])).digest("hex")}`;
}

function buildSuppressionKey(input: { readonly tenantId: string; readonly destinationHash: string }): string {
  return `email-suppression:${createHash("sha256").update(JSON.stringify([input.tenantId, input.destinationHash])).digest("hex")}`;
}

export function createInMemoryEmailProviderRepository(
  state: InMemoryEmailProviderRepositoryState = {
    allowedDeliveryKeys: new Set(),
    suppressedDestinationHashes: new Set(),
    idempotencyKeys: new Map(),
    queuedDeliveries: [],
    providerSendResults: [],
    webhookReconciliations: [],
  },
): EmailProviderRepository & { readonly state: InMemoryEmailProviderRepositoryState } {
  return {
    state,
    async assertTenantEmailDeliveryAllowed(input) {
      if (!state.allowedDeliveryKeys.has(buildEmailDeliveryKey(input))) {
        throw new Error("EMAIL_PROVIDER_DELIVERY_ACCESS_DENIED");
      }
    },
    async isDestinationSuppressed(input) {
      return state.suppressedDestinationHashes.has(buildSuppressionKey(input));
    },
    async claimIdempotencyKey(input) {
      const key = buildEmailIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, { tenantId: input.tenantId, requestId: input.requestId });
        return "claimed";
      }

      if (existing.requestId === input.requestId) {
        return "duplicate";
      }

      throw new Error("EMAIL_PROVIDER_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistQueuedDelivery(input) {
      state.queuedDeliveries.push(input);
    },
    async persistProviderSendResult(input) {
      state.providerSendResults.push({
        ...input,
        result: sanitizeEmailProviderSendResult(input.result) ?? input.result,
      });
    },
    async persistWebhookReconciliation(input) {
      state.webhookReconciliations.push({
        ...input,
        redactedPayload: buildRedactedEmailWebhookPayload(input.redactedPayload),
      });
    },
  };
}

export async function executeEmailProviderSend(
  input: EmailProviderMutationInput,
  repository: EmailProviderRepository,
  sendWithProvider?: (plan: EmailProviderSendPlan) => Promise<EmailProviderSendResult>,
): Promise<{ status: "ready" | "blocked" | "duplicate"; plan: EmailProviderSendPlan; result: EmailProviderSendResult | null }> {
  await repository.assertTenantEmailDeliveryAllowed({
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    deliveryId: input.deliveryId,
  });

  const destinationSuppressed = await repository.isDestinationSuppressed({
    tenantId: input.tenantId,
    destinationHash: input.consent.email ?? "missing-email",
  });
  const plan = buildEmailProviderSendPlan({
    ...input,
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
  const result = sanitizeEmailProviderSendResult(sendWithProvider ? await sendWithProvider(plan) : null);
  if (result) {
    await repository.persistProviderSendResult({
      tenantId: input.tenantId,
      deliveryId: input.deliveryId,
      result,
    });
  }

  return { status: "ready", plan, result };
}

export function buildEmailProviderReconciliation(input: {
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  alreadyProcessedEventIds?: readonly string[];
}): ProviderEventReconciliationPlan {
  return buildProviderEventReconciliationPlan({
    provider: "resend",
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });
}

export const emailProviderContract = buildEmailProviderContract();
