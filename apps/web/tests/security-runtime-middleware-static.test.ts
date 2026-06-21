import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..", "..");

function readWorkspaceFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("web security runtime middleware wiring", () => {
  it("applies shared security header and CSRF enforcement plans at the Next middleware boundary", () => {
    const source = readWorkspaceFile("apps/web/middleware.ts");

    expect(source).toContain('import { buildSecurityRuntimeEnforcementPlan } from "@inkroute/security"');
    expect(source).toContain("export function middleware");
    expect(source).toContain("for (const header of plan.headers)");
    expect(source).toContain("X-InkRoute-Security-Runtime");
    expect(source).toContain("https://api.stripe.com");
    expect(source).toContain("https://sentry.io");
    expect(source).toContain("CSRF_TOKEN_REQUIRED");
    expect(source).toContain("x-csrf-token");
    expect(source).toContain("inkroute_csrf");
    expect(source).toContain("cookieAuthenticatedMutation");
    expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(source).toContain("headers: noStoreHeaders");
    expect(source).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(source).toContain("request.cookies.has(name)");
  });

  it("keeps static assets outside middleware while protecting application and API paths", () => {
    const source = readWorkspaceFile("apps/web/middleware.ts");

    expect(source).toContain("matcher");
    expect(source).toContain("_next/static");
    expect(source).toContain("_next/image");
    expect(source).toContain("favicon.ico");
  });
});
