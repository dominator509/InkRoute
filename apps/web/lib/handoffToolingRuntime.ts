import { buildHandoffToolingRuntimeReadinessPlan, handoffToolingRuntimeRequiredCommands } from "@inkroute/handoff";

export type HandoffToolingRuntimeStatus =
  | "wired"
  | "runtime-gated"
  | "ci-gated"
  | "artifact-gated";

export interface HandoffToolingRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: HandoffToolingRuntimeStatus;
}

export interface HandoffToolingRunPersistenceContract {
  readonly prismaModel: "HandoffToolingRun";
  readonly tenantRelation: "handoffToolingRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["rootScriptMatrix", "packageScriptMatrix", "reportArtifactManifest", "ciEvidenceManifest"];
  readonly requiredBooleanProofs: readonly [
    "dependenciesInstalled",
    "packageTypecheckPassed",
    "packageTestsPassed",
    "verifyDocsPassed",
    "handoffAuditPassed",
    "handoffNextPassed",
    "verifyLedgerPassed",
    "verifyToolingPassed",
    "verifyTaskSyncPassed",
    "handoffAllPassed",
    "queueLedgerParityVerified",
    "ciRunCaptured",
    "reportArtifactsCaptured"
  ];
  readonly artifactFields: readonly [
    "installArtifactPath",
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "handoffScriptArtifactPath",
    "toolingVerifierArtifactPath",
    "handoffAllArtifactPath"
  ];
}

export const handoffToolingRequiredRootScripts = [
  "handoff:verify-docs",
  "handoff:audit",
  "handoff:next",
  "handoff:verify-ledger",
  "handoff:verify-tooling",
  "handoff:verify-task-sync",
  "handoff:all",
] as const;

export const handoffToolingRuntimeCommands = handoffToolingRuntimeRequiredCommands;

export const handoffToolingRuntimeLocalCommands = [
  "pnpm handoff:verify-docs",
  "pnpm handoff:audit",
  "pnpm handoff:next",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:verify-tooling",
  "pnpm handoff:verify-task-sync",
] as const;

const handoffToolingRuntimeLocalCommandSet = new Set<string>(handoffToolingRuntimeLocalCommands);

export const handoffToolingRuntimeExternalCommands = handoffToolingRuntimeCommands.filter(
  (command) => !handoffToolingRuntimeLocalCommandSet.has(command),
);

export type HandoffToolingRuntimeArtifact = (typeof handoffToolingRuntimeArtifactPaths)[number];

export type HandoffToolingRuntimeCommand = (typeof handoffToolingRuntimeCommands)[number];

export type HandoffToolingRuntimeEvidenceInput = {
  dependenciesInstalled: boolean;
  packageTypecheckPassed: boolean;
  packageTestsPassed: boolean;
  verifyDocsPassed: boolean;
  handoffAuditPassed: boolean;
  handoffNextPassed: boolean;
  verifyLedgerPassed: boolean;
  verifyToolingPassed: boolean;
  verifyTaskSyncPassed: boolean;
  handoffAllPassed: boolean;
  queueLedgerParityVerified: boolean;
  ciRunCaptured: boolean;
  reportArtifactsCaptured: boolean;
  requiredCommandsRun: readonly HandoffToolingRuntimeCommand[];
  capturedArtifacts: readonly HandoffToolingRuntimeArtifact[];
};

export type HandoffToolingRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: HandoffToolingRuntimeArtifact[];
  requiredCommands: typeof handoffToolingRuntimeCommands;
  requiredEvidence: typeof handoffToolingRuntimeArtifactPaths;
  toolingPolicy: {
    installedDependenciesRequired: true;
    handoffAllRequired: true;
    ciAndReportArtifactsRequired: true;
  };
};

