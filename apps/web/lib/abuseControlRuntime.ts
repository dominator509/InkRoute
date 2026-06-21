import {
  buildAbuseControlPlan,
  buildAbuseControlRuntimeReadinessPlan,
  rateLimitRules,
  type AbuseSignal,
} from "@inkroute/security";

export type AbuseRuntimeAction =
  | "load-route-family-policy"
  | "enforce-route-local-abuse-before-handler"
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

export interface AbuseEventPersistenceInput {
  tenantId: string;
  actorUserId?: string;
  routeFamily: (typeof abuseControlRouteFamilies)[number];
  routePattern: string;
  abuseKeyHash: string;
  ipHash?: string;
  userAgentHash?: string;
  action: "allow" | "throttle" | "challenge" | "reject" | "bypass" | "fail_closed";
  reason: string;
  limiterProvider?: "redis" | "upstash" | "edge" | "local";
  limiterDecision: "allowed" | "limited" | "challenged" | "bypassed" | "failed_closed";
  observedRequests?: number;
  windowSeconds?: number;
  botChallengeRequired: boolean;
  providerSignatureValid?: boolean;
  alertDispatchedAt?: string;
  failClosed: boolean;
}

export interface AbuseEventPersistenceContract {
  modelName: "AbuseEvent";
  row: AbuseEventPersistenceInput;
  transactionWrites: readonly ["AbuseEvent", "AuditLog"];
  hashedFields: readonly ["abuseKeyHash", "ipHash", "userAgentHash"];
  redactedFields: readonly ["rawIp", "userAgent", "payload", "providerSignature", "messageBody", "token"];
  tenantIsolationKey: "tenantId";
  failClosedGate: "persist_before_reject_on_limiter_error";
}

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

export const abuseControlProofFiles = [
  "scripts/security/verify-abuse-alerts.mjs",
  "scripts/security/verify-abuse-rate-limits.mjs",
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/abuseControlRuntime.ts",
  "apps/web/tests/abuse-control-runtime-static.test.ts",
  "apps/web/tests/booking-requests-contract.test.ts",
  "apps/web/tests/privacy-requests-public-route.test.ts",
  "apps/web/tests/error-report-ingest-hardening-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
  "apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts",
  "apps/web/app/api/public/[tenantSlug]/messages/route.ts",
  "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
  "apps/dashboard/app/api/security/privacy-requests/route.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609004000_add_abuse_events/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
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

export const abuseControlLocalCommands = abuseControlCommands.slice(0, 4);
export const abuseControlExternalCommands = abuseControlCommands.slice(4);

export const abuseControlRequiredExternalEvidence = [
  "Distributed rate-limit provider proof",
  "Bot challenge route proof",
  "Provider webhook signature bypass/rejection proof",
  "Throttling alert delivery proof",
  "Fail-closed limiter behavior proof",
  "Public-route integration proof",
] as const;

export type AbuseControlArtifact = (typeof abuseControlArtifactPaths)[number];

export const abuseControlLocalArtifacts = [
  "coverage/abuse-control-runtime.json",
  "coverage/abuse-provider-webhook-bypass.json",
  "coverage/abuse-event-redaction.json",
  "test-results/abuse-control-runtime",
] as const satisfies readonly AbuseControlArtifact[];

export const abuseControlExternalArtifacts = abuseControlArtifactPaths.filter(
  (artifact) => !abuseControlLocalArtifacts.includes(artifact as (typeof abuseControlLocalArtifacts)[number]),
) as readonly AbuseControlArtifact[];

export type AbuseControlCommand = (typeof abuseControlCommands)[number];

export type AbuseControlExecutionPolicy = {
  localRouteChecksOnly: true;
  distributedLimiterRequiresExternalEvidence: true;
  botChallengeRequiresExternalEvidence: true;
  webhookBypassRequiresExternalEvidence: true;
  alertDeliveryRequiresExternalEvidence: true;
  failClosedRequiresExternalEvidence: true;
  publicRouteIntegrationRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof abuseControlRequiredExternalEvidence;
};

export type AbuseControlEvidenceInput = {
  packageAbuseHelpersPassed: boolean;
  runtimeMatrixCaptured: boolean;
  distributedRateLimitCaptured: boolean;
  botChallengeCaptured: boolean;
  validWebhookBypassCaptured: boolean;
  invalidWebhookChallengeCaptured: boolean;
  abuseEventRedactionCaptured: boolean;
  abuseAlertDeliveryCaptured: boolean;
  failClosedCaptured: boolean;
  requiredCommandsRun: readonly AbuseControlCommand[];
  capturedArtifacts: readonly AbuseControlArtifact[];
};

export type AbuseControlEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: AbuseControlArtifact[];
  requiredCommands: typeof abuseControlCommands;
  requiredEvidence: typeof abuseControlArtifactPaths;
  privacyPolicy: {
    tenantSafeHashedKeysRequired: true;
    rawIpAndPayloadsRedacted: true;
    failClosedBeforeHandlerExecution: true;
  };
};

