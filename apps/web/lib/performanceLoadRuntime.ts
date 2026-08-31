import { buildPerformanceLoadRuntimeReadinessPlan } from "@inkroute/testing";

export type PerformanceLoadRuntimeStatus =
  | "wired"
  | "runtime-gated"
  | "database-gated"
  | "ci-gated";

export interface PerformanceLoadRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PerformanceLoadRuntimeStatus;
}

export interface PerformanceLoadRouteBudgetTarget {
  readonly id: string;
  readonly surface: "public" | "dashboard" | "runtime";
  readonly routePattern: string;
  readonly p95MsBudget: number;
  readonly maxErrorRate: number;
  readonly minConcurrentUsers: number;
  readonly evidenceArtifact: string;
}

export interface PerformanceLoadRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: "blocked" | "running" | "passed" | "failed" | "database_gated";
  runtimeMatrix: readonly PerformanceLoadRuntimeMatrixEntry[];
  artifactManifest: readonly string[];
  performanceBudgetVerifierPassed: boolean;
  lighthouseCiPassed: boolean;
  coreWebVitalsWithinBudget: boolean;
  publicRouteBudgetsPassed: boolean;
  dashboardRouteBudgetsPassed: boolean;
  routeBudgetTargetsVerified: boolean;
  bookingLoadTestPassed: boolean;
  webhookBurstTestPassed: boolean;
  uploadIntentLoadTestPassed: boolean;
  dbExplainPlansPassed: boolean;
  imageOptimizationBenchmarksPassed: boolean;
  regressionThresholdsConfigured: boolean;
  performanceArtifactsRetained: boolean;
  ciPerformanceJobPassed: boolean;
  regressionsTriagedAndFixed: boolean;
  triageArtifactPath?: string | null;
  ciRunUrl?: string | null;
}

export interface PerformanceLoadRunPersistenceContract {
  modelName: "PerformanceLoadRun";
  row: PerformanceLoadRunPersistenceInput;
  transactionWrites: readonly ["PerformanceLoadRun", "AuditLog"];
  requiredPerformanceFlags: readonly [
    "performanceBudgetVerifierPassed",
    "lighthouseCiPassed",
    "coreWebVitalsWithinBudget",
    "publicRouteBudgetsPassed",
    "dashboardRouteBudgetsPassed",
    "routeBudgetTargetsVerified",
    "bookingLoadTestPassed",
    "webhookBurstTestPassed",
    "uploadIntentLoadTestPassed",
    "dbExplainPlansPassed",
    "imageOptimizationBenchmarksPassed",
    "regressionThresholdsConfigured",
    "performanceArtifactsRetained",
    "ciPerformanceJobPassed",
    "regressionsTriagedAndFixed",
  ];
  artifactFields: readonly ["runtimeMatrix", "artifactManifest", "triageArtifactPath"];
  tenantIsolationKey: "tenantId";
}

export type PerformanceLoadRunData = PerformanceLoadRunPersistenceInput & {
  commitSha: string | null;
  triageArtifactPath: string | null;
  ciRunUrl: string | null;
};

export interface PerformanceLoadRunRepository {
  readonly performanceLoadRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: PerformanceLoadRunData;
      update: PerformanceLoadRunData;
    }): unknown;
  };
}

export const performanceLoadRuntimeArtifactPaths = [
  "coverage/performance-load-runtime.json",
  "coverage/performance-budget-verification.json",
  "coverage/performance-lighthouse-ci.json",
  "coverage/performance-core-web-vitals.json",
  "coverage/performance-public-route-budgets.json",
  "coverage/performance-dashboard-route-budgets.json",
  "coverage/performance-route-budget-targets.json",
  "coverage/performance-booking-load.json",
  "coverage/performance-webhook-burst.json",
  "coverage/performance-upload-intent-load.json",
  "coverage/performance-db-explain-analyze.json",
  "coverage/performance-image-optimization.json",
  "coverage/performance-regression-thresholds.json",
  "coverage/performance-ci-run-redacted.json",
  "coverage/performance-regression-triage.md",
  "coverage/performance-load-redacted-artifact-packet.json",
  "test-results/performance-load-runtime"
] as const;

