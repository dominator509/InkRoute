import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingFlowRuntimeArtifactPaths,
  bookingFlowRuntimeCommands,
  bookingFlowRuntimeMatrix,
  bookingFlowRuntimeReadiness,
} from "../lib/bookingFlowRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking flow runtime evidence contract", () => {
  const webPackageJson = readRepoFile("apps/web/package.json");
  const bookingPage = readRepoFile("apps/web/app/booking/page.tsx");
  const bookingClient = readRepoFile("apps/web/app/booking/BookingFlowClient.tsx");
  const confirmationPage = readRepoFile("apps/web/app/booking/confirmation/page.tsx");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const helper = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts");
  const contractTest = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins booking flow runtime commands, matrix rows, and artifact paths", () => {
    expect(bookingFlowRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test -- booking-requests-contract",
      "Playwright booking page smoke for /booking",
      "Playwright booking confirmation smoke for /booking/confirmation",
      "Next public booking API route runtime smoke",
      "dev-DB booking transaction smoke",
    ]);
    expect(bookingFlowRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "install-and-prisma-client",
      "web-typecheck-build-boundaries",
      "booking-route-contract-and-next-smoke",
      "booking-and-confirmation-browser-smoke",
      "local-fallback-db-provider-boundaries",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingFlowRuntimeArtifactPaths).toContain("coverage/booking-flow-runtime.json");
    expect(bookingFlowRuntimeArtifactPaths).toContain("coverage/booking-flow-db-transaction-smoke.json");
    expect(bookingFlowRuntimeArtifactPaths).toContain("test-results/booking-flow-runtime");
  });

  it("keeps scripts, booking UI, route contracts, local fallback, and helper gates visible", () => {
    for (const scriptName of ["typecheck", "build", "test"]) {
      expect(webPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingPage).toContain("BookingFlowClient");
    expect(bookingClient).toContain("Generate confirmation preview");
    expect(confirmationPage).toContain("Provider boundaries");
    expect(bookingRoute).toContain("buildBookingPostSubmitPlan");
    expect(bookingRoute).toContain("evaluateEncryptionPolicy");
    expect(helper).toContain("buildBookingFlowRuntimeEvidencePlan");
    expect(helper).toContain("Next public booking API route runtime smoke");
    expect(contractTest).toContain("requires anti-bot proof only for database-scoped persistence");
    expect(contractTest).toContain("executes post-persist workflow consumers with tenant-isolated records");
    expect(localRuntime).toContain("executeBookingPostPersistWorkflowConsumers");
  });

  it("keeps booking flow runtime blocked until install, Prisma, Next, browser, DB, CI, and artifact proof execute", () => {
    expect(bookingFlowRuntimeReadiness.status).toBe("blocked");
    expect(bookingFlowRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingFlowRuntimeReadiness.requiredCommands).toEqual([...bookingFlowRuntimeCommands]);
    expect(bookingFlowRuntimeReadiness.requiredControls).toEqual([
      "Verify booking and confirmation pages in a real Next runtime, not only package helpers.",
      "Exercise public booking API route request handling with DB and local-runtime scopes.",
      "Preserve explicit provider-gated reference upload, deposit, notification, and calendar boundaries.",
      "Keep local-runtime fallback tenant-scoped and visibly non-production.",
      "Redact medical notes, payment data, provider tokens, private file URLs, and raw client PII from runtime artifacts.",
    ]);
    expect(bookingFlowRuntimeReadiness.requiredEvidence).toEqual([
      "dependency install and generated Prisma Client evidence",
      "web typecheck/build and client/server boundary evidence",
      "booking API contract and Next route runtime smoke evidence",
      "booking and confirmation browser smoke evidence",
      "local fallback, database runtime, and provider-gated boundary evidence",
      "CI artifact bundle with redaction/secret-safety proof",
    ]);
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Workspace dependencies must be installed with a committed lockfile before booking runtime evidence can close.");
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.");
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runtime evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking flow runtime contracts");
    expect(ciWorkflow).toContain("booking-flow-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-flow-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-flow-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-flow-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/bookingFlowRuntime.ts");
    expect(gapTracker).toContain("live dependency install, Prisma Client generation, web typecheck/build, Next route runtime smoke, browser smoke, dev-DB transaction smoke, CI evidence, and secret-safe artifact review remain open");
  });
});
