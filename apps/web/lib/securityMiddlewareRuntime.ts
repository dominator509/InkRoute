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

export interface SecurityMiddlewareEvidencePersistenceInput {
  tenantId: string;
  surface: "web" | "dashboard";
  environment: "production" | "preview" | "local";
  routePattern: string;
  headerSmokePassed: boolean;
  productionHstsVerified: boolean;
  previewLocalHstsSuppressed: boolean;
  cspProviderConnectSrcVerified: boolean;
  cspFrameBaseFormInvariantPassed: boolean;
  csrfAttackRejected: boolean;
  csrfValidSessionAllowed: boolean;
  sameSiteSessionBoundVerified: boolean;
  signedWebhookBypassReviewed: boolean;
  artifactObjectKey?: string;
}

export interface SecurityMiddlewareEvidencePersistenceContract {
  modelName: "SecurityMiddlewareEvidence";
  row: SecurityMiddlewareEvidencePersistenceInput;
  transactionWrites: readonly ["SecurityMiddlewareEvidence", "AuditLog"];
  proofFields: readonly [
    "headerSmokePassed",
    "productionHstsVerified",
    "previewLocalHstsSuppressed",
    "cspProviderConnectSrcVerified",
    "csrfAttackRejected",
    "csrfValidSessionAllowed",
    "sameSiteSessionBoundVerified",
    "signedWebhookBypassReviewed",
  ];
  redactedFields: readonly ["artifactObjectKey", "redactedMetadata", "cookie", "csrfToken", "sessionId"];
  tenantIsolationKey: "tenantId";
}

