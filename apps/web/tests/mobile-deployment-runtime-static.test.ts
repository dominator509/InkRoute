import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mobileDeploymentRuntimeArtifactPaths,
  mobileDeploymentRuntimeCommands,
  mobileDeploymentRuntimeMatrix,
  mobileDeploymentRuntimeReadiness
} from "../lib/mobileDeploymentRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const mobileEvidence = read("deployment/manifests/mobile-deployment-evidence.json");
const mobileVerifier = read("deployment/scripts/verify-mobile-deployment.mjs");
const mobileGuide = read("deployment/MOBILE_BUILD_GUIDE.md");
const appJson = read("apps/mobile/app.json");
const easJson = read("apps/mobile/eas.json");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-116 mobile deployment runtime wiring", () => {
  it("pins mobile deployment commands, matrix entries, and redacted artifact paths", () => {
    expect(mobileDeploymentRuntimeCommands).toEqual([
      "pnpm deploy:verify-mobile",
      "eas build --profile development",
      "eas build --profile preview --platform all",
      "eas build --profile production --platform all",
      "eas update --channel preview",
      "mobile device QA checklist",
      "mobile push token smoke",
      "mobile synthetic crash capture",
      "OTA rollback rehearsal"
    ]);
    expect(mobileDeploymentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "deployment-evidence-verifier",
      "development-build",
      "preview-ios-android-build",
      "production-ios-android-build",
      "device-push-crash-qa",
      "ota-runtime-policy",
      "native-credentials-store-readiness",
      "ci-mobile-deployment-artifacts"
    ]);
    expect(mobileDeploymentRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/mobile-deployment-runtime.json",
        "coverage/mobile-eas-preview-build-redacted.json",
        "coverage/mobile-eas-production-build-redacted.json",
        "coverage/mobile-device-qa-checklist-redacted.json",
        "coverage/mobile-push-token-smoke-redacted.json",
        "coverage/mobile-sentry-crash-capture-redacted.json",
        "coverage/mobile-ota-rollback-redacted.json",
        "coverage/mobile-store-readiness-redacted.json",
        "coverage/mobile-deployment-ci-run-redacted.json",
        "test-results/mobile-deployment-runtime"
      ])
    );
  });

  it("keeps mobile evidence manifest, verifier, EAS profiles, and app runtime policy wired", () => {
    for (const profile of ["development", "preview", "production"]) {
      expect(mobileEvidence).toContain(`"profile": "${profile}"`);
      expect(easJson).toContain(`"${profile}"`);
    }
    for (const qaId of ["device-qa", "push-token", "crash-capture", "ota-rollback"]) {
      expect(mobileEvidence).toContain(`"id": "${qaId}"`);
    }
    expect(mobileEvidence).toContain("expoRuntimeVersionPolicy");
    expect(mobileEvidence).toContain("rollback update has been rehearsed on preview channel");
    expect(mobileVerifier).toContain("mobile-deployment-evidence.json");
    expect(appJson).toContain('"policy": "appVersion"');
    expect(appJson).toContain("deployment-gated-see-GAP-047");
    expect(mobileGuide).toContain("EAS");
    expect(deploymentTests).toContain("buildMobileDeploymentRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until EAS builds, native credentials, QA, push, crash, OTA, store readiness, and verifier proof exist", () => {
    expect(mobileDeploymentRuntimeReadiness.status).toBe("blocked");
    expect(mobileDeploymentRuntimeReadiness.incompleteProfiles).toEqual(
      expect.arrayContaining(["development", "preview", "preview:platforms", "production", "production:platforms"])
    );
    expect(mobileDeploymentRuntimeReadiness.missingQaEvidence).toEqual(
      expect.arrayContaining(["device-qa", "push-token", "crash-capture", "ota-rollback", "store-readiness"])
    );
    expect(mobileDeploymentRuntimeReadiness.requiredCommands).toEqual(mobileDeploymentRuntimeCommands);
    expect(mobileDeploymentRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Development, preview, and production EAS build artifact labels for iOS and Android where required.",
        "Device QA checklist covering auth, booking triage, offline notes, travel updates, and reconnect behavior.",
        "Push token registration and receipt proof.",
        "Sentry mobile crash capture, source-map, and redaction proof.",
        "Runtime policy decision showing when store builds are required versus OTA updates allowed.",
        "OTA publish and rollback rehearsal evidence on preview channel.",
        "App Store Connect and Google Play credential/readiness review labels."
      ])
    );
    expect(mobileDeploymentRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Mobile development, preview, and production profiles must have redacted build evidence for required platforms.",
        "Mobile deployment evidence must include device QA, push token, crash capture, OTA rollback, and store-readiness items.",
        "EAS development, preview, and production channels must be configured.",
        "pnpm deploy:verify-mobile must pass."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 mobile deployment runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/mobile-deployment-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-deployment-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/mobile-deployment-runtime.json");
    expect(ciWorkflow).toContain("test-results/mobile-deployment-runtime");
    expect(unitManifest).toContain("unit-web-mobile-deployment-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/mobileDeploymentRuntime.ts");
    expect(gapTracker).toContain("live EAS/native credential/mobile store proof remains open");
  });
});
