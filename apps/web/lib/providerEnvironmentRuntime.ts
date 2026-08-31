import {
  buildProviderEnvironmentRuntimeReadinessPlan,
  providerEnvironmentRuntimeRequiredCommands,
} from "@inkroute/deployment";
import type { ProviderEnvironmentSurface } from "@inkroute/deployment";

export type ProviderEnvironmentRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "secret-store-gated"
  | "ci-gated";

export interface ProviderEnvironmentRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderEnvironmentRuntimeStatus;
}

export interface ProviderEnvironmentRunPersistenceContract {
  readonly prismaModel: "ProviderEnvironmentRun";
  readonly tenantRelation: "providerEnvironmentRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["environmentMatrix", "surfaceMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "strictEnvCheckPassed",
    "previewProvisioned",
    "stagingProvisioned",
    "productionProvisioned",
    "webDashboardSmokePassed",
    "databaseMigrationDryRunPassed",
    "storagePrivateAclSmokePassed",
    "mobilePreviewBuildPassed",
    "observabilitySourceMapSmokePassed",
    "githubEnvironmentProtectionsConfigured",
    "secretStoreDestinationsConfigured",
    "redactedEvidenceLabelsRecorded",
    "ciProviderEnvironmentArtifactsCaptured"
  ];
  readonly redactedArtifactField: "redactedHandoffArtifactPath";
}

export const providerEnvironmentRuntimeSurfaces: readonly ProviderEnvironmentSurface[] = [
  "web",
  "dashboard",
  "database",
  "storage",
  "mobile",
  "observability",
  "ci_cd"
] as const;

export const providerEnvironmentRuntimeArtifactPaths = [
  "coverage/provider-environment-runtime.json",
  "coverage/provider-environment-verifier.json",
  "coverage/provider-strict-env-check-redacted.json",
  "coverage/provider-web-dashboard-smoke-redacted.json",
  "coverage/provider-database-migration-dry-run-redacted.json",
  "coverage/provider-storage-private-acl-redacted.json",
  "coverage/provider-mobile-eas-preview-redacted.json",
  "coverage/provider-sentry-release-smoke-redacted.json",
  "coverage/provider-github-environment-protection-redacted.json",
  "coverage/provider-secret-store-destinations-redacted.json",
  "coverage/provider-redacted-handoff-labels.json",
  "coverage/provider-redacted-handoff-packet.json",
  "coverage/provider-environment-ci-run-redacted.json",
  "test-results/provider-environment-runtime"
] as const;