export type AbuseControlExecutionPlan = {
  status: "local-plan-ready";
  policy: AbuseControlExecutionPolicy;
  externalEvidenceRequired: typeof abuseControlRequiredExternalEvidence;
  distributedLimiterExecutionAllowed: false;
  botChallengeExecutionAllowed: false;
  webhookBypassExecutionAllowed: false;
  alertDeliveryExecutionAllowed: false;
  failClosedExecutionAllowed: false;
  publicRouteIntegrationExecutionAllowed: false;
  localCommands: typeof abuseControlLocalCommands;
  externalCommands: typeof abuseControlExternalCommands;
  localArtifacts: typeof abuseControlLocalArtifacts;
  externalArtifacts: typeof abuseControlExternalArtifacts;
  disabledReasons: readonly string[];
};

export const abuseControlExecutionPolicy: AbuseControlExecutionPolicy = {
  localRouteChecksOnly: true,
  distributedLimiterRequiresExternalEvidence: true,
  botChallengeRequiresExternalEvidence: true,
  webhookBypassRequiresExternalEvidence: true,
  alertDeliveryRequiresExternalEvidence: true,
  failClosedRequiresExternalEvidence: true,
  publicRouteIntegrationRequiresExternalEvidence: true,
  externalEvidenceRequired: abuseControlRequiredExternalEvidence,
};

export type AbuseControlArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof abuseControlArtifactPaths;
  retainedExternalGates: readonly string[];
};

