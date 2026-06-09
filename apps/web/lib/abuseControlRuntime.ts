import {
  buildAbuseControlPlan,
  buildAbuseControlRuntimeReadinessPlan,
  rateLimitRules,
  type AbuseSignal,
} from "@inkroute/security";

export type AbuseRuntimeAction =
  | "load-route-family-policy"
  | "derive-tenant-safe-abuse-key"
  | "check-distributed-rate-limit"
  | "apply-bot-challenge"
  | "bypass-valid-provider-webhook"
  | "reject-invalid-provider-webhook"
  | "persist-redacted-abuse-event"
  | "emit-throttling-alert"
  | "fail-closed-on-limiter-error";

export const abuseControlRouteFamilies = [
  "public-booking-submit",
  "public-upload-intent",
  "public-privacy-request",
  "public-message",
  "fallback-error-report",
  "provider-webhook",
  "dashboard-mutation",
] as const;

export const abuseControlArtifactPaths = [
  "coverage/abuse-control-runtime.json",
  "coverage/abuse-rate-limit-distributed.json",
  "coverage/abuse-bot-challenge.json",
  "coverage/abuse-provider-webhook-bypass.json",
  "coverage/abuse-invalid-webhook-challenge.json",
  "coverage/abuse-event-redaction.json",
  "coverage/abuse-alert-delivery-redacted.json",
  "coverage/abuse-fail-closed.json",
  "test-results/abuse-control-runtime",
] as const;

export const abuseControlCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/abuse-control-runtime-static.test.ts apps/web/tests/booking-requests-contract.test.ts apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/error-report-ingest-hardening-static.test.ts",
  "node scripts/security/verify-abuse-rate-limits.mjs",
  "node scripts/security/verify-abuse-alerts.mjs",
  "distributed rate-limit provider integration test",
  "bot challenge route integration test",
  "provider webhook signature bypass/rejection test",
] as const;

export function buildAbuseControlRuntimeContract(input: {
  ruleId: string;
  tenantId: string;
  ipHash: string;
  userId?: string;
  observedRequests: number;
  windowSeconds: number;
  userAgent?: string;
  routePath: string;
  providerSignatureValid?: boolean;
  redisConfigured: boolean;
  botChallengeConfigured: boolean;
  alertingConfigured: boolean;
}) {
  const plan = buildAbuseControlPlan(input);
  const actions: AbuseRuntimeAction[] = [
    "load-route-family-policy",
    "derive-tenant-safe-abuse-key",
    "check-distributed-rate-limit",
    "persist-redacted-abuse-event",
    "emit-throttling-alert",
    "fail-closed-on-limiter-error",
  ];

  if (plan.challengeRequired) actions.push("apply-bot-challenge");
  if (input.providerSignatureValid === true) actions.push("bypass-valid-provider-webhook");
  if (input.providerSignatureValid === false) actions.push("reject-invalid-provider-webhook");

  return {
    gapIds: ["GAP-101"] as const,
    plan,
    actions,
    routeFamilies: abuseControlRouteFamilies,
    signals: plan.signals as readonly AbuseSignal[],
    artifactPaths: abuseControlArtifactPaths,
  };
}

export const abuseControlRuntimeReadiness = buildAbuseControlRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  distributedLimiterConfigured: false,
  limiterEnvVarsConfigured: false,
  edgeOrMiddlewareWired: false,
  routeFamilyPoliciesApplied: true,
  tenantSafeKeysVerified: true,
  botChallengeProviderConfigured: false,
  botChallengeRouteTestsPassed: false,
  providerWebhookSignatureBypassVerified: false,
  invalidWebhookSignatureChallengeVerified: false,
  privacySafeAbuseLogPersistenceConfigured: false,
  abuseLogRedactionVerified: false,
  alertDeliveryConfigured: false,
  throttlingAlertSmokePassed: false,
  failClosedBehaviorVerified: false,
  publicRouteIntegrationTestsPassed: false,
});

export const abuseControlRuntimePreview = buildAbuseControlRuntimeContract({
  ruleId: "public-booking-submit",
  tenantId: "tenant_demo",
  ipHash: "ip_hash_demo",
  observedRequests: 12,
  windowSeconds: 3600,
  userAgent: "Vitest bot fixture",
  routePath: "/api/public/inkroute-demo/booking-requests/../admin",
  redisConfigured: false,
  botChallengeConfigured: false,
  alertingConfigured: false,
});

export const abuseControlKnownRateLimitRules = rateLimitRules.map((rule) => ({
  id: rule.id,
  routePattern: rule.routePattern,
  keyStrategy: rule.keyStrategy,
  gapIds: rule.gapIds,
}));