export const providerEnvironmentRuntimeProofFiles = [
  "apps/web/lib/providerEnvironmentRuntime.ts",
  "apps/web/tests/provider-environment-runtime-static.test.ts",
  "deployment/PROVIDER_OPTIONS.md",
  "deployment/manifests/provider-environment-evidence.json",
  "deployment/scripts/verify-provider-envs.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "apps/dashboard/app/api/deployment/readiness/route.ts",
  "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
  "deployment/CI_CD_RUNBOOK.md",
  "deployment/MOBILE_BUILD_GUIDE.md",
  "deployment/DATABASE_MIGRATION_GUIDE.md",
  "DEPLOYMENT.md",
  ".github/workflows/ci.yml",
  ".env.example",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const providerEnvironmentRuntimeCommands = providerEnvironmentRuntimeRequiredCommands;

export const providerEnvironmentRuntimeRequiredExternalEvidence = [
  "Preview, staging, and production provider project proof must be captured outside Codex with raw project IDs redacted.",
  "Secret-store destination evidence must include labels only and never committed secret values or provider resource IDs.",
  "Database, storage, EAS, Sentry, and GitHub protection artifacts must redact URLs, tokens, bucket names, project IDs, and user data.",
  "ProviderEnvironmentRun persistence must execute only against an approved provider-backed database.",
  "Retained redacted provider-environment handoff packet must be captured before closure.",
] as const;

export type ProviderEnvironmentRuntimeExecutionPolicy = {
  readonly codexMayClassifyRedactedLabels: true;
  readonly rawProjectIdsForbiddenInGit: true;
  readonly providerConsoleRequiredForProvisioning: true;
  readonly secretStoreAccessRequiresApprovedOperator: true;
  readonly ciProviderRequiredForEnvironmentArtifacts: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const providerEnvironmentRuntimeExecutionPolicy: ProviderEnvironmentRuntimeExecutionPolicy = {
  codexMayClassifyRedactedLabels: true,
  rawProjectIdsForbiddenInGit: true,
  providerConsoleRequiredForProvisioning: true,
  secretStoreAccessRequiresApprovedOperator: true,
  ciProviderRequiredForEnvironmentArtifacts: true,
  providerDatabaseRequiredForPersistence: true,
};

export type ProviderEnvironmentRuntimeArtifact = (typeof providerEnvironmentRuntimeArtifactPaths)[number];

export type ProviderEnvironmentRuntimeCommand = (typeof providerEnvironmentRuntimeCommands)[number];

export const providerEnvironmentRuntimeLocalArtifacts = [
  "coverage/provider-environment-runtime.json",
  "coverage/provider-environment-verifier.json",
  "coverage/provider-redacted-handoff-labels.json",
  "coverage/provider-redacted-handoff-packet.json",
  "test-results/provider-environment-runtime",
] as const satisfies readonly ProviderEnvironmentRuntimeArtifact[];

export const providerEnvironmentRuntimeExternalArtifacts = [
  "coverage/provider-strict-env-check-redacted.json",
  "coverage/provider-web-dashboard-smoke-redacted.json",
  "coverage/provider-database-migration-dry-run-redacted.json",
  "coverage/provider-storage-private-acl-redacted.json",
  "coverage/provider-mobile-eas-preview-redacted.json",
  "coverage/provider-sentry-release-smoke-redacted.json",
  "coverage/provider-github-environment-protection-redacted.json",
  "coverage/provider-secret-store-destinations-redacted.json",
  "coverage/provider-redacted-handoff-packet.json",
  "coverage/provider-environment-ci-run-redacted.json",
] as const satisfies readonly ProviderEnvironmentRuntimeArtifact[];

export const providerEnvironmentRuntimeLocalCommands = [
  "pnpm deploy:verify-provider-envs",
  "record redacted provider evidence labels",
] as const satisfies readonly ProviderEnvironmentRuntimeCommand[];

export const providerEnvironmentRuntimeExternalCommands = [
  "pnpm deploy:check-env:strict",
  "provider web/dashboard route smoke",
  "provider database migration dry-run",
  "provider storage private ACL smoke",
  "eas build --profile preview",
  "sentry release/source-map smoke",
  "github environment protection audit",
  "verify provider secret-store destinations",
  "capture provider environment CI artifacts",
] as const satisfies readonly ProviderEnvironmentRuntimeCommand[];

export type ProviderEnvironmentRuntimeEvidenceInput = {
  verifierPassed: boolean;
  strictEnvCheckPassed: boolean;
  previewProvisioned: boolean;
  stagingProvisioned: boolean;
  productionProvisioned: boolean;
  webDashboardSmokePassed: boolean;
  databaseMigrationDryRunPassed: boolean;
  storagePrivateAclSmokePassed: boolean;
  mobilePreviewBuildPassed: boolean;
  observabilitySourceMapSmokePassed: boolean;
  githubEnvironmentProtectionsConfigured: boolean;
  secretStoreDestinationsConfigured: boolean;
  redactedEvidenceLabelsRecorded: boolean;
  redactedHandoffPacketCaptured: boolean;
  ciProviderEnvironmentArtifactsCaptured: boolean;
  requiredCommandsRun: readonly ProviderEnvironmentRuntimeCommand[];
  capturedArtifacts: readonly ProviderEnvironmentRuntimeArtifact[];
};

export type ProviderEnvironmentRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: ProviderEnvironmentRuntimeArtifact[];
  requiredCommands: typeof providerEnvironmentRuntimeCommands;
  requiredEvidence: typeof providerEnvironmentRuntimeArtifactPaths;
  providerEnvironmentPolicy: {
    rawProjectIdsForbiddenInGit: true;
    secretStoreDestinationsRequired: true;
    redactedEvidenceLabelsRequired: true;
  };
};

export interface ProviderEnvironmentRuntimeExecutionPlan {
  readonly localCommands: typeof providerEnvironmentRuntimeLocalCommands;
  readonly externalCommands: typeof providerEnvironmentRuntimeExternalCommands;
  readonly localArtifacts: typeof providerEnvironmentRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof providerEnvironmentRuntimeExternalArtifacts;
  readonly manifestVerifierExecutionAllowed: false;
  readonly strictEnvExecutionAllowed: false;
  readonly providerProvisioningExecutionAllowed: false;
  readonly webDashboardSmokeExecutionAllowed: false;
  readonly databaseDryRunExecutionAllowed: false;
  readonly storageAclExecutionAllowed: false;
  readonly mobileEasExecutionAllowed: false;
  readonly observabilitySourceMapExecutionAllowed: false;
  readonly githubProtectionAuditExecutionAllowed: false;
  readonly secretStoreDestinationExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof providerEnvironmentRuntimeExecutionPolicy;
}

export interface ProviderEnvironmentRuntimeArtifactReview {
  readonly artifactPath: ProviderEnvironmentRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof providerEnvironmentRuntimeRequiredExternalEvidence;
}

export interface ProviderEnvironmentRuntimeRedactedHandoffPacket {
  readonly status: "redacted-handoff-packet-ready";
  readonly artifactPath: "coverage/provider-redacted-handoff-packet.json";
  readonly surfaces: typeof providerEnvironmentRuntimeSurfaces;
  readonly review: ProviderEnvironmentRuntimeArtifactReview;
  readonly requiredArtifacts: typeof providerEnvironmentRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof providerEnvironmentRuntimeRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

const sensitiveProviderEnvironmentKeyPattern =
  /(token|secret|password|authorization|cookie|env|databaseUrl|dbUrl|provider|projectId|resourceId|ciRunUrl|deployUrl|previewUrl|stagingUrl|productionUrl|sentry|eas|github|bucket|secretStore|tenantId|userId|runId|email|phone|raw|payload|body|stack|error|log|output|transcript|database|dsn|migration|storage|acl|source.?map|protection|handoff|artifact|label|smoke|strict|verifier|url|uri|repository|repo|branch|pull|pr|reviewer|codeowner|neutralCiTrace)/i;

const sensitiveProviderEnvironmentStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DSN]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|whsec)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\brepo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\b/gi, "[REDACTED_REPOSITORY_SELECTOR]"],
  [/\bbranch:[A-Za-z0-9_./-]+\b/gi, "[REDACTED_BRANCH_SELECTOR]"],
  [/\bpr[_:#-][A-Za-z0-9_.-]+\b/gi, "[REDACTED_PR_SELECTOR]"],
  [/\breviewer[_:@-]?[A-Za-z0-9_.-]+\b/gi, "[REDACTED_REVIEWER_SELECTOR]"],
  [/\bCODEOWNER:[A-Za-z0-9_.@/-]+\b/g, "[REDACTED_CODEOWNER_SELECTOR]"],
  [/\b(?:tenant|user|project|provider|bucket|run|env|eas|sentry|gh|github|vercel|neon|supabase|render|resource|secret|workflow|ci|commit|deployment|preview|staging|production|source.?map|release)_[A-Za-z0-9_.-]+\b/gi, "[REDACTED_ID]"],
  [/\b(?:coverage|test-results|artifacts|reports)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED_ARTIFACT_PATH]"],
];

export type ProviderEnvironmentRunRecordInput = ProviderEnvironmentRuntimeEvidenceInput & {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: ProviderEnvironmentRuntimeEvidenceDecision["status"];
  environmentMatrix: unknown;
  surfaceMatrix: unknown;
  artifactManifest: unknown;
  redactedHandoffArtifactPath?: string | null;
  ciRunUrl?: string | null;
};

export type ProviderEnvironmentRunData = Omit<ProviderEnvironmentRunRecordInput, "requiredCommandsRun" | "capturedArtifacts">;

export interface ProviderEnvironmentRunRepository {
  readonly providerEnvironmentRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: ProviderEnvironmentRunData;
      update: ProviderEnvironmentRunData;
    }): unknown;
  };
}