export const performanceLoadRuntimeProofFiles = [
  "apps/web/lib/performanceLoadRuntime.ts",
  "apps/web/tests/performance-load-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609015000_add_performance_load_runs/migration.sql",
  "TESTING_PLAN.md",
  "SEO_PLAN.md",
  "testing/manifests/performance-budget.json",
  "testing/scripts/verify-performance-budgets.mjs",
  "package.json",
  "testing/scripts/phase14-static-check.mjs",
  "testing/scripts/verify-test-manifest.mjs",
  "testing/manifests/unit-test-manifest.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  ".github/workflows/ci.yml",
] as const;

export const performanceLoadRuntimeCommands = [
  "pnpm test:performance:budgets",
  "Lighthouse CI for public and dashboard route budgets",
  "capture Core Web Vitals for public and dashboard critical routes",
  "verify performance route budget target contract",
  "measure public home/booking/city SEO route budgets",
  "measure dashboard overview and booking detail route budgets",
  "load test public booking endpoint",
  "load test Stripe webhook burst handling",
  "load test secure upload intent endpoint",
  "database EXPLAIN/ANALYZE query-plan checks",
  "image optimization benchmark report",
  "verify performance regression thresholds",
  "GitHub Actions performance/load job"
] as const;

export const performanceLoadRuntimeLocalCommands = ["pnpm test:performance:budgets"] as const;
export const performanceLoadRuntimeExternalCommands = performanceLoadRuntimeCommands.filter(
  (command) => command !== "pnpm test:performance:budgets",
);

export const performanceLoadRuntimeRequiredExternalEvidence = [
  "Lighthouse CI and Core Web Vitals output must be captured outside Codex with URLs and tokens redacted.",
  "Load-test and Stripe webhook artifacts must redact provider payloads, tenant IDs, user IDs, emails, and phone numbers.",
  "DB EXPLAIN/ANALYZE artifacts must redact database URLs, query literals, and customer identifiers.",
  "CI performance artifacts must redact run URLs and provider identifiers before retention.",
  "Retained redacted performance/load artifact packet must be captured before closure.",
] as const;

export const performanceLoadRouteBudgetTargets = [
  {
    id: "public-home",
    surface: "public",
    routePattern: "/",
    p95MsBudget: 800,
    maxErrorRate: 0.01,
    minConcurrentUsers: 25,
    evidenceArtifact: "coverage/performance-public-route-budgets.json",
  },
  {
    id: "public-booking",
    surface: "public",
    routePattern: "/booking",
    p95MsBudget: 900,
    maxErrorRate: 0.01,
    minConcurrentUsers: 25,
    evidenceArtifact: "coverage/performance-booking-load.json",
  },
  {
    id: "dashboard-overview",
    surface: "dashboard",
    routePattern: "/dashboard",
    p95MsBudget: 1000,
    maxErrorRate: 0.01,
    minConcurrentUsers: 15,
    evidenceArtifact: "coverage/performance-dashboard-route-budgets.json",
  },
  {
    id: "dashboard-booking-detail",
    surface: "dashboard",
    routePattern: "/dashboard/bookings/:bookingId",
    p95MsBudget: 1100,
    maxErrorRate: 0.01,
    minConcurrentUsers: 15,
    evidenceArtifact: "coverage/performance-dashboard-route-budgets.json",
  },
  {
    id: "runtime-booking-api",
    surface: "runtime",
    routePattern: "/api/public/:tenantSlug/booking-requests",
    p95MsBudget: 750,
    maxErrorRate: 0.005,
    minConcurrentUsers: 30,
    evidenceArtifact: "coverage/performance-booking-load.json",
  },
  {
    id: "runtime-upload-intent-api",
    surface: "runtime",
    routePattern: "/api/files/signed-upload",
    p95MsBudget: 650,
    maxErrorRate: 0.005,
    minConcurrentUsers: 30,
    evidenceArtifact: "coverage/performance-upload-intent-load.json",
  },
] as const satisfies readonly PerformanceLoadRouteBudgetTarget[];

