import { buildSecretManagementRuntimeReadinessPlan } from "@inkroute/deployment";

export type SecretManagementRuntimeStatus =
  | "wired"
  | "secret-store-gated"
  | "rotation-gated"
  | "scan-gated"
  | "ci-gated";

export interface SecretManagementRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SecretManagementRuntimeStatus;
}

export interface SecretManagementRunPersistenceContract {
  readonly prismaModel: "SecretManagementRun";
  readonly tenantRelation: "secretManagementRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["productionSecretInventory", "auditManifest", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "strictEnvCheckPassed",
    "providerSecretStoresConfigured",
    "maskedCiLogsCaptured",
    "providerAuditLogsCaptured",
    "rotationCadenceDocumented",
    "dualControlPolicyDocumented",
    "incidentRotationTabletopDocumented",
    "committedSecretScanPassed",
    "ciSecretManagementArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "redactedProviderStoreArtifactPath",
    "maskedCiLogArtifactPath",
    "providerAuditLogArtifactPath",
    "incidentRotationTabletopArtifactPath",
    "committedSecretScanArtifactPath"
  ];
}

export const secretManagementRequiredProductionSecretNames = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENTRY_AUTH_TOKEN",
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_WEB_PROJECT_ID",
  "VERCEL_DASHBOARD_PROJECT_ID",
  "CSRF_SECRET",
  "SECURITY_ENCRYPTION_PRIMARY_KEY",
  "EAS_PROJECT_ID"
] as const;

export const secretManagementRuntimeArtifactPaths = [
  "coverage/secret-management-runtime.json",
  "coverage/secret-management-verifier.json",
  "coverage/secret-strict-env-check-redacted.json",
  "coverage/secret-provider-store-destinations-redacted.json",
  "coverage/secret-masked-ci-logs-redacted.json",
  "coverage/secret-provider-audit-logs-redacted.json",
  "coverage/secret-rotation-policy.json",
  "coverage/secret-incident-rotation-tabletop.md",
  "coverage/secret-committed-scan.json",
  "coverage/secret-management-ci-run-redacted.json",
  "test-results/secret-management-runtime"
] as const;

export const secretManagementRuntimeProofFiles = [
  "apps/web/lib/secretManagementRuntime.ts",
  "apps/web/tests/secret-management-runtime-static.test.ts",
  ".env.example",
  "ENVIRONMENT_VARIABLES.md",
  "deployment/manifests/environment-contract.json",
  "deployment/manifests/secret-management-audit.json",
  "deployment/scripts/check-env.mjs",
  "deployment/scripts/verify-secret-management.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  ".github/workflows/ci.yml",
  "apps/dashboard/app/api/deployment/readiness/route.ts",
  "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609018000_add_secret_management_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const secretManagementRuntimeCommands = [
  "pnpm deploy:verify-secrets",
  "pnpm deploy:check-env:strict",
  "committed secret scan",
  "provider secret-store audit",
  "masked CI log review",
  "provider audit-log reference capture",
  "document secret rotation cadence and dual-control policy",
  "incident rotation tabletop",
  "capture CI secret-management artifacts"
] as const;

export const secretManagementRuntimeRequiredExternalEvidence = [
  "Strict environment checks must run only in approved secret-backed environments and retain redacted labels only.",
  "Provider secret-store and audit-log proof must include labels/references only, never secret values or provider IDs.",
  "Masked CI logs must prove secrets are not printed while redacting run URLs, tokens, and environment details.",
  "SecretManagementRun persistence must execute only against an approved provider-backed database without storing secret values.",
] as const;