export function buildProviderEnvironmentRunData(input: ProviderEnvironmentRunRecordInput): ProviderEnvironmentRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    environmentMatrix: input.environmentMatrix,
    surfaceMatrix: input.surfaceMatrix,
    artifactManifest: input.artifactManifest,
    verifierPassed: input.verifierPassed,
    strictEnvCheckPassed: input.strictEnvCheckPassed,
    previewProvisioned: input.previewProvisioned,
    stagingProvisioned: input.stagingProvisioned,
    productionProvisioned: input.productionProvisioned,
    webDashboardSmokePassed: input.webDashboardSmokePassed,
    databaseMigrationDryRunPassed: input.databaseMigrationDryRunPassed,
    storagePrivateAclSmokePassed: input.storagePrivateAclSmokePassed,
    mobilePreviewBuildPassed: input.mobilePreviewBuildPassed,
    observabilitySourceMapSmokePassed: input.observabilitySourceMapSmokePassed,
    githubEnvironmentProtectionsConfigured: input.githubEnvironmentProtectionsConfigured,
    secretStoreDestinationsConfigured: input.secretStoreDestinationsConfigured,
    redactedEvidenceLabelsRecorded: input.redactedEvidenceLabelsRecorded,
    ciProviderEnvironmentArtifactsCaptured: input.ciProviderEnvironmentArtifactsCaptured,
    redactedHandoffArtifactPath: input.redactedHandoffArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistProviderEnvironmentRun(
  repository: ProviderEnvironmentRunRepository,
  input: ProviderEnvironmentRunRecordInput,
): unknown {
  const data = buildProviderEnvironmentRunData(input);

  return repository.providerEnvironmentRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export function buildProviderEnvironmentRuntimeEvidenceDecision(
  input: ProviderEnvironmentRuntimeEvidenceInput,
): ProviderEnvironmentRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run provider environment manifest verifier.",
    !input.strictEnvCheckPassed && "Run strict provider environment checks.",
    !input.previewProvisioned && "Capture preview provider provisioning proof.",
    !input.stagingProvisioned && "Capture staging provider provisioning proof.",
    !input.productionProvisioned && "Capture production provider provisioning proof.",
    !input.webDashboardSmokePassed && "Capture web/dashboard provider smoke proof.",
    !input.databaseMigrationDryRunPassed && "Capture provider database migration dry-run proof.",
    !input.storagePrivateAclSmokePassed && "Capture provider storage private ACL smoke proof.",
    !input.mobilePreviewBuildPassed && "Capture EAS preview build proof.",
    !input.observabilitySourceMapSmokePassed && "Capture observability source-map smoke proof.",
    !input.githubEnvironmentProtectionsConfigured && "Capture GitHub environment protection audit proof.",
    !input.secretStoreDestinationsConfigured && "Capture secret-store destination proof.",
    !input.redactedEvidenceLabelsRecorded && "Record only redacted provider evidence labels.",
    !input.redactedHandoffPacketCaptured && "Capture retained redacted provider-environment handoff packet proof.",
    !input.ciProviderEnvironmentArtifactsCaptured && "Capture CI provider-environment artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = providerEnvironmentRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = providerEnvironmentRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: providerEnvironmentRuntimeCommands,
    requiredEvidence: providerEnvironmentRuntimeArtifactPaths,
    providerEnvironmentPolicy: {
      rawProjectIdsForbiddenInGit: true,
      secretStoreDestinationsRequired: true,
      redactedEvidenceLabelsRequired: true,
    },
  };
}