export type PerformanceLoadRuntimeExecutionPolicy = {
  readonly codexMayRunDependencyFreeVerifier: true;
  readonly liveBrowserRequiredForLighthouseAndCwv: true;
  readonly providerEnvironmentRequiredForLoadAndPersistence: true;
  readonly databaseAccessRequiredForExplainAnalyze: true;
  readonly ciProviderRequiredForPerformanceJob: true;
};

export const performanceLoadRuntimeExecutionPolicy: PerformanceLoadRuntimeExecutionPolicy = {
  codexMayRunDependencyFreeVerifier: true,
  liveBrowserRequiredForLighthouseAndCwv: true,
  providerEnvironmentRequiredForLoadAndPersistence: true,
  databaseAccessRequiredForExplainAnalyze: true,
  ciProviderRequiredForPerformanceJob: true,
};

export type PerformanceLoadRuntimeArtifact = (typeof performanceLoadRuntimeArtifactPaths)[number];

export type PerformanceLoadRuntimeCommand = (typeof performanceLoadRuntimeCommands)[number];

export const performanceLoadRuntimeLocalArtifacts = [
  "coverage/performance-load-runtime.json",
  "coverage/performance-budget-verification.json",
  "coverage/performance-regression-thresholds.json",
  "test-results/performance-load-runtime",
] as const satisfies readonly PerformanceLoadRuntimeArtifact[];

export const performanceLoadRuntimeExternalArtifacts = [
  "coverage/performance-lighthouse-ci.json",
  "coverage/performance-core-web-vitals.json",
  "coverage/performance-public-route-budgets.json",
  "coverage/performance-dashboard-route-budgets.json",
  "coverage/performance-booking-load.json",
  "coverage/performance-webhook-burst.json",
  "coverage/performance-upload-intent-load.json",
  "coverage/performance-db-explain-analyze.json",
  "coverage/performance-image-optimization.json",
  "coverage/performance-ci-run-redacted.json",
  "coverage/performance-regression-triage.md",
  "coverage/performance-load-redacted-artifact-packet.json",
] as const satisfies readonly PerformanceLoadRuntimeArtifact[];

export type PerformanceLoadRuntimeEvidenceInput = {
  performanceBudgetVerifierPassed: boolean;
  lighthouseCiPassed: boolean;
  coreWebVitalsWithinBudget: boolean;
  publicRouteBudgetsPassed: boolean;
  dashboardRouteBudgetsPassed: boolean;
  routeBudgetTargetsVerified: boolean;
  bookingLoadTestPassed: boolean;
  webhookBurstTestPassed: boolean;
  uploadIntentLoadTestPassed: boolean;
  dbExplainPlansPassed: boolean;
  imageOptimizationBenchmarksPassed: boolean;
  regressionThresholdsConfigured: boolean;
  performanceArtifactsRetained: boolean;
  ciPerformanceJobPassed: boolean;
  regressionsTriagedAndFixed: boolean;
  redactedArtifactPacketCaptured: boolean;
  requiredCommandsRun: readonly PerformanceLoadRuntimeCommand[];
  capturedArtifacts: readonly PerformanceLoadRuntimeArtifact[];
};

export type PerformanceLoadRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: PerformanceLoadRuntimeArtifact[];
  requiredCommands: typeof performanceLoadRuntimeCommands;
  requiredEvidence: typeof performanceLoadRuntimeArtifactPaths;
  performancePolicy: {
    lighthouseAndCwvRequired: true;
    loadAndDatabaseBenchmarksRequired: true;
    routeBudgetTargetsRequired: true;
    regressionsMustBeTriaged: true;
  };
};

export interface PerformanceLoadRuntimeExecutionPlan {
  readonly localCommands: typeof performanceLoadRuntimeLocalCommands;
  readonly externalCommands: typeof performanceLoadRuntimeExternalCommands;
  readonly localArtifacts: typeof performanceLoadRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof performanceLoadRuntimeExternalArtifacts;
  readonly routeBudgetTargets: typeof performanceLoadRouteBudgetTargets;
  readonly lighthouseExecutionAllowed: false;
  readonly coreWebVitalsExecutionAllowed: false;
  readonly routeBudgetExecutionAllowed: false;
  readonly loadTestExecutionAllowed: false;
  readonly dbExplainExecutionAllowed: false;
  readonly imageBenchmarkExecutionAllowed: false;
  readonly ciPerformanceExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof performanceLoadRuntimeExecutionPolicy;
}

