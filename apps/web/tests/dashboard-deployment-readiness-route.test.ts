import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../../dashboard/app/api/deployment/readiness/route";

function deploymentRequest(method: "GET" | "POST", body?: unknown, role = "owner"): NextRequest {
  return new NextRequest("https://local.test/api/dashboard/deployment/readiness", {
    method,
    headers: {
      "content-type": "application/json",
      "x-user-role": role,
      "x-user-id": "deployment-operator-1",
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("dashboard deployment readiness route", () => {
  it("returns a local-fallback production-blocked readiness payload for authorized readers", async () => {
    const response = await GET(deploymentRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe("local-fallback");
    expect(body.operationMode).toBe("read-only");
    expect(body.productionBlocked).toBe(true);
    expect(body.environment.productionBlocked).toBe(true);
    expect(body.plan.productionBlockers.length).toBeGreaterThan(0);
    expect(body.checklist.length).toBeGreaterThan(0);
    expect(body.handoffTasks.length).toBeGreaterThan(0);
    expect(body.boundary).toContain("deployment actions remain external");
    expect(body.gapIds).toEqual(expect.arrayContaining(["GAP-089", "GAP-114", "GAP-115"]));
  });

  it("denies deployment readiness reads for roles without release read permission", async () => {
    const response = await GET(deploymentRequest("GET", undefined, "assistant"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it("rejects malformed deployment readiness mutation JSON", async () => {
    const response = await POST(deploymentRequest("POST", "not-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
  });

  it("records local-fallback rollback preflight requests without executing external providers", async () => {
    const response = await POST(
      deploymentRequest("POST", {
        operation: "request-rollback-plan",
        targetEnvironment: "preview",
        reason: "Smoke test rollback drill",
        requestId: "rollback-preview-001",
        blockerIds: ["launch-foundation-install"],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe("local-fallback");
    expect(body.persistence).toBe("local-fallback");
    expect(body.operation).toBe("request-rollback-plan");
    expect(body.operationResult.status).toBe("preflight-only");
    expect(body.operationResult.boundary).toContain("execution remains outside this API");
    expect(body.requestId).toBe("rollback-preview-001");
    expect(body.plan.environment).toBe("preview");
  });

  it("keeps production approval requests blocked until protected CI/CD environments exist", async () => {
    const response = await POST(
      deploymentRequest("POST", {
        operation: "request-production-approval",
        targetEnvironment: "production",
        reason: "Attempt production approval before providers are ready",
        blockerIds: ["provider-sandboxes", "legal-review"],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(true);
    expect(body.operationResult.implemented).toBe(false);
    expect(body.operationResult.status).toBe("blocked");
    expect(body.warning).toContain("does not perform external provider calls");
    expect(body.environment.productionBlocked).toBe(true);
  });
});