export interface HandoffToolingRuntimeExecutionPlan {
  readonly localCommands: typeof handoffToolingRuntimeLocalCommands;
  readonly externalCommands: typeof handoffToolingRuntimeExternalCommands;
  readonly localArtifacts: typeof handoffToolingRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof handoffToolingRuntimeExternalArtifacts;
  readonly dependencyInstallExecutionAllowed: false;
  readonly packageTypecheckExecutionAllowed: false;
  readonly packageTestExecutionAllowed: false;
  readonly verifyDocsExecutionAllowed: false;
  readonly auditExecutionAllowed: false;
  readonly nextExecutionAllowed: false;
  readonly ledgerExecutionAllowed: false;
  readonly toolingVerifierExecutionAllowed: false;
  readonly taskSyncExecutionAllowed: false;
  readonly handoffAllExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof handoffToolingRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof handoffToolingRuntimeRequiredExternalEvidence;
}

export interface HandoffToolingRuntimeArtifactReview {
  readonly artifactPath: HandoffToolingRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof handoffToolingRuntimeRequiredExternalEvidence;
}

export interface HandoffToolingRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly sourceArtifactPath: HandoffToolingRuntimeArtifact | string;
  readonly artifactPath: "coverage/handoff-tooling-redacted-evidence-bundle.json";
  readonly review: HandoffToolingRuntimeArtifactReview;
  readonly requiredArtifacts: typeof handoffToolingRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof handoffToolingRuntimeRequiredExternalEvidence;
  readonly handoffAllExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
}

export const handoffToolingRuntimeRequiredExternalEvidence = [
  "Dependency install, package typecheck/test, handoff:all, CI run, and persisted run proof must be captured only after approved execution.",
  "Handoff report artifacts must redact command output, environment values, provider URLs, run URLs, and raw logs.",
  "Report artifacts must either be captured or explicitly documented as unavailable before runtime closure.",
  "HandoffToolingRun persistence must execute only against an approved provider-backed database.",
  "Redacted handoff tooling evidence bundle captured without raw command output, environment values, provider URLs, run URLs, raw logs, report IDs, or actor identifiers.",
] as const;

export type HandoffToolingRuntimeExecutionPolicy = {
  readonly codexMayClassifyHandoffReports: true;
  readonly installedDependenciesRequiredForRuntimeProof: true;
  readonly handoffAllRequiredForClosure: true;
  readonly reportArtifactsRequiredOrUnavailableDocumented: true;
  readonly ciProviderRequiredForRuntimeArtifacts: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const handoffToolingRuntimeExecutionPolicy: HandoffToolingRuntimeExecutionPolicy = {
  codexMayClassifyHandoffReports: true,
  installedDependenciesRequiredForRuntimeProof: true,
  handoffAllRequiredForClosure: true,
  reportArtifactsRequiredOrUnavailableDocumented: true,
  ciProviderRequiredForRuntimeArtifacts: true,
  providerDatabaseRequiredForPersistence: true,
};

const sensitiveHandoffToolingKeyPattern =
  /(token|secret|password|authorization|cookie|env|installOutput|stdout|stderr|command|artifact|artifactUrl|ci|ciRun|ciRunUrl|provider|tenantId|userId|runId|email|phone|report|docs|audit|next|ledger|taskSync|tooling|handoffAll|missingScript|script|queue|parity|manifest|raw|log|output|path|url|uri|database|dsn|stack|error|actor|metadata|repository|branch|pr|pullrequest|reviewer|codeowner)/i;

const sensitiveHandoffToolingStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|ghp|gho|ghu|ghs|whsec)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|project|provider|artifact|run|task|report|repository|branch|pr|pullrequest|reviewer|codeowner)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildHandoffToolingRuntimeEvidenceDecision(
  input: HandoffToolingRuntimeEvidenceInput,
): HandoffToolingRuntimeEvidenceDecision {
  const blockers = [
    !input.dependenciesInstalled && "Install workspace dependencies.",
    !input.packageTypecheckPassed && "Run @inkroute/handoff typecheck.",
    !input.packageTestsPassed && "Run @inkroute/handoff tests.",
    !input.verifyDocsPassed && "Run handoff docs verification.",
    !input.handoffAuditPassed && "Run handoff audit.",
    !input.handoffNextPassed && "Run handoff next.",
    !input.verifyLedgerPassed && "Run handoff ledger verification.",
    !input.verifyToolingPassed && "Run handoff tooling verifier.",
    !input.verifyTaskSyncPassed && "Run handoff task sync verifier.",
    !input.handoffAllPassed && "Run handoff:all.",
    !input.queueLedgerParityVerified && "Verify queue and ledger parity counts.",
    !input.ciRunCaptured && "Capture CI handoff tooling evidence.",
    !input.reportArtifactsCaptured && "Capture handoff report artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = handoffToolingRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = handoffToolingRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: handoffToolingRuntimeCommands,
    requiredEvidence: handoffToolingRuntimeArtifactPaths,
    toolingPolicy: {
      installedDependenciesRequired: true,
      handoffAllRequired: true,
      ciAndReportArtifactsRequired: true,
    },
  };
}

