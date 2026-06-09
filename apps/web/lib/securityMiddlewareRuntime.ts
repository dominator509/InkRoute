import {
  buildSecurityMiddlewareRuntimeReadinessPlan,
  buildSecurityRuntimeEnforcementPlan,
  csrfControlPlans,
} from "@inkroute/security";

export type SecurityMiddlewareEvidenceAction =
  | "apply-web-security-headers"
  | "apply-dashboard-security-headers"
  | "block-cookie-authenticated-csrf-attack"
  | "allow-valid-csrf-session-bound-mutation"
  | "verify-samesite-cookie-behavior"
  | "verify-production-hsts-only"
  | "verify-preview-local-hsts-suppression"
  | "verify-provider-csp-connect-src"
  | "verify-frame-base-form-csp-invariants"
  | "review-signed-webhook-csrf-bypass"
  | "capture-browser-header-smoke";

export const securityMiddlewareArtifactPaths = [
  "coverage/security-middleware-runtime.json",
  "coverage/security-web-header-browser-smoke.json",
  "coverage/security-dashboard-header-browser-smoke.json",
  "coverage/security-production-hsts.json",
  "coverage/security-preview-local-hsts-suppression.json",
  "coverage/security-provider-csp-connect-src.json",
  "coverage/security-csp-frame-base-form-invariants.json",
  "coverage/security-csrf-attack-rejection.json",
  "coverage/security-csrf-valid-session-binding.json",
  "coverage/security-webhook-csrf-bypass-review.json",
  "test-results/security-middleware-runtime",
] as const;

export const securityMiddlewareCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/security-runtime-middleware.test.ts apps/web/tests/security-runtime-middleware-static.test.ts apps/web/tests/dashboard-security-runtime-middleware-static.test.ts apps/web/tests/security-middleware-runtime-static.test.ts",
  "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
  "browser security header smoke tests",
  "deployment HSTS proof",
  "provider CSP connect-src smoke",
  "signed webhook CSRF bypass review",
] as const;

export function buildSecurityMiddlewareRuntimeContract() {
  const csrfAttack = buildSecurityRuntimeEnforcementPlan({
    environment: "production",
    httpsEnabled: true,
    appSurface: "web",
    extraConnectSources: ["https://sentry.io", "https://api.stripe.com"],
    cookieAuthenticatedMutation: true,
    method: "POST",
    csrfTokenPresent: false,
    csrfTokenValid: false,
    sameSiteCookie: "lax",
  });
  const csrfAllowed = buildSecurityRuntimeEnforcementPlan({
    environment: "production",
    httpsEnabled: true,
    appSurface: "dashboard",
    extraConnectSources: ["https://sentry.io", "https://api.stripe.com"],
    cookieAuthenticatedMutation: true,
    method: "PATCH",
    csrfTokenPresent: true,
    csrfTokenValid: true,
    sameSiteCookie: "strict",
  });
  const readiness = buildSecurityMiddlewareRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    securityTestsPassed: false,
    securityTypecheckPassed: false,
    webMiddlewareWired: true,
    dashboardMiddlewareWired: true,
    webHeaderBrowserSmokePassed: false,
    dashboardHeaderBrowserSmokePassed: false,
    productionHstsDeploymentVerified: false,
    previewLocalHstsSuppressionVerified: false,
    cspProviderConnectSourcesVerified: false,
    cspFrameBaseFormInvariantsVerified: false,
    csrfCookieMutationAttackTestsPassed: true,
    csrfValidTokenAllowTestsPassed: true,
    sameSiteCookieBehaviorVerified: false,
    csrfSessionBindingVerified: false,
    providerWebhookCsrfBypassReviewed: false,
    routeRuntimeIntegrationTestsPassed: false,
  });
  const actions: SecurityMiddlewareEvidenceAction[] = [
    "apply-web-security-headers",
    "apply-dashboard-security-headers",
    "block-cookie-authenticated-csrf-attack",
    "allow-valid-csrf-session-bound-mutation",
    "verify-samesite-cookie-behavior",
    "verify-production-hsts-only",
    "verify-preview-local-hsts-suppression",
    "verify-provider-csp-connect-src",
    "verify-frame-base-form-csp-invariants",
    "review-signed-webhook-csrf-bypass",
    "capture-browser-header-smoke",
  ];

  return {
    gapIds: ["GAP-102"] as const,
    csrfAttack,
    csrfAllowed,
    readiness,
    actions,
    csrfControlPlans,
    artifactPaths: securityMiddlewareArtifactPaths,
  };
}

export const securityMiddlewareRuntimeContract = buildSecurityMiddlewareRuntimeContract();