export interface SecurityMiddlewareEvidencePersistenceClient {
  readonly securityMiddlewareEvidence: {
    create(input: {
      data: {
        tenantId: string;
        surface: string;
        environment: string;
        routePattern: string;
        headerSmokePassed: boolean;
        productionHstsVerified: boolean;
        previewLocalHstsSuppressed: boolean;
        cspProviderConnectSrcVerified: boolean;
        cspFrameBaseFormInvariantPassed: boolean;
        csrfAttackRejected: boolean;
        csrfValidSessionAllowed: boolean;
        sameSiteSessionBoundVerified: boolean;
        signedWebhookBypassReviewed: boolean;
        artifactObjectKey?: string;
        redactedMetadata: Record<string, unknown>;
      };
    }): Promise<{ id?: string } | unknown>;
  };
  readonly auditLog: {
    create(input: {
      data: {
        tenantId: string;
        action: "security.middleware.evidence.persisted";
        entityType: "SecurityMiddlewareEvidence";
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
}

export interface SecurityMiddlewareEvidencePersistenceResult {
  readonly persisted: true;
  readonly evidenceId: string;
  readonly auditAction: "security.middleware.evidence.persisted";
  readonly tenantId: string;
  readonly surface: SecurityMiddlewareEvidencePersistenceInput["surface"];
}

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

export const securityMiddlewareRuntimeProofFiles = [
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/securityMiddlewareRuntime.ts",
  "apps/web/tests/security-middleware-runtime-static.test.ts",
  "apps/web/middleware.ts",
  "apps/dashboard/middleware.ts",
  "apps/web/tests/security-runtime-middleware.test.ts",
  "apps/web/tests/security-runtime-middleware-static.test.ts",
  "apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
  "apps/web/tests/e2e/security-runtime.spec.ts",
  "apps/dashboard/tests/e2e/security-runtime.spec.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609005000_add_security_middleware_evidence/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
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

export const securityMiddlewareLocalCommands = securityMiddlewareCommands.slice(0, 2);
export const securityMiddlewareExternalCommands = securityMiddlewareCommands.slice(2);

export const securityMiddlewareRequiredExternalEvidence = [
  "Web and dashboard browser security header smoke proof",
  "Production HTTPS HSTS proof",
  "Provider CSP connect-src proof",
  "Signed webhook CSRF bypass review proof",
  "SecurityMiddlewareEvidence persistence proof",
  "Runtime route integration proof",
] as const;

export type SecurityMiddlewareArtifact = (typeof securityMiddlewareArtifactPaths)[number];

export const securityMiddlewareLocalArtifacts = [
  "coverage/security-middleware-runtime.json",
  "coverage/security-preview-local-hsts-suppression.json",
  "coverage/security-csp-frame-base-form-invariants.json",
  "coverage/security-csrf-attack-rejection.json",
  "coverage/security-csrf-valid-session-binding.json",
  "test-results/security-middleware-runtime",
] as const satisfies readonly SecurityMiddlewareArtifact[];

const securityMiddlewareLocalArtifactSet = new Set<SecurityMiddlewareArtifact>(
  securityMiddlewareLocalArtifacts,
);

export const securityMiddlewareExternalArtifacts = securityMiddlewareArtifactPaths.filter(
  (artifact) => !securityMiddlewareLocalArtifactSet.has(artifact),
) as readonly SecurityMiddlewareArtifact[];

export type SecurityMiddlewareCommand = (typeof securityMiddlewareCommands)[number];

export type SecurityMiddlewareExecutionPolicy = {
  localMiddlewareContractOnly: true;
  persistenceContractAvailable: true;
  browserSmokeRequiresExternalEvidence: true;
  deploymentHstsRequiresExternalEvidence: true;
  providerCspRequiresExternalEvidence: true;
  signedWebhookReviewRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  routeIntegrationRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof securityMiddlewareRequiredExternalEvidence;
};

export type SecurityMiddlewareEvidenceInput = {
  packageSecurityHelpersPassed: boolean;
  webHeaderBrowserSmokeCaptured: boolean;
  dashboardHeaderBrowserSmokeCaptured: boolean;
  productionHstsCaptured: boolean;
  previewLocalHstsSuppressionCaptured: boolean;
  providerCspConnectSrcCaptured: boolean;
  cspFrameBaseFormInvariantCaptured: boolean;
  csrfAttackRejectionCaptured: boolean;
  csrfValidSessionBindingCaptured: boolean;
  signedWebhookBypassReviewCaptured: boolean;
  requiredCommandsRun: readonly SecurityMiddlewareCommand[];
  capturedArtifacts: readonly SecurityMiddlewareArtifact[];
};

export type SecurityMiddlewareEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: SecurityMiddlewareArtifact[];
  requiredCommands: typeof securityMiddlewareCommands;
  requiredEvidence: typeof securityMiddlewareArtifactPaths;
  headerPolicy: {
    hstsProductionOnly: true;
    cspFrameBaseFormLocked: true;
    csrfTokensRedacted: true;
  };
};

export type SecurityMiddlewareExecutionPlan = {
  status: "local-plan-ready";
  policy: SecurityMiddlewareExecutionPolicy;
  persistenceContractAvailable: true;
  externalEvidenceRequired: typeof securityMiddlewareRequiredExternalEvidence;
  browserSmokeExecutionAllowed: false;
  deploymentHstsExecutionAllowed: false;
  providerCspExecutionAllowed: false;
  signedWebhookReviewExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  routeIntegrationExecutionAllowed: false;
  localCommands: typeof securityMiddlewareLocalCommands;
  externalCommands: typeof securityMiddlewareExternalCommands;
  localArtifacts: typeof securityMiddlewareLocalArtifacts;
  externalArtifacts: typeof securityMiddlewareExternalArtifacts;
  disabledReasons: readonly string[];
};

export const securityMiddlewareExecutionPolicy: SecurityMiddlewareExecutionPolicy = {
  localMiddlewareContractOnly: true,
  persistenceContractAvailable: true,
  browserSmokeRequiresExternalEvidence: true,
  deploymentHstsRequiresExternalEvidence: true,
  providerCspRequiresExternalEvidence: true,
  signedWebhookReviewRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  routeIntegrationRequiresExternalEvidence: true,
  externalEvidenceRequired: securityMiddlewareRequiredExternalEvidence,
};

export type SecurityMiddlewareArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof securityMiddlewareArtifactPaths;
  retainedExternalGates: readonly string[];
};

const securityMiddlewareSensitivePatterns = [
  /(csrf[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(session[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(cookie['":=\s]+)[^"',\n}]+/gi,
  /(provider[_-]?signature['":=\s]+)[^"',\s}]+/gi,
  /(artifact[_-]?object[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedSecurityMiddlewareArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return securityMiddlewareSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedSecurityMiddlewareArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|cookie|csrf|session|providerSignature|artifactObjectKey|rawBody|stack/i.test(key)
          ? "[REDACTED]"
          : buildRedactedSecurityMiddlewareArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildSecurityMiddlewareExecutionPlan(): SecurityMiddlewareExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: securityMiddlewareExecutionPolicy,
    persistenceContractAvailable: true,
    externalEvidenceRequired: securityMiddlewareRequiredExternalEvidence,
    browserSmokeExecutionAllowed: false,
    deploymentHstsExecutionAllowed: false,
    providerCspExecutionAllowed: false,
    signedWebhookReviewExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    routeIntegrationExecutionAllowed: false,
    localCommands: securityMiddlewareLocalCommands,
    externalCommands: securityMiddlewareExternalCommands,
    localArtifacts: securityMiddlewareLocalArtifacts,
    externalArtifacts: securityMiddlewareExternalArtifacts,
    disabledReasons: [
      "Browser security header smoke proof requires Playwright/browser execution.",
      "Production HTTPS HSTS proof requires deployment-platform evidence.",
      "Provider CSP connect-src proof requires provider-specific runtime smoke evidence.",
      "Signed webhook CSRF bypass review requires signed callback integration evidence.",
      "SecurityMiddlewareEvidence persistence contract is wired, but proof requires provider-backed database execution.",
      "Runtime route integration proof requires deployed or browser-backed route execution.",
    ],
  };
}

export function buildSecurityMiddlewareArtifactReview(rawArtifact: unknown): SecurityMiddlewareArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedSecurityMiddlewareArtifact(rawArtifact),
    requiredArtifacts: securityMiddlewareArtifactPaths,
    retainedExternalGates: [
      "Web and dashboard browser security header smoke proof",
      "Production HTTPS HSTS proof",
      "Provider CSP connect-src proof",
      "Signed webhook CSRF bypass review proof",
      "SecurityMiddlewareEvidence persistence proof",
      "Runtime route integration proof",
    ],
  };
}

export function buildSecurityMiddlewareEvidenceDecision(
  input: SecurityMiddlewareEvidenceInput,
): SecurityMiddlewareEvidenceDecision {
  const blockers = [
    !input.packageSecurityHelpersPassed && "Run package security middleware helper tests.",
    !input.webHeaderBrowserSmokeCaptured && "Capture web browser security header smoke proof.",
    !input.dashboardHeaderBrowserSmokeCaptured && "Capture dashboard browser security header smoke proof.",
    !input.productionHstsCaptured && "Capture production HTTPS HSTS proof.",
    !input.previewLocalHstsSuppressionCaptured && "Capture preview/local HSTS suppression proof.",
    !input.providerCspConnectSrcCaptured && "Capture provider CSP connect-src proof.",
    !input.cspFrameBaseFormInvariantCaptured && "Capture CSP frame/base/form invariant proof.",
    !input.csrfAttackRejectionCaptured && "Capture cookie-authenticated CSRF attack rejection proof.",
    !input.csrfValidSessionBindingCaptured && "Capture valid CSRF/session-bound mutation allowance proof.",
    !input.signedWebhookBypassReviewCaptured && "Capture signed webhook CSRF bypass review proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = securityMiddlewareArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = securityMiddlewareCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: securityMiddlewareCommands,
    requiredEvidence: securityMiddlewareArtifactPaths,
    headerPolicy: {
      hstsProductionOnly: true,
      cspFrameBaseFormLocked: true,
      csrfTokensRedacted: true,
    },
  };
}

export function buildSecurityMiddlewareEvidencePersistenceContract(
  input: SecurityMiddlewareEvidencePersistenceInput,
): SecurityMiddlewareEvidencePersistenceContract {
  return {
    modelName: "SecurityMiddlewareEvidence",
    row: input,
    transactionWrites: ["SecurityMiddlewareEvidence", "AuditLog"],
    proofFields: [
      "headerSmokePassed",
      "productionHstsVerified",
      "previewLocalHstsSuppressed",
      "cspProviderConnectSrcVerified",
      "csrfAttackRejected",
      "csrfValidSessionAllowed",
      "sameSiteSessionBoundVerified",
      "signedWebhookBypassReviewed",
    ],
    redactedFields: ["artifactObjectKey", "redactedMetadata", "cookie", "csrfToken", "sessionId"],
    tenantIsolationKey: "tenantId",
  };
}

export async function persistSecurityMiddlewareEvidence(
  client: SecurityMiddlewareEvidencePersistenceClient,
  input: SecurityMiddlewareEvidencePersistenceInput,
): Promise<SecurityMiddlewareEvidencePersistenceResult> {
  const redactedMetadata = buildRedactedSecurityMiddlewareArtifact({
    surface: input.surface,
    environment: input.environment,
    routePattern: input.routePattern,
    headerSmokePassed: input.headerSmokePassed,
    productionHstsVerified: input.productionHstsVerified,
    previewLocalHstsSuppressed: input.previewLocalHstsSuppressed,
    cspProviderConnectSrcVerified: input.cspProviderConnectSrcVerified,
    cspFrameBaseFormInvariantPassed: input.cspFrameBaseFormInvariantPassed,
    csrfAttackRejected: input.csrfAttackRejected,
    csrfValidSessionAllowed: input.csrfValidSessionAllowed,
    sameSiteSessionBoundVerified: input.sameSiteSessionBoundVerified,
    signedWebhookBypassReviewed: input.signedWebhookBypassReviewed,
    artifactObjectKey: input.artifactObjectKey,
  }) as Record<string, unknown>;

  const evidence = await client.securityMiddlewareEvidence.create({
    data: {
      tenantId: input.tenantId,
      surface: input.surface,
      environment: input.environment,
      routePattern: input.routePattern,
      headerSmokePassed: input.headerSmokePassed,
      productionHstsVerified: input.productionHstsVerified,
      previewLocalHstsSuppressed: input.previewLocalHstsSuppressed,
      cspProviderConnectSrcVerified: input.cspProviderConnectSrcVerified,
      cspFrameBaseFormInvariantPassed: input.cspFrameBaseFormInvariantPassed,
      csrfAttackRejected: input.csrfAttackRejected,
      csrfValidSessionAllowed: input.csrfValidSessionAllowed,
      sameSiteSessionBoundVerified: input.sameSiteSessionBoundVerified,
      signedWebhookBypassReviewed: input.signedWebhookBypassReviewed,
      ...(input.artifactObjectKey ? { artifactObjectKey: input.artifactObjectKey } : {}),
      redactedMetadata,
    },
  });
  const evidenceId =
    typeof evidence === "object" && evidence && "id" in evidence && typeof evidence.id === "string"
      ? evidence.id
      : `${input.tenantId}:${input.surface}:${input.environment}:${input.routePattern}`;

  await client.auditLog.create({
    data: {
      tenantId: input.tenantId,
      action: "security.middleware.evidence.persisted",
      entityType: "SecurityMiddlewareEvidence",
      entityId: evidenceId,
      metadata: redactedMetadata,
    },
  });

  return {
    persisted: true,
    evidenceId,
    auditAction: "security.middleware.evidence.persisted",
    tenantId: input.tenantId,
    surface: input.surface,
  };
}

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

export const securityMiddlewareEvidencePersistencePreview = buildSecurityMiddlewareEvidencePersistenceContract({
  tenantId: "tenant_demo",
  surface: "web",
  environment: "production",
  routePattern: "/api/public/:tenantSlug/booking-requests",
  headerSmokePassed: false,
  productionHstsVerified: false,
  previewLocalHstsSuppressed: true,
  cspProviderConnectSrcVerified: false,
  cspFrameBaseFormInvariantPassed: true,
  csrfAttackRejected: true,
  csrfValidSessionAllowed: true,
  sameSiteSessionBoundVerified: false,
  signedWebhookBypassReviewed: false,
  artifactObjectKey: "security/tenant_demo/middleware/redacted-browser-smoke.json",
});