export function buildProviderEnvironmentRuntimeExecutionPlan(): ProviderEnvironmentRuntimeExecutionPlan {
  return {
    localCommands: providerEnvironmentRuntimeLocalCommands,
    externalCommands: providerEnvironmentRuntimeExternalCommands,
    localArtifacts: providerEnvironmentRuntimeLocalArtifacts,
    externalArtifacts: providerEnvironmentRuntimeExternalArtifacts,
    manifestVerifierExecutionAllowed: false,
    strictEnvExecutionAllowed: false,
    providerProvisioningExecutionAllowed: false,
    webDashboardSmokeExecutionAllowed: false,
    databaseDryRunExecutionAllowed: false,
    storageAclExecutionAllowed: false,
    mobileEasExecutionAllowed: false,
    observabilitySourceMapExecutionAllowed: false,
    githubProtectionAuditExecutionAllowed: false,
    secretStoreDestinationExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: providerEnvironmentRuntimeExecutionPolicy,
  };
}

function redactProviderEnvironmentString(value: string, redactions: Set<string>): string {
  return sensitiveProviderEnvironmentStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactProviderEnvironmentValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveProviderEnvironmentKeyPattern.test(key)) {
    if (typeof value === "string") {
      redactProviderEnvironmentString(value, redactions);
    }
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactProviderEnvironmentString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactProviderEnvironmentValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactProviderEnvironmentValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedProviderEnvironmentArtifact(artifact: unknown): unknown {
  return redactProviderEnvironmentValue(artifact, new Set<string>());
}

export function buildProviderEnvironmentRuntimeArtifactReview(
  artifactPath: ProviderEnvironmentRuntimeArtifact | string,
  artifact: unknown,
): ProviderEnvironmentRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactProviderEnvironmentValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: providerEnvironmentRuntimeRequiredExternalEvidence,
  };
}

