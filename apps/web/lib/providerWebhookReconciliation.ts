import {
  buildProviderWebhookRuntimeReadinessPlan,
  type ProviderEventReconciliationPlan,
  type ProviderWebhookRuntimeReadinessPlan,
} from "@inkroute/notifications";
import { emailProviderContract } from "./emailProvider";
import { smsProviderContract } from "./smsProvider";

export type ProviderWebhookSource = "email" | "sms" | "push";
export type ProviderWebhookReconciliationStatus = "ready" | "blocked" | "duplicate" | "processed";

export interface ProviderWebhookPersistenceRepository {
  claimProviderEvent(input: { tenantId: string; provider: string; eventId: string; idempotencyKey: string }): Promise<"claimed" | "duplicate">;
  persistProviderEvent(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; redactedPayload: Record<string, unknown> }): Promise<void>;
  updateDeliveryLogExactlyOnce(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan }): Promise<void>;
  persistSuppression(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; reason: string }): Promise<void>;
  persistInboundRouting(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; redactedPayload: Record<string, unknown> }): Promise<void>;
  suppressInvalidPushToken(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; tokenHash: string }): Promise<void>;
  persistWebhookAudit(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; status: ProviderWebhookReconciliationStatus; redactedPayload: Record<string, unknown> }): Promise<void>;
  alertFailedWebhook(input: { tenantId: string | null; source: ProviderWebhookSource; eventId: string; reason: string; redactedPayload: Record<string, unknown> }): Promise<void>;
}

export interface ProviderWebhookContract {
  runtimeReadiness: ProviderWebhookRuntimeReadinessPlan;
  emailReadiness: typeof emailProviderContract.webhookReadiness;
  smsStopReadiness: typeof smsProviderContract.stopWebhookReadiness;
  smsHelpReadiness: typeof smsProviderContract.helpWebhookReadiness;
  requiredRepositoryMethods: readonly (keyof ProviderWebhookPersistenceRepository)[];
}

export interface ProviderWebhookExecutionInput {
  tenantId: string | null;
  source: ProviderWebhookSource;
  eventId: string;
  redactedPayload: Record<string, unknown>;
  reconciliation: ProviderEventReconciliationPlan;
}

export function buildProviderWebhookContract(): ProviderWebhookContract {
  return {
    runtimeReadiness: buildProviderWebhookRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      webRouteTestsPassed: false,
      emailSignatureVerificationImplemented: false,
      smsSignatureVerificationImplemented: false,
      pushReceiptTrustedSourceVerified: false,
      rawBodyPreservedForVerification: true,
      webhookSecretsConfigured: false,
      replayProtectionPersistenceAvailable: false,
      providerEventPersistenceAvailable: false,
      deliveryLogPersistenceAvailable: false,
      exactlyOnceDeliveryUpdatesEnforced: false,
      suppressionPersistenceAvailable: false,
      inboundRoutingPersistenceAvailable: false,
      invalidPushTokenPersistenceAvailable: false,
      tenantResolutionEnforced: true,
      payloadRedactionEnforced: true,
      failedWebhookAlertingConfigured: false,
      providerSandboxWebhookTestsPassed: false,
      routeInvalidSignatureTestsPassed: false,
    }),
    emailReadiness: emailProviderContract.webhookReadiness,
    smsStopReadiness: smsProviderContract.stopWebhookReadiness,
    smsHelpReadiness: smsProviderContract.helpWebhookReadiness,
    requiredRepositoryMethods: [
      "claimProviderEvent",
      "persistProviderEvent",
      "updateDeliveryLogExactlyOnce",
      "persistSuppression",
      "persistInboundRouting",
      "suppressInvalidPushToken",
      "persistWebhookAudit",
      "alertFailedWebhook",
    ],
  };
}

export function redactedWebhookPayloadSummary(input: {
  source: ProviderWebhookSource;
  eventId: string;
  eventType: string;
  rawBodyBytes: number;
  signatureHeaderPresent: boolean;
}): Record<string, unknown> {
  return {
    source: input.source,
    eventId: input.eventId,
    eventType: input.eventType,
    rawBodyBytes: input.rawBodyBytes,
    signatureHeaderPresent: input.signatureHeaderPresent,
    redacted: true,
    omittedFields: ["destination", "messageBody", "providerPayload", "signature", "token"],
  };
}

