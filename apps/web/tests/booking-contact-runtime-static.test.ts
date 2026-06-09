import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingContactArtifactPaths,
  bookingContactRuntimeCommands,
  bookingContactRuntimeMatrix,
  bookingContactRuntimeReadiness,
  bookingContactRunPersistenceContract,
} from "../lib/bookingContactRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking/contact runtime evidence contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const contactRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/contact/route.ts");
  const contactPage = readRepoFile("apps/web/app/contact/page.tsx");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const confirmationPage = readRepoFile("apps/web/app/booking/confirmation/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const bookingContactRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035100_add_booking_contact_runs/migration.sql");

  it("pins booking/contact commands, matrix rows, and artifact paths", () => {
    expect(bookingContactRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "booking/contact API E2E tests",
      "booking/contact browser E2E tests",
      "provider sandbox handoff boundary tests",
      "GitHub Actions booking/contact runtime evidence job",
    ]);
    expect(bookingContactRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-and-web-package-gates",
      "public-route-post-submit-plan",
      "contact-form-local-persistence",
      "provider-gated-handoff-boundaries",
      "api-and-browser-e2e",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingContactArtifactPaths).toContain("coverage/booking-contact-runtime.json");
    expect(bookingContactArtifactPaths).toContain("coverage/booking-contact-contact-persistence.json");
    expect(bookingContactArtifactPaths).toContain("test-results/booking-contact-runtime");
  });

  it("keeps booking route plan, confirmation boundaries, and contact persistence wiring visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(bookingPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingSource).toContain("buildBookingContactRuntimeEvidencePlan");
    expect(bookingSource).toContain("buildBookingPostSubmitPlan");
    expect(bookingTests).toContain("blocks booking/contact runtime evidence until route, UI, persistence, provider, E2E, CI, and artifact proof exist");
    expect(bookingRoute).toContain("buildBookingPostSubmitPlan");
    expect(bookingRoute).toContain("packagePostSubmitPlan");
    expect(confirmationPage).toContain("Provider boundaries");
    expect(contactRoute).toContain("persistContactSubmission");
    expect(contactRoute).toContain("provider_gated");
    expect(contactPage).toContain("/api/public/${inkrouteDemoTenant.slug}/contact");
    expect(localRuntime).toContain("LocalContactSubmissionRecord");
    expect(localRuntime).toContain("redactedSubmission");
  });

  it("keeps runtime evidence blocked until DB integration, tenant isolation, E2E, provider sandbox, CI, and safe artifacts exist", () => {
    expect(bookingContactRuntimeReadiness.status).toBe("blocked");
    expect(bookingContactRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingContactRuntimeReadiness.requiredCommands).toEqual([...bookingContactRuntimeCommands]);
    expect(bookingContactRuntimeReadiness.requiredControls).toEqual([
      "Persist booking/contact submissions before creating upload, deposit, notification, or calendar handoff work.",
      "Keep provider work idempotent, audit logged, tenant scoped, and retryable.",
      "Preserve no-live-payment behavior until Stripe sandbox credentials and reviewed deposit copy are configured.",
      "Render confirmation states from persisted workflow data instead of optimistic client-only state.",
      "Redact medical notes, payment data, provider tokens, private file URLs, and raw client PII from evidence artifacts.",
    ]);
    expect(bookingContactRuntimeReadiness.requiredEvidence).toEqual([
      "tenant-scoped booking/contact database integration evidence",
      "browser E2E, API E2E, and provider sandbox transcript evidence",
      "web typecheck/build, CI, and secret-safe artifact evidence",
    ]);
    expect(bookingContactRuntimeReadiness.blockers).toContain("Database integration evidence must prove booking/contact persistence and transaction behavior.");
    expect(bookingContactRuntimeReadiness.blockers).toContain("Browser E2E must cover booking submission, confirmation state, contact submission, validation errors, and provider-gated handoffs.");
    expect(bookingContactRuntimeReadiness.blockers).toContain("Booking/contact artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("pins the BookingContactRun persistence model and migration", () => {
    expect(bookingContactRunPersistenceContract).toEqual({
      prismaModel: "BookingContactRun",
      tenantRelation: "bookingContactRuns",
      migration: "20260609035100_add_booking_contact_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDatabasePersistenceEvidence: true,
      storesTenantIsolationEvidence: true,
      storesProviderHandoffEvidence: true,
      storesNoLivePaymentEvidence: true,
      storesApiE2eEvidence: true,
      storesBrowserE2eEvidence: true,
      storesWebBuildEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model BookingContactRun");
    expect(prismaSchema).toContain("bookingContactRuns BookingContactRun[]");
    expect(prismaSchema).toContain("databasePersistenceEvidenceCaptured");
    expect(prismaSchema).toContain("browserE2eEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(bookingContactRunMigration).toContain('CREATE TABLE "BookingContactRun"');
    expect(bookingContactRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(bookingContactRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(bookingContactRunMigration).toContain('"BookingContactRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming booking/contact launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking contact runtime contracts");
    expect(ciWorkflow).toContain("booking-contact-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-contact-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-contact-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-contact-runtime-static");
    expect(unitManifest).toContain("BookingContactRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/bookingContactRuntime.ts");
    expect(gapTracker).toContain("BookingContactRun Prisma model and app row contract");
    expect(gapTracker).toContain("live DB transaction integration, tenant-isolation integration, browser/API E2E, provider sandbox handoff evidence, web typecheck/build, CI evidence, and secret-safe artifact review remain open");
  });
});
