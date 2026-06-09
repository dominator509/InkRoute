import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  providerSessionRuntimeArtifactPaths,
  providerSessionRuntimeCommands,
  providerSessionRuntimeControls,
  providerSessionRuntimeMatrix,
  providerSessionRuntimeReadiness,
} from "../lib/providerSessionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider session runtime contract", () => {
  const authPackageJson = readRepoFile("packages/auth/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const dashboardMiddlewareTest = readRepoFile("apps/dashboard/tests/dashboard-auth-middleware-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins provider session commands, controls, matrix rows, and artifacts", () => {
    expect(providerSessionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "provider-backed login callback test",
      "provider-backed logout callback test",
      "provider-backed session callback and TenantMember lookup test",
      "dashboard/API tenant isolation smoke tests",
      "mobile session storage/revocation smoke tests",
    ]);
    expect(providerSessionRuntimeControls).toContain("server-side-tenant-member-lookup");
    expect(providerSessionRuntimeControls).toContain("cross-tenant-session-denial");
    expect(providerSessionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-package-typecheck",
      "auth-package-tests",
      "provider-selection-env",
      "login-callback",
      "logout-callback",
      "session-callback-tenant-lookup",
      "session-role-persistence",
      "cookie-mobile-security",
      "auth-audit-log",
      "tenant-isolation-smoke",
      "mobile-revocation-smoke",
    ]);
    expect(providerSessionRuntimeArtifactPaths).toContain("coverage/provider-session-runtime.json");
    expect(providerSessionRuntimeArtifactPaths).toContain("test-results/provider-session-runtime");
  });

  it("keeps auth helper, package tests, and dashboard middleware guardrails wired", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    expect(authSource).toContain("buildProviderSessionStoreReadinessPlan");
    expect(authTests).toContain("buildProviderSessionStoreReadinessPlan");
    expect(dashboardMiddleware).toContain("/login?next=");
    expect(dashboardMiddlewareTest).toContain("AUTH_REQUIRED");
  });

  it("keeps provider-backed auth blockers explicit until real provider evidence exists", () => {
    expect(providerSessionRuntimeReadiness.status).toBe("blocked");
    expect(providerSessionRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerSessionRuntimeReadiness.requiredCommands).toEqual([...providerSessionRuntimeCommands]);
    expect(providerSessionRuntimeReadiness.requiredControls).toEqual([
      "Map provider identity to application User records without trusting client headers.",
      "Resolve TenantMember and CustomRole rows server-side for every guarded request.",
      "Persist active sessions and revocations before route authorization.",
      "Use secure dashboard cookies and secure mobile token storage with logout/revocation clearing.",
      "Write redacted AuditLog rows for auth lifecycle and authorization decisions.",
      "Deny cross-tenant provider sessions in dashboard, API, and mobile surfaces.",
    ]);
    expect(providerSessionRuntimeReadiness.requiredEvidence).toContain(
      "provider selection, redacted environment/callback configuration, and login/logout/session callback evidence",
    );
    expect(providerSessionRuntimeReadiness.blockers).toContain(
      "Auth provider must be selected before provider-backed sessions can be claimed.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider sessions are configured", () => {
    expect(ciWorkflow).toContain("Run Phase 1 provider session runtime contracts");
    expect(ciWorkflow).toContain("provider-session-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-session-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-provider-session-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerSessionRuntime.ts");
    expect(gapTracker).toContain("live provider selection/env/callbacks, persisted session store, revocation, audit logs, provider-backed tests, tenant-isolation smoke tests, and command evidence remain open");
  });
});