export function buildProviderWebhookRouteBoundary(input: {
  source: ProviderWebhookSource;
  tenantId: string | null;
  eventId: string;
  eventType: string;
  rawBodyBytes: number;
  signatureHeaderPresent: boolean;
  reconciliation: ProviderEventReconciliationPlan;
}) {
  const redactedPayload = redactedWebhookPayloadSummary(input);
  const requiredWrites = ["ProviderEvent", "IdempotencyKey", "NotificationAuditLog"];
  if (input.reconciliation.shouldUpdateDeliveryLog) requiredWrites.push("NotificationDelivery");
  if (input.reconciliation.shouldSuppressDestination) requiredWrites.push("SuppressionListEntry");
  if (input.reconciliation.shouldCreateInboundThread) requiredWrites.push("MessageThread", "Message");
  if (input.reconciliation.shouldMarkPushTokenInactive) requiredWrites.push("PushToken");

  return {
    tenantId: input.tenantId,
    source: input.source,
    eventId: input.eventId,
    idempotencyKey: input.reconciliation.idempotencyKey,
    redactedPayload,
    requiredWrites,
    requiredControls: [
      "Verify cryptographic provider signatures or trusted Expo receipt source before side effects.",
      "Claim ProviderEvent idempotency before delivery, suppression, inbound, or invalid-token mutations.",
      "Apply exactly-once NotificationDelivery reconciliation under replay and concurrent callbacks.",
      "Persist suppression, inbound routing, invalid-token, audit, and alert outcomes in tenant scope.",
      "Keep raw destinations, message bodies, signatures, provider payloads, and push tokens out of logs.",
    ],
    blockers: input.reconciliation.blockers,
  };
}

export async function executeProviderWebhookReconciliation(
  repository: ProviderWebhookPersistenceRepository,
  input: ProviderWebhookExecutionInput,
): Promise<{ status: ProviderWebhookReconciliationStatus; reconciliation: ProviderEventReconciliationPlan }> {
  if (!input.tenantId) {
    await repository.alertFailedWebhook({ tenantId: null, source: input.source, eventId: input.eventId, reason: "tenant_unresolved", redactedPayload: input.redactedPayload });
    return { status: "blocked", reconciliation: input.reconciliation };
  }

  if (input.reconciliation.blockers.length > 0) {
    await repository.alertFailedWebhook({ tenantId: input.tenantId, source: input.source, eventId: input.eventId, reason: input.reconciliation.blockers.join("; "), redactedPayload: input.redactedPayload });
    return { status: "blocked", reconciliation: input.reconciliation };
  }

  const claim = await repository.claimProviderEvent({
    tenantId: input.tenantId,
    provider: input.reconciliation.provider,
    eventId: input.eventId,
    idempotencyKey: input.reconciliation.idempotencyKey,
  });
  if (claim === "duplicate") return { status: "duplicate", reconciliation: input.reconciliation };

  await repository.persistProviderEvent({ tenantId: input.tenantId, reconciliation: input.reconciliation, redactedPayload: input.redactedPayload });
  if (input.reconciliation.shouldUpdateDeliveryLog) await repository.updateDeliveryLogExactlyOnce({ tenantId: input.tenantId, reconciliation: input.reconciliation });
  if (input.reconciliation.shouldSuppressDestination) await repository.persistSuppression({ tenantId: input.tenantId, reconciliation: input.reconciliation, reason: input.reconciliation.interpretation.eventType });
  if (input.reconciliation.shouldCreateInboundThread) await repository.persistInboundRouting({ tenantId: input.tenantId, reconciliation: input.reconciliation, redactedPayload: input.redactedPayload });
  if (input.reconciliation.shouldMarkPushTokenInactive) await repository.suppressInvalidPushToken({ tenantId: input.tenantId, reconciliation: input.reconciliation, tokenHash: String(input.redactedPayload.tokenHash ?? "redacted-token") });
  await repository.persistWebhookAudit({ tenantId: input.tenantId, reconciliation: input.reconciliation, status: "processed", redactedPayload: input.redactedPayload });

  return { status: "processed", reconciliation: input.reconciliation };
}

export const providerWebhookContract = buildProviderWebhookContract();
