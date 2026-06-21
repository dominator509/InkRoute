import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPerformanceLoadRuntimeArtifactReview,
  buildPerformanceLoadRuntimeEvidenceDecision,
  buildPerformanceLoadRuntimeExecutionPlan,
  buildRedactedPerformanceLoadArtifact,
  buildPerformanceLoadRunData,
  buildPerformanceLoadRunPersistenceContract,
  performanceLoadRunPersistencePreview,
  performanceLoadRuntimeArtifactPaths,
  performanceLoadRuntimeCommands,
  performanceLoadRuntimeExternalArtifacts,
  performanceLoadRuntimeExternalCommands,
  performanceLoadRuntimeExecutionPolicy,
  performanceLoadRuntimeLocalArtifacts,
  performanceLoadRuntimeLocalCommands,
  performanceLoadRuntimeMatrix,
  performanceLoadRuntimeProofFiles,
  performanceLoadRuntimeReadiness,
  performanceLoadRuntimeRequiredExternalEvidence,
  persistPerformanceLoadRun
} from "../lib/performanceLoadRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const packageJson = read("package.json");
const performanceBudget = read("testing/manifests/performance-budget.json");
const budgetVerifier = read("testing/scripts/verify-performance-budgets.mjs");
const phase14StaticCheck = read("testing/scripts/phase14-static-check.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-112 performance and load runtime wiring", () => {
  it("pins performance/load commands, matrix entries, and artifact paths", () => {
    expect(performanceLoadRuntimeCommands).toEqual([
      "pnpm test:performance:budgets",
      "Lighthouse CI for public and dashboard route budgets",
      "capture Core Web Vitals for public and dashboard critical routes",
      "measure public home/booking/city SEO route budgets",
      "measure dashboard overview and booking detail route budgets",
      "load test public booking endpoint",
      "load test Stripe webhook burst handling",
      "load test secure upload intent endpoint",
      "database EXPLAIN/ANALYZE query-plan checks",
      "image optimization benchmark report",
      "verify performance regression thresholds",
      "GitHub Actions performance/load job"
    ]);
    expect(performanceLoadRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "budget-verifier",
      "lighthouse-core-web-vitals",
      "core-web-vitals",
      "public-route-budgets",
      "dashboard-route-budgets",
      "booking-load",
      "webhook-burst-load",
      "upload-intent-load",
      "db-explain-analyze",
      "image-optimization-benchmarks",
      "regression-thresholds",
      "ci-performance-job",
      "regression-triage"
    ]);
    expect(performanceLoadRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/performance-load-runtime.json",
        "coverage/performance-budget-verification.json",
        "coverage/performance-lighthouse-ci.json",
        "coverage/performance-core-web-vitals.json",
        "coverage/performance-public-route-budgets.json",
        "coverage/performance-dashboard-route-budgets.json",
        "coverage/performance-booking-load.json",
        "coverage/performance-webhook-burst.json",
        "coverage/performance-upload-intent-load.json",
        "coverage/performance-db-explain-analyze.json",
        "coverage/performance-image-optimization.json",
        "coverage/performance-regression-thresholds.json",
        "coverage/performance-ci-run-redacted.json",
        "coverage/performance-regression-triage.md",
        "test-results/performance-load-runtime"
      ])
    );
  });

  it("keeps performance budget manifest, verifier, and root script wired", () => {
    expect(packageJson).toContain('"test:performance:budgets"');
    expect(phase14StaticCheck).toContain("test:performance:budgets");
    expect(budgetVerifier).toContain("testing/manifests/performance-budget.json");
    for (const required of [
      "largestContentfulPaintMs",
      "public-home",
      "public-booking",
      "dashboard-overview",
      "booking-request-abuse",
      "stripe-webhook-burst",
      "secure-upload-intent-burst",
      "tenant-booking-dashboard",
      "webhook-idempotency-lookup",
      "portfolio_public",
      "reference_private"
    ]) {
      expect(performanceBudget).toContain(required);
    }
  });

  it("keeps readiness blocked until real Lighthouse, load, EXPLAIN, image, CI, and triage proof exists", () => {
    expect(performanceLoadRuntimeReadiness.status).toBe("blocked");
    expect(performanceLoadRuntimeReadiness.missingScripts).toEqual([]);
    expect(performanceLoadRuntimeReadiness.requiredCommands).toBe(performanceLoadRuntimeCommands);
    expect(performanceLoadRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "performance budget verifier, Lighthouse CI, Core Web Vitals, and route budget reports",
        "booking, webhook, and upload-intent load-test reports",
        "database EXPLAIN/ANALYZE query-plan output and image optimization benchmark report",
        "CI performance job, retained artifacts, regression thresholds, and triage log"
      ])
    );
    expect(performanceLoadRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Lighthouse CI must execute against public and dashboard route budgets.",
        "Public booking abuse/load test must meet RPS, p95, and error-rate targets.",
        "Database EXPLAIN/ANALYZE query-plan checks must pass for dashboard, SEO, and webhook idempotency queries.",
        "CI performance/load job must pass or publish explicit retained performance artifacts."
      ])
    );
  });

  it("pins durable PerformanceLoadRun rows, benchmark flags, retained artifacts, CI, and regression triage evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildPerformanceLoadRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "performance-load-demo",
      commitSha: "abc1234",
      status: "database_gated",
      runtimeMatrix: performanceLoadRuntimeMatrix,
      artifactManifest: performanceLoadRuntimeArtifactPaths,
      performanceBudgetVerifierPassed: true,
      lighthouseCiPassed: false,
      coreWebVitalsWithinBudget: false,
      publicRouteBudgetsPassed: false,
      dashboardRouteBudgetsPassed: false,
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
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model PerformanceLoadRun");
    expect(schema).toContain("coreWebVitalsWithinBudget");
    expect(schema).toContain("dbExplainPlansPassed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["PerformanceLoadRun", "AuditLog"]);
    expect(contract.requiredPerformanceFlags).toContain("uploadIntentLoadTestPassed");
    expect(contract.artifactFields).toContain("triageArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(performanceLoadRunPersistencePreview.modelName).toBe("PerformanceLoadRun");
    const runData = buildPerformanceLoadRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "performance-load-demo",
      status: "database_gated",
      performanceBudgetVerifierPassed: true,
      triageArtifactPath: "coverage/performance-regression-triage.md",
    });
    expect(persistPerformanceLoadRun).toBeTypeOf("function");
    expect(String(persistPerformanceLoadRun)).toContain("repository.performanceLoadRun.upsert");
  });

  it("pins current performance/load runtime proof files for GAP-112", () => {
    expect(performanceLoadRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
      "testing/scripts/verify-test-manifest.mjs",
        "apps/web/lib/performanceLoadRuntime.ts",
        "apps/web/tests/performance-load-runtime-static.test.ts",
        "testing/manifests/performance-budget.json",
        "testing/scripts/verify-performance-budgets.mjs",
        "packages/db/prisma/migrations/20260609015000_add_performance_load_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of performanceLoadRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 performance load runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/performance-load-runtime-static.test.ts");
    expect(ciWorkflow).toContain("performance-load-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/performance-load-runtime.json");
    expect(ciWorkflow).toContain("test-results/performance-load-runtime");
    expect(unitManifest).toContain("unit-web-performance-load-runtime-static");
    expect(unitManifest).toContain("PerformanceLoadRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/performanceLoadRuntime.ts");
    expect(gapTracker).toContain("Performance load evidence classifier wired and benchmark proof gated");
    expect(gapTracker).toContain("GAP-112 is performance-load-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("performanceLoadRuntimeLocalArtifacts");
    expect(gapTracker).toContain("performanceLoadRuntimeExternalArtifacts");
    expect(gapTracker).toContain("persistPerformanceLoadRun upsert seam");
  });

  it("classifies GAP-112 evidence as blocked until Lighthouse, load, DB, image, CI, and triage proof is captured", () => {
    const blockedDecision = buildPerformanceLoadRuntimeEvidenceDecision({
      performanceBudgetVerifierPassed: true,
      lighthouseCiPassed: false,
      coreWebVitalsWithinBudget: false,
      publicRouteBudgetsPassed: false,
      dashboardRouteBudgetsPassed: false,
      bookingLoadTestPassed: false,
      webhookBurstTestPassed: false,
      uploadIntentLoadTestPassed: false,
      dbExplainPlansPassed: false,
      imageOptimizationBenchmarksPassed: false,
      regressionThresholdsConfigured: true,
      performanceArtifactsRetained: true,
      ciPerformanceJobPassed: false,
      regressionsTriagedAndFixed: false,
      requiredCommandsRun: performanceLoadRuntimeCommands.filter(
        (command) =>
          command !== "Lighthouse CI for public and dashboard route budgets" &&
          command !== "capture Core Web Vitals for public and dashboard critical routes" &&
          command !== "measure public home/booking/city SEO route budgets" &&
          command !== "measure dashboard overview and booking detail route budgets" &&
          command !== "load test public booking endpoint" &&
          command !== "load test Stripe webhook burst handling" &&
          command !== "load test secure upload intent endpoint" &&
          command !== "database EXPLAIN/ANALYZE query-plan checks" &&
          command !== "image optimization benchmark report" &&
          command !== "GitHub Actions performance/load job",
      ),
      capturedArtifacts: [
        "coverage/performance-load-runtime.json",
        "coverage/performance-budget-verification.json",
        "coverage/performance-regression-thresholds.json",
        "test-results/performance-load-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run Lighthouse CI for public and dashboard routes.",
        "Capture Core Web Vitals within budget.",
        "Run public booking load test.",
        "Run Stripe webhook burst load test.",
        "Run DB EXPLAIN/ANALYZE query-plan checks.",
        "Run image optimization benchmarks.",
        "Capture CI performance/load job proof.",
        "Triage and fix or document performance regressions.",
        "Required command not recorded: Lighthouse CI for public and dashboard route budgets",
        "Required command not recorded: capture Core Web Vitals for public and dashboard critical routes",
        "Required command not recorded: load test public booking endpoint",
        "Required command not recorded: load test Stripe webhook burst handling",
        "Required command not recorded: database EXPLAIN/ANALYZE query-plan checks",
        "Required command not recorded: image optimization benchmark report",
        "Required command not recorded: GitHub Actions performance/load job",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/performance-lighthouse-ci.json",
        "coverage/performance-core-web-vitals.json",
        "coverage/performance-booking-load.json",
        "coverage/performance-db-explain-analyze.json",
        "coverage/performance-image-optimization.json",
        "coverage/performance-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.performancePolicy).toEqual({
      lighthouseAndCwvRequired: true,
      loadAndDatabaseBenchmarksRequired: true,
      regressionsMustBeTriaged: true,
    });

    const completeDecision = buildPerformanceLoadRuntimeEvidenceDecision({
      performanceBudgetVerifierPassed: true,
      lighthouseCiPassed: true,
      coreWebVitalsWithinBudget: true,
      publicRouteBudgetsPassed: true,
      dashboardRouteBudgetsPassed: true,
      bookingLoadTestPassed: true,
      webhookBurstTestPassed: true,
      uploadIntentLoadTestPassed: true,
      dbExplainPlansPassed: true,
      imageOptimizationBenchmarksPassed: true,
      regressionThresholdsConfigured: true,
      performanceArtifactsRetained: true,
      ciPerformanceJobPassed: true,
      regressionsTriagedAndFixed: true,
      requiredCommandsRun: performanceLoadRuntimeCommands,
      capturedArtifacts: performanceLoadRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(performanceLoadRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(performanceLoadRuntimeArtifactPaths);
  });

  it("keeps live performance/load execution disabled while separating local and external evidence", () => {
    const plan = buildPerformanceLoadRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(performanceLoadRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(performanceLoadRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(performanceLoadRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(performanceLoadRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/performance-load-runtime.json",
        "coverage/performance-budget-verification.json",
        "coverage/performance-regression-thresholds.json",
        "test-results/performance-load-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/performance-lighthouse-ci.json",
        "coverage/performance-core-web-vitals.json",
        "coverage/performance-booking-load.json",
        "coverage/performance-webhook-burst.json",
        "coverage/performance-upload-intent-load.json",
        "coverage/performance-db-explain-analyze.json",
        "coverage/performance-image-optimization.json",
        "coverage/performance-ci-run-redacted.json",
      ]),
    );
    expect(plan.lighthouseExecutionAllowed).toBe(false);
    expect(plan.coreWebVitalsExecutionAllowed).toBe(false);
    expect(plan.routeBudgetExecutionAllowed).toBe(false);
    expect(plan.loadTestExecutionAllowed).toBe(false);
    expect(plan.dbExplainExecutionAllowed).toBe(false);
    expect(plan.imageBenchmarkExecutionAllowed).toBe(false);
    expect(plan.ciPerformanceExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(performanceLoadRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayRunDependencyFreeVerifier: true,
      liveBrowserRequiredForLighthouseAndCwv: true,
      providerEnvironmentRequiredForLoadAndPersistence: true,
      databaseAccessRequiredForExplainAnalyze: true,
      ciProviderRequiredForPerformanceJob: true,
    });
  });

  it("redacts performance/load artifacts before review or retention", () => {
    const rawArtifact = {
      databaseUrl: "postgres://tenant_demo:secret@db.example.com/inkroute",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      stripePayload: { id: "evt_test_secret", customer_email: "client@example.com" },
      routeUrl: "https://inkroute.example.com/booking/user_123?tenant=tenant_demo",
      queryPlan: "Seq Scan on Booking where tenant_id='tenant_demo' and phone='+1 (555) 333-1212'",
      nested: {
        authorization: "Bearer super-secret-token",
        contact: "artist@example.com +1 555 222 3333",
        ids: ["tenant_demo", "booking_abc123"],
      },
    };
    const redacted = buildRedactedPerformanceLoadArtifact(rawArtifact);
    const review = buildPerformanceLoadRuntimeArtifactReview("coverage/performance-load-runtime.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("postgres://");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 (555) 333-1212");
    expect(serialized).not.toContain("Bearer super-secret-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("booking_abc123");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "ciRunUrl",
        "databaseUrl",
        "queryPlan",
        "routeUrl",
        "stripePayload",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(performanceLoadRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Lighthouse CI and Core Web Vitals output must be captured outside Codex with URLs and tokens redacted.",
        "Load-test and Stripe webhook artifacts must redact provider payloads, tenant IDs, user IDs, emails, and phone numbers.",
        "DB EXPLAIN/ANALYZE artifacts must redact database URLs, query literals, and customer identifiers.",
        "CI performance artifacts must redact run URLs and provider identifiers before retention.",
      ]),
    );
  });
});

