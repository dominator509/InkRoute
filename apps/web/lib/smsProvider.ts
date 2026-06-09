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

export type SmsProviderMutationInput = SmsProviderSendPlanInput & {
  providerRequestId: string;
};

export interface SmsProviderSendResult {
  providerMessageId: string;
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

export interface SmsProviderContract {
  sendPlan: SmsProviderSendPlan;
  stopWebhookReadiness: SmsWebhookRuntimeReadinessPlan;
  helpWebhookReadiness: SmsWebhookRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof SmsProviderRepository)[];
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
    signatureVerifierConfigured: false,
    twilioAuthTokenConfigured: false,
    requestUrlValidated: false,
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
