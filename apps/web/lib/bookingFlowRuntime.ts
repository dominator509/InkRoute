import { buildBookingFlowRuntimeEvidencePlan } from "../app/api/public/[tenantSlug]/booking-requests/test-helpers";

export type BookingFlowRuntimeStatus =
  | "wired"
  | "install-gated"
  | "next-gated"
  | "browser-gated"
  | "database-gated"
  | "ci-gated";

export interface BookingFlowRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingFlowRuntimeStatus;
}


export interface BookingFlowRuntimeRunPersistenceContract {
  readonly prismaModel: "BookingFlowRuntimeRun";
  readonly tenantRelation: "bookingFlowRuntimeRuns";
  readonly migration: "20260609035300_add_booking_flow_runtime_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDependencyInstallEvidence: true;
  readonly storesPrismaGenerationEvidence: true;
  readonly storesWebTypecheckBuildEvidence: true;
  readonly storesRouteRuntimeSmokeEvidence: true;
  readonly storesBrowserSmokeEvidence: true;
  readonly storesDatabaseSmokeEvidence: true;
  readonly storesProviderBoundaryEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const bookingFlowRuntimeRunPersistenceContract = {
  prismaModel: "BookingFlowRuntimeRun",
  tenantRelation: "bookingFlowRuntimeRuns",
  migration: "20260609035300_add_booking_flow_runtime_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDependencyInstallEvidence: true,
  storesPrismaGenerationEvidence: true,
  storesWebTypecheckBuildEvidence: true,
  storesRouteRuntimeSmokeEvidence: true,
  storesBrowserSmokeEvidence: true,
  storesDatabaseSmokeEvidence: true,
  storesProviderBoundaryEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies BookingFlowRuntimeRunPersistenceContract;

export const bookingFlowRuntimeCommands = [
  "pnpm install",
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "Playwright booking page smoke for /booking",
  "Playwright booking confirmation smoke for /booking/confirmation",
  "Next public booking API route runtime smoke",
  "dev-DB booking transaction smoke",
] as const;

export const bookingFlowRuntimeArtifactPaths = [
  "coverage/booking-flow-runtime.json",
  "coverage/booking-flow-install.txt",
  "coverage/booking-flow-prisma-generate.txt",
  "coverage/booking-flow-web-typecheck.txt",
  "coverage/booking-flow-web-build.txt",
  "coverage/booking-flow-contract-test.txt",
  "coverage/booking-flow-next-route-smoke.json",
  "coverage/booking-flow-local-fallback.json",
  "coverage/booking-flow-db-transaction-smoke.json",
  "coverage/booking-flow-provider-boundaries.json",
  "coverage/booking-flow-client-server-boundaries.json",
  "coverage/booking-flow-secret-safe-artifacts.json",
  "test-results/booking-flow-runtime",
] as const;

export const bookingFlowRuntimeMatrix = [
  {
    id: "install-and-prisma-client",
    command: "pnpm install && pnpm db:generate",
    artifact: "coverage/booking-flow-prisma-generate.txt",
    status: "install-gated",
  },
  {
    id: "web-typecheck-build-boundaries",
    command: "pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/booking-flow-web-build.txt",
    status: "next-gated",
  },
  {
    id: "booking-route-contract-and-next-smoke",
    command: "pnpm --filter @inkroute/web test -- booking-requests-contract && Next public booking API route runtime smoke",
    artifact: "coverage/booking-flow-next-route-smoke.json",
    status: "wired",
  },
  {
    id: "booking-and-confirmation-browser-smoke",
    command: "Playwright booking page smoke for /booking && Playwright booking confirmation smoke for /booking/confirmation",
    artifact: "test-results/booking-flow-runtime",
    status: "browser-gated",
  },
  {
    id: "local-fallback-db-provider-boundaries",
    command: "dev-DB booking transaction smoke",
    artifact: "coverage/booking-flow-db-transaction-smoke.json",
    status: "database-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions booking flow runtime evidence job",
    artifact: "coverage/booking-flow-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingFlowRuntimeMatrixEntry[];

export const bookingFlowRuntimeReadiness = buildBookingFlowRuntimeEvidencePlan({
  packageScripts: { typecheck: "tsc --noEmit", build: "next build", test: "playwright test" },
  dependenciesInstalled: false,
  prismaClientGenerated: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  bookingRouteContractTestsPassed: true,
  bookingPageBrowserSmokePassed: false,
  confirmationPageBrowserSmokePassed: false,
  nextRouteRuntimeSmokePassed: false,
  localRuntimeFallbackVerified: true,
  databaseRuntimeSmokePassed: false,
  providerGatedBoundariesPreserved: true,
  clientServerComponentBoundaryVerified: false,
  ciArtifactsCaptured: false,
  secretSafeArtifactsCaptured: false,
});