export interface PerformanceLoadRuntimeArtifactReview {
  readonly artifactPath: PerformanceLoadRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof performanceLoadRuntimeRequiredExternalEvidence;
}

export interface PerformanceLoadRuntimeRedactedArtifactPacket {
  readonly status: "redacted-artifact-packet-ready";
  readonly artifactPath: "coverage/performance-load-redacted-artifact-packet.json";
  readonly review: PerformanceLoadRuntimeArtifactReview;
  readonly requiredArtifacts: typeof performanceLoadRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof performanceLoadRuntimeRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

const sensitivePerformanceLoadKeyPattern =
  /(token|secret|password|authorization|cookie|databaseUrl|dbUrl|ciRunUrl|providerId|stripePayload|payload|queryPlan|routeUrl|email|phone|tenantId|userId|runId|raw|body|stack|error|log|output|transcript|database|dsn|lighthouse|core.?web.?vitals|cwv|trace|screenshot|video|artifact|command|request|response|explain|analyze|benchmark|image|regression|triage|route|url|path|booking|webhook|upload|stripe|provider|commitSha|repository|repo|branch|pull|pr|reviewer|codeowner)/i;

const sensitivePerformanceLoadStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DSN]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|whsec)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|artist|client|booking|run|route|load|webhook|upload|stripe|lighthouse|cwv|workflow|ci|commit|trace|artifact|query|image|regression|repository|repo|branch|pull|pr|reviewer|codeowner)_[A-Za-z0-9_.-]+\b/gi, "[REDACTED_ID]"],
  [/\b(?:artifacts|coverage|test-results|reports)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED_ARTIFACT_PATH]"],
];

export function buildPerformanceLoadRuntimeEvidenceDecision(
  input: PerformanceLoadRuntimeEvidenceInput,
): PerformanceLoadRuntimeEvidenceDecision {
  const blockers = [
    !input.performanceBudgetVerifierPassed && "Run performance budget verifier.",
    !input.lighthouseCiPassed && "Run Lighthouse CI for public and dashboard routes.",
    !input.coreWebVitalsWithinBudget && "Capture Core Web Vitals within budget.",
    !input.publicRouteBudgetsPassed && "Capture public route budget proof.",
    !input.dashboardRouteBudgetsPassed && "Capture dashboard route budget proof.",
    !input.routeBudgetTargetsVerified && "Verify route budget targets for public, dashboard, and runtime endpoints.",
    !input.bookingLoadTestPassed && "Run public booking load test.",
    !input.webhookBurstTestPassed && "Run Stripe webhook burst load test.",
    !input.uploadIntentLoadTestPassed && "Run secure upload-intent load test.",
    !input.dbExplainPlansPassed && "Run DB EXPLAIN/ANALYZE query-plan checks.",
    !input.imageOptimizationBenchmarksPassed && "Run image optimization benchmarks.",
    !input.regressionThresholdsConfigured && "Configure performance regression thresholds.",
    !input.performanceArtifactsRetained && "Retain performance/load artifacts.",
    !input.ciPerformanceJobPassed && "Capture CI performance/load job proof.",
    !input.regressionsTriagedAndFixed && "Triage and fix or document performance regressions.",
    !input.redactedArtifactPacketCaptured && "Capture retained redacted performance/load artifact packet proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = performanceLoadRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = performanceLoadRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: performanceLoadRuntimeCommands,
    requiredEvidence: performanceLoadRuntimeArtifactPaths,
    performancePolicy: {
      lighthouseAndCwvRequired: true,
      loadAndDatabaseBenchmarksRequired: true,
      routeBudgetTargetsRequired: true,
      regressionsMustBeTriaged: true,
    },
  };
}

