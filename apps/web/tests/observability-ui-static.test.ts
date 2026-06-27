import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("observability UI runtime boundaries", () => {
  it("keeps web global-error wired to the public error-report route with redaction context", () => {
    const source = readWorkspaceFile("apps/web/app/global-error.tsx");

    expect(source).toContain('fetch("/api/public/inkroute-demo/error-reports"');
    expect(source).toContain("boundary: \"apps/web/app/global-error.tsx\"");
    expect(source).toContain("phase11-demo");
    expect(source).toContain("redacted Phase 11 error-report draft");
    expect(source).not.toContain("SENTRY_DSN");
  });

  it("keeps dashboard global-error wired to authenticated error-report ingest with privacy copy", () => {
    const source = readWorkspaceFile("apps/dashboard/app/global-error.tsx");

    expect(source).toContain('fetch("/api/error-reports"');
    expect(source).toContain("boundary: \"apps/dashboard/app/global-error.tsx\"");
    expect(source).toContain("Do not attach client PII or medical notes");
    expect(source).toContain("authenticated tenant-scoped capture");
  });

  it("surfaces mobile crash-report and Sentry readiness boundaries in the system screen", () => {
    const source = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

    expect(source).toContain("mobileCrashReportDraft");
    expect(source).toContain("mobileCrashAlertRoute");
    expect(source).toContain("mobileSentryChecklist");
    expect(source).toContain("mobileObservabilityBoundaries");
    expect(source).toContain("Crash report draft");
    expect(source).toContain("Sentry / Expo checklist");
  });
});