export function buildHandoffToolingRuntimeExecutionPlan(): HandoffToolingRuntimeExecutionPlan {
  return {
    localCommands: handoffToolingRuntimeLocalCommands,
    externalCommands: handoffToolingRuntimeExternalCommands,
    localArtifacts: handoffToolingRuntimeLocalArtifacts,
    externalArtifacts: handoffToolingRuntimeExternalArtifacts,
    dependencyInstallExecutionAllowed: false,
    packageTypecheckExecutionAllowed: false,
    packageTestExecutionAllowed: false,
    verifyDocsExecutionAllowed: false,
    auditExecutionAllowed: false,
    nextExecutionAllowed: false,
    ledgerExecutionAllowed: false,
    toolingVerifierExecutionAllowed: false,
    taskSyncExecutionAllowed: false,
    handoffAllExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: handoffToolingRuntimeExecutionPolicy,
    externalEvidenceRequired: handoffToolingRuntimeRequiredExternalEvidence,
  };
}

function redactHandoffToolingString(value: string, redactions: Set<string>): string {
  return sensitiveHandoffToolingStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactHandoffToolingValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveHandoffToolingKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactHandoffToolingString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactHandoffToolingValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactHandoffToolingValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedHandoffToolingArtifact(artifact: unknown): unknown {
  return redactHandoffToolingValue(artifact, new Set<string>());
}

export function buildHandoffToolingRuntimeArtifactReview(
  artifactPath: HandoffToolingRuntimeArtifact | string,
  artifact: unknown,
): HandoffToolingRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactHandoffToolingValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: handoffToolingRuntimeRequiredExternalEvidence,
  };
}

export function buildHandoffToolingRuntimeRedactedEvidenceBundle(
  artifactPath: HandoffToolingRuntimeArtifact | string,
  artifact: unknown,
): HandoffToolingRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    sourceArtifactPath: artifactPath,
    artifactPath: "coverage/handoff-tooling-redacted-evidence-bundle.json",
    review: buildHandoffToolingRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: handoffToolingRuntimeArtifactPaths,
    externalEvidenceRequired: handoffToolingRuntimeRequiredExternalEvidence,
    handoffAllExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
  };
}

export const handoffToolingRequiredReports = [
  "docs/handoff/manifests/handoff-tooling-readiness.json",
  "docs/handoff/manifests/agent-execution-queue.json",
  "docs/handoff/manifests/agent-execution-ledger.json",
  "docs/handoff/manifests/agent-task-tracking-sync.json",
  "docs/handoff/manifests/gap-audit-report.json",
  "docs/handoff/manifests/phase-documentation-audit.json",
] as const;

export const handoffToolingRequiredScriptFiles = [
  "scripts/handoff/verify-phase-docs.mjs",
  "scripts/handoff/audit-gap-tracker.mjs",
  "scripts/handoff/print-next-agent-tasks.mjs",
  "scripts/handoff/verify-agent-execution-ledger.mjs",
  "scripts/handoff/verify-handoff-tooling.mjs",
  "scripts/handoff/verify-agent-task-sync.mjs",
] as const;

export const handoffToolingRequiredDocs = [
  "HANDOFF_TO_CODEX.md",
  "HANDOFF_TO_JULES.md",
  "HANDOFF_TO_CLAUDE_CODE.md",
  "docs/handoff/README.md",
  "docs/handoff/AGENT_EXECUTION_QUEUE.md",
  "docs/handoff/GAP_CLOSURE_PROTOCOL.md",
] as const;

