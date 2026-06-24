import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  buildBookingFlowRuntimeEvidencePlan,
  buildPostPersistWorkflowPlans,
  bookingFlowRuntimeRequiredCommands,
  bookingFlowRuntimeRequiredControls,
  bookingFlowRuntimeRequiredEvidence,
  evaluateBotProof,
  shouldCollectReferenceUpload,
} from "../app/api/public/[tenantSlug]/booking-requests/test-helpers";
import { persistBookingPostPersistWorkflow, persistBookingRequest, executeBookingPostPersistWorkflowConsumers } from "../lib/localRuntimeState";

describe("booking request queue/consumer contracts", () => {
  it("requires anti-bot proof only for database-scoped persistence", async () => {
    const previous = process.env.BOOKING_SUBMISSION_BOT_SECRET;
    process.env.BOOKING_SUBMISSION_BOT_SECRET = "test-bot-secret";

    const bodyText = JSON.stringify({
      clientName: "Ink Demo",
      clientEmail: "demo@example.com",
      preferredCity: "seattle",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "small",
      ideaSummary: "Reference photo upload request for hand placement alignment",
      policyAccepted: true,
      artistId: "cuid_000000000000000000000000",
    });

    const request = new NextRequest("https://local.test/api/public/inkroute-demo/booking-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: bodyText,
    });

    const dbScope = await evaluateBotProof(request.clone(), "inkroute-demo", bodyText, "database");
    const localScope = await evaluateBotProof(request.clone(), "inkroute-demo", bodyText, "local-fallback");

    expect(dbScope.required).toBe(true);
    expect(dbScope.requiredFor).toBe("database");
    expect(dbScope.status).toBe("missing");
    expect(localScope.required).toBe(false);
    expect(localScope.requiredFor).toBe("local-fallback");

    if (previous === undefined) {
      delete process.env.BOOKING_SUBMISSION_BOT_SECRET;
    } else {
      process.env.BOOKING_SUBMISSION_BOT_SECRET = previous;
    }
  });

  it("produces tenant-consistent reference-upload contracts for DB vs local workflows", () => {
    const input = {
      artistId: "cuid_000000000000000000000001",
      clientName: "Ink Demo",
      clientEmail: "demo@example.com",
      preferredCity: "seattle",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "small",
      budgetMin: 120000,
      ideaSummary: "Reference photo upload request for forearm floral ink style and placement alignment.",
      policyAccepted: true,
    } as const;

    const localWorkflows = buildPostPersistWorkflowPlans(input, "inkroute-demo", "booking-local", "local-fallback");
    const dbWorkflows = buildPostPersistWorkflowPlans(input, "inkroute-demo", "booking-db", "database");

    expect(localWorkflows.length).toBe(dbWorkflows.length);
    expect(shouldCollectReferenceUpload(input)).toBe(true);

    const localReference = localWorkflows.find((workflow) => workflow.type === "reference-upload");
    const dbReference = dbWorkflows.find((workflow) => workflow.type === "reference-upload");
    expect(localReference).toBeDefined();
    expect(dbReference).toBeDefined();

    const localPayload = localReference?.payload as Record<string, unknown>;
    const dbPayload = dbReference?.payload as Record<string, unknown>;
    expect(localPayload.consumer).toBe("reference-upload-intent-route");
    expect(dbPayload.consumer).toBe("reference-upload-worker");
    expect(localPayload.status).toBe("local-runtime-ready");
    expect(dbPayload.status).toBe("queued");
    expect((localPayload.handoffReference as { handoffHeaders: string[] } | undefined)?.handoffHeaders).toEqual([
      "x-inkroute-upload-intent",
      "x-inkroute-upload-signature",
    ]);
    expect(dbPayload.queueHint).toBe("reference-upload-intent");
    expect(localWorkflows.map((workflow) => workflow.type)).toEqual(dbWorkflows.map((workflow) => workflow.type));
  });

  it("executes post-persist workflow consumers with tenant-isolated records", () => {
    const tenantSlug = `inkroute-demo-consumer-${Date.now()}`;
    const booking = persistBookingRequest(tenantSlug, {
      artistId: "cuid_000000000000000000000002",
      clientName: "Ink Demo",
      clientEmail: "demo+consumer@example.com",
      preferredCity: "seattle",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "small",
      ideaSummary: "Reference photo upload request for shoulder and forearm alignment.",
      policyAccepted: true,
    });

    const plans = buildPostPersistWorkflowPlans(
      {
        ...booking.request,
        policyAccepted: true,
      },
      tenantSlug,
      booking.request.id,
      "local-fallback",
    );

    for (const plan of plans) {
      persistBookingPostPersistWorkflow(tenantSlug, {
        bookingRequestId: booking.request.id,
        type: plan.type,
        status: plan.status,
        payload: plan.payload,
      });
    }

    const consumerRuns = executeBookingPostPersistWorkflowConsumers(tenantSlug, booking.request.id, "local-fallback");
    expect(consumerRuns.length).toBe(plans.length);
    expect(consumerRuns.some((run) => run.type === "notification")).toBe(true);
    expect(consumerRuns.some((run) => run.type === "deposit")).toBe(true);
    expect(consumerRuns.some((run) => run.type === "calendar")).toBe(true);
    expect(consumerRuns.some((run) => run.type === "reference-upload")).toBe(true);
    expect(consumerRuns.some((run) => run.type === "reference-upload" && run.status === "succeeded")).toBe(true);
    expect(consumerRuns.every((run) => run.tenantId === tenantSlug)).toBe(true);

    const otherTenant = executeBookingPostPersistWorkflowConsumers(`other-${tenantSlug}`, booking.request.id, "local-fallback");
    expect(otherTenant).toHaveLength(0);
  });

  it("keeps booking provider handoff runtime evidence attached to post-persist workflow contracts", async () => {
    const routeSource = await import("node:fs").then((fs) =>
      fs.readFileSync("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts", "utf8"),
    );

    expect(routeSource).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(routeSource).toContain("providerHandoffRuntimeEvidencePlan");
    expect(routeSource).toContain("acceptedBookingGateEnforced: true");
    expect(routeSource).toContain("persistedWorkerQueueConfigured: true");
    expect(routeSource).toContain("providerHandoffAudit");
    expect(routeSource).toContain("payloadsPersisted: true");
    expect(routeSource).toContain('auditPayloadsPersisted: resolvedTenant.source === "database"');
    expect(routeSource).toContain("buildProviderFailureHandlingContract");
    expect(routeSource).toContain("booking-provider-failure-local-contract");
    expect(routeSource).toContain("retryPolicyVerified: true");
    expect(routeSource).toContain("rollbackPathsVerified: true");
    expect(routeSource).toContain("operatorReviewQueueConfigured: true");
    expect(routeSource).toContain("providerIdempotencyConfigured: false");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain('{ ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) }');
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 201, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 500, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 400 },");
    expect(routeSource).not.toContain("{ status: 403 },");
    expect(routeSource).not.toContain("{ status: 404 },");
    expect(routeSource).not.toContain("{ status: 500 },");
  });

  it("blocks booking flow runtime evidence until install, Prisma, Next build, browser smoke, DB smoke, and safe artifacts exist", () => {
    const plan = buildBookingFlowRuntimeEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", test: "playwright test" },
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

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["build"]);
    expect(plan.requiredCommands).toBe(bookingFlowRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(bookingFlowRuntimeRequiredControls);
    expect(plan.requiredEvidence).toBe(bookingFlowRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Generated Prisma Client must be available before web typecheck/build runtime evidence can close.");
    expect(plan.blockers).toContain("Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.");
    expect(plan.blockers).toContain("Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("pins GAP-017 tracker closure evidence in the unit manifest", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    const manifestPath = existsSync("testing/manifests/unit-test-manifest.json")
      ? "testing/manifests/unit-test-manifest.json"
      : "../testing/manifests/unit-test-manifest.json";
    const manifestText = readFileSync(manifestPath, "utf8");

    expect(manifestText).toContain("unit-web-booking-requests-contract");
    expect(manifestText).toContain("GAP-017");
  });

  it("marks booking flow runtime evidence ready when Next runtime, DB smoke, browser smoke, and artifacts align", () => {
    const plan = buildBookingFlowRuntimeEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", build: "next build", test: "playwright test" },
      dependenciesInstalled: true,
      prismaClientGenerated: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      bookingRouteContractTestsPassed: true,
      bookingPageBrowserSmokePassed: true,
      confirmationPageBrowserSmokePassed: true,
      nextRouteRuntimeSmokePassed: true,
      localRuntimeFallbackVerified: true,
      databaseRuntimeSmokePassed: true,
      providerGatedBoundariesPreserved: true,
      clientServerComponentBoundaryVerified: true,
      ciArtifactsCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });
});
