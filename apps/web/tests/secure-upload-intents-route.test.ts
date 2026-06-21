import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import {
  buildPrivateStorageAccessPlan,
  buildReferenceUploadProviderEvidencePlan,
  buildSignedUploadIntentRequiredControls,
  privateStorageAccessRequiredControls,
  rateLimitRules,
  referenceUploadProviderEvidenceRequiredControls,
  referenceUploadProviderEvidenceRequiredEvidence,
} from "@inkroute/security";
import { POST } from "../app/api/public/[tenantSlug]/secure-upload-intents/route";

const routeSource = readFileSync(resolve(__dirname, "../app/api/public/[tenantSlug]/secure-upload-intents/route.ts"), "utf8");

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
  it("keeps upload route identifiers and tenant-safe error copy uncorrupted", () => {
    expect(routeSource).toContain("buildReferenceUploadProviderEvidencePlan");
    expect(routeSource).toContain("buildSignedUploadIntentPlan");
    expect(routeSource).toContain("validateUploadDraft");
    expect(routeSource).toContain("persistUploadIntent");
    expect(routeSource).toContain("declaredByAuthenticatedUser");
    expect(routeSource).toContain("localUploadIntentDisabled");
    expect(routeSource).toContain("providerSignedUploadUrlIssued");
    expect(routeSource).toContain("byteUploadVerified");
    expect(routeSource).not.toContain("ppload");
    expect(routeSource).not.toContain("pRL");
    expect(routeSource).not.toContain("pser");
  });

  it("pins upload route control catalogs to the package helper identities before JSON serialization", () => {
    const privateStoragePlan = buildPrivateStorageAccessPlan({
      kind: "reference_private",
      operation: "upload",
      tenantId: "tenant_001",
      subjectId: "reference_001",
      objectKey: "private/tenant_001/reference_private/reference_001.jpg",
      storageVisibility: "client_private",
      expiresInSeconds: 900,
      now: "2026-06-20T12:00:00.000Z",
      expiresAt: "2026-06-20T12:15:00.000Z",
      scanApproved: false,
      providerConfigured: false,
    });
    const providerEvidencePlan = buildReferenceUploadProviderEvidencePlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: false,
      securityTypecheckPassed: false,
      webUploadRouteTestsPassed: false,
      webTypecheckPassed: false,
      uploadIntentRouteUsesSignedPlan: false,
      providerSignedUploadUrlIssued: false,
      byteUploadVerified: false,
      magicByteValidationPassed: false,
      malwareScanConfigured: false,
      quarantineFlowVerified: false,
      privateBucketAclVerified: false,
      fileAssetRowsPersisted: false,
      bookingReferenceImageRowsPersisted: false,
      auditLogRowsPersisted: false,
      privateFetchDenied: false,
      crossTenantFetchDenied: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(privateStoragePlan.requiredControls).toBe(privateStorageAccessRequiredControls);
    expect(providerEvidencePlan.requiredControls).toBe(referenceUploadProviderEvidenceRequiredControls);
  });

  it("rejects malformed upload intent JSON before tenant persistence", async () => {
    const response = await POST(uploadIntentRequest("{"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
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
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      ok: false,
      error: { code: "UPLOAD_VALIDATION_FAILED" },
    });
    expect(body.error.message).toContain("local signed-upload validation rules");
    expect(body.error.reasons.length).toBeGreaterThan(0);
  });

  it("returns tenant-safe 404 responses for unknown upload-intent tenants", async () => {
    const response = await POST(
      uploadIntentRequest(acceptedPrivateReferenceUpload),
      { params: Promise.resolve({ tenantSlug: "unknown-studio" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      ok: false,
      error: { code: "TENANT_NOT_FOUND", message: "Upload intents are available for local demo tenant slug only." },
    });
  });

  it("queues accepted private upload intents with scoped runtime security evidence", async () => {
    const response = await POST(
      uploadIntentRequest(acceptedPrivateReferenceUpload),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
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
    expect(body.data.signedIntentPlan.requiredControls).toEqual(
      buildSignedUploadIntentRequiredControls(body.data.validation),
    );
    expect(body.data.privateStoragePlan).toMatchObject({
      status: "provider_gated",
      operation: "upload",
      bucketAcl: "private",
      signedUrlRequired: true,
      publicReadAllowed: false,
      objectKey: body.data.signedIntentPlan.objectKey,
    });
    expect(body.data.privateStoragePlan.requiredControls).toEqual(privateStorageAccessRequiredControls);
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
    expect(body.data.referenceUploadProviderEvidencePlan).toMatchObject({
      status: "blocked",
      missingScripts: [],
    });
    expect(body.data.referenceUploadProviderEvidencePlan.requiredControls).toEqual(
      referenceUploadProviderEvidenceRequiredControls,
    );
    expect(body.data.referenceUploadProviderEvidencePlan.requiredEvidence).toBe(referenceUploadProviderEvidenceRequiredEvidence);
    expect(body.data.referenceUploadProviderEvidencePlan.blockers).toEqual(expect.arrayContaining([
      "Byte upload verification must prove the uploaded object matches declared size and upload intent.",
      "Magic-byte validation must verify uploaded file content before scan approval.",
      "Cross-tenant reference fetch-denial tests must pass.",
    ]));
    expect(body.data.localRuntime.gapIds).toEqual(expect.arrayContaining(["GAP-096", "GAP-097"]));
    expect(body.data.nextWork).toEqual(expect.arrayContaining([
      "Scan and strip metadata from media before status transitions.",
      "Generate public derivative only after private visibility checks.",
    ]));
  });

  it("fail-closes production upload intents instead of returning local provider-gated previews", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await POST(
        uploadIntentRequest(acceptedPrivateReferenceUpload, "203.0.113.245"),
        { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
      );
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(body).toMatchObject({
        ok: false,
        error: { code: "PROVIDER_STORAGE_NOT_CONFIGURED" },
        data: {
          productionBoundary: {
            localUploadIntentDisabled: true,
            gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
          },
        },
      });
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
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
    expect(throttled.headers.get("Cache-Control")).toBe("no-store");
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
