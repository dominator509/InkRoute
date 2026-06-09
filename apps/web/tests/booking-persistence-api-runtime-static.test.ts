import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingPersistenceApiArtifactPaths,
  bookingPersistenceApiImplementedControls,
  bookingPersistenceApiRemainingRuntimeEvidence,
  bookingPersistenceApiRuntimeCommands,
  bookingPersistenceApiRuntimeMatrix,
  bookingPersistenceApiRunPersistenceContract,
} from "../lib/bookingPersistenceApiRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking persistence API runtime contract", () => {
  const route = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const helper = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts");
  const contractTest = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const validators = readRepoFile("packages/validators/src/booking.ts");
  const security = readRepoFile("packages/security/src/index.ts");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const bookingPersistenceApiRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035400_add_booking_persistence_api_runs/migration.sql");

  it("pins booking persistence API commands, matrix rows, and artifact paths", () => {
    expect(bookingPersistenceApiRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/web test -- booking-requests-contract",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm db:generate",
      "Next public booking API route runtime smoke",
      "dev-DB booking transaction smoke",
      "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
      "GitHub Actions booking persistence API evidence job",
    ]);
    expect(bookingPersistenceApiRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "route-contract-tests",
      "web-typecheck-build",
      "prisma-client-and-db-transaction",
      "next-route-runtime-smoke",
      "provider-worker-execution-boundaries",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingPersistenceApiArtifactPaths).toContain("coverage/booking-persistence-api-runtime.json");
    expect(bookingPersistenceApiArtifactPaths).toContain("coverage/booking-persistence-db-transaction.json");
    expect(bookingPersistenceApiArtifactPaths).toContain("test-results/booking-persistence-api-runtime");
  });

  it("keeps implemented route controls visible in source", () => {
    expect(route).toContain("resolveTenantScope");
    expect(route).toContain("persistBookingRequestToDatabase");
    expect(route).toContain("prisma.$transaction");
    expect(route).toContain("evaluateBotProof");
    expect(route).toContain("ENCRYPTION_POLICY_DENIED");
    expect(route).toContain("BOOKING_PERSISTENCE_FAILED");
    expect(route).toContain("buildLocalResponse");
    expect(route).toContain("packagePostSubmitPlan");
    expect(helper).toContain("buildPostPersistWorkflowPlans");
    expect(localRuntime).toContain("persistBookingRequest");
    expect(localRuntime).toContain("executeBookingPostPersistWorkflowConsumers");
  });

  it("keeps schema, validator, security, and contract coverage attached", () => {
    for (const model of ["BookingRequest", "BookingStateEvent", "AuditLog"]) {
      expect(schema).toContain(`model ${model}`);
    }
    expect(validators).toContain("bookingRequestInputSchema");
    expect(security).toContain("evaluateEncryptionPolicy");
    expect(security).toContain("rateLimitRules");
    expect(contractTest).toContain("requires anti-bot proof only for database-scoped persistence");
    expect(contractTest).toContain("produces tenant-consistent reference-upload contracts for DB vs local workflows");
    expect(contractTest).toContain("executes post-persist workflow consumers with tenant-isolated records");
  });

  it("keeps remaining runtime evidence explicit without reopening the implemented route scaffold", () => {
    expect(bookingPersistenceApiImplementedControls).toEqual([
      "Resolve tenant scope before persistence and fall back only when the database is unavailable.",
      "Require DB-scope anti-bot proof before database writes.",
      "Gate medical-note persistence on encryption policy and key readiness.",
      "Write BookingRequest, BookingStateEvent, and AuditLog records through a transaction on the database path.",
      "Keep provider workers for reference upload, deposit, notification, and calendar handoffs separate from the route persistence contract.",
    ]);
    expect(bookingPersistenceApiRemainingRuntimeEvidence).toEqual([
      "fresh booking route contract test output",
      "generated Prisma Client and dev-DB transaction smoke output",
      "web typecheck/build output",
      "Next route runtime smoke transcript",
      "provider worker execution evidence tracked by GAP-033 and GAP-034",
      "CI artifact bundle with redaction/secret-safety proof",
    ]);
  });

  it("pins the BookingPersistenceApiRun persistence model and migration", () => {
    expect(bookingPersistenceApiRunPersistenceContract).toEqual({
      prismaModel: "BookingPersistenceApiRun",
      tenantRelation: "bookingPersistenceApiRuns",
      migration: "20260609035400_add_booking_persistence_api_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesRouteContractEvidence: true,
      storesWebTypecheckBuildEvidence: true,
      storesPrismaGenerationEvidence: true,
      storesDatabaseTransactionEvidence: true,
      storesNextRouteSmokeEvidence: true,
      storesProviderBoundaryEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model BookingPersistenceApiRun");
    expect(prismaSchema).toContain("bookingPersistenceApiRuns BookingPersistenceApiRun[]");
    expect(prismaSchema).toContain("routeContractEvidenceCaptured");
    expect(prismaSchema).toContain("databaseTransactionEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(bookingPersistenceApiRunMigration).toContain('CREATE TABLE "BookingPersistenceApiRun"');
    expect(bookingPersistenceApiRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(bookingPersistenceApiRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(bookingPersistenceApiRunMigration).toContain('"BookingPersistenceApiRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts for GAP-032", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking persistence API runtime contracts");
    expect(ciWorkflow).toContain("booking-persistence-api-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-persistence-api-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-persistence-api-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-persistence-api-runtime-static");
    expect(unitManifest).toContain("BookingPersistenceApiRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/bookingPersistenceApiRuntime.ts");
    expect(gapTracker).toContain("BookingPersistenceApiRun Prisma model and app row contract");
    expect(gapTracker).toContain("live generated Prisma Client, dev-DB transaction smoke, web typecheck/build, Next route runtime smoke, fresh CI evidence, and secret-safe artifact review remain open");
  });
});