export const handoffToolingRequiredCiEvidence = [
  "Verify Phase 16 handoff manifests",
  "Run Phase 16 handoff tooling runtime contracts",
  "handoff:verify-tooling",
  "handoff-tooling-runtime-artifacts",
] as const;

export const handoffToolingRuntimeArtifactPaths = [
  "coverage/handoff-tooling-runtime.json",
  "coverage/handoff-tooling-install-output.txt",
  "coverage/handoff-tooling-package-typecheck.txt",
  "coverage/handoff-tooling-package-test.txt",
  "coverage/handoff-verify-docs.json",
  "coverage/handoff-audit.json",
  "coverage/handoff-next.json",
  "coverage/handoff-ledger-verification.json",
  "coverage/handoff-tooling-verification.json",
  "coverage/handoff-task-sync.json",
  "coverage/handoff-all-output.txt",
  "coverage/handoff-tooling-ci-run.json",
  "coverage/handoff-tooling-redacted-evidence-bundle.json",
  "test-results/handoff-tooling-runtime",
] as const;

export const handoffToolingRuntimeLocalArtifacts = [
  "coverage/handoff-tooling-runtime.json",
  "coverage/handoff-verify-docs.json",
  "coverage/handoff-audit.json",
  "coverage/handoff-next.json",
  "coverage/handoff-ledger-verification.json",
  "coverage/handoff-tooling-verification.json",
  "coverage/handoff-task-sync.json",
  "test-results/handoff-tooling-runtime",
] as const satisfies readonly HandoffToolingRuntimeArtifact[];

export const handoffToolingRuntimeExternalArtifacts = [
  "coverage/handoff-tooling-install-output.txt",
  "coverage/handoff-tooling-package-typecheck.txt",
  "coverage/handoff-tooling-package-test.txt",
  "coverage/handoff-all-output.txt",
  "coverage/handoff-tooling-ci-run.json",
  "coverage/handoff-tooling-redacted-evidence-bundle.json",
] as const satisfies readonly HandoffToolingRuntimeArtifact[];

export const handoffToolingRuntimeProofFiles = [
  "packages/handoff/package.json",
  "packages/handoff/src/index.ts",
  "packages/handoff/tests/handoff-plan.test.ts",
  "docs/handoff/manifests/handoff-tooling-readiness.json",
  "scripts/handoff/verify-handoff-tooling.mjs",
  "scripts/handoff/verify-phase-docs.mjs",
  "scripts/handoff/audit-gap-tracker.mjs",
  "scripts/handoff/print-next-agent-tasks.mjs",
  "scripts/handoff/verify-agent-execution-ledger.mjs",
  "scripts/handoff/verify-agent-task-sync.mjs",
  "docs/handoff/manifests/agent-execution-queue.json",
  "docs/handoff/manifests/agent-execution-ledger.json",
  "apps/web/lib/handoffToolingRuntime.ts",
  "apps/web/tests/handoff-tooling-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609024000_add_handoff_tooling_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  "package.json"
] as const;

