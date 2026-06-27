import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildCalendarAutomationSecretSafeArtifactReview,
  buildRedactedCalendarAutomationArtifact,
  calendarAutomatedTestContract,
} from "../lib/calendarAutomatedTests";

const repoRoot = resolve(__dirname, "../../..");

describe("calendar automated test contract", () => {
  it("enumerates the full Phase 8 calendar and travel test matrix", () => {
    expect(calendarAutomatedTestContract.suites.map((suite) => suite.id)).toEqual([
      "calendar-helper-unit",
      "signed-ics-route",
      "availability-preview-route",
      "calendar-postgres-integration",
      "google-provider",
      "timezone-provider-matrix",
      "dashboard-calendar-playwright",
      "public-travel-playwright",
      "concurrent-hold-race",
      "signed-ics-revocation-db",
    ]);
  });

  it("keeps calendar artifacts secret-safe and provider-token redacted", () => {
    expect(calendarAutomatedTestContract.suites.every((suite) => suite.secretPolicy === "redacted-only")).toBe(true);
    expect(calendarAutomatedTestContract.ciArtifactPaths).toContain("coverage/google-provider-redacted.json");
    expect(calendarAutomatedTestContract.ciArtifactPaths).toContain("test-results/calendar");
    expect(calendarAutomatedTestContract.ciArtifactPaths).toContain("test-results/travel");
  });

  it("redacts provider tokens, signed feed tokens, PII, and private booking data from retained artifacts", () => {
    const artifact = buildRedactedCalendarAutomationArtifact({
      artifactId: "google-provider-redacted",
      payload: {
        googleAccessToken: "ya29.secret",
        signedFeedToken: "feed_secret",
        clientEmail: "client@example.com",
        privateBookingNotes: "private schedule note",
        eventCount: 2,
      },
    });

    expect(artifact.payload).toEqual({
      googleAccessToken: "[redacted]",
      signedFeedToken: "[redacted]",
      clientEmail: "[redacted]",
      privateBookingNotes: "[redacted]",
      eventCount: 2,
    });
    expect(JSON.stringify(artifact)).not.toContain("ya29.secret");
    expect(JSON.stringify(artifact)).not.toContain("feed_secret");
    expect(JSON.stringify(artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifact)).not.toContain("private schedule note");
  });

  it("recursively reviews retained calendar artifacts for secret-safe redaction", () => {
    const review = buildCalendarAutomationSecretSafeArtifactReview({
      artifacts: [
        {
          artifactId: "calendar-automation-secret-safe-artifacts",
          payload: {
            eventCount: 2,
            google: {
              googleRefreshToken: "refresh_secret",
              attendees: [{ clientName: "Sensitive Client" }],
            },
            exports: [{ signedFeedToken: "signed_feed_secret", visibleStatus: "retained" }],
          },
        },
      ],
    });

    expect(review.passed).toBe(true);
    expect(review.reviewedArtifactIds).toEqual(["calendar-automation-secret-safe-artifacts"]);
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("refresh_secret");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("Sensitive Client");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("signed_feed_secret");
    expect(JSON.stringify(review.redactedArtifacts)).toContain("retained");
  });

  it("blocks empty calendar artifact reviews", () => {
    const review = buildCalendarAutomationSecretSafeArtifactReview({ artifacts: [] });

    expect(review.passed).toBe(false);
    expect(review.blockers).toContain("Calendar automation artifact review requires at least one retained artifact.");
  });

  it("keeps runtime proof blocked until DB, Google, timezone, Playwright, and artifact evidence actually pass", () => {
    expect(calendarAutomatedTestContract.readiness.status).toBe("blocked");
    expect(calendarAutomatedTestContract.readiness.blockers).toContain("@inkroute/calendar helper/planning tests must pass.");
    expect(calendarAutomatedTestContract.readiness.blockers).toContain("Postgres calendar integration tests must pass for availability, holds, appointments, audit logs, and feed tokens.");
    expect(calendarAutomatedTestContract.readiness.blockers).toContain("Google provider integration tests must pass against a test calendar.");
    expect(calendarAutomatedTestContract.readiness.blockers).toContain("DST/recurrence provider matrix tests must pass across internal, Google, and ICS outputs.");
    expect(calendarAutomatedTestContract.readiness.blockers).toContain("Calendar test artifacts must capture DB logs, Google provider transcripts, Playwright traces, and ICS import output.");
  });

  it("wires a dedicated calendar lifecycle CI step and retained artifacts", () => {
    const workflowSource = readFileSync(resolve(repoRoot, ".github/workflows/ci.yml"), "utf8");

    expect(workflowSource).toContain("Run Phase 8 calendar lifecycle contracts");
    expect(workflowSource).toContain("pnpm --filter @inkroute/calendar test");
    expect(workflowSource).toContain("apps/web/tests/calendar-automation-static.test.ts");
    expect(workflowSource).toContain("Upload calendar lifecycle artifacts");
    expect(workflowSource).toContain("coverage/calendar-*.json");
    expect(workflowSource).toContain("test-results/calendar");
  });
});
