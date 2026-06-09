import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  buildBookingFlowRuntimeEvidencePlan,
  buildPostPersistWorkflowPlans,
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
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm install",
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "Playwright booking page smoke for /booking",
      "Playwright booking confirmation smoke for /booking/confirmation",
      "dev-DB booking transaction smoke",
    ]));
    expect(plan.requiredControls).toContain("Verify booking and confirmation pages in a real Next runtime, not only package helpers.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "dependency install and generated Prisma Client evidence",
      "web typecheck/build and client/server boundary evidence",
      "booking API contract and Next route runtime smoke evidence",
      "booking and confirmation browser smoke evidence",
      "local fallback, database runtime, and provider-gated boundary evidence",
      "CI artifact bundle with redaction/secret-safety proof",
    ]));
    expect(plan.blockers).toContain("Generated Prisma Client must be available before web typecheck/build runtime evidence can close.");
    expect(plan.blockers).toContain("Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.");
    expect(plan.blockers).toContain("Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
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
    expect(plan.requiredControls).toContain("Preserve explicit provider-gated reference upload, deposit, notification, and calendar boundaries.");
  });
});
