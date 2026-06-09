import { buildHandoffToolingRuntimeReadinessPlan } from "@inkroute/handoff";

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

export const handoffToolingRequiredRootScripts = [
  "handoff:verify-docs",
  "handoff:audit",
  "handoff:next",
  "handoff:verify-ledger",
  "handoff:verify-tooling",
  "handoff:verify-task-sync",
  "handoff:all",
] as const;

export const handoffToolingRuntimeCommands = [
  "pnpm install",
  "pnpm --filter @inkroute/handoff typecheck",
  "pnpm --filter @inkroute/handoff test",
  "pnpm handoff:verify-docs",
  "pnpm handoff:audit",
  "pnpm handoff:next",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:verify-tooling",
  "pnpm handoff:all",
] as const;

export const handoffToolingRequiredReports = [
  "docs/handoff/manifests/handoff-tooling-readiness.json",
  "docs/handoff/manifests/agent-execution-queue.json",
  "docs/handoff/manifests/agent-execution-ledger.json",
  "docs/handoff/manifests/agent-task-tracking-sync.json",
  "docs/handoff/reports/handoff-audit.json",
  "docs/handoff/reports/handoff-next.json",
] as const;

export const handoffToolingRequiredScriptFiles = [
  "scripts/handoff/verify-handoff-docs.mjs",
  "scripts/handoff/audit-handoff.mjs",
  "scripts/handoff/next-handoff-task.mjs",
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
  "coverage/handoff-all-output.txt",
  "coverage/handoff-tooling-ci-run.json",
  "test-results/handoff-tooling-runtime",
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
    id: "handoff-script-suite",
    command: "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:all",
    artifact: "coverage/handoff-tooling-verification.json",
    status: "wired",
  },
  {
    id: "ci-evidence",
    command: "GitHub Actions CI captures Phase 16 handoff tooling checks",
    artifact: "coverage/handoff-tooling-ci-run.json",
    status: "ci-gated",
  },
  {
    id: "report-artifacts",
    command: "capture handoff reports or document artifact unavailability",
    artifact: "coverage/handoff-tooling-runtime.json",
    status: "artifact-gated",
  },
] as const satisfies readonly HandoffToolingRuntimeMatrixEntry[];

export const handoffToolingRuntimeReadiness = buildHandoffToolingRuntimeReadinessPlan({
  requiredRootScripts: [...handoffToolingRequiredRootScripts],
  rootScripts: {
    "handoff:verify-docs": "node scripts/handoff/verify-handoff-docs.mjs",
    "handoff:audit": "node scripts/handoff/audit-handoff.mjs",
    "handoff:next": "node scripts/handoff/next-handoff-task.mjs",
    "handoff:verify-ledger": "node scripts/handoff/verify-agent-execution-ledger.mjs",
    "handoff:verify-tooling": "node scripts/handoff/verify-handoff-tooling.mjs",
    "handoff:verify-task-sync": "node scripts/handoff/verify-agent-task-sync.mjs",
    "handoff:all": "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:verify-task-sync",
  },
  requiredReports: [...handoffToolingRequiredReports],
  existingReports: [...handoffToolingRequiredReports],
  requiredScriptFiles: [...handoffToolingRequiredScriptFiles],
  existingScriptFiles: [...handoffToolingRequiredScriptFiles],
  requiredDocs: [...handoffToolingRequiredDocs],
  existingDocs: [...handoffToolingRequiredDocs],
  requiredCiEvidence: [...handoffToolingRequiredCiEvidence],
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
