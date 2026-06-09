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

export type EmailProviderMutationInput = EmailProviderSendPlanInput & {
  providerRequestId: string;
};

export interface EmailProviderSendResult {
  providerMessageId: string;
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

export interface EmailProviderContract {
  sendPlan: EmailProviderSendPlan;
  webhookReadiness: EmailWebhookRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof EmailProviderRepository)[];
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
  alreadyProcessedEventIds?: readonly string[];
}): EmailWebhookRuntimeReadinessPlan {
  return buildEmailWebhookRuntimeReadinessPlan({
    tenantId: input.tenantId,
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    rawBodyCaptured: input.rawBodyCaptured,
    signatureHeaderPresent: input.signatureHeaderPresent,
    signatureVerifierConfigured: false,
    webhookSecretConfigured: false,
    signatureTimestampWithinTolerance: false,
    tenantResolved: Boolean(input.tenantId),
    deliveryLogPersistenceAvailable: false,
    providerEventPersistenceAvailable: false,
    suppressionPersistenceAvailable: false,
    idempotencyStoreAvailable: false,
    payloadRedacted: true,
    alreadyProcessedEventIds: input.alreadyProcessedEventIds,
  });
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
  const result = sendWithProvider ? await sendWithProvider(plan) : null;
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