export function buildProviderEnvironmentRuntimeRedactedHandoffPacket(
  artifact: unknown,
): ProviderEnvironmentRuntimeRedactedHandoffPacket {
  return {
    status: "redacted-handoff-packet-ready",
    artifactPath: "coverage/provider-redacted-handoff-packet.json",
    surfaces: providerEnvironmentRuntimeSurfaces,
    review: buildProviderEnvironmentRuntimeArtifactReview("coverage/provider-redacted-handoff-packet.json", artifact),
    requiredArtifacts: providerEnvironmentRuntimeArtifactPaths,
    externalEvidenceRequired: providerEnvironmentRuntimeRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}

export const providerEnvironmentRuntimeMatrix: readonly ProviderEnvironmentRuntimeMatrixEntry[] = [
  {
    id: "manifest-verifier",
    command: "pnpm deploy:verify-provider-envs",
    artifact: "coverage/provider-environment-verifier.json",
    status: "wired"
  },
  {
    id: "strict-env-secret-store",
    command: "pnpm deploy:check-env:strict",
    artifact: "coverage/provider-strict-env-check-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "web-dashboard-smoke",
    command: "provider web/dashboard route smoke",
    artifact: "coverage/provider-web-dashboard-smoke-redacted.json",
    status: "provider-gated"
  },
  {
    id: "database-migration-dry-run",
    command: "provider database migration dry-run",
    artifact: "coverage/provider-database-migration-dry-run-redacted.json",
    status: "provider-gated"
  },
  {
    id: "storage-private-acl-smoke",
    command: "provider storage private ACL smoke",
    artifact: "coverage/provider-storage-private-acl-redacted.json",
    status: "provider-gated"
  },
  {
    id: "mobile-eas-preview-build",
    command: "eas build --profile preview",
    artifact: "coverage/provider-mobile-eas-preview-redacted.json",
    status: "provider-gated"
  },
  {
    id: "observability-source-map-smoke",
    command: "sentry release/source-map smoke",
    artifact: "coverage/provider-sentry-release-smoke-redacted.json",
    status: "provider-gated"
  },
  {
    id: "github-environment-protections",
    command: "github environment protection audit",
    artifact: "coverage/provider-github-environment-protection-redacted.json",
    status: "ci-gated"
  },
  {
    id: "secret-store-destinations",
    command: "verify provider secret-store destinations",
    artifact: "coverage/provider-secret-store-destinations-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "redacted-evidence-labels",
    command: "record redacted provider evidence labels",
    artifact: "coverage/provider-redacted-handoff-labels.json",
    status: "ci-gated"
  },
  {
    id: "redacted-handoff-packet",
    command: "retain redacted provider-environment handoff packet",
    artifact: "coverage/provider-redacted-handoff-packet.json",
    status: "ci-gated"
  },
  {
    id: "ci-provider-environment-artifacts",
    command: "capture provider environment CI artifacts",
    artifact: "coverage/provider-environment-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const providerEnvironmentRunPersistenceContract: ProviderEnvironmentRunPersistenceContract = {
  prismaModel: "ProviderEnvironmentRun",
  tenantRelation: "providerEnvironmentRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["environmentMatrix", "surfaceMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "strictEnvCheckPassed",
    "previewProvisioned",
    "stagingProvisioned",
    "productionProvisioned",
    "webDashboardSmokePassed",
    "databaseMigrationDryRunPassed",
    "storagePrivateAclSmokePassed",
    "mobilePreviewBuildPassed",
    "observabilitySourceMapSmokePassed",
    "githubEnvironmentProtectionsConfigured",
    "secretStoreDestinationsConfigured",
    "redactedEvidenceLabelsRecorded",
    "ciProviderEnvironmentArtifactsCaptured"
  ],
  redactedArtifactField: "redactedHandoffArtifactPath"
};

export const providerEnvironmentRuntimeReadiness = buildProviderEnvironmentRuntimeReadinessPlan({
  environments: [
    { name: "preview", requiredBeforeProduction: true, surfaces: [] },
    { name: "staging", requiredBeforeProduction: true, surfaces: [] },
    { name: "production", requiredBeforeProduction: true, surfaces: [] }
  ],
  verifierPassed: false,
  providerSmokeChecksPassed: false,
  githubEnvironmentProtectionsConfigured: false,
  secretStoreDestinationsConfigured: false,
  redactedEvidenceLabelsRecorded: false
});
