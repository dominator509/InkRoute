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
  persistExportWorkflow(input: {
    tenantId: string;
    plan: MessagingPrivacyPlan;
    threadId?: string;
  }): Promise<void>;
  persistDeleteWorkflow(input: {
    tenantId: string;
    plan: MessagingPrivacyPlan;
    threadId?: string;
  }): Promise<void>;
  persistRetentionWorkflow(input: {
    tenantId: string;
    plan: MessagingPrivacyPlan;
    threadId?: string;
    retentionDays?: number;
  }): Promise<void>;
  authorizeAttachment(input: { tenantId: string; threadId: string; role: MessagingRole; attachmentUrl: string }): Promise<"allowed" | "denied">;
  persistModerationDecision(input: { tenantId: string; plan: MessagingPrivacyPlan; spamScore: number }): Promise<void>;
  persistAuditLog(input: { tenantId: string; plan: MessagingPrivacyPlan; redactedMetadata: Record<string, unknown> }): Promise<void>;
}

export interface MessagingPrivacyPrismaRepositoryClient {
  readonly idempotencyKey: {
    findUnique(input: { where: { tenantId_scope_key: { tenantId: string; scope: string; key: string } } }): Promise<unknown | null>;
    create(input: { data: { tenantId: string; scope: string; key: string; status: string; metadata: Record<string, unknown> } }): Promise<unknown>;
  };
  readonly messagePrivacyEvent: {
    create(input: {
      data: {
        tenantId: string;
        action: string;
        threadId?: string;
        messageId?: string;
        actorUserId?: string;
        role?: string;
        status?: string;
        workflowStatus?: string;
        retentionDays?: number;
        redactionFindings?: readonly string[];
        metadata?: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
  readonly messageAuditLog: {
    create(input: {
      data: {
        tenantId: string;
        action: string;
        threadId?: string;
        messageId?: string;
        actorUserId?: string;
        role?: string;
        metadata?: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
  readonly message: {
    updateMany(input: { where: { tenantId: string; id: string }; data: { body: string; status?: string } }): Promise<unknown>;
  };
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

export interface InMemoryMessagingPrivacyRepositorySnapshot {
  readonly idempotencyKeys: readonly string[];
  readonly privacyEvents: readonly { tenantId: string; action: MessagingPrivacyAction; redactedMetadata: Record<string, unknown> }[];
  readonly redactedMessages: readonly { tenantId: string; messageId: string; bodyPreview: string; findings: readonly string[] }[];
  readonly exportWorkflows: readonly { tenantId: string; action: MessagingPrivacyAction; threadId?: string }[];
  readonly deleteWorkflows: readonly { tenantId: string; action: MessagingPrivacyAction; threadId?: string }[];
  readonly retentionWorkflows: readonly { tenantId: string; action: MessagingPrivacyAction; threadId?: string; retentionDays?: number }[];
  readonly attachmentAuthorizations: readonly { tenantId: string; threadId: string; role: MessagingRole; attachmentUrl: string; status: "allowed" | "denied" }[];
  readonly moderationDecisions: readonly { tenantId: string; action: MessagingPrivacyAction; spamScore: number; rateLimitAllowed?: boolean }[];
  readonly auditLogs: readonly { tenantId: string; action: MessagingPrivacyAction; redactedMetadata: Record<string, unknown> }[];
}

const sensitiveBody = "Client email ari@example.test, phone +1 206 555 0142, card details, allergy notes, and private https://storage.example.test/private/token=secret URL.";

const sensitiveKeyPattern = /(token|secret|password|authorization|cookie|provider|payload|email|phone|card|medical|allergy|privateurl|attachmenturl|url)/i;
const sensitiveValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:card|allergy|medical|diagnosis|medication|private)\b/gi,
  /https?:\/\/\S+/gi,
];

export function buildRedactedMessagingPrivacyPayload(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedMessagingPrivacyPayload(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : buildRedactedMessagingPrivacyPayload(value),
    ]),
  );
}

export const messagingPrivacyActionRolePolicy: Record<MessagingPrivacyAction, readonly MessagingRole[]> = {
  authorize_message_view: ["client", "artist", "assistant", "studio_manager", "admin"],
  redact_message: ["artist", "studio_manager", "admin"],
  export_thread: ["studio_manager", "admin"],
  delete_thread: ["admin"],
  apply_retention: ["admin"],
  moderate_message: ["studio_manager", "admin"],
};

export const messagingPrivacyRoleMismatchBlocker =
  "Messaging privacy route must use the authenticated dashboard actor role, not a caller supplied role.";

export const messagingPrivacySecureAttachmentBlocker =
  "Secure attachment policy denies this role access to private or signed message attachments.";

export function mapDashboardRoleToMessagingPrivacyRole(role: string): MessagingRole {
  const normalized = role.trim().toLowerCase();
  if (normalized === "owner") return "admin";
  if (normalized === "admin" || normalized === "studio_manager" || normalized === "artist" || normalized === "assistant" || normalized === "client") {
    return normalized;
  }
  return "assistant";
}

export function isMessagingPrivacyActionAllowedForRole(action: MessagingPrivacyAction, role: MessagingRole): boolean {
  return messagingPrivacyActionRolePolicy[action].includes(role);
}

export function isMessagingPrivacyAttachmentAllowedForRole(role: MessagingRole, attachmentUrl?: string): boolean {
  if (!attachmentUrl) return true;
  const normalizedUrl = attachmentUrl.toLowerCase();
  const privateOrSignedUrl = normalizedUrl.includes("/private/") || normalizedUrl.includes("token=") || normalizedUrl.includes("signature=");
  return !(privateOrSignedUrl && role === "assistant");
}

function withMessagingPrivacyBlocker(plan: MessagingPrivacyPlan, blocker: string): MessagingPrivacyPlan {
  return {
    ...plan,
    status: "blocked",
    blockers: plan.blockers.includes(blocker) ? plan.blockers : [...plan.blockers, blocker],
  };
}

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
      exportWorkflowPersistenceAvailable: true,
      deleteWorkflowPersistenceAvailable: true,
      retentionWorkflowPersistenceAvailable: true,
      retentionJobConfigured: false,
      providerPayloadExportOmissionEnforced: false,
      privateUrlExportOmissionEnforced: false,
      moderationRateLimitIntegrationConfigured: true,
      spamModerationTestsPassed: false,
      auditLogPersistenceAvailable: true,
      idempotencyStoreAvailable: true,
      secretSafeArtifactsReviewed: false,
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
      body: "Redacted message contract view.",
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
  const plan = buildMessagingPrivacyPlan(input);
  if (!isMessagingPrivacyAttachmentAllowedForRole(input.role, input.attachmentUrl)) {
    return withMessagingPrivacyBlocker(plan, messagingPrivacySecureAttachmentBlocker);
  }
  return plan;
}

export async function executeMessagingPrivacyPlan(
  repository: MessagingPrivacyRepository,
  plan: MessagingPrivacyPlan,
  input: { tenantId: string; messageId?: string; threadId?: string; attachmentUrl?: string; spamScore?: number },
): Promise<{ status: "processed" | "blocked" | "duplicate"; plan: MessagingPrivacyPlan }> {
  if (plan.status === "blocked") return { status: "blocked", plan };
  const idempotencyKey = `${plan.action}:${input.threadId ?? input.messageId ?? "unknown"}`;
  const effectiveThreadId = input.threadId ?? plan.threadId;
  const effectiveRetentionDays = plan.retentionDays;

  const claim = await repository.claimIdempotencyKey({
    tenantId: input.tenantId,
    key: plan.idempotencyKey ?? idempotencyKey,
    action: plan.action,
  });
  if (claim === "duplicate") return { status: "duplicate", plan };

  const effectiveAttachmentUrl = input.attachmentUrl ?? plan.attachmentUrl;
  if (effectiveAttachmentUrl && effectiveThreadId) {
    const attachmentStatus = await repository.authorizeAttachment({
      tenantId: input.tenantId,
      threadId: effectiveThreadId,
      role: plan.role,
      attachmentUrl: effectiveAttachmentUrl,
    });
    if (attachmentStatus === "denied") {
      const blockedPlan = withMessagingPrivacyBlocker(plan, messagingPrivacySecureAttachmentBlocker);
      await repository.persistAuditLog({
        tenantId: input.tenantId,
        plan: blockedPlan,
        redactedMetadata: { attachmentAuthorizationStatus: attachmentStatus, blocker: messagingPrivacySecureAttachmentBlocker },
      });
      return { status: "blocked", plan: blockedPlan };
    }
  }

  await repository.persistPrivacyEvent({ tenantId: input.tenantId, plan, redactedMetadata: { action: plan.action, findings: plan.redactionFindings } });
  if (plan.action === "redact_message" && input.messageId) await repository.persistRedactedMessage({ tenantId: input.tenantId, messageId: input.messageId, bodyPreview: "[redacted-message-body]", findings: plan.redactionFindings });
  if (plan.action === "export_thread") {
    await repository.persistExportWorkflow({ tenantId: input.tenantId, plan, threadId: effectiveThreadId });
  }
  if (plan.action === "delete_thread") {
    await repository.persistDeleteWorkflow({ tenantId: input.tenantId, plan, threadId: effectiveThreadId });
  }
  if (plan.action === "apply_retention") {
    await repository.persistRetentionWorkflow({
      tenantId: input.tenantId,
      plan,
      threadId: effectiveThreadId,
      retentionDays: effectiveRetentionDays,
    });
  }
  if (plan.action === "moderate_message") await repository.persistModerationDecision({ tenantId: input.tenantId, plan, spamScore: input.spamScore ?? 0 });
  await repository.persistAuditLog({ tenantId: input.tenantId, plan, redactedMetadata: { visibleFields: plan.visibleFields, requiredWrites: plan.requiredWrites } });
  return { status: "processed", plan };
}

const messagingPrivacyIdempotencyScope = "messaging_privacy";

const planMetadata = (plan: MessagingPrivacyPlan, extra: Record<string, unknown> = {}): Record<string, unknown> =>
  buildRedactedMessagingPrivacyPayload({
    action: plan.action,
    status: plan.status,
    visibleFields: plan.visibleFields,
    requiredWrites: plan.requiredWrites,
    redactionFindings: plan.redactionFindings,
    exportIncludesProviderPayloads: plan.exportIncludesProviderPayloads,
    exportIncludesPrivateUrls: plan.exportIncludesPrivateUrls,
    attachmentPolicyApproved: plan.attachmentPolicyApproved,
    rateLimitAllowed: plan.rateLimitAllowed,
    ...extra,
  }) as Record<string, unknown>;

export function createPrismaMessagingPrivacyRepository(
  client: MessagingPrivacyPrismaRepositoryClient,
): MessagingPrivacyRepository {
  const persistWorkflowEvent = async (input: {
    tenantId: string;
    plan: MessagingPrivacyPlan;
    workflowStatus: string;
    threadId?: string;
    retentionDays?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> => {
    await client.messagePrivacyEvent.create({
      data: {
        tenantId: input.tenantId,
        action: input.plan.action,
        ...(input.threadId ?? input.plan.threadId ? { threadId: input.threadId ?? input.plan.threadId } : {}),
        ...(input.plan.messageId ? { messageId: input.plan.messageId } : {}),
        ...(input.plan.actorId ? { actorUserId: input.plan.actorId } : {}),
        role: input.plan.role,
        status: input.plan.status,
        workflowStatus: input.workflowStatus,
        ...(input.retentionDays ?? input.plan.retentionDays ? { retentionDays: input.retentionDays ?? input.plan.retentionDays } : {}),
        redactionFindings: input.plan.redactionFindings,
        metadata: planMetadata(input.plan, input.metadata),
      },
    });
  };

  return {
    async claimIdempotencyKey(input) {
      const existing = await client.idempotencyKey.findUnique({
        where: {
          tenantId_scope_key: {
            tenantId: input.tenantId,
            scope: messagingPrivacyIdempotencyScope,
            key: `${input.action}:${input.key}`,
          },
        },
      });
      if (existing) return "duplicate";

      await client.idempotencyKey.create({
        data: {
          tenantId: input.tenantId,
          scope: messagingPrivacyIdempotencyScope,
          key: `${input.action}:${input.key}`,
          status: "claimed",
          metadata: planMetadata({ action: input.action, status: "ready", visibleFields: [], requiredWrites: [], redactionFindings: [] } as MessagingPrivacyPlan),
        },
      });
      return "claimed";
    },
    async persistPrivacyEvent(input) {
      await persistWorkflowEvent({
        tenantId: input.tenantId,
        plan: input.plan,
        workflowStatus: "privacy_event_recorded",
        metadata: input.redactedMetadata,
      });
    },
    async persistRedactedMessage(input) {
      await client.message.updateMany({
        where: { tenantId: input.tenantId, id: input.messageId },
        data: { body: "[redacted-message-body]", status: "read" },
      });
      await client.messagePrivacyEvent.create({
        data: {
          tenantId: input.tenantId,
          action: "redact_message",
          messageId: input.messageId,
          status: "ready",
          workflowStatus: "message_redacted",
          redactionFindings: input.findings,
          metadata: planMetadata({ action: "redact_message", status: "ready", visibleFields: [], requiredWrites: [], redactionFindings: input.findings } as MessagingPrivacyPlan, {
            bodyPreview: input.bodyPreview,
          }),
        },
      });
    },
    async persistExportWorkflow(input) {
      await persistWorkflowEvent({ tenantId: input.tenantId, plan: input.plan, workflowStatus: "export_queued", threadId: input.threadId });
    },
    async persistDeleteWorkflow(input) {
      await persistWorkflowEvent({ tenantId: input.tenantId, plan: input.plan, workflowStatus: "delete_queued", threadId: input.threadId });
    },
    async persistRetentionWorkflow(input) {
      await persistWorkflowEvent({
        tenantId: input.tenantId,
        plan: input.plan,
        workflowStatus: "retention_queued",
        threadId: input.threadId,
        retentionDays: input.retentionDays,
      });
    },
    async authorizeAttachment(input) {
      const status = input.attachmentUrl.includes("/private/") && input.role === "assistant" ? "denied" : "allowed";
      await client.messageAuditLog.create({
        data: {
          tenantId: input.tenantId,
          action: "authorize_attachment",
          threadId: input.threadId,
          role: input.role,
          metadata: buildRedactedMessagingPrivacyPayload({ attachmentUrl: input.attachmentUrl, status }) as Record<string, unknown>,
        },
      });
      return status;
    },
    async persistModerationDecision(input) {
      await persistWorkflowEvent({
        tenantId: input.tenantId,
        plan: input.plan,
        workflowStatus: "moderation_recorded",
        metadata: { spamScore: input.spamScore, rateLimitAllowed: input.plan.rateLimitAllowed },
      });
    },
    async persistAuditLog(input) {
      await client.messageAuditLog.create({
        data: {
          tenantId: input.tenantId,
          action: input.plan.action,
          ...(input.plan.threadId ? { threadId: input.plan.threadId } : {}),
          ...(input.plan.messageId ? { messageId: input.plan.messageId } : {}),
          ...(input.plan.actorId ? { actorUserId: input.plan.actorId } : {}),
          role: input.plan.role,
          metadata: planMetadata(input.plan, input.redactedMetadata),
        },
      });
    },
  };
}

export function createInMemoryMessagingPrivacyRepository(): MessagingPrivacyRepository & {
  snapshot(): InMemoryMessagingPrivacyRepositorySnapshot;
} {
  const idempotencyKeys = new Set<string>();
  const privacyEvents: { tenantId: string; action: MessagingPrivacyAction; redactedMetadata: Record<string, unknown> }[] = [];
  const redactedMessages: { tenantId: string; messageId: string; bodyPreview: string; findings: readonly string[] }[] = [];
  const exportWorkflows: { tenantId: string; action: MessagingPrivacyAction; threadId?: string }[] = [];
  const deleteWorkflows: { tenantId: string; action: MessagingPrivacyAction; threadId?: string }[] = [];
  const retentionWorkflows: { tenantId: string; action: MessagingPrivacyAction; threadId?: string; retentionDays?: number }[] = [];
  const attachmentAuthorizations: { tenantId: string; threadId: string; role: MessagingRole; attachmentUrl: string; status: "allowed" | "denied" }[] = [];
  const moderationDecisions: { tenantId: string; action: MessagingPrivacyAction; spamScore: number; rateLimitAllowed?: boolean }[] = [];
  const auditLogs: { tenantId: string; action: MessagingPrivacyAction; redactedMetadata: Record<string, unknown> }[] = [];

  return {
    async claimIdempotencyKey(input) {
      const scopedKey = `${input.tenantId}:${input.action}:${input.key}`;
      if (idempotencyKeys.has(scopedKey)) return "duplicate";
      idempotencyKeys.add(scopedKey);
      return "claimed";
    },
    async persistPrivacyEvent(input) {
      privacyEvents.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        redactedMetadata: buildRedactedMessagingPrivacyPayload(input.redactedMetadata) as Record<string, unknown>,
      });
    },
    async persistRedactedMessage(input) {
      redactedMessages.push({
        tenantId: input.tenantId,
        messageId: input.messageId,
        bodyPreview: "[redacted-message-body]",
        findings: input.findings,
      });
    },
    async persistExportWorkflow(input) {
      exportWorkflows.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        threadId: input.threadId ?? input.plan.threadId,
      });
    },
    async persistDeleteWorkflow(input) {
      deleteWorkflows.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        threadId: input.threadId ?? input.plan.threadId,
      });
    },
    async persistRetentionWorkflow(input) {
      retentionWorkflows.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        threadId: input.threadId ?? input.plan.threadId,
        retentionDays: input.retentionDays ?? input.plan.retentionDays,
      });
    },
    async authorizeAttachment(input) {
      const status = input.attachmentUrl.includes("/private/") && input.role === "assistant" ? "denied" : "allowed";
      attachmentAuthorizations.push({ ...input, status });
      return status;
    },
    async persistModerationDecision(input) {
      moderationDecisions.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        spamScore: input.spamScore,
        rateLimitAllowed: input.plan.rateLimitAllowed,
      });
    },
    async persistAuditLog(input) {
      auditLogs.push({
        tenantId: input.tenantId,
        action: input.plan.action,
        redactedMetadata: buildRedactedMessagingPrivacyPayload(input.redactedMetadata) as Record<string, unknown>,
      });
    },
    snapshot() {
      return {
        idempotencyKeys: [...idempotencyKeys],
        privacyEvents: [...privacyEvents],
        redactedMessages: [...redactedMessages],
        exportWorkflows: [...exportWorkflows],
        deleteWorkflows: [...deleteWorkflows],
        retentionWorkflows: [...retentionWorkflows],
        attachmentAuthorizations: [...attachmentAuthorizations],
        moderationDecisions: [...moderationDecisions],
        auditLogs: [...auditLogs],
      };
    },
  };
}

export const messagingPrivacyContract = buildMessagingPrivacyContract();