export type SecretManagementRuntimeExecutionPolicy = {
  readonly codexMayClassifySecretLabels: true;
  readonly secretValuesForbidden: true;
  readonly providerStoreAccessRequiresApprovedOperator: true;
  readonly strictEnvironmentRequiresRealSecretBackedRuntime: true;
  readonly ciProviderRequiredForMaskedLogs: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const secretManagementRuntimeExecutionPolicy: SecretManagementRuntimeExecutionPolicy = {
  codexMayClassifySecretLabels: true,
  secretValuesForbidden: true,
  providerStoreAccessRequiresApprovedOperator: true,
  strictEnvironmentRequiresRealSecretBackedRuntime: true,
  ciProviderRequiredForMaskedLogs: true,
  providerDatabaseRequiredForPersistence: true,
};

export type SecretManagementRuntimeArtifact = (typeof secretManagementRuntimeArtifactPaths)[number];

export const secretManagementRuntimeLocalArtifacts = [
  "coverage/secret-management-runtime.json",
  "coverage/secret-management-verifier.json",
  "coverage/secret-rotation-policy.json",
  "coverage/secret-incident-rotation-tabletop.md",
  "coverage/secret-committed-scan.json",
  "test-results/secret-management-runtime",
] as const satisfies readonly SecretManagementRuntimeArtifact[];

const secretManagementRuntimeLocalArtifactSet = new Set<SecretManagementRuntimeArtifact>(
  secretManagementRuntimeLocalArtifacts,
);

export const secretManagementRuntimeExternalArtifacts = secretManagementRuntimeArtifactPaths.filter(
  (artifact) => !secretManagementRuntimeLocalArtifactSet.has(artifact),
) as readonly SecretManagementRuntimeArtifact[];

export type SecretManagementRuntimeCommand = (typeof secretManagementRuntimeCommands)[number];

export type SecretManagementRuntimeEvidenceInput = {
  verifierPassed: boolean;
  strictEnvCheckPassed: boolean;
  providerSecretStoresConfigured: boolean;
  maskedCiLogsCaptured: boolean;
  providerAuditLogsCaptured: boolean;
  rotationCadenceDocumented: boolean;
  dualControlPolicyDocumented: boolean;
  incidentRotationTabletopDocumented: boolean;
  committedSecretScanPassed: boolean;
  ciSecretManagementArtifactsCaptured: boolean;
  requiredCommandsRun: readonly SecretManagementRuntimeCommand[];
  capturedArtifacts: readonly SecretManagementRuntimeArtifact[];
};

export type SecretManagementRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: SecretManagementRuntimeArtifact[];
  requiredCommands: typeof secretManagementRuntimeCommands;
  requiredEvidence: typeof secretManagementRuntimeArtifactPaths;
  secretPolicy: {
    secretValuesForbidden: true;
    providerStoreLabelsOnly: true;
    maskedCiLogsRequired: true;
  };
};

export interface SecretManagementRuntimeExecutionPlan {
  readonly localCommands: typeof secretManagementRuntimeLocalCommands;
  readonly externalCommands: typeof secretManagementRuntimeExternalCommands;
  readonly localArtifacts: typeof secretManagementRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof secretManagementRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly strictEnvExecutionAllowed: false;
  readonly providerSecretStoreExecutionAllowed: false;
  readonly maskedCiLogExecutionAllowed: false;
  readonly providerAuditLogExecutionAllowed: false;
  readonly rotationPolicyExecutionAllowed: false;
  readonly incidentTabletopExecutionAllowed: false;
  readonly committedSecretScanExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof secretManagementRuntimeExecutionPolicy;
}

export interface SecretManagementRuntimeArtifactReview {
  readonly artifactPath: SecretManagementRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof secretManagementRuntimeRequiredExternalEvidence;
}

export const secretManagementRuntimeLocalCommands = [
  "pnpm deploy:verify-secrets",
  "committed secret scan",
  "document secret rotation cadence and dual-control policy",
  "incident rotation tabletop",
] as const satisfies readonly SecretManagementRuntimeCommand[];

export const secretManagementRuntimeExternalCommands = [
  "pnpm deploy:check-env:strict",
  "provider secret-store audit",
  "masked CI log review",
  "provider audit-log reference capture",
  "capture CI secret-management artifacts",
] as const satisfies readonly SecretManagementRuntimeCommand[];

const sensitiveSecretManagementKeyPattern =
  /(token|secret|password|authorization|cookie|env|databaseUrl|dbUrl|directUrl|provider|projectId|resourceId|ciRunUrl|auditLog|secretStore|maskedLog|tenantId|userId|runId|email|phone|value)/i;

const sensitiveSecretManagementStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|whsec)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|project|provider|run|secret|audit|env)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export type SecretManagementRunRecordInput = SecretManagementRuntimeEvidenceInput & {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: SecretManagementRuntimeEvidenceDecision["status"];
  productionSecretInventory: unknown;
  auditManifest: unknown;
  artifactManifest: unknown;
  redactedProviderStoreArtifactPath?: string | null;
  maskedCiLogArtifactPath?: string | null;
  providerAuditLogArtifactPath?: string | null;
  incidentRotationTabletopArtifactPath?: string | null;
  committedSecretScanArtifactPath?: string | null;
  ciRunUrl?: string | null;
};

export type SecretManagementRunData = Omit<SecretManagementRunRecordInput, "requiredCommandsRun" | "capturedArtifacts">;

export interface SecretManagementRunRepository {
  readonly secretManagementRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: SecretManagementRunData;
      update: SecretManagementRunData;
    }): unknown;
  };
}

export function buildSecretManagementRunData(input: SecretManagementRunRecordInput): SecretManagementRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    productionSecretInventory: input.productionSecretInventory,
    auditManifest: input.auditManifest,
    artifactManifest: input.artifactManifest,
    verifierPassed: input.verifierPassed,
    strictEnvCheckPassed: input.strictEnvCheckPassed,
    providerSecretStoresConfigured: input.providerSecretStoresConfigured,
    maskedCiLogsCaptured: input.maskedCiLogsCaptured,
    providerAuditLogsCaptured: input.providerAuditLogsCaptured,
    rotationCadenceDocumented: input.rotationCadenceDocumented,
    dualControlPolicyDocumented: input.dualControlPolicyDocumented,
    incidentRotationTabletopDocumented: input.incidentRotationTabletopDocumented,
    committedSecretScanPassed: input.committedSecretScanPassed,
    ciSecretManagementArtifactsCaptured: input.ciSecretManagementArtifactsCaptured,
    redactedProviderStoreArtifactPath: input.redactedProviderStoreArtifactPath ?? null,
    maskedCiLogArtifactPath: input.maskedCiLogArtifactPath ?? null,
    providerAuditLogArtifactPath: input.providerAuditLogArtifactPath ?? null,
    incidentRotationTabletopArtifactPath: input.incidentRotationTabletopArtifactPath ?? null,
    committedSecretScanArtifactPath: input.committedSecretScanArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistSecretManagementRun(
  repository: SecretManagementRunRepository,
  input: SecretManagementRunRecordInput,
): unknown {
  const data = buildSecretManagementRunData(input);

  return repository.secretManagementRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export function buildSecretManagementRuntimeEvidenceDecision(
  input: SecretManagementRuntimeEvidenceInput,
): SecretManagementRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run secret-management audit verifier.",
    !input.strictEnvCheckPassed && "Run strict env check against a real secret-backed environment.",
    !input.providerSecretStoresConfigured && "Capture provider secret-store configuration proof.",
    !input.maskedCiLogsCaptured && "Capture masked CI log proof.",
    !input.providerAuditLogsCaptured && "Capture provider audit-log references.",
    !input.rotationCadenceDocumented && "Document secret rotation cadence.",
    !input.dualControlPolicyDocumented && "Document production dual-control policy.",
    !input.incidentRotationTabletopDocumented && "Document incident rotation tabletop.",
    !input.committedSecretScanPassed && "Run committed-secret scan.",
    !input.ciSecretManagementArtifactsCaptured && "Capture CI secret-management artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = secretManagementRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = secretManagementRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: secretManagementRuntimeCommands,
    requiredEvidence: secretManagementRuntimeArtifactPaths,
    secretPolicy: {
      secretValuesForbidden: true,
      providerStoreLabelsOnly: true,
      maskedCiLogsRequired: true,
    },
  };
}

export function buildSecretManagementRuntimeExecutionPlan(): SecretManagementRuntimeExecutionPlan {
  return {
    localCommands: secretManagementRuntimeLocalCommands,
    externalCommands: secretManagementRuntimeExternalCommands,
    localArtifacts: secretManagementRuntimeLocalArtifacts,
    externalArtifacts: secretManagementRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    strictEnvExecutionAllowed: false,
    providerSecretStoreExecutionAllowed: false,
    maskedCiLogExecutionAllowed: false,
    providerAuditLogExecutionAllowed: false,
    rotationPolicyExecutionAllowed: false,
    incidentTabletopExecutionAllowed: false,
    committedSecretScanExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: secretManagementRuntimeExecutionPolicy,
  };
}

