import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile API client static contract", () => {
  const apiClientSource = readWorkspaceFile("apps/mobile/src/lib/mobileApiClient.ts");
  const homeScreenSource = readWorkspaceFile("apps/mobile/src/screens/HomeScreen.tsx");
  const bookingScreenSource = readWorkspaceFile("apps/mobile/src/screens/BookingRequestsScreen.tsx");

  it("uses shared mobile-support request planning for tenant/auth/request-id headers", () => {
    expect(apiClientSource).toContain("buildMobileApiRequestPlan");
    expect(apiClientSource).toContain("baseUrl: session.baseUrl");
    expect(apiClientSource).toContain("tenantId: session.tenantId");
    expect(apiClientSource).toContain("accessToken: session.accessToken");
    expect(apiClientSource).toContain("requestId: request.requestId");
    expect(apiClientSource).toContain("idempotencyKey: request.idempotencyKey");
  });

  it("blocks unsafe requests before fetch and redacts response errors", () => {
    expect(apiClientSource).toContain('if (plan.status !== "ready" || !plan.url)');
    expect(apiClientSource).toContain("plan.blockers.join");
    expect(apiClientSource).toContain("Sensitive response details were redacted");
    expect(apiClientSource).not.toContain("await response.text()");
  });

  it("validates response envelopes before screens consume data", () => {
    expect(apiClientSource).toContain("assertMobileApiEnvelope");
    expect(apiClientSource).toContain('typeof envelope.ok !== "boolean"');
    expect(apiClientSource).toContain("envelope.requestId !== requestId");
    expect(apiClientSource).toContain('"INVALID_ENVELOPE"');
  });

  it("surfaces API sync coverage in mobile screens without hiding runtime gates", () => {
    expect(homeScreenSource).toContain("mobileApiSyncPreview");
    expect(homeScreenSource).toContain("API sync contract");
    expect(bookingScreenSource).toContain("mobileApiSyncPreview");
    expect(bookingScreenSource).toContain("Typed client ready");
    expect(bookingScreenSource).toContain("provider auth and seeded API smoke");
  });
});
