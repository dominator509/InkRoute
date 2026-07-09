import {
  buildAlertEscalationPlan,
  buildAlertRuntimeDeliveryReadinessPlan,
  type ObservabilityEventInput,
  type ObservabilityReportDraft,
} from "@inkroute/observability";
export type AlertEscalationRuntimeStatus =
  | "wired"
  | "credential-gated"
  | "worker-gated"
  | "schedule-gated"
  | "provider-gated"
  | "callback-gated"
  | "ci-gated";

export interface AlertEscalationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AlertEscalationRuntimeStatus;
}

export const alertEscalationRuntimeCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/alert-escalation-runtime-static.test.ts",
  "durable AlertDelivery worker executor smoke",
  "Slack/email/pager credential-gated delivery tests",
  "on-call schedule and quiet-hours routing tests",
  "provider acknowledgement callback persistence tests",
  "live synthetic critical/high provider proof",
] as const;

export const alertEscalationRequiredExternalEvidence = [
  "AlertDelivery migration applied in a non-production database",
  "durable worker executor smoke and retry/dead-letter proof",
  "Slack/email/pager credential-gated delivery tests",
  "on-call schedule and quiet-hours routing tests",
  "provider acknowledgement callback persistence tests",
  "live synthetic critical/high provider proof, CI evidence, and secret-safe artifacts",
] as const;

export const alertEscalationArtifactPaths = [
  "coverage/alert-escalation-runtime.json",
  "coverage/alert-observability-typecheck.txt",
  "coverage/alert-observability-test.txt",
  "coverage/alert-route-static-contract.json",
  "coverage/alert-worker-retry-dead-letter.json",
  "coverage/alert-worker-executor.json",
  "coverage/alert-provider-credentials-redacted.json",
  "coverage/alert-on-call-schedule.json",
  "coverage/alert-quiet-hours-routing.json",
  "coverage/alert-acknowledgement-state.json",
  "coverage/alert-provider-callbacks-redacted.json",
  "coverage/alert-sanitized-payload-redacted.json",
  "coverage/alert-live-critical-pager-redacted.json",
  "coverage/alert-live-high-slack-redacted.json",
  "coverage/alert-ci-evidence.json",
  "coverage/alert-secret-safe-artifacts.json",
  "test-results/observability-alerts",
] as const;

export const alertEscalationProofFiles = [
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260613000400_add_alert_deliveries/migration.sql",
  "apps/web/app/api/observability/alerts/route.ts",
  "apps/web/tests/alert-escalation-runtime-static.test.ts",
  "apps/dashboard/app/errors/page.tsx",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type AlertEscalationEvidenceArtifact = (typeof alertEscalationArtifactPaths)[number];

export interface AlertEscalationExecutionPlan {
  readonly id: "gap-083-alert-escalation";
  readonly durableWorkerExecutionAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly migrationExecutionAllowed: false;
  readonly policy: AlertEscalationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof alertEscalationRuntimeCommands;
  readonly requiredArtifacts: typeof alertEscalationArtifactPaths;
  readonly localContractArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly workerArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly providerArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly scheduleArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly callbackArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly secretSafeArtifactPath: AlertEscalationEvidenceArtifact;
  readonly externalEvidenceRequired: typeof alertEscalationRequiredExternalEvidence;
}

export interface AlertEscalationExecutionPolicy {
  readonly executeDurableWorker: false;
  readonly executeProviderDelivery: false;
  readonly executeMigration: false;
  readonly executeOnCallRouting: false;
  readonly executeProviderCallbacks: false;
  readonly executeLiveSyntheticProviderProof: false;
  readonly executeCi: false;
}

export interface AlertEscalationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: AlertEscalationEvidenceArtifact;
}

const alertArtifactSensitiveKeyPattern =
  /(?:authorization|body|clientsecret|credential|email|password|phone|private|raw|secret|slack|stack|token|webhook|repository|repo|branch|pull|pr|reviewer|codeowner)/i;
const alertArtifactEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const alertArtifactPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const alertArtifactTokenPattern = /\b(?:bearer|pagerduty|slack|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;
const alertArtifactSelectorPattern = /\b(?:repository|repo|branch|pull|pr|reviewer|codeowner)[-_:/]?[A-Za-z0-9_.-]{6,}\b/gi;

function redactAlertArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (alertArtifactSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(alertArtifactEmailPattern, "[REDACTED_EMAIL]")
      .replace(alertArtifactPhonePattern, "[REDACTED_PHONE]")
      .replace(alertArtifactTokenPattern, "[REDACTED_TOKEN]")
      .replace(alertArtifactSelectorPattern, "[REDACTED_SELECTOR]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactAlertArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactAlertArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedAlertEscalationArtifact(artifact: unknown): unknown {
  return redactAlertArtifactValue(artifact);
}

export const alertEscalationExecutionPolicy: AlertEscalationExecutionPolicy = {
  executeDurableWorker: false,
  executeProviderDelivery: false,
  executeMigration: false,
  executeOnCallRouting: false,
  executeProviderCallbacks: false,
  executeLiveSyntheticProviderProof: false,
  executeCi: false,
};

export function buildAlertEscalationExecutionPlan(): AlertEscalationExecutionPlan {
  return {
    id: "gap-083-alert-escalation",
    durableWorkerExecutionAllowed: false,
    providerDeliveryAllowed: false,
    migrationExecutionAllowed: false,
    policy: alertEscalationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: alertEscalationRuntimeCommands,
    requiredArtifacts: alertEscalationArtifactPaths,
    localContractArtifacts: [
      "coverage/alert-escalation-runtime.json",
      "coverage/alert-observability-typecheck.txt",
      "coverage/alert-observability-test.txt",
      "coverage/alert-route-static-contract.json",
      "coverage/alert-sanitized-payload-redacted.json",
    ],
    workerArtifacts: ["coverage/alert-worker-retry-dead-letter.json", "coverage/alert-worker-executor.json"],
    providerArtifacts: [
      "coverage/alert-provider-credentials-redacted.json",
      "coverage/alert-live-critical-pager-redacted.json",
      "coverage/alert-live-high-slack-redacted.json",
    ],
    scheduleArtifacts: ["coverage/alert-on-call-schedule.json", "coverage/alert-quiet-hours-routing.json"],
    callbackArtifacts: ["coverage/alert-acknowledgement-state.json", "coverage/alert-provider-callbacks-redacted.json"],
    secretSafeArtifactPath: "coverage/alert-secret-safe-artifacts.json",
    externalEvidenceRequired: alertEscalationRequiredExternalEvidence,
  };
}

export function buildAlertEscalationArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: AlertEscalationEvidenceArtifact = "coverage/alert-secret-safe-artifacts.json",
): AlertEscalationArtifactReview {
  const redactedArtifact = buildRedactedAlertEscalationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(alertArtifactEmailPattern) ? "email" : null,
    serialized.match(alertArtifactPhonePattern) ? "phone" : null,
    serialized.match(alertArtifactTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface AlertEscalationEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly routeStaticContractPassed: boolean;
  readonly workerRetryDeadLetterVerified: boolean;
  readonly workerExecutorVerified: boolean;
  readonly providerCredentialsVerified: boolean;
  readonly onCallScheduleVerified: boolean;
  readonly quietHoursRoutingVerified: boolean;
  readonly acknowledgementStateVerified: boolean;
  readonly providerCallbacksVerified: boolean;
  readonly sanitizedPayloadCaptured: boolean;
  readonly liveCriticalPagerProofCaptured: boolean;
  readonly liveHighSlackProofCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly AlertEscalationEvidenceArtifact[];
}

export interface AlertEscalationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly AlertEscalationEvidenceArtifact[];
  readonly requiredCommands: typeof alertEscalationRuntimeCommands;
  readonly requiredEvidence: typeof alertEscalationRuntimeRequiredEvidence;
  readonly redactedSummary: string;
}

export const alertEscalationRuntimeRequiredEvidence = [
  "observability package typecheck/test and alert route static contract artifacts",
  "AlertDelivery retry/dead-letter, worker executor, provider credential, on-call, and quiet-hours artifacts",
  "acknowledgement state, provider callback, sanitized payload, live pager, and live Slack artifacts",
  "CI evidence and redacted secret-safe artifact review",
] as const;

export function buildAlertEscalationEvidenceDecision(input: AlertEscalationEvidenceInput): AlertEscalationEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.routeStaticContractPassed ? "Alert escalation route static contract evidence is required." : null,
    !input.workerRetryDeadLetterVerified ? "AlertDelivery retry/dead-letter evidence is required." : null,
    !input.workerExecutorVerified ? "Durable AlertDelivery worker executor evidence is required." : null,
    !input.providerCredentialsVerified ? "Slack/email/pager credential-gated delivery evidence is required." : null,
    !input.onCallScheduleVerified ? "On-call schedule routing evidence is required." : null,
    !input.quietHoursRoutingVerified ? "Quiet-hours routing evidence is required." : null,
    !input.acknowledgementStateVerified ? "Alert acknowledgement state evidence is required." : null,
    !input.providerCallbacksVerified ? "Provider acknowledgement callback persistence evidence is required." : null,
    !input.sanitizedPayloadCaptured ? "Redacted alert payload audit evidence is required." : null,
    !input.liveCriticalPagerProofCaptured ? "Live synthetic critical pager proof evidence is required." : null,
    !input.liveHighSlackProofCaptured ? "Live synthetic high Slack proof evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI alert escalation runtime gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = alertEscalationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: alertEscalationRuntimeCommands,
    requiredEvidence: alertEscalationRuntimeRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-083 alert escalation evidence is complete with CI-safe redacted provider artifacts captured."
        : "GAP-083 alert escalation evidence remains blocked until worker, provider credential, schedule, callback, live delivery, CI, and redaction artifacts are captured.",
  };
}