function redactSecretManagementString(value: string, redactions: Set<string>): string {
  return sensitiveSecretManagementStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactSecretManagementValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveSecretManagementKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactSecretManagementString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSecretManagementValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactSecretManagementValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedSecretManagementArtifact(artifact: unknown): unknown {
  return redactSecretManagementValue(artifact, new Set<string>());
}

export function buildSecretManagementRuntimeArtifactReview(
  artifactPath: SecretManagementRuntimeArtifact | string,
  artifact: unknown,
): SecretManagementRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactSecretManagementValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: secretManagementRuntimeRequiredExternalEvidence,
  };
}

export const secretManagementRuntimeMatrix: readonly SecretManagementRuntimeMatrixEntry[] = [
  {
    id: "secret-audit-verifier",
    command: "pnpm deploy:verify-secrets",
    artifact: "coverage/secret-management-verifier.json",
    status: "wired"
  },
  {
    id: "strict-env-real-secrets",
    command: "pnpm deploy:check-env:strict",
    artifact: "coverage/secret-strict-env-check-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "provider-secret-stores",
    command: "provider secret-store audit",
    artifact: "coverage/secret-provider-store-destinations-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "masked-ci-log-review",
    command: "masked CI log review",
    artifact: "coverage/secret-masked-ci-logs-redacted.json",
    status: "ci-gated"
  },
  {
    id: "provider-audit-log-references",
    command: "provider audit-log reference capture",
    artifact: "coverage/secret-provider-audit-logs-redacted.json",
    status: "secret-store-gated"
  },
  {
    id: "rotation-policy-dual-control",
    command: "document secret rotation cadence and dual-control policy",
    artifact: "coverage/secret-rotation-policy.json",
    status: "rotation-gated"
  },
  {
    id: "incident-rotation-tabletop",
    command: "incident rotation tabletop",
    artifact: "coverage/secret-incident-rotation-tabletop.md",
    status: "rotation-gated"
  },
  {
    id: "committed-secret-scan",
    command: "committed secret scan",
    artifact: "coverage/secret-committed-scan.json",
    status: "scan-gated"
  },
  {
    id: "ci-secret-management-artifacts",
    command: "capture CI secret-management artifacts",
    artifact: "coverage/secret-management-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const secretManagementRunPersistenceContract: SecretManagementRunPersistenceContract = {
  prismaModel: "SecretManagementRun",
  tenantRelation: "secretManagementRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["productionSecretInventory", "auditManifest", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "strictEnvCheckPassed",
    "providerSecretStoresConfigured",
    "maskedCiLogsCaptured",
    "providerAuditLogsCaptured",
    "rotationCadenceDocumented",
    "dualControlPolicyDocumented",
    "incidentRotationTabletopDocumented",
    "committedSecretScanPassed",
    "ciSecretManagementArtifactsCaptured"
  ],
  redactedArtifactFields: [
    "redactedProviderStoreArtifactPath",
    "maskedCiLogArtifactPath",
    "providerAuditLogArtifactPath",
    "incidentRotationTabletopArtifactPath",
    "committedSecretScanArtifactPath"
  ]
};

export const secretManagementRuntimeReadiness = buildSecretManagementRuntimeReadinessPlan({
  requiredProductionSecretNames: secretManagementRequiredProductionSecretNames,
  auditItems: [],
  rotationPolicy: {
    defaultCadenceDays: 90,
    incidentRotationHours: 4,
    requiresDualControlForProduction: true,
    requiresMaskedCiLogProof: true,
    requiresProviderAuditLogReference: true
  },
  verifierPassed: false,
  strictEnvironmentCheckPassed: false,
  providerSecretStoresConfigured: false,
  maskedCiLogsCaptured: false,
  providerAuditLogsCaptured: false,
  committedSecretScanPassed: false,
  incidentRotationProcessDocumented: false
});
