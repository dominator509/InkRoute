import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { rateLimitRules } from "@inkroute/security";
import { POST } from "../app/api/public/[tenantSlug]/secure-upload-intents/route";

function uploadIntentRequest(body: unknown, clientIp = "203.0.113.44"): NextRequest {
  return new NextRequest("https://local.test/api/public/inkroute-demo/secure-upload-intents", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": clientIp,
      "user-agent": "vitest-secure-upload-route",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const acceptedPrivateReferenceUpload = {
  kind: "reference_private",
  filename: "placement-reference.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 512_000,
};

describe("public secure upload intent route", () => {
  it("rejects malformed upload intent JSON before tenant persistence", async () => {
    const response = await POST(uploadIntentRequest("{"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
  });

  it("rejects unsupported upload metadata with policy reasons", async () => {
    const response = await POST(
      uploadIntentRequest({
        kind: "reference_private",
        filename: "../unsafe.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: 25_000_000,
        declaredByAuthenticatedUser: false,
      }),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "UPLOAD_VALIDATION_FAILED" },
    });
    expect(body.error.reasons.length).toBeGreaterThan(0);
  });

  it("returns tenant-safe 404 responses for unknown upload-intent tenants", async () => {
    const response = await POST(
      uploadIntentRequest(acceptedPrivateReferenceUpload),
      { params: Promise.resolve({ tenantSlug: "unknown-studio" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "TENANT_NOT_FOUND" },
    });
  });

  it("queues accepted private upload intents with scoped runtime security evidence", async () => {
    const response = await POST(
      uploadIntentRequest(acceptedPrivateReferenceUpload),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.tenantSlug).toBe("inkroute-demo");
    expect(body.data.validation).toMatchObject({
      accepted: true,
      storageVisibility: "tenant_private",
    });
    expect(body.data.draft.tenantId).toBe(body.data.tenantId);
    expect(body.data.draft.objectKey).toMatch(new RegExp(`^${body.data.tenantId}/\\d+/placement-reference\\.jpg$`));
    expect(body.data.draft.signedUploadUrl).toContain("/upload/inkroute-demo/");
    expect(body.data.signedIntentPlan).toMatchObject({
      accepted: true,
      status: "provider_gated",
      tenantId: body.data.tenantId,
      subjectId: body.data.draft.id,
      signedUploadUrlRequired: true,
      publicReadAllowed: false,
    });
    expect(body.data.signedIntentPlan.objectKey).toMatch(new RegExp(`^private/${body.data.tenantId}/reference_private/unassigned/${body.data.draft.id}\\.jpg$`));
    expect(body.data.signedIntentPlan.requiredControls).toContain("Private upload objects must not be readable through public URLs before or after scan completion.");
    expect(body.data.privateStoragePlan).toMatchObject({
      status: "provider_gated",
      operation: "upload",
      bucketAcl: "private",
      signedUrlRequired: true,
      publicReadAllowed: false,
      objectKey: body.data.signedIntentPlan.objectKey,
    });
    expect(body.data.privateStoragePlan.requiredControls).toContain("Use private bucket ACLs for original reference, consent, healed-photo, and document assets.");
    expect(body.data.privateStoragePlan.reasons).toContain("Storage provider is not configured.");
    expect(body.data.fileAssetPersistencePlan).toMatchObject({
      status: "blocked",
      tenantId: body.data.tenantId,
      subjectId: body.data.draft.id,
      objectKey: body.data.signedIntentPlan.objectKey,
      accessLevel: "tenant_member",
      publicReadAllowed: false,
      requiredWrites: ["FileAsset", "AuditLog", "BookingReferenceImage"],
    });
    expect(body.data.fileAssetPersistencePlan.blockers).toEqual(expect.arrayContaining([
      "Object storage provider must be configured before FileAsset persistence is production-ready.",
      "Tenant-scoped FileAsset store must be configured before upload metadata can persist.",
      "FileAsset cannot be exposed or finalized before upload scan approval.",
    ]));
    expect(body.data.localRuntime.gapIds).toEqual(expect.arrayContaining(["GAP-096", "GAP-097"]));
    expect(body.data.nextWork).toEqual(expect.arrayContaining([
      "Scan and strip metadata from media before status transitions.",
      "Generate public derivative only after private visibility checks.",
    ]));
  });

  it("throttles repeated secure upload intent attempts per tenant and client", async () => {
    const uploadRule = rateLimitRules.find((rule) => rule.id === "public-upload-intent");
    expect(uploadRule).toBeDefined();

    const responses = [];
    for (let attempt = 0; attempt <= uploadRule!.maxRequests; attempt += 1) {
      responses.push(
        await POST(uploadIntentRequest(acceptedPrivateReferenceUpload, "203.0.113.240"), {
          params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
        }),
      );
    }

    const throttled = responses.at(-1)!;
    const body = await throttled.json();

    expect(responses.slice(0, -1).every((response) => response.status === 201)).toBe(true);
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBeTruthy();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        details: {
          gapIds: ["GAP-005", "GAP-096", "GAP-097"],
          remaining: 0,
        },
      },
    });
  });
});