export function buildPerformanceLoadRuntimeExecutionPlan(): PerformanceLoadRuntimeExecutionPlan {
  return {
    localCommands: performanceLoadRuntimeLocalCommands,
    externalCommands: performanceLoadRuntimeExternalCommands,
    localArtifacts: performanceLoadRuntimeLocalArtifacts,
    externalArtifacts: performanceLoadRuntimeExternalArtifacts,
    routeBudgetTargets: performanceLoadRouteBudgetTargets,
    lighthouseExecutionAllowed: false,
    coreWebVitalsExecutionAllowed: false,
    routeBudgetExecutionAllowed: false,
    loadTestExecutionAllowed: false,
    dbExplainExecutionAllowed: false,
    imageBenchmarkExecutionAllowed: false,
    ciPerformanceExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: performanceLoadRuntimeExecutionPolicy,
  };
}

function redactPerformanceLoadString(value: string, redactions: Set<string>): string {
  return sensitivePerformanceLoadStringPatterns.reduce((current, [pattern, replacement]) => {
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactPerformanceLoadValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitivePerformanceLoadKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactPerformanceLoadString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactPerformanceLoadValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactPerformanceLoadValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedPerformanceLoadArtifact(artifact: unknown): unknown {
  return redactPerformanceLoadValue(artifact, new Set<string>());
}

export function buildPerformanceLoadRuntimeArtifactReview(
  artifactPath: PerformanceLoadRuntimeArtifact | string,
  artifact: unknown,
): PerformanceLoadRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactPerformanceLoadValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: performanceLoadRuntimeRequiredExternalEvidence,
  };
}

export function buildPerformanceLoadRuntimeRedactedArtifactPacket(
  artifact: unknown,
): PerformanceLoadRuntimeRedactedArtifactPacket {
  return {
    status: "redacted-artifact-packet-ready",
    artifactPath: "coverage/performance-load-redacted-artifact-packet.json",
    review: buildPerformanceLoadRuntimeArtifactReview("coverage/performance-load-redacted-artifact-packet.json", artifact),
    requiredArtifacts: performanceLoadRuntimeArtifactPaths,
    externalEvidenceRequired: performanceLoadRuntimeRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}

export const performanceLoadRuntimeMatrix: readonly PerformanceLoadRuntimeMatrixEntry[] = [
  {
    id: "budget-verifier",
    command: "pnpm test:performance:budgets",
    artifact: "coverage/performance-budget-verification.json",
    status: "wired"
  },
  {
    id: "lighthouse-core-web-vitals",
    command: "Lighthouse CI for public and dashboard route budgets",
    artifact: "coverage/performance-lighthouse-ci.json",
    status: "runtime-gated"
  },
  {
    id: "core-web-vitals",
    command: "capture Core Web Vitals for public and dashboard critical routes",
    artifact: "coverage/performance-core-web-vitals.json",
    status: "runtime-gated"
  },
  {
    id: "route-budget-target-contract",
    command: "verify performance route budget target contract",
    artifact: "coverage/performance-route-budget-targets.json",
    status: "wired"
  },
  {
    id: "public-route-budgets",
    command: "measure public home/booking/city SEO route budgets",
    artifact: "coverage/performance-public-route-budgets.json",
    status: "runtime-gated"
  },
  {
    id: "dashboard-route-budgets",
    command: "measure dashboard overview and booking detail route budgets",
    artifact: "coverage/performance-dashboard-route-budgets.json",
    status: "runtime-gated"
  },
  {
    id: "booking-load",
    command: "load test public booking endpoint",
    artifact: "coverage/performance-booking-load.json",
    status: "runtime-gated"
  },
  {
    id: "webhook-burst-load",
    command: "load test Stripe webhook burst handling",
    artifact: "coverage/performance-webhook-burst.json",
    status: "runtime-gated"
  },
  {
    id: "upload-intent-load",
    command: "load test secure upload intent endpoint",
    artifact: "coverage/performance-upload-intent-load.json",
    status: "runtime-gated"
  },
  {
    id: "db-explain-analyze",
    command: "database EXPLAIN/ANALYZE query-plan checks",
    artifact: "coverage/performance-db-explain-analyze.json",
    status: "database-gated"
  },
  {
    id: "image-optimization-benchmarks",
    command: "image optimization benchmark report",
    artifact: "coverage/performance-image-optimization.json",
    status: "runtime-gated"
  },
  {
    id: "regression-thresholds",
    command: "verify performance regression thresholds",
    artifact: "coverage/performance-regression-thresholds.json",
    status: "wired"
  },
  {
    id: "ci-performance-job",
    command: "GitHub Actions performance/load job",
    artifact: "coverage/performance-ci-run-redacted.json",
    status: "ci-gated"
  },
  {
    id: "regression-triage",
    command: "triage and fix or document performance regressions",
    artifact: "coverage/performance-regression-triage.md",
    status: "ci-gated"
  },
  {
    id: "redacted-artifact-packet",
    command: "retain redacted performance/load artifact packet",
    artifact: "coverage/performance-load-redacted-artifact-packet.json",
    status: "ci-gated"
  }
];

export function buildPerformanceLoadRunPersistenceContract(
  input: PerformanceLoadRunPersistenceInput,
): PerformanceLoadRunPersistenceContract {
  return {
    modelName: "PerformanceLoadRun",
    row: input,
    transactionWrites: ["PerformanceLoadRun", "AuditLog"],
    requiredPerformanceFlags: [
      "performanceBudgetVerifierPassed",
      "lighthouseCiPassed",
      "coreWebVitalsWithinBudget",
      "publicRouteBudgetsPassed",
      "dashboardRouteBudgetsPassed",
      "routeBudgetTargetsVerified",
      "bookingLoadTestPassed",
      "webhookBurstTestPassed",
      "uploadIntentLoadTestPassed",
      "dbExplainPlansPassed",
      "imageOptimizationBenchmarksPassed",
      "regressionThresholdsConfigured",
      "performanceArtifactsRetained",
      "ciPerformanceJobPassed",
      "regressionsTriagedAndFixed",
    ],
    artifactFields: ["runtimeMatrix", "artifactManifest", "triageArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildPerformanceLoadRunData(input: PerformanceLoadRunPersistenceInput): PerformanceLoadRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    triageArtifactPath: input.triageArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistPerformanceLoadRun(
  repository: PerformanceLoadRunRepository,
  input: PerformanceLoadRunPersistenceInput,
): unknown {
  const data = buildPerformanceLoadRunData(input);

  return repository.performanceLoadRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export const performanceLoadRuntimeReadiness = buildPerformanceLoadRuntimeReadinessPlan({
  rootScripts: ["test:performance:budgets"],
  performanceBudgetVerifierPassed: true,
  lighthouseCiPassed: false,
  coreWebVitalsWithinBudget: false,
  publicRouteBudgetsPassed: false,
  dashboardRouteBudgetsPassed: false,
  routeBudgetTargetsVerified: false,
  bookingLoadTestPassed: false,
  webhookBurstTestPassed: false,
  uploadIntentLoadTestPassed: false,
  dbExplainPlansPassed: false,
  imageOptimizationBenchmarksPassed: false,
  regressionThresholdsConfigured: true,
  performanceArtifactsRetained: true,
  ciPerformanceJobPassed: false,
  regressionsTriagedAndFixed: false
});

export const performanceLoadRunPersistencePreview = buildPerformanceLoadRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "performance-load-demo",
  status: "database_gated",
  runtimeMatrix: performanceLoadRuntimeMatrix,
  artifactManifest: performanceLoadRuntimeArtifactPaths,
  performanceBudgetVerifierPassed: true,
  lighthouseCiPassed: false,
  coreWebVitalsWithinBudget: false,
  publicRouteBudgetsPassed: false,
  dashboardRouteBudgetsPassed: false,
  routeBudgetTargetsVerified: false,
  bookingLoadTestPassed: false,
  webhookBurstTestPassed: false,
  uploadIntentLoadTestPassed: false,
  dbExplainPlansPassed: false,
  imageOptimizationBenchmarksPassed: false,
  regressionThresholdsConfigured: true,
  performanceArtifactsRetained: true,
  ciPerformanceJobPassed: false,
  regressionsTriagedAndFixed: false,
  triageArtifactPath: "coverage/performance-regression-triage.md",
});