export const handoffToolingRuntimeMatrix = [
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/handoff-tooling-install-output.txt",
    status: "runtime-gated",
  },
  {
    id: "package-typecheck",
    command: "pnpm --filter @inkroute/handoff typecheck",
    artifact: "coverage/handoff-tooling-package-typecheck.txt",
    status: "runtime-gated",
  },
  {
    id: "package-tests",
    command: "pnpm --filter @inkroute/handoff test",
    artifact: "coverage/handoff-tooling-package-test.txt",
    status: "wired",
  },
  {
    id: "handoff-verify-docs",
    command: "pnpm handoff:verify-docs",
    artifact: "coverage/handoff-verify-docs.json",
    status: "wired",
  },
  {
    id: "handoff-audit",
    command: "pnpm handoff:audit",
    artifact: "coverage/handoff-audit.json",
    status: "wired",
  },
  {
    id: "handoff-next",
    command: "pnpm handoff:next",
    artifact: "coverage/handoff-next.json",
    status: "wired",
  },
  {
    id: "handoff-verify-ledger",
    command: "pnpm handoff:verify-ledger",
    artifact: "coverage/handoff-ledger-verification.json",
    status: "wired",
  },
  {
    id: "handoff-verify-tooling",
    command: "pnpm handoff:verify-tooling",
    artifact: "coverage/handoff-tooling-verification.json",
    status: "wired",
  },
  {
    id: "handoff-verify-task-sync",
    command: "pnpm handoff:verify-task-sync",
    artifact: "coverage/handoff-task-sync.json",
    status: "wired",
  },
  {
    id: "handoff-all",
    command: "pnpm handoff:all",
    artifact: "coverage/handoff-all-output.txt",
    status: "runtime-gated",
  },
  {
    id: "ci-evidence",
    command: "GitHub Actions CI captures Phase 16 handoff tooling checks",
    artifact: "coverage/handoff-tooling-ci-run.json",
    status: "ci-gated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted handoff tooling evidence bundle",
    artifact: "coverage/handoff-tooling-redacted-evidence-bundle.json",
    status: "artifact-gated",
  },
  {
    id: "report-artifacts",
    command: "capture handoff reports or document artifact unavailability",
    artifact: "coverage/handoff-tooling-runtime.json",
    status: "artifact-gated",
  },
] as const satisfies readonly HandoffToolingRuntimeMatrixEntry[];

export const handoffToolingRunPersistenceContract: HandoffToolingRunPersistenceContract = {
  prismaModel: "HandoffToolingRun",
  tenantRelation: "handoffToolingRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["rootScriptMatrix", "packageScriptMatrix", "reportArtifactManifest", "ciEvidenceManifest"],
  requiredBooleanProofs: [
    "dependenciesInstalled",
    "packageTypecheckPassed",
    "packageTestsPassed",
    "verifyDocsPassed",
    "handoffAuditPassed",
    "handoffNextPassed",
    "verifyLedgerPassed",
    "verifyToolingPassed",
    "verifyTaskSyncPassed",
    "handoffAllPassed",
    "queueLedgerParityVerified",
    "ciRunCaptured",
    "reportArtifactsCaptured",
  ],
  artifactFields: [
    "installArtifactPath",
    "packageTypecheckArtifactPath",
    "packageTestArtifactPath",
    "handoffScriptArtifactPath",
    "toolingVerifierArtifactPath",
    "handoffAllArtifactPath",
  ],
};

export const handoffToolingRuntimeReadiness = buildHandoffToolingRuntimeReadinessPlan({
  requiredRootScripts: handoffToolingRequiredRootScripts,
  rootScripts: {
    "handoff:verify-docs": "node scripts/handoff/verify-phase-docs.mjs",
    "handoff:audit": "node scripts/handoff/audit-gap-tracker.mjs",
    "handoff:next": "node scripts/handoff/print-next-agent-tasks.mjs",
    "handoff:verify-ledger": "node scripts/handoff/verify-agent-execution-ledger.mjs",
    "handoff:verify-tooling": "node scripts/handoff/verify-handoff-tooling.mjs",
    "handoff:verify-task-sync": "node scripts/handoff/verify-agent-task-sync.mjs",
    "handoff:all": "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:verify-task-sync",
  },
  requiredReports: handoffToolingRequiredReports,
  existingReports: [...handoffToolingRequiredReports],
  requiredScriptFiles: handoffToolingRequiredScriptFiles,
  existingScriptFiles: [...handoffToolingRequiredScriptFiles],
  requiredDocs: handoffToolingRequiredDocs,
  existingDocs: [...handoffToolingRequiredDocs],
  requiredCiEvidence: handoffToolingRequiredCiEvidence,
  ciWorkflowText: "Verify Phase 16 handoff manifests Run Phase 16 handoff tooling runtime contracts handoff:verify-tooling handoff-tooling-runtime-artifacts",
  handoffPackageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests",
  },
  queueTaskCount: 6,
  ledgerExecutionCount: 6,
  dependenciesInstalled: false,
  packageTypecheckPassed: false,
  packageTestsPassed: false,
  handoffScriptsExecuted: false,
  verifierPassed: false,
  ciRunCaptured: false,
  reportArtifactsCaptured: false,
});

