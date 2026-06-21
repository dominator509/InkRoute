import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const privacySource = readFileSync(join(process.cwd(), "apps/dashboard/lib/messagingPrivacy.ts"), "utf8");
const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/messages/privacy/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/messages/page.tsx"), "utf8");

describe("messaging privacy contract", () => {
  it("uses notification package runtime readiness and privacy plan helpers", () => {
    expect(privacySource).toContain("buildMessagingPrivacyRuntimeReadinessPlan");
    expect(privacySource).toContain("buildMessagingPrivacyPlan");
    expect(privacySource).toContain("messagingPrivacyContract");
    expect(privacySource).toContain("Redacted message contract view");
    expect(privacySource).not.toContain("Redacted message preview only");
  });

  it("covers redaction, role visibility, export, delete, retention, moderation, and attachment authorization", () => {
    expect(privacySource).toContain('action: "redact_message"');
    expect(privacySource).toContain('action: "authorize_message_view"');
    expect(privacySource).toContain('action: "export_thread"');
    expect(privacySource).toContain('action: "delete_thread"');
    expect(privacySource).toContain('action: "apply_retention"');
    expect(privacySource).toContain('action: "moderate_message"');
    expect(privacySource).toContain("authorizeAttachment");
    expect(privacySource).toContain("spamScore");
  });

  it("defines repository seams for privacy events, redactions, workflows, audit, and idempotency", () => {
    expect(privacySource).toContain("MessagingPrivacyRepository");
    expect(privacySource).toContain("createInMemoryMessagingPrivacyRepository");
    expect(privacySource).toContain("buildRedactedMessagingPrivacyPayload");
    expect(privacySource).toContain("claimIdempotencyKey");
    expect(privacySource).toContain("persistPrivacyEvent");
    expect(privacySource).toContain("persistRedactedMessage");
    expect(privacySource).toContain("persistExportWorkflow");
    expect(privacySource).toContain("persistDeleteWorkflow");
    expect(privacySource).toContain("persistRetentionWorkflow");
    expect(privacySource).toContain("persistModerationDecision");
    expect(privacySource).toContain("persistAuditLog");
  });

  it("redacts nested messaging privacy payloads before retained workflow or audit storage", async () => {
    const { buildRedactedMessagingPrivacyPayload } = await import("../lib/messagingPrivacy");
    const redacted = buildRedactedMessagingPrivacyPayload({
      providerPayload: { token: "secret-provider-token", message: "ari@example.test called +1 206 555 0142" },
      body: "card details, allergy notes, and https://storage.example.test/private/file?token=secret",
      nested: [{ medicalNote: "diagnosis details" }],
    });

    expect(JSON.stringify(redacted)).not.toContain("secret-provider-token");
    expect(JSON.stringify(redacted)).not.toContain("ari@example.test");
    expect(JSON.stringify(redacted)).not.toContain("206 555 0142");
    expect(JSON.stringify(redacted)).not.toContain("storage.example.test/private");
    expect(JSON.stringify(redacted)).toContain("[redacted]");
  });

  it("executes local privacy workflows with idempotency, workflow rows, attachment authorization, moderation, and audit capture", async () => {
    const {
      buildMessagingPrivacyPlanFromRequest,
      createInMemoryMessagingPrivacyRepository,
      executeMessagingPrivacyPlan,
    } = await import("../lib/messagingPrivacy");
    const repository = createInMemoryMessagingPrivacyRepository();
    const exportPlan = buildMessagingPrivacyPlanFromRequest({
      tenantId: "tenant_demo",
      action: "export_thread",
      role: "studio_manager",
      actorId: "manager_demo",
      threadId: "thread_demo",
      body: "ari@example.test requested export with private https://storage.example.test/private/file",
      bodyRedacted: true,
      exportIncludesProviderPayloads: false,
      exportIncludesPrivateUrls: false,
      attachmentUrl: "https://storage.example.test/private/file",
      attachmentPolicyApproved: true,
      idempotencyKey: "privacy:export:thread_demo",
    });

    await expect(
      executeMessagingPrivacyPlan(repository, exportPlan, {
        tenantId: "tenant_demo",
        threadId: "thread_demo",
        attachmentUrl: "https://storage.example.test/private/file",
      }),
    ).resolves.toMatchObject({ status: "processed" });
    await expect(
      executeMessagingPrivacyPlan(repository, exportPlan, {
        tenantId: "tenant_demo",
        threadId: "thread_demo",
        attachmentUrl: "https://storage.example.test/private/file",
      }),
    ).resolves.toMatchObject({ status: "duplicate" });

    const moderationPlan = buildMessagingPrivacyPlanFromRequest({
      tenantId: "tenant_demo",
      action: "moderate_message",
      role: "studio_manager",
      actorId: "moderator_demo",
      messageId: "message_spam",
      body: "spam plus card and allergy details",
      bodyRedacted: true,
      spamScore: 91,
      rateLimitAllowed: false,
      idempotencyKey: "privacy:moderate:message_spam",
    });
    await expect(
      executeMessagingPrivacyPlan(repository, moderationPlan, {
        tenantId: "tenant_demo",
        messageId: "message_spam",
        spamScore: 91,
      }),
    ).resolves.toMatchObject({ status: "processed" });

    const snapshot = repository.snapshot();
    expect(snapshot.idempotencyKeys).toHaveLength(2);
    expect(snapshot.exportWorkflows).toEqual([{ tenantId: "tenant_demo", action: "export_thread", threadId: "thread_demo" }]);
    expect(snapshot.attachmentAuthorizations).toEqual([
      {
        tenantId: "tenant_demo",
        threadId: "thread_demo",
        role: "studio_manager",
        attachmentUrl: "https://storage.example.test/private/file",
        status: "allowed",
      },
    ]);
    expect(snapshot.moderationDecisions).toEqual([
      { tenantId: "tenant_demo", action: "moderate_message", spamScore: 91, rateLimitAllowed: false },
    ]);
    expect(snapshot.auditLogs).toHaveLength(2);
  });

  it("wires a dashboard privacy API boundary with RBAC, tenant scope, no-store, and planning output", () => {
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function POST");
    expect(routeSource).toContain('assertPermission(actor, "message:read")');
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain("buildMessagingPrivacyPlanFromRequest");
    expect(routeSource).toContain("role: parseRole(body.role, actor.role)");
    expect(routeSource).toContain("MESSAGING_PRIVACY_WORKFLOW_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("messagingPrivacyLocalContractFallbackDisabled");
    expect(routeSource).toContain("Messaging privacy POST returns the local redaction/export/delete/retention/moderation contract");
    expect(routeSource).not.toContain("messagingPrivacyPlanOnlyWritesDisabled");
    expect(routeSource).not.toContain("plan-only responses are disabled");
    expect(routeSource).toContain("requiresPrivacyWorkflowPersistence");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('}, { status: 400 });');
    expect(routeSource).not.toContain('}, { status: 403 });');
  });

  it("surfaces privacy and retention plans on the dashboard messages page", () => {
    expect(pageSource).toContain("messagingPrivacyContract");
    expect(pageSource).toContain("Messaging privacy contract");
    expect(pageSource).toContain("Retention workflows");
    expect(pageSource).toContain("Assistant visibility");
  });
});