const abuseControlSensitivePatterns = [
  /(ip[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(user[_-]?agent[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(provider[_-]?signature['":=\s]+)[^"',\s}]+/gi,
  /(message[_-]?body['":=\s]+)[^"',}]+/gi,
  /(payload['":=\s]+)[^"',}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedAbuseControlArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return abuseControlSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedAbuseControlArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|name|address|token|secret|authorization|credential|password|rawIp|ipHash|userAgent|payload|providerSignature|messageBody|webhook|stack/i.test(key)
          ? "[REDACTED]"
          : buildRedactedAbuseControlArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildAbuseControlExecutionPlan(): AbuseControlExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: abuseControlExecutionPolicy,
    externalEvidenceRequired: abuseControlRequiredExternalEvidence,
    distributedLimiterExecutionAllowed: false,
    botChallengeExecutionAllowed: false,
    webhookBypassExecutionAllowed: false,
    alertDeliveryExecutionAllowed: false,
    failClosedExecutionAllowed: false,
    publicRouteIntegrationExecutionAllowed: false,
    localCommands: abuseControlLocalCommands,
    externalCommands: abuseControlExternalCommands,
    localArtifacts: abuseControlLocalArtifacts,
    externalArtifacts: abuseControlExternalArtifacts,
    disabledReasons: [
      "Distributed limiter proof requires Redis/Upstash or edge provider execution.",
      "Bot challenge proof requires configured challenge provider execution.",
      "Provider webhook bypass/rejection proof requires signed webhook integration fixtures.",
      "Throttling alert delivery proof requires configured alert transport.",
      "Fail-closed limiter proof requires runtime limiter failure injection.",
      "Public-route abuse integration proof requires distributed middleware/provider execution.",
    ],
  };
}

export function buildAbuseControlArtifactReview(rawArtifact: unknown): AbuseControlArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedAbuseControlArtifact(rawArtifact),
    requiredArtifacts: abuseControlArtifactPaths,
    retainedExternalGates: [
      "Distributed rate-limit provider proof",
      "Bot challenge route proof",
      "Provider webhook signature bypass/rejection proof",
      "Throttling alert delivery proof",
      "Fail-closed limiter behavior proof",
      "Public-route integration proof",
    ],
  };
}

export function buildAbuseControlEvidenceDecision(input: AbuseControlEvidenceInput): AbuseControlEvidenceDecision {
  const blockers = [
    !input.packageAbuseHelpersPassed && "Run package abuse-control helper tests.",
    !input.runtimeMatrixCaptured && "Capture abuse route-family runtime matrix evidence.",
    !input.distributedRateLimitCaptured && "Capture distributed rate-limit provider proof.",
    !input.botChallengeCaptured && "Capture bot challenge route proof.",
    !input.validWebhookBypassCaptured && "Capture valid provider webhook bypass proof.",
    !input.invalidWebhookChallengeCaptured && "Capture invalid provider webhook challenge/rejection proof.",
    !input.abuseEventRedactionCaptured && "Capture privacy-safe AbuseEvent redaction proof.",
    !input.abuseAlertDeliveryCaptured && "Capture throttling alert delivery proof.",
    !input.failClosedCaptured && "Capture fail-closed limiter behavior proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = abuseControlArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = abuseControlCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: abuseControlCommands,
    requiredEvidence: abuseControlArtifactPaths,
    privacyPolicy: {
      tenantSafeHashedKeysRequired: true,
      rawIpAndPayloadsRedacted: true,
      failClosedBeforeHandlerExecution: true,
    },
  };
}

export function buildAbuseEventPersistenceContract(input: AbuseEventPersistenceInput): AbuseEventPersistenceContract {
  return {
    modelName: "AbuseEvent",
    row: input,
    transactionWrites: ["AbuseEvent", "AuditLog"],
    hashedFields: ["abuseKeyHash", "ipHash", "userAgentHash"],
    redactedFields: ["rawIp", "userAgent", "payload", "providerSignature", "messageBody", "token"],
    tenantIsolationKey: "tenantId",
    failClosedGate: "persist_before_reject_on_limiter_error",
  };
}

export function buildAbuseControlRuntimeContract(input: {
  ruleId: string;
  tenantId: string;
  ipHash: string;
  userId?: string;
  observedRequests: number;
  windowSeconds: number;
  userAgent?: string;
  routePath: string;
  providerWebhook: boolean;
  providerSignatureValid?: boolean;
  redisConfigured: boolean;
  botChallengeConfigured: boolean;
  alertingConfigured: boolean;
}) {
  const plan = buildAbuseControlPlan(input);
  const actions: AbuseRuntimeAction[] = [
    "load-route-family-policy",
    "enforce-route-local-abuse-before-handler",
    "derive-tenant-safe-abuse-key",
    "check-distributed-rate-limit",
    "persist-redacted-abuse-event",
    "emit-throttling-alert",
    "fail-closed-on-limiter-error",
  ];

  if (plan.action === "challenge") actions.push("apply-bot-challenge");
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
  edgeOrMiddlewareWired: true,
  routeFamilyPoliciesApplied: true,
  tenantSafeKeysVerified: true,
  botChallengeProviderConfigured: false,
  botChallengeRouteTestsPassed: false,
  providerWebhookSignatureBypassVerified: false,
  invalidWebhookSignatureChallengeVerified: false,
  privacySafeAbuseLogPersistenceConfigured: true,
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
  providerWebhook: false,
});

export const abuseControlKnownRateLimitRules = rateLimitRules.map((rule) => ({
  id: rule.id,
  routePattern: rule.routePattern,
  keyStrategy: rule.keyStrategy,
  gapIds: rule.gapIds,
}));

export const abuseEventPersistencePreview = buildAbuseEventPersistenceContract({
  tenantId: "tenant_demo",
  routeFamily: "public-booking-submit",
  routePattern: "/api/public/:tenantSlug/booking-requests",
  abuseKeyHash: "sha256:tenant-route-ip-redacted",
  ipHash: "sha256:redacted",
  userAgentHash: "sha256:redacted",
  action: "challenge",
  reason: "Suspicious request velocity and bot proof missing.",
  limiterProvider: "redis",
  limiterDecision: "challenged",
  observedRequests: 12,
  windowSeconds: 3600,
  botChallengeRequired: true,
  failClosed: false,
});