export const alertEscalationRuntimeMatrix: readonly AlertEscalationRuntimeMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/alert-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/alert-observability-test.txt", status: "wired" },
  { id: "route-static-contract", command: "pnpm vitest run apps/web/tests/alert-escalation-runtime-static.test.ts", artifact: "coverage/alert-route-static-contract.json", status: "wired" },
  { id: "worker-retry-dead-letter", command: "durable AlertDelivery worker retry/dead-letter tests", artifact: "coverage/alert-worker-retry-dead-letter.json", status: "worker-gated" },
  { id: "worker-executor", command: "durable AlertDelivery worker executor smoke", artifact: "coverage/alert-worker-executor.json", status: "worker-gated" },
  { id: "provider-credentials", command: "Slack/email/pager credential-gated delivery tests", artifact: "coverage/alert-provider-credentials-redacted.json", status: "credential-gated" },
  { id: "on-call-schedule", command: "on-call schedule routing tests", artifact: "coverage/alert-on-call-schedule.json", status: "schedule-gated" },
  { id: "quiet-hours-routing", command: "quiet-hours routing tests", artifact: "coverage/alert-quiet-hours-routing.json", status: "schedule-gated" },
  { id: "acknowledgement-state", command: "alert acknowledgement state persistence tests", artifact: "coverage/alert-acknowledgement-state.json", status: "callback-gated" },
  { id: "provider-callbacks", command: "provider acknowledgement callback persistence tests", artifact: "coverage/alert-provider-callbacks-redacted.json", status: "callback-gated" },
  { id: "sanitized-payload", command: "redacted alert payload audit", artifact: "coverage/alert-sanitized-payload-redacted.json", status: "wired" },
  { id: "live-critical-pager", command: "live synthetic critical pager proof", artifact: "coverage/alert-live-critical-pager-redacted.json", status: "provider-gated" },
  { id: "live-high-slack", command: "live synthetic high Slack proof", artifact: "coverage/alert-live-high-slack-redacted.json", status: "provider-gated" },
  { id: "ci-alert-escalation-gate", command: "GitHub Actions alert escalation runtime gate", artifact: "coverage/alert-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted alert artifact audit", artifact: "coverage/alert-secret-safe-artifacts.json", status: "ci-gated" },
] as const;
