import {
  buildMessagingPrivacyPlan,
  buildMessagingPrivacyRuntimeReadinessPlan,
  type MessagingPrivacyAction,
  type MessagingPrivacyPlan,
  type MessagingPrivacyRuntimeReadinessPlan,
  type MessagingRole,
} from "@inkroute/notifications";

export interface MessagingPrivacyRepository {
  claimIdempotencyKey(input: { tenantId: string; key: string; action: MessagingPrivacyAction }): Promise<"claimed" | "duplicate">;
  persistPrivacyEvent(input: { tenantId: string; plan: MessagingPrivacyPlan; redactedMetadata: Record<string, unknown> }): Promise<void>;
  persistRedactedMessage(input: { tenantId: string; messageId: string; bodyPreview: string; findings: readonly string[] }): Promise<void>;
  persistExportWorkflow(input: { tenantId: string; plan: MessagingPrivacyPlan }): Promise<void>;
  persistDeleteWorkflow(input: { tenantId: string; plan: MessagingPrivacyPlan }): Promise<void>;
  persistRetentionWorkflow(input: { tenantId: string; plan: MessagingPrivacyPlan }): Promise<void>;
  authorizeAttachment(input: { tenantId: string; threadId: string; role: MessagingRole; attachmentUrl: string }): Promise<"allowed" | "denied">;
  persistModerationDecision(input: { tenantId: string; plan: MessagingPrivacyPlan; spamScore: number }): Promise<void>;
  persistAuditLog(input: { tenantId: string; plan: MessagingPrivacyPlan; redactedMetadata: Record<string, unknown> }): Promise<void>;
}

export interface MessagingPrivacyContract {
  runtimeReadiness: MessagingPrivacyRuntimeReadinessPlan;
  redactPlan: MessagingPrivacyPlan;
  authorizeViewPlan: MessagingPrivacyPlan;
  exportPlan: MessagingPrivacyPlan;
  deletePlan: MessagingPrivacyPlan;
  retentionPlan: MessagingPrivacyPlan;
  moderationPlan: MessagingPrivacyPlan;
  requiredRepositoryMethods: readonly (keyof MessagingPrivacyRepository)[];
}

const sensitiveBody = "Client email ari@example.test, phone +1 206 555 0142, card details, allergy notes, and private https://storage.example.test/private/token=secret URL.";

export function buildMessagingPrivacyContract(): MessagingPrivacyContract {
  return {
    runtimeReadiness: buildMessagingPrivacyRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      dashboardTestsPassed: false,
      messagingApiTestsPassed: false,
      redactionServiceImplemented: true,
      piiDetectionConfigured: true,
      medicalPaymentPrivateUrlDetectionConfigured: true,
      bodyPreviewRedactionEnforced: true,
      roleGatedMessageUiImplemented: true,
      roleGatedApiAuthorizationEnforced: true,
      unauthorizedRoleDenialTestsPassed: false,
      secureAttachmentAuthorizationImplemented: true,
      attachmentPolicyTestsPassed: false,
      exportWorkflowPersistenceAvailable: false,
      deleteWorkflowPersistenceAvailable: false,
      retentionWorkflowPersistenceAvailable: false,
      retentionJobConfigured: false,
      providerPayloadExportOmissionEnforced: true,
      privateUrlExportOmissionEnforced: true,
      moderationRateLimitIntegrationConfigured: true,
      spamModerationTestsPassed: false,
      auditLogPersistenceAvailable: false,
      idempotencyStoreAvailable: false,
      postgresRetentionIntegrationTestsPassed: false,
    }),
    redactPlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "redact_message",
      role: "artist",
      actorId: "user_mara_demo",
      messageId: "message_demo",
      body: sensitiveBody,
      bodyRedacted: true,
      attachmentUrl: "https://storage.example.test/private/redacted",
      attachmentPolicyApproved: true,
      idempotencyKey: "privacy:redact:message_demo",
    }),
    authorizeViewPlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "authorize_message_view",
      role: "assistant",
      actorId: "user_assistant_demo",
      messageId: "message_demo",
      body: "Redacted message preview only.",
      bodyRedacted: true,
      attachmentPolicyApproved: false,
      idempotencyKey: "privacy:view:message_demo",
    }),
    exportPlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "export_thread",
      role: "studio_manager",
      actorId: "user_manager_demo",
      threadId: "thread_demo",
      body: sensitiveBody,
      bodyRedacted: true,
      retentionDays: 365,
      exportIncludesProviderPayloads: false,
      exportIncludesPrivateUrls: false,
      attachmentUrl: "https://storage.example.test/private/redacted",
      attachmentPolicyApproved: true,
      idempotencyKey: "privacy:export:thread_demo",
    }),
    deletePlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "delete_thread",
      role: "admin",
      actorId: "admin_demo",
      threadId: "thread_demo",
      retentionDays: 365,
      deleteRequestedAt: "2026-06-09T17:00:00.000Z",
      idempotencyKey: "privacy:delete:thread_demo",
    }),
    retentionPlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "apply_retention",
      role: "admin",
      actorId: "retention_worker_demo",
      threadId: "thread_demo",
      retentionDays: 365,
      idempotencyKey: "privacy:retention:thread_demo",
    }),
    moderationPlan: buildMessagingPrivacyPlan({
      tenantId: "tenant_demo",
      action: "moderate_message",
      role: "studio_manager",
      actorId: "moderator_demo",
      messageId: "message_spam_demo",
      body: "Suspicious inbound message with a private_url token.",
      bodyRedacted: true,
      spamScore: 91,
      rateLimitAllowed: false,
      idempotencyKey: "privacy:moderate:message_spam_demo",
    }),
    requiredRepositoryMethods: [
      "claimIdempotencyKey",
      "persistPrivacyEvent",
      "persistRedactedMessage",
      "persistExportWorkflow",
      "persistDeleteWorkflow",
      "persistRetentionWorkflow",
      "authorizeAttachment",
      "persistModerationDecision",
      "persistAuditLog",
    ],
  };
}

