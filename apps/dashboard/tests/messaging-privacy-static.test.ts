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
    expect(privacySource).toContain("claimIdempotencyKey");
    expect(privacySource).toContain("persistPrivacyEvent");
    expect(privacySource).toContain("persistRedactedMessage");
    expect(privacySource).toContain("persistExportWorkflow");
    expect(privacySource).toContain("persistDeleteWorkflow");
    expect(privacySource).toContain("persistRetentionWorkflow");
    expect(privacySource).toContain("persistModerationDecision");
    expect(privacySource).toContain("persistAuditLog");
  });

  it("wires a dashboard privacy API boundary with RBAC, tenant scope, no-store, and planning output", () => {
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function POST");
    expect(routeSource).toContain('assertPermission(actor, "message:read")');
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain("buildMessagingPrivacyPlanFromRequest");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("surfaces privacy and retention plans on the dashboard messages page", () => {
    expect(pageSource).toContain("messagingPrivacyContract");
    expect(pageSource).toContain("Messaging privacy contract");
    expect(pageSource).toContain("Retention workflows");
    expect(pageSource).toContain("Assistant visibility");
  });
});
