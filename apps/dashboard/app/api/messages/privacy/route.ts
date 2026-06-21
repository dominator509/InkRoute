import { NextResponse, type NextRequest } from "next/server";
import type { MessagingPrivacyAction, MessagingRole } from "@inkroute/notifications";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";
import { buildMessagingPrivacyPlanFromRequest, messagingPrivacyContract } from "../../../../lib/messagingPrivacy";

const actions: readonly MessagingPrivacyAction[] = ["redact_message", "authorize_message_view", "export_thread", "delete_thread", "apply_retention", "moderate_message"];
const roles: readonly MessagingRole[] = ["client", "artist", "assistant", "studio_manager", "admin"];

function parseAction(value: unknown): MessagingPrivacyAction {
  return typeof value === "string" && actions.includes(value as MessagingPrivacyAction) ? (value as MessagingPrivacyAction) : "authorize_message_view";
}

function parseRole(value: unknown): MessagingRole {
  return typeof value === "string" && roles.includes(value as MessagingRole) ? (value as MessagingRole) : "artist";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to inspect messaging privacy controls." } }, { status: 403, headers: noStoreHeaders });
  }
  const tenantId = request.nextUrl.searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot inspect messaging privacy for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }
  return NextResponse.json({ ok: true, tenantId, contract: messagingPrivacyContract, gapIds: ["GAP-068"] }, { headers: noStoreHeaders });
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to plan messaging privacy mutations." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_MESSAGING_PRIVACY_JSON", message: "Messaging privacy request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot plan messaging privacy mutations for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const plan = buildMessagingPrivacyPlanFromRequest({
    tenantId,
    action: parseAction(body.action),
    role: parseRole(body.role ?? actor.role),
    actorId: actor.actorUserId,
    ...(typeof body.threadId === "string" ? { threadId: body.threadId } : {}),
    ...(typeof body.messageId === "string" ? { messageId: body.messageId } : {}),
    ...(typeof body.body === "string" ? { body: body.body } : {}),
    ...(typeof body.bodyRedacted === "boolean" ? { bodyRedacted: body.bodyRedacted } : {}),
    ...(typeof body.attachmentUrl === "string" ? { attachmentUrl: body.attachmentUrl } : {}),
    ...(typeof body.attachmentPolicyApproved === "boolean" ? { attachmentPolicyApproved: body.attachmentPolicyApproved } : {}),
    ...(typeof body.retentionDays === "number" ? { retentionDays: body.retentionDays } : {}),
    ...(typeof body.exportIncludesProviderPayloads === "boolean" ? { exportIncludesProviderPayloads: body.exportIncludesProviderPayloads } : {}),
    ...(typeof body.exportIncludesPrivateUrls === "boolean" ? { exportIncludesPrivateUrls: body.exportIncludesPrivateUrls } : {}),
    ...(typeof body.deleteRequestedAt === "string" ? { deleteRequestedAt: body.deleteRequestedAt } : {}),
    ...(typeof body.spamScore === "number" ? { spamScore: body.spamScore } : {}),
    ...(typeof body.rateLimitAllowed === "boolean" ? { rateLimitAllowed: body.rateLimitAllowed } : {}),
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : `messaging-privacy:${tenantId}:${body.action ?? "authorize_message_view"}`,
  });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        tenantId,
        error: {
          code: "MESSAGING_PRIVACY_WORKFLOW_PERSISTENCE_NOT_CONFIGURED",
          message:
            "Production messaging privacy mutations require durable MessagePrivacyEvent, MessageAuditLog, IdempotencyKey, export/delete/retention workflow, moderation, and attachment authorization persistence; local-contract fallback responses are disabled.",
          gapIds: ["GAP-068"],
        },
        plan,
        requiredRepositoryMethods: messagingPrivacyContract.requiredRepositoryMethods,
        productionBoundary: {
          messagingPrivacyLocalContractFallbackDisabled: true,
          requiresPrivacyWorkflowPersistence: true,
          requiresAuditAndIdempotencyPersistence: true,
          requiresSecureAttachmentAuthorization: true,
          gapIds: ["GAP-068"],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantId,
      plan,
      requiredRepositoryMethods: messagingPrivacyContract.requiredRepositoryMethods,
      gapIds: ["GAP-068"],
      boundary: "Messaging privacy POST returns the local redaction/export/delete/retention/moderation contract; durable workflow repositories remain required for live execution.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
