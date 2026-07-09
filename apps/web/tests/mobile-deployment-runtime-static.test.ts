import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildMobileDeploymentRuntimeArtifactReview,
  buildMobileDeploymentRunData,
  buildMobileDeploymentRuntimeEvidenceDecision,
  buildMobileDeploymentRuntimeExecutionPlan,
  buildRedactedMobileDeploymentArtifact,
  persistMobileDeploymentRun,
  mobileDeploymentRuntimeArtifactPaths,
  mobileDeploymentRuntimeCommands,
  mobileDeploymentRuntimeExternalArtifacts,
  mobileDeploymentRuntimeExternalCommands,
  mobileDeploymentRuntimeExecutionPolicy,
  mobileDeploymentRuntimeLocalArtifacts,
  mobileDeploymentRuntimeLocalCommands,
  mobileDeploymentRuntimeMatrix,
  mobileDeploymentRuntimeProofFiles,
  mobileDeploymentRuntimeReadiness,
  mobileDeploymentRuntimeRequiredExternalEvidence,
  mobileDeploymentRunPersistenceContract
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
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read("packages/db/prisma/migrations/20260609019000_add_mobile_deployment_runs/migration.sql");

describe("GAP-116 mobile deployment runtime wiring", () => {
  it("pins mobile deployment commands, matrix entries, and redacted artifact paths", () => {
    expect(mobileDeploymentRuntimeCommands).toEqual([
      "pnpm deploy:verify-mobile",
      "eas build --profile development",
      "eas build --profile preview --platform ios",
      "eas build --profile preview --platform android",
      "eas build --profile production --platform ios",
      "eas build --profile production --platform android",
      "eas update --channel preview",
      "mobile device QA checklist",
      "mobile push token smoke",
      "mobile synthetic crash capture",
      "OTA rollback rehearsal",
      "verify native signing credentials outside source control",
      "review App Store Connect and Google Play readiness labels",
      "record redacted mobile build artifact labels",
      "capture CI mobile deployment artifacts"
    ]);
    expect(mobileDeploymentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "deployment-evidence-verifier",
      "development-build",
      "preview-ios-build",
      "preview-android-build",
      "production-ios-build",
      "production-android-build",
      "device-qa",
      "push-token-smoke",
      "sentry-crash-capture",
      "ota-preview-publish",
      "ota-rollback-rehearsal",
      "runtime-policy-parity",
      "native-credentials",
      "store-readiness",
      "redacted-build-artifacts",
      "ci-mobile-deployment-artifacts"
    ]);
    expect(mobileDeploymentRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/mobile-deployment-runtime.json",
        "coverage/mobile-eas-preview-build-redacted.json",
        "coverage/mobile-eas-production-build-redacted.json",
        "coverage/mobile-ios-build-redacted.json",
        "coverage/mobile-android-build-redacted.json",
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
    expect(mobileDeploymentRuntimeReadiness.requiredCommands).toBe(mobileDeploymentRuntimeCommands);
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
    expect(gapTracker).toContain("Mobile deployment evidence classifier wired and EAS/native proof gated");
    expect(gapTracker).toContain("GAP-116 is mobile-deployment-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("mobileDeploymentRuntimeLocalArtifacts");
    expect(gapTracker).toContain("mobileDeploymentRuntimeExternalArtifacts");
  });

  it("pins current mobile deployment runtime proof files for GAP-116", () => {
    expect(mobileDeploymentRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/deployment/src/index.ts",
      "packages/releases/src/index.ts",
        "apps/web/lib/mobileDeploymentRuntime.ts",
        "apps/web/tests/mobile-deployment-runtime-static.test.ts",
        "apps/mobile/eas.json",
        "deployment/manifests/mobile-deployment-evidence.json",
        "deployment/scripts/verify-mobile-deployment.mjs",
        "packages/db/prisma/migrations/20260609019000_add_mobile_deployment_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of mobileDeploymentRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable MobileDeploymentRun persistence for EAS/native/mobile-store proof", () => {
    const runData = buildMobileDeploymentRunData({
      tenantId: "tenant_static",
      runId: "mobile_deployment_static",
      commitSha: "abc123",
      status: "blocked",
      buildProfileMatrix: [{ profile: "preview", status: "not_built" }],
      qaEvidenceMatrix: [{ id: "device-qa", status: "pending" }],
      artifactManifest: ["coverage/mobile-deployment-runtime.json"],
      verifierPassed: true,
      easDevelopmentBuildPassed: false,
      easPreviewIosBuildPassed: false,
      easPreviewAndroidBuildPassed: false,
      easProductionIosBuildPassed: false,
      easProductionAndroidBuildPassed: false,
      easChannelsConfigured: false,
      nativeCredentialsConfigured: false,
      pushCredentialsConfigured: false,
      deviceQaPassed: false,
      pushTokenSmokePassed: false,
      sentryCrashCapturePassed: false,
      otaPreviewPublishPassed: false,
      otaRollbackRehearsed: false,
      runtimePolicyParityVerified: true,
      storeReadinessReviewed: false,
      redactedBuildArtifactsRecorded: false,
      ciMobileDeploymentArtifactsCaptured: false,
      requiredCommandsRun: ["pnpm deploy:verify-mobile"],
      capturedArtifacts: ["coverage/mobile-deployment-runtime.json", "coverage/mobile-runtime-policy.json"],
      redactedBuildArtifactPath: "coverage/mobile-eas-preview-build-redacted.json",
      deviceQaArtifactPath: "coverage/mobile-device-qa-checklist-redacted.json",
      otaRollbackArtifactPath: "coverage/mobile-ota-rollback-redacted.json",
      storeReadinessArtifactPath: "coverage/mobile-store-readiness-redacted.json",
      ciRunUrl: "https://github.example/redacted/mobile-deployment",
    });

    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "mobile_deployment_static",
      status: "blocked",
      verifierPassed: true,
      runtimePolicyParityVerified: true,
      otaRollbackArtifactPath: "coverage/mobile-ota-rollback-redacted.json",
    });
    expect(persistMobileDeploymentRun).toBeTypeOf("function");
    expect(String(persistMobileDeploymentRun)).toContain("repository.mobileDeploymentRun.upsert");
    expect(mobileDeploymentRunPersistenceContract.prismaModel).toBe("MobileDeploymentRun");
    expect(mobileDeploymentRunPersistenceContract.tenantRelation).toBe("mobileDeploymentRuns");
    expect(mobileDeploymentRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(mobileDeploymentRunPersistenceContract.jsonFields).toEqual([
      "buildProfileMatrix",
      "qaEvidenceMatrix",
      "artifactManifest"
    ]);
    expect(mobileDeploymentRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "easDevelopmentBuildPassed",
        "easPreviewIosBuildPassed",
        "easProductionAndroidBuildPassed",
        "nativeCredentialsConfigured",
        "pushCredentialsConfigured",
        "deviceQaPassed",
        "sentryCrashCapturePassed",
        "otaRollbackRehearsed",
        "storeReadinessReviewed",
        "ciMobileDeploymentArtifactsCaptured"
      ])
    );
    expect(mobileDeploymentRunPersistenceContract.redactedArtifactFields).toContain("redactedBuildArtifactPath");
    expect(prismaSchema).toContain("mobileDeploymentRuns MobileDeploymentRun[]");
    expect(prismaSchema).toContain("model MobileDeploymentRun");
    expect(prismaSchema).toContain("buildProfileMatrix                      Json");
    expect(prismaSchema).toContain("easProductionAndroidBuildPassed         Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "MobileDeploymentRun"');
    expect(prismaMigration).toContain('"otaRollbackArtifactPath" TEXT');
    expect(unitManifest).toContain("MobileDeploymentRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609019000_add_mobile_deployment_runs/migration.sql");
    expect(gapTracker).toContain("persistMobileDeploymentRun upsert seam");
  });

  it("classifies GAP-116 evidence as blocked until EAS, native, device, OTA, store, and CI proof is captured", () => {
    const blockedDecision = buildMobileDeploymentRuntimeEvidenceDecision({
      verifierPassed: true,
      easDevelopmentBuildPassed: false,
      easPreviewIosBuildPassed: false,
      easPreviewAndroidBuildPassed: false,
      easProductionIosBuildPassed: false,
      easProductionAndroidBuildPassed: false,
      easChannelsConfigured: false,
      nativeCredentialsConfigured: false,
      pushCredentialsConfigured: false,
      deviceQaPassed: false,
      pushTokenSmokePassed: false,
      sentryCrashCapturePassed: false,
      otaPreviewPublishPassed: false,
      otaRollbackRehearsed: false,
      runtimePolicyParityVerified: true,
      storeReadinessReviewed: false,
      redactedBuildArtifactsRecorded: false,
      ciMobileDeploymentArtifactsCaptured: false,
      requiredCommandsRun: mobileDeploymentRuntimeCommands.filter(
        (command) =>
          command !== "eas build --profile preview --platform ios" &&
          command !== "eas build --profile preview --platform android" &&
          command !== "eas build --profile production --platform ios" &&
          command !== "mobile device QA checklist" &&
          command !== "OTA rollback rehearsal" &&
          command !== "verify native signing credentials outside source control" &&
          command !== "capture CI mobile deployment artifacts",
      ),
      capturedArtifacts: [
        "coverage/mobile-deployment-runtime.json",
        "coverage/mobile-deployment-verifier.json",
        "coverage/mobile-runtime-policy.json",
        "test-results/mobile-deployment-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture EAS development build proof.",
        "Capture EAS preview iOS build proof.",
        "Capture EAS production Android build proof.",
        "Configure EAS development, preview, and production channels.",
        "Capture native signing credential proof.",
        "Complete mobile device QA.",
        "Capture OTA rollback rehearsal proof.",
        "Capture mobile store readiness review proof.",
        "Capture CI mobile deployment artifacts.",
        "Required command not recorded: eas build --profile preview --platform ios",
        "Required command not recorded: eas build --profile preview --platform android",
        "Required command not recorded: eas build --profile production --platform ios",
        "Required command not recorded: mobile device QA checklist",
        "Required command not recorded: OTA rollback rehearsal",
        "Required command not recorded: verify native signing credentials outside source control",
        "Required command not recorded: capture CI mobile deployment artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/mobile-eas-development-build-redacted.json",
        "coverage/mobile-eas-preview-build-redacted.json",
        "coverage/mobile-eas-production-build-redacted.json",
        "coverage/mobile-device-qa-checklist-redacted.json",
        "coverage/mobile-ota-rollback-redacted.json",
        "coverage/mobile-deployment-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.mobileDeploymentPolicy).toEqual({
      nativeCredentialsRequired: true,
      otaRollbackProofRequired: true,
      redactedBuildArtifactsOnly: true,
    });

    const completeDecision = buildMobileDeploymentRuntimeEvidenceDecision({
      verifierPassed: true,
      easDevelopmentBuildPassed: true,
      easPreviewIosBuildPassed: true,
      easPreviewAndroidBuildPassed: true,
      easProductionIosBuildPassed: true,
      easProductionAndroidBuildPassed: true,
      easChannelsConfigured: true,
      nativeCredentialsConfigured: true,
      pushCredentialsConfigured: true,
      deviceQaPassed: true,
      pushTokenSmokePassed: true,
      sentryCrashCapturePassed: true,
      otaPreviewPublishPassed: true,
      otaRollbackRehearsed: true,
      runtimePolicyParityVerified: true,
      storeReadinessReviewed: true,
      redactedBuildArtifactsRecorded: true,
      ciMobileDeploymentArtifactsCaptured: true,
      requiredCommandsRun: mobileDeploymentRuntimeCommands,
      capturedArtifacts: mobileDeploymentRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(mobileDeploymentRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(mobileDeploymentRuntimeArtifactPaths);
  });

  it("keeps mobile deployment execution disabled while splitting local labels from EAS/device/store proof", () => {
    const plan = buildMobileDeploymentRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(mobileDeploymentRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(mobileDeploymentRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(mobileDeploymentRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(mobileDeploymentRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/mobile-deployment-runtime.json",
        "coverage/mobile-deployment-verifier.json",
        "coverage/mobile-runtime-policy.json",
        "test-results/mobile-deployment-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/mobile-eas-development-build-redacted.json",
        "coverage/mobile-eas-preview-build-redacted.json",
        "coverage/mobile-eas-production-build-redacted.json",
        "coverage/mobile-ios-build-redacted.json",
        "coverage/mobile-android-build-redacted.json",
        "coverage/mobile-device-qa-checklist-redacted.json",
        "coverage/mobile-push-token-smoke-redacted.json",
        "coverage/mobile-sentry-crash-capture-redacted.json",
        "coverage/mobile-ota-rollback-redacted.json",
        "coverage/mobile-native-credentials-redacted.json",
        "coverage/mobile-store-readiness-redacted.json",
        "coverage/mobile-deployment-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.easBuildExecutionAllowed).toBe(false);
    expect(plan.easUpdateExecutionAllowed).toBe(false);
    expect(plan.deviceQaExecutionAllowed).toBe(false);
    expect(plan.pushTokenExecutionAllowed).toBe(false);
    expect(plan.crashCaptureExecutionAllowed).toBe(false);
    expect(plan.otaRollbackExecutionAllowed).toBe(false);
    expect(plan.nativeCredentialExecutionAllowed).toBe(false);
    expect(plan.storeReadinessExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(mobileDeploymentRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyRuntimePolicyAndLabels: true,
      easProjectRequiredForBuilds: true,
      physicalOrEmulatedDeviceRequiredForQa: true,
      nativeCredentialsMustStayOutsideSourceControl: true,
      storeConsolesRequiredForReadiness: true,
      providerDatabaseRequiredForPersistence: true,
    });
  });

  it("redacts mobile deployment artifacts before review or persistence", () => {
    const rawArtifact = {
      easProjectId: "eas_project_abc123",
      buildUrl: "https://expo.dev/accounts/inkroute/projects/mobile/builds/build_123",
      installUrl: "https://expo.dev/artifacts/eas/build-secret.apk",
      otaUrl: "https://u.expo.dev/update/ota_secret",
      sentryDsn: "https://secret@sentry.io/project_456",
      deviceUdid: "00008030-001C195E0A91802E",
      pushToken: "ExponentPushToken[secret]",
      nativeCredential: "ios_distribution_certificate_secret",
      storeReadiness: { appStoreEmail: "owner@example.com", phone: "+1 555 777 1212" },
      buildLog: "EAS build emitted PRIVATE_ENV=value",
      runtimeChannel: "production-private-channel",
      rollbackTranscript: "rollback touched private_update_123",
      storeSubmissionTranscript: "appstore_submission_01HZYXZYXZYXZYXZYXZYXZYXZ approved com.inkroute.mobile",
      nativeSigningTranscript: "provisioning_profile_01HZYXZYXZYXZYXZYXZYXZYXZ used keystore_release_01HZYXZYXZYXZYXZYXZYXZYXZ",
      otaTranscript: "ota_update_01HZYXZYXZYXZYXZYXZYXZYXZ published to channel_production_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciTranscript: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ for commit_01HZYXZYXZYXZYXZYXZYXZYXZ",
      screenshotPath: "artifacts/mobile-deployment/private-screen.png",
      videoPath: "artifacts/mobile-deployment/private-video.mp4",
      crashPayload: { nativeStack: "private native crash" },
      qaNotes: "device QA captured private client name",
      environment: { DATABASE_URL: "postgresql://mobile:secret@db.example.test:5432/app" },
      nested: {
        authorization: "Bearer mobile-deployment-token",
        tenantId: "tenant_demo",
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_mobile_deployment",
      reviewerHandle: "reviewer_mobile_owner",
      codeownerSelector: "CODEOWNER:mobile-platform-team",
    };
    const redacted = buildRedactedMobileDeploymentArtifact(rawArtifact);
    const review = buildMobileDeploymentRuntimeArtifactReview("coverage/mobile-deployment-ci-run-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("eas_project_abc123");
    expect(serialized).not.toContain("expo.dev");
    expect(serialized).not.toContain("u.expo.dev");
    expect(serialized).not.toContain("sentry.io");
    expect(serialized).not.toContain("00008030");
    expect(serialized).not.toContain("ExponentPushToken");
    expect(serialized).not.toContain("ios_distribution_certificate_secret");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 777 1212");
    expect(serialized).not.toContain("Bearer mobile-deployment-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("PRIVATE_ENV=value");
    expect(serialized).not.toContain("production-private-channel");
    expect(serialized).not.toContain("private_update_123");
    expect(serialized).not.toContain("appstore_submission_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("com.inkroute.mobile");
    expect(serialized).not.toContain("provisioning_profile_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("ota_update_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("artifacts/mobile-deployment/private-screen.png");
    expect(serialized).not.toContain("artifacts/mobile-deployment/private-video.mp4");
    expect(serialized).not.toContain("private native crash");
    expect(serialized).not.toContain("private client name");
    expect(serialized).not.toContain("postgresql://mobile:secret@db.example.test:5432/app");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_mobile_deployment");
    expect(serialized).not.toContain("reviewer_mobile_owner");
    expect(serialized).not.toContain("CODEOWNER:mobile-platform-team");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "buildLog",
        "buildUrl",
        "codeownerSelector",
        "crashPayload",
        "deviceUdid",
        "easProjectId",
        "environment",
        "installUrl",
        "nativeCredential",
        "nativeSigningTranscript",
        "otaTranscript",
        "otaUrl",
        "pullRequestSelector",
        "pushToken",
        "qaNotes",
        "repositorySelector",
        "reviewerHandle",
        "rollbackTranscript",
        "runtimeChannel",
        "screenshotPath",
        "sentryDsn",
        "storeSubmissionTranscript",
        "storeReadiness",
        "videoPath",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(mobileDeploymentRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "EAS build, OTA update, and rollback artifacts must be captured outside Codex with build URLs, tokens, and project IDs redacted.",
        "Native signing credentials, push credentials, device identifiers, and store-console proof must never be committed.",
        "Device QA, push token, and crash-capture artifacts must redact device IDs, user data, Sentry project labels, and contact data.",
        "MobileDeploymentRun persistence must execute only against an approved provider-backed database.",
      ]),
    );
  });
});

