import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");
const screenSource = readFileSync(resolve(root, "apps/mobile/src/screens/SystemStatusScreen.tsx"), "utf8");
const crashSource = readFileSync(resolve(root, "apps/mobile/src/lib/mobileCrash.ts"), "utf8");

describe("mobile crash proof coverage contract", () => {
  it("pins simulator and device proof artifact boundaries without claiming live capture", () => {
    expect(screenSource).toContain("forced crash proof pending");
    expect(screenSource).toContain("Crash capture contract");
    expect(crashSource).toContain("fallbackReporterConfigured: true");
    expect(crashSource).toContain("offlineQueue");
    expect(crashSource).toContain("blocked_high_risk_payload");
  });

  it("keeps synthetic mobile proof payloads redacted-only", () => {
    expect(crashSource).toContain("artist@example.test");
    expect(crashSource).toContain("demo-token");
    expect(crashSource).toContain("signed-upload-url-redacted");
    expect(crashSource).not.toContain("SENTRY_AUTH_TOKEN=");
    expect(crashSource).not.toContain("BEGIN PRIVATE KEY");
  });
});
