import {
  buildReleaseRuntimeVerificationPlan,
  releaseRuntimeVerificationRequiredEvidence as packageReleaseRuntimeVerificationRequiredEvidence,
} from "@inkroute/releases";

export const releaseRuntimeVerificationRequiredEvidence = packageReleaseRuntimeVerificationRequiredEvidence;

export const releaseRuntimeVerificationArtifactPaths = [
  "coverage/release-runtime-verification.json",
  "coverage/release-health-route-smoke.json",
  "coverage/release-dashboard-route-smoke.json",
  "coverage/release-feature-flag-route-smoke.json",
  "coverage/release-web-build.log",
  "coverage/release-dashboard-build.log",
  "coverage/release-mobile-typecheck.log",
  "coverage/release-governance-workflow-dry-run-redacted.json",
  "test-results/release-runtime",
  "test-results/release-governance",
] as const;

export const releaseRuntimeVerificationProofFiles = [
  "apps/dashboard/package.json",
  "apps/mobile/package.json",
  "apps/web/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/web/lib/releaseRuntimeVerification.ts",
  "apps/web/tests/release-runtime-verification-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/release-health/route.ts",
  "apps/web/tests/release-health-route.test.ts",
  "apps/dashboard/app/releases/page.tsx",
  "apps/dashboard/components/ReleaseActionPanel.tsx",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/tests/release-route-static.test.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  ".github/workflows/release-governance.yml",
  ".github/workflows/ci.yml",
  "packages/mobile/package.json",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ReleaseRuntimeVerificationEvidenceArtifact = (typeof releaseRuntimeVerificationArtifactPaths)[number];

export const releaseRuntimeVerificationRequiredExternalEvidence = [
  "web typecheck and build",
  "dashboard build",
  "mobile typecheck",
  "dashboard release and feature-flag runtime route smokes",
  "release-governance workflow dry run and GitHub Actions proof",
  "CI artifact attachment",
] as const;

export interface ReleaseRuntimeVerificationExecutionPlan {
  readonly id: "gap-087-release-runtime-verification";
  readonly buildExecutionAllowed: false;
  readonly githubActionsExecutionAllowed: false;
  readonly mobileTypecheckExecutionAllowed: false;
  readonly policy: ReleaseRuntimeVerificationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof releaseRuntimeVerificationCommands;
  readonly requiredArtifacts: typeof releaseRuntimeVerificationArtifactPaths;
  readonly localRouteArtifacts: readonly ReleaseRuntimeVerificationEvidenceArtifact[];
  readonly buildArtifacts: readonly ReleaseRuntimeVerificationEvidenceArtifact[];
  readonly workflowArtifacts: readonly ReleaseRuntimeVerificationEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof releaseRuntimeVerificationRequiredExternalEvidence;
}

export interface ReleaseRuntimeVerificationExecutionPolicy {
  readonly executeWebBuild: false;
  readonly executeDashboardBuild: false;
  readonly executeMobileTypecheck: false;
  readonly executeDashboardRouteSmokes: false;
  readonly executeReleaseGovernanceWorkflow: false;
  readonly executeCi: false;
}

export interface ReleaseRuntimeVerificationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ReleaseRuntimeVerificationEvidenceArtifact;
}

const releaseRuntimeSensitiveKeyPattern =
  /(?:authorization|clientsecret|cookie|credential|email|password|phone|private|secret|stack|token)/i;
const releaseRuntimeEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const releaseRuntimePhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const releaseRuntimeTokenPattern = /\b(?:bearer|ghp|github_pat|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactReleaseRuntimeArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (releaseRuntimeSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(releaseRuntimeEmailPattern, "[REDACTED_EMAIL]")
      .replace(releaseRuntimePhonePattern, "[REDACTED_PHONE]")
      .replace(releaseRuntimeTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactReleaseRuntimeArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactReleaseRuntimeArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedReleaseRuntimeVerificationArtifact(artifact: unknown): unknown {
  return redactReleaseRuntimeArtifactValue(artifact);
}

export const releaseRuntimeVerificationExecutionPolicy: ReleaseRuntimeVerificationExecutionPolicy = {
  executeWebBuild: false,
  executeDashboardBuild: false,
  executeMobileTypecheck: false,
  executeDashboardRouteSmokes: false,
  executeReleaseGovernanceWorkflow: false,
  executeCi: false,
};

export function buildReleaseRuntimeVerificationExecutionPlan(): ReleaseRuntimeVerificationExecutionPlan {
  return {
    id: "gap-087-release-runtime-verification",
    buildExecutionAllowed: false,
    githubActionsExecutionAllowed: false,
    mobileTypecheckExecutionAllowed: false,
    policy: releaseRuntimeVerificationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: releaseRuntimeVerificationCommands,
    requiredArtifacts: releaseRuntimeVerificationArtifactPaths,
    localRouteArtifacts: [
      "coverage/release-runtime-verification.json",
      "coverage/release-health-route-smoke.json",
      "coverage/release-dashboard-route-smoke.json",
      "coverage/release-feature-flag-route-smoke.json",
    ],
    buildArtifacts: [
      "coverage/release-web-build.log",
      "coverage/release-dashboard-build.log",
      "coverage/release-mobile-typecheck.log",
    ],
    workflowArtifacts: ["coverage/release-governance-workflow-dry-run-redacted.json"],
    externalEvidenceRequired: releaseRuntimeVerificationRequiredExternalEvidence,
  };
}

export function buildReleaseRuntimeVerificationArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: ReleaseRuntimeVerificationEvidenceArtifact = "coverage/release-governance-workflow-dry-run-redacted.json",
): ReleaseRuntimeVerificationArtifactReview {
  const redactedArtifact = buildRedactedReleaseRuntimeVerificationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(releaseRuntimeEmailPattern) ? "email" : null,
    serialized.match(releaseRuntimePhonePattern) ? "phone" : null,
    serialized.match(releaseRuntimeTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ReleaseRuntimeVerificationEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly releaseHealthRouteSmokePassed: boolean;
  readonly dashboardReleaseRouteSmokePassed: boolean;
  readonly dashboardFeatureFlagRouteSmokePassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly releaseGovernanceWorkflowDryRunPassed: boolean;
  readonly githubActionsWorkflowEvidenceCaptured: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly ReleaseRuntimeVerificationEvidenceArtifact[];
}

export const releaseRuntimeVerificationDecisionRequiredEvidence = [
  "release package typecheck/test, release-health route, dashboard release route, and feature-flag route artifacts",
  "web typecheck, web build, dashboard build, and mobile typecheck artifacts",
  "release-governance workflow dry-run, GitHub Actions workflow, and CI artifact evidence",
] as const;

export interface ReleaseRuntimeVerificationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ReleaseRuntimeVerificationEvidenceArtifact[];
  readonly requiredCommands: typeof releaseRuntimeVerificationCommands;
  readonly requiredEvidence: typeof releaseRuntimeVerificationDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildReleaseRuntimeVerificationEvidenceDecision(
  input: ReleaseRuntimeVerificationEvidenceInput,
): ReleaseRuntimeVerificationEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.releaseHealthRouteSmokePassed ? "Public release-health route smoke evidence is required." : null,
    !input.dashboardReleaseRouteSmokePassed ? "Dashboard release route smoke evidence is required." : null,
    !input.dashboardFeatureFlagRouteSmokePassed ? "Dashboard feature-flag route smoke evidence is required." : null,
    !input.webTypecheckPassed ? "Web typecheck evidence is required." : null,
    !input.webBuildPassed ? "Web build evidence is required." : null,
    !input.dashboardBuildPassed ? "Dashboard build evidence is required." : null,
    !input.mobileTypecheckPassed ? "Mobile typecheck evidence is required." : null,
    !input.releaseGovernanceWorkflowDryRunPassed ? "Release-governance workflow dry-run evidence is required." : null,
    !input.githubActionsWorkflowEvidenceCaptured ? "GitHub Actions workflow evidence is required." : null,
    !input.ciArtifactsAttached ? "Release runtime CI artifact attachment evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = releaseRuntimeVerificationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: releaseRuntimeVerificationCommands,
    requiredEvidence: releaseRuntimeVerificationDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-087 release runtime verification evidence is complete with CI-safe artifacts captured."
        : "GAP-087 release runtime verification evidence remains blocked until package, route, build, workflow, GitHub Actions, and artifact evidence is captured.",
  };
}

export const releaseRuntimeVerificationCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/release-health-route.test.ts apps/web/tests/release-runtime-verification-static.test.ts apps/dashboard/tests/release-route-static.test.ts apps/dashboard/tests/feature-flag-route-static.test.ts",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "release-governance workflow dry run",
] as const;

export const releaseRuntimeVerificationMatrix = [
  {
    id: "release-package-contracts",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-runtime-verification.json",
    status: "command-target-wired",
  },
  {
    id: "public-release-health-route",
    command: "pnpm vitest run apps/web/tests/release-health-route.test.ts",
    artifact: "coverage/release-health-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "dashboard-release-route-smoke",
    command: "pnpm vitest run apps/dashboard/tests/release-route-static.test.ts",
    artifact: "coverage/release-dashboard-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "dashboard-feature-flag-route-smoke",
    command: "pnpm vitest run apps/dashboard/tests/feature-flag-route-static.test.ts",
    artifact: "coverage/release-feature-flag-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "web-dashboard-mobile-builds",
    command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/dashboard build && pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/release-web-build.log",
    status: "build-gate-target-wired",
  },
  {
    id: "release-governance-workflow",
    command: "release-governance workflow dry run",
    artifact: "coverage/release-governance-workflow-dry-run-redacted.json",
    status: "github-actions-proof-gated",
  },
] as const;

export function buildReleaseRuntimeVerificationContract() {
  return buildReleaseRuntimeVerificationPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    webTypecheckPassed: false,
    releaseHealthRouteTestsPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    mobileBuildOrTypecheckPassed: false,
    dashboardReleaseRouteSmokePassed: false,
    dashboardFeatureFlagRouteSmokePassed: false,
    releaseGovernanceWorkflowDryRunPassed: false,
    githubActionsWorkflowEvidenceCaptured: false,
    ciArtifactsAttached: true,
  });
}

export const releaseRuntimeVerificationContract = buildReleaseRuntimeVerificationContract();