export function buildMessagingPrivacyPlanFromRequest(input: {
  tenantId: string;
  action: MessagingPrivacyAction;
  role: MessagingRole;
  actorId?: string;
  threadId?: string;
  messageId?: string;
  body?: string;
  bodyRedacted?: boolean;
  attachmentUrl?: string;
  attachmentPolicyApproved?: boolean;
  retentionDays?: number;
  exportIncludesProviderPayloads?: boolean;
  exportIncludesPrivateUrls?: boolean;
  deleteRequestedAt?: string;
  spamScore?: number;
  rateLimitAllowed?: boolean;
  idempotencyKey?: string;
}): MessagingPrivacyPlan {
  return buildMessagingPrivacyPlan(input);
}

export async function executeMessagingPrivacyPlan(
  repository: MessagingPrivacyRepository,
  plan: MessagingPrivacyPlan,
  input: { tenantId: string; messageId?: string; threadId?: string; attachmentUrl?: string; spamScore?: number },
): Promise<{ status: "processed" | "blocked" | "duplicate"; plan: MessagingPrivacyPlan }> {
  if (plan.status === "blocked") return { status: "blocked", plan };
  const idempotencyKey = `${plan.action}:${input.threadId ?? input.messageId ?? "unknown"}`;
  const claim = await repository.claimIdempotencyKey({ tenantId: input.tenantId, key: idempotencyKey, action: plan.action });
  if (claim === "duplicate") return { status: "duplicate", plan };

  await repository.persistPrivacyEvent({ tenantId: input.tenantId, plan, redactedMetadata: { action: plan.action, findings: plan.redactionFindings } });
  if (plan.action === "redact_message" && input.messageId) await repository.persistRedactedMessage({ tenantId: input.tenantId, messageId: input.messageId, bodyPreview: "[redacted-message-body]", findings: plan.redactionFindings });
  if (plan.action === "export_thread") await repository.persistExportWorkflow({ tenantId: input.tenantId, plan });
  if (plan.action === "delete_thread") await repository.persistDeleteWorkflow({ tenantId: input.tenantId, plan });
  if (plan.action === "apply_retention") await repository.persistRetentionWorkflow({ tenantId: input.tenantId, plan });
  if (input.attachmentUrl && input.threadId) await repository.authorizeAttachment({ tenantId: input.tenantId, threadId: input.threadId, role: plan.role, attachmentUrl: input.attachmentUrl });
  if (plan.action === "moderate_message") await repository.persistModerationDecision({ tenantId: input.tenantId, plan, spamScore: input.spamScore ?? 0 });
  await repository.persistAuditLog({ tenantId: input.tenantId, plan, redactedMetadata: { visibleFields: plan.visibleFields, requiredWrites: plan.requiredWrites } });
  return { status: "processed", plan };
}

export const messagingPrivacyContract = buildMessagingPrivacyContract();
