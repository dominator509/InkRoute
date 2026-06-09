export type WebBuildRuntimeVerificationStatus = "wired" | "prisma-gated" | "typecheck-gated" | "build-gated" | "browser-gated" | "ci-gated";

export interface WebBuildRuntimeVerificationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: WebBuildRuntimeVerificationStatus;
}

export interface WebBuildRuntimeRunPersistenceContract {
  readonly prismaModel: "WebBuildRuntimeRun";
  readonly tenantRelation: "webBuildRuntimeRuns";
  readonly migration: "20260609034900_add_web_build_runtime_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesPrismaClientEvidence: true;
  readonly storesTypecheckEvidence: true;
  readonly storesBuildEvidence: true;
  readonly storesBrowserSmokeEvidence: true;
  readonly storesFallbackEvidence: true;
  readonly storesExactOptionalEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const webBuildRuntimeRunPersistenceContract = {
  prismaModel: "WebBuildRuntimeRun",
  tenantRelation: "webBuildRuntimeRuns",
  migration: "20260609034900_add_web_build_runtime_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesPrismaClientEvidence: true,
  storesTypecheckEvidence: true,
  storesBuildEvidence: true,
  storesBrowserSmokeEvidence: true,
  storesFallbackEvidence: true,
  storesExactOptionalEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies WebBuildRuntimeRunPersistenceContract;

export const webBuildRuntimeVerificationCommands = [
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "web browser smoke for public booking and content routes",
  "Prisma DB-backed booking route smoke",
  "local DB-unavailable fallback smoke",
] as const;

export const webBuildRuntimeVerificationArtifactPaths = [
  "coverage/web-build-runtime-verification.json",
  "coverage/web-build-prisma-generate.txt",
  "coverage/web-build-typecheck.txt",
  "coverage/web-build-next-build.txt",
  "coverage/web-build-browser-smoke.json",
  "coverage/web-build-prisma-client-runtime.json",
  "coverage/web-build-db-fallback-smoke.json",
  "coverage/web-build-exact-optional-property-review.json",
  "coverage/web-build-secret-safe-artifacts.json",
  "test-results/web-build-runtime-verification",
] as const;

export const webBuildRuntimeVerificationMatrix = [
  {
    id: "prisma-client-generation",
    command: "pnpm db:generate",
    artifact: "coverage/web-build-prisma-generate.txt",
    status: "prisma-gated",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/web-build-typecheck.txt",
    status: "typecheck-gated",
  },
  {
    id: "web-next-build",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/web-build-next-build.txt",
    status: "build-gated",
  },
  {
    id: "browser-smoke",
    command: "web browser smoke for public booking and content routes",
    artifact: "coverage/web-build-browser-smoke.json",
    status: "browser-gated",
  },
  {
    id: "fallback-and-exact-optional-review",
    command: "Prisma DB-backed booking route smoke && local DB-unavailable fallback smoke",
    artifact: "coverage/web-build-db-fallback-smoke.json",
    status: "ci-gated",
  },
] as const satisfies readonly WebBuildRuntimeVerificationMatrixEntry[];
