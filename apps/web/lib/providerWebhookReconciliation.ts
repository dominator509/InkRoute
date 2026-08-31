import { buildProviderWebhookReconciliationPlan as buildObservabilityProviderWebhookReconciliationPlan } from "@inkroute/observability";
import {
  buildProviderWebhookRuntimeReadinessPlan,
  type ProviderEventReconciliationPlan,
  type ProviderWebhookRuntimeReadinessPlan,
} from "@inkroute/notifications";
import { emailProviderContract } from "./emailProvider";
import { smsProviderContract } from "./smsProvider";
import { createHash } from "node:crypto";

export type ProviderWebhookErrorStatus = "open" | "triaged" | "in_progress" | "resolved" | "ignored";

export type ProviderWebhookReconciliationStatus =
  | "wired"
  | "signature-gated"
  | "persistence-gated"
  | "replay-gated"
  | "provider-gated"
  | "privacy-gated"
  | "ci-gated";

export interface ProviderWebhookReconciliationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderWebhookReconciliationStatus;
}

export const providerWebhookReconciliationCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/provider-webhook-reconciliation-static.test.ts apps/web/tests/observability-routes.test.ts",
  "Sentry webhook signature and replay tests",
  "ProviderWebhookDelivery unique idempotency persistence tests",
  "ErrorReport status mutation integration tests",
  "live Sentry webhook replay proof with redacted payloads",
  "provider webhook no-PII artifact audit",
] as const;

export const providerWebhookReconciliationRequiredExternalEvidence = [
  "Sentry signature and replay execution",
  "ProviderWebhookDelivery migration applied in non-production database",
  "durable idempotency and ErrorReport status mutation integration proof",
  "live Sentry webhook replay proof",
  "provider webhook no-PII audit, CI evidence, and secret-safe artifacts",
] as const;

export const providerWebhookReconciliationArtifactPaths = [
  "coverage/provider-webhook-reconciliation.json",
  "coverage/provider-webhook-observability-typecheck.txt",
  "coverage/provider-webhook-observability-test.txt",
  "coverage/provider-webhook-route-static-contracts.json",
  "coverage/provider-webhook-signature-replay.json",
  "coverage/provider-webhook-idempotency.json",
  "coverage/provider-webhook-durable-delivery-constraint.json",
  "coverage/provider-webhook-error-status-mutation.json",
  "coverage/provider-webhook-sanitized-payload-redacted.json",
  "coverage/provider-webhook-live-sentry-proof-redacted.json",
  "coverage/provider-webhook-no-pii-artifact-audit.json",
  "coverage/provider-webhook-ci-evidence.json",
  "coverage/provider-webhook-secret-safe-artifacts.json",
  "test-results/provider-webhook-reconciliation",
] as const;

export const providerWebhookReconciliationProofFiles = [
  "packages/observability/package.json",
  "apps/web/lib/providerWebhookReconciliation.ts",
  "apps/web/app/api/webhooks/sentry/route.ts",
  "apps/web/tests/provider-webhook-reconciliation-static.test.ts",
  "apps/web/tests/observability-routes.test.ts",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260613000300_add_provider_webhook_deliveries/migration.sql",
  "API_CONTRACTS.md",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type ProviderWebhookReconciliationEvidenceArtifact = (typeof providerWebhookReconciliationArtifactPaths)[number];

export interface ProviderWebhookReconciliationExecutionPlan {
  readonly id: "gap-082-provider-webhook-reconciliation";
  readonly liveProviderReplayAllowed: false;
  readonly migrationExecutionAllowed: false;
  readonly durableDatabaseExecutionAllowed: false;
  readonly policy: ProviderWebhookReconciliationExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof providerWebhookReconciliationCommands;
  readonly requiredArtifacts: typeof providerWebhookReconciliationArtifactPaths;
  readonly localContractArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
  readonly durablePersistenceArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
  readonly liveProviderArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
  readonly privacyArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
  readonly secretSafeArtifactPath: ProviderWebhookReconciliationEvidenceArtifact;
  readonly externalEvidenceRequired: typeof providerWebhookReconciliationRequiredExternalEvidence;
}

export interface ProviderWebhookReconciliationExecutionPolicy {
  readonly executeLiveProviderReplay: false;
  readonly executeMigration: false;
  readonly executeDurableDatabase: false;
  readonly executeStatusMutationIntegration: false;
  readonly executeNoPiiAudit: false;
  readonly executeCi: false;
}

export interface ProviderWebhookReconciliationArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: Record<string, unknown>;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: ProviderWebhookReconciliationEvidenceArtifact;
}

const PROVIDER_WEBHOOK_ARTIFACT_EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PROVIDER_WEBHOOK_ARTIFACT_TOKEN_PATTERN = /\b(?:bearer|sentry|sk|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;
const PROVIDER_WEBHOOK_ARTIFACT_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|api[-_]?key|sentry[-_]?secret|dsn|url|uri|path|artifact|trace|screenshot|video|raw|payload|body|stack|error|output|log|env|database|tenant|user|client|booking|message|destination|fingerprint|issue|event|run|commit|workflow|ci)/i;
const PROVIDER_WEBHOOK_ARTIFACT_VALUE_PATTERNS = [
  PROVIDER_WEBHOOK_ARTIFACT_EMAIL_PATTERN,
  PROVIDER_WEBHOOK_ARTIFACT_TOKEN_PATTERN,
  /https?:\/\/[^\s"'<>]+/gi,
  /\b(?:coverage|test-results|artifacts|reports)\/[A-Za-z0-9_./-]{6,}\b/gi,
  /\b(?:gh[psuor]_|github_pat_|sentry_|sk_|ya29)[A-Za-z0-9_./:-]{6,}\b/gi,
  /\b(?:workflow|ci|run|commit|artifact|trace|screenshot|video|tenant|issue|event|provider)[-_:/A-Za-z0-9.]{8,}\b/gi,
  /\b[a-f0-9]{32,}\b/gi,
] as const;
const PROVIDER_WEBHOOK_ARTIFACT_UNSAFE_PATTERNS = [
  PROVIDER_WEBHOOK_ARTIFACT_EMAIL_PATTERN,
  PROVIDER_WEBHOOK_ARTIFACT_TOKEN_PATTERN,
  /https?:\/\/[^\s"'<>]+/gi,
  /\b(?:coverage|test-results|artifacts|reports)\/[A-Za-z0-9_./-]{6,}\b/gi,
] as const;

export const providerWebhookReconciliationExecutionPolicy: ProviderWebhookReconciliationExecutionPolicy = {
  executeLiveProviderReplay: false,
  executeMigration: false,
  executeDurableDatabase: false,
  executeStatusMutationIntegration: false,
  executeNoPiiAudit: false,
  executeCi: false,
};

export function buildProviderWebhookReconciliationExecutionPlan(): ProviderWebhookReconciliationExecutionPlan {
  return {
    id: "gap-082-provider-webhook-reconciliation",
    liveProviderReplayAllowed: false,
    migrationExecutionAllowed: false,
    durableDatabaseExecutionAllowed: false,
    policy: providerWebhookReconciliationExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: providerWebhookReconciliationCommands,
    requiredArtifacts: providerWebhookReconciliationArtifactPaths,
    localContractArtifacts: [
      "coverage/provider-webhook-reconciliation.json",
      "coverage/provider-webhook-observability-typecheck.txt",
      "coverage/provider-webhook-observability-test.txt",
      "coverage/provider-webhook-route-static-contracts.json",
      "coverage/provider-webhook-sanitized-payload-redacted.json",
    ],
    durablePersistenceArtifacts: [
      "coverage/provider-webhook-signature-replay.json",
      "coverage/provider-webhook-idempotency.json",
      "coverage/provider-webhook-durable-delivery-constraint.json",
      "coverage/provider-webhook-error-status-mutation.json",
    ],
    liveProviderArtifacts: ["coverage/provider-webhook-live-sentry-proof-redacted.json"],
    privacyArtifacts: ["coverage/provider-webhook-no-pii-artifact-audit.json"],
    secretSafeArtifactPath: "coverage/provider-webhook-secret-safe-artifacts.json",
    externalEvidenceRequired: providerWebhookReconciliationRequiredExternalEvidence,
  };
}

function redactProviderWebhookReconciliationArtifactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactProviderWebhookReconciliationArtifactValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        PROVIDER_WEBHOOK_ARTIFACT_KEY_PATTERN.test(key)
          ? "[redacted-artifact]"
          : redactProviderWebhookReconciliationArtifactValue(entry),
      ]),
    );
  }

  if (typeof value !== "string") {
    return value;
  }

  return PROVIDER_WEBHOOK_ARTIFACT_VALUE_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, "[redacted-artifact]"),
    value,
  );
}

export function buildRedactedProviderWebhookReconciliationArtifact(
  artifact: Record<string, unknown>,
): Record<string, unknown> {
  return redactProviderWebhookReconciliationArtifactValue(artifact) as Record<string, unknown>;
}

export function buildProviderWebhookReconciliationArtifactReview(
  artifactName: string,
  artifact: Record<string, unknown>,
  requiredArtifactPath: ProviderWebhookReconciliationEvidenceArtifact = "coverage/provider-webhook-secret-safe-artifacts.json",
): ProviderWebhookReconciliationArtifactReview {
  const redactedArtifact = buildRedactedProviderWebhookReconciliationArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(PROVIDER_WEBHOOK_ARTIFACT_EMAIL_PATTERN) ? "email" : null,
    serialized.match(PROVIDER_WEBHOOK_ARTIFACT_TOKEN_PATTERN) ? "provider-token" : null,
    PROVIDER_WEBHOOK_ARTIFACT_UNSAFE_PATTERNS.some((pattern) => serialized.match(pattern)) ? "provider-artifact-selector" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface ProviderWebhookReconciliationEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly routeStaticContractsPassed: boolean;
  readonly signatureReplayVerified: boolean;
  readonly idempotencyVerified: boolean;
  readonly durableDeliveryConstraintVerified: boolean;
  readonly errorStatusMutationVerified: boolean;
  readonly sanitizedPayloadCaptured: boolean;
  readonly liveSentryReplayProofCaptured: boolean;
  readonly noPiiArtifactAuditPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
}

export const providerWebhookReconciliationDecisionRequiredEvidence = [
  "observability package typecheck/test and route static contract artifacts",
  "Sentry signature/replay, idempotency, durable ProviderWebhookDelivery constraint, and status mutation artifacts",
  "sanitized payload, live Sentry replay, and no-PII provider webhook artifact audit evidence",
  "CI evidence and redacted secret-safe artifact review",
] as const;

export interface ProviderWebhookReconciliationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly ProviderWebhookReconciliationEvidenceArtifact[];
  readonly requiredCommands: typeof providerWebhookReconciliationCommands;
  readonly requiredEvidence: typeof providerWebhookReconciliationDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildProviderWebhookReconciliationEvidenceDecision(
  input: ProviderWebhookReconciliationEvidenceInput,
): ProviderWebhookReconciliationEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.routeStaticContractsPassed ? "Provider webhook route static contract evidence is required." : null,
    !input.signatureReplayVerified ? "Sentry webhook signature and replay evidence is required." : null,
    !input.idempotencyVerified ? "Provider webhook idempotency evidence is required." : null,
    !input.durableDeliveryConstraintVerified ? "ProviderWebhookDelivery durable unique constraint evidence is required." : null,
    !input.errorStatusMutationVerified ? "ErrorReport status mutation integration evidence is required." : null,
    !input.sanitizedPayloadCaptured ? "Sanitized provider payload artifact evidence is required." : null,
    !input.liveSentryReplayProofCaptured ? "Live Sentry webhook replay proof evidence is required." : null,
    !input.noPiiArtifactAuditPassed ? "Provider webhook no-PII artifact audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI provider webhook reconciliation gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = providerWebhookReconciliationArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: providerWebhookReconciliationCommands,
    requiredEvidence: providerWebhookReconciliationDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-082 provider webhook reconciliation evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-082 provider webhook reconciliation evidence remains blocked until durable delivery, replay, status mutation, provider, no-PII, CI, and redaction artifacts are captured.",
  };
}

export const providerWebhookReconciliationMatrix: readonly ProviderWebhookReconciliationMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/provider-webhook-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/provider-webhook-observability-test.txt", status: "wired" },
  { id: "route-static-contracts", command: "provider webhook reconciliation static route contracts", artifact: "coverage/provider-webhook-route-static-contracts.json", status: "wired" },
  { id: "signature-replay", command: "Sentry webhook signature and replay tests", artifact: "coverage/provider-webhook-signature-replay.json", status: "signature-gated" },
  { id: "idempotency", command: "provider delivery idempotency tests", artifact: "coverage/provider-webhook-idempotency.json", status: "replay-gated" },
  { id: "durable-delivery-constraint", command: "ProviderWebhookDelivery unique idempotency persistence tests", artifact: "coverage/provider-webhook-durable-delivery-constraint.json", status: "persistence-gated" },
  { id: "error-status-mutation", command: "ErrorReport status mutation integration tests", artifact: "coverage/provider-webhook-error-status-mutation.json", status: "persistence-gated" },
  { id: "sanitized-payload", command: "sanitized provider payload artifact audit", artifact: "coverage/provider-webhook-sanitized-payload-redacted.json", status: "privacy-gated" },
  { id: "live-sentry-proof", command: "live Sentry webhook replay proof with redacted payloads", artifact: "coverage/provider-webhook-live-sentry-proof-redacted.json", status: "provider-gated" },
  { id: "no-pii-artifact-audit", command: "provider webhook no-PII artifact audit", artifact: "coverage/provider-webhook-no-pii-artifact-audit.json", status: "privacy-gated" },
  { id: "ci-provider-webhook-reconciliation", command: "GitHub Actions provider webhook reconciliation gate", artifact: "coverage/provider-webhook-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted provider webhook artifact audit", artifact: "coverage/provider-webhook-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

const SECRET_KEY_PATTERN = /(authorization|cookie|password|secret|token|api[-_]?key|sentry[-_]?secret|dsn)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~+/-]+=*/gi;

function redactText(value: string): string {
  return value.replace(EMAIL_PATTERN, "[redacted-email]").replace(BEARER_PATTERN, "[redacted-token]");
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactText(value).slice(0, 500);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 12).map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return sanitizeProviderObject(value as Record<string, unknown>);
  }

  return value ?? null;
}

function sanitizeProviderObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 24)
      .map(([key, entry]) => [key, SECRET_KEY_PATTERN.test(key) ? "[redacted-secret]" : sanitizeValue(entry)]),
  );
}

export function buildProviderDeliveryId(event: Record<string, unknown>, data: Record<string, unknown>): string {
  const providerId = data.id ?? data.issueId ?? event.id ?? event.installationId ?? event.action ?? "unknown";
  const action = typeof event.action === "string" ? event.action : "unknown";
  const providerIdHash = createHash("sha256").update(String(providerId)).digest("hex").slice(0, 24);

  return `sentry:${action}:sha256:${providerIdHash}`;
}

function buildProviderWebhookReplayIdempotencyKey(providerDeliveryId: string): string {
  return `sentry-replay:${createHash("sha256").update(providerDeliveryId).digest("hex")}`;
}

export function mapSentryActionToErrorStatus(action: string): ProviderWebhookErrorStatus {
  if (["resolved", "closed"].includes(action)) {
    return "resolved";
  }

  if (["ignored", "archived"].includes(action)) {
    return "ignored";
  }

  if (["assigned", "regressed"].includes(action)) {
    return "triaged";
  }

  return "open";
}

export function sanitizeProviderWebhookPayload(
  event: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return {
    provider: "sentry",
    action: typeof event.action === "string" ? event.action : "unknown",
    issueId: sanitizeValue(data.id ?? data.issueId ?? null),
    title: sanitizeValue(data.title ?? event.title ?? null),
    culprit: sanitizeValue(data.culprit ?? null),
    release: sanitizeValue(data.release ?? null),
    fingerprint: sanitizeValue(data.fingerprint ?? data.stackHash ?? null),
    tenantId: sanitizeValue(data.tenantId ?? null),
    rawPayloadShape: Object.keys(event).slice(0, 12),
    sanitizedDataPreview: sanitizeProviderObject(data),
  };
}

export function resolveTenantOwnershipFromProvider(
  data: Record<string, unknown>,
  fallbackTenantId?: string,
): { tenantId: string | null; source: "provider-payload" | "fallback" | "unresolved" } {
  if (typeof data.tenantId === "string" && data.tenantId.trim()) {
    return { tenantId: data.tenantId, source: "provider-payload" };
  }

  if (typeof data.projectSlug === "string" && data.projectSlug.startsWith("tenant_")) {
    return { tenantId: data.projectSlug, source: "provider-payload" };
  }

  if (fallbackTenantId) {
    return { tenantId: fallbackTenantId, source: "fallback" };
  }

  return { tenantId: null, source: "unresolved" };
}

export function resolveProviderFingerprint(data: Record<string, unknown>): string | null {
  if (typeof data.fingerprint === "string" && data.fingerprint.trim()) {
    return data.fingerprint;
  }

  if (typeof data.stackHash === "string" && data.stackHash.trim()) {
    return data.stackHash;
  }

  return null;
}

export function buildSentryReconciliationPlan(input: {
  event: Record<string, unknown>;
  data: Record<string, unknown>;
  fallbackTenantId?: string;
}) {
  const action = typeof input.event.action === "string" ? input.event.action : "unknown";
  const providerDeliveryId = buildProviderDeliveryId(input.event, input.data);

  return {
    provider: "sentry" as const,
    action,
    providerDeliveryId,
    idempotencyKey: buildProviderWebhookReplayIdempotencyKey(providerDeliveryId),
    targetErrorStatus: mapSentryActionToErrorStatus(action),
    providerFingerprint: resolveProviderFingerprint(input.data),
    sanitizedPayload: sanitizeProviderWebhookPayload(input.event, input.data),
    ownership: resolveTenantOwnershipFromProvider(input.data, input.fallbackTenantId),
    persistence: "audit-log-transaction" as const,
    rawPayloadStored: false,
  };
}

export function buildProviderWebhookReconciliationContract() {
  return buildObservabilityProviderWebhookReconciliationPlan({
    packageScripts: ["test", "typecheck"],
    routeTestsPassed: false,
    webTypecheckPassed: false,
    webhookSecretConfigured: Boolean(process.env.SENTRY_WEBHOOK_SECRET),
    signatureVerificationEnabled: true,
    timingSafeComparisonEnabled: true,
    replayProtectionConfigured: true,
    durableDeliveryPersistenceConfigured: true,
    idempotencyConstraintConfigured: true,
    tenantIssueOwnershipLookupConfigured: true,
    errorReportStatusMutationConfigured: true,
    reconciliationAuditLogsConfigured: true,
    sanitizedProviderPayloadsVerified: true,
    liveSentryWebhookProofCaptured: false,
  });
}

export const providerWebhookReconciliationContract = buildProviderWebhookReconciliationContract();


export interface ProviderWebhookPersistenceRepository {
  claimProviderEvent(input: { tenantId: string; idempotencyKey: string; provider: string; eventId: string }): Promise<"claimed" | "duplicate">;
  persistProviderEvent(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; redactedPayload: Record<string, unknown> }): Promise<void>;
  updateDeliveryLogExactlyOnce(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan }): Promise<void>;
  persistSuppression(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan }): Promise<void>;
  persistInboundRouting(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan }): Promise<void>;
  suppressInvalidPushToken(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan }): Promise<void>;
  persistWebhookAudit(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; redactedPayload: Record<string, unknown> }): Promise<void>;
  alertFailedWebhook(input: { tenantId: string | null; reason: string; redactedPayload: Record<string, unknown> }): Promise<void>;
}

export interface InMemoryProviderWebhookPersistenceRepositoryState {
  readonly providerEvents: Map<string, { readonly tenantId: string; readonly provider: string; readonly eventId: string }>;
  readonly persistedProviderEvents: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan; readonly redactedPayload: Record<string, unknown> }[];
  readonly deliveryUpdates: Map<string, { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan }>;
  readonly suppressions: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan }[];
  readonly inboundRoutes: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan }[];
  readonly invalidPushTokens: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan }[];
  readonly webhookAudits: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan; readonly redactedPayload: Record<string, unknown> }[];
  readonly failedAlerts: { readonly tenantId: string | null; readonly reason: string; readonly redactedPayload: Record<string, unknown> }[];
}

const providerWebhookPrivatePayloadKeys = new Set([
  "authorization",
  "cookie",
  "destination",
  "email",
  "eventId",
  "headers",
  "idempotencyKey",
  "messageBody",
  "phone",
  "providerMessageId",
  "providerPayload",
  "rawBody",
  "rawHeaders",
  "signature",
  "token",
]);

function redactProviderWebhookValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactProviderWebhookValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        providerWebhookPrivatePayloadKeys.has(key) ? "[redacted]" : redactProviderWebhookValue(entry),
      ]),
    );
  }

  return typeof value === "string" ? redactText(value) : value;
}

export function buildRedactedProviderWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return redactProviderWebhookValue(payload) as Record<string, unknown>;
}

function buildProviderEventClaimKey(input: { readonly tenantId: string; readonly provider: string; readonly idempotencyKey: string }): string {
  return `provider-event-claim:${createHash("sha256").update(JSON.stringify([input.tenantId, input.provider, input.idempotencyKey])).digest("hex")}`;
}

function buildDeliveryUpdateKey(input: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan }): string {
  return `provider-delivery-update:${createHash("sha256").update(JSON.stringify([input.tenantId, input.reconciliation.provider, input.reconciliation.eventId])).digest("hex")}`;
}

export function createInMemoryProviderWebhookPersistenceRepository(
  state: InMemoryProviderWebhookPersistenceRepositoryState = {
    providerEvents: new Map(),
    persistedProviderEvents: [],
    deliveryUpdates: new Map(),
    suppressions: [],
    inboundRoutes: [],
    invalidPushTokens: [],
    webhookAudits: [],
    failedAlerts: [],
  },
): ProviderWebhookPersistenceRepository & { readonly state: InMemoryProviderWebhookPersistenceRepositoryState } {
  return {
    state,
    async claimProviderEvent(input) {
      const key = buildProviderEventClaimKey(input);
      if (state.providerEvents.has(key)) {
        return "duplicate";
      }

      state.providerEvents.set(key, {
        tenantId: input.tenantId,
        provider: input.provider,
        eventId: input.eventId,
      });
      return "claimed";
    },
    async persistProviderEvent(input) {
      state.persistedProviderEvents.push({
        ...input,
        redactedPayload: buildRedactedProviderWebhookPayload(input.redactedPayload),
      });
    },
    async updateDeliveryLogExactlyOnce(input) {
      const key = buildDeliveryUpdateKey(input);
      if (!state.deliveryUpdates.has(key)) {
        state.deliveryUpdates.set(key, input);
      }
    },
    async persistSuppression(input) {
      state.suppressions.push(input);
    },
    async persistInboundRouting(input) {
      state.inboundRoutes.push(input);
    },
    async suppressInvalidPushToken(input) {
      state.invalidPushTokens.push(input);
    },
    async persistWebhookAudit(input) {
      state.webhookAudits.push({
        ...input,
        redactedPayload: buildRedactedProviderWebhookPayload(input.redactedPayload),
      });
    },
    async alertFailedWebhook(input) {
      state.failedAlerts.push({
        ...input,
        redactedPayload: buildRedactedProviderWebhookPayload(input.redactedPayload),
      });
    },
  };
}

export interface ProviderWebhookContract {
  runtimeReadiness: ProviderWebhookRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof ProviderWebhookPersistenceRepository)[];
  emailWebhookReadiness: typeof emailProviderContract.webhookReadiness;
  smsStopWebhookReadiness: typeof smsProviderContract.stopWebhookReadiness;
  smsHelpWebhookReadiness: typeof smsProviderContract.helpWebhookReadiness;
}

export interface ProviderWebhookRouteBoundaryInput {
  source: "email" | "sms" | "push";
  tenantId?: string;
  eventId: string;
  eventType: string;
  rawBodyBytes: number;
  signatureHeaderPresent: boolean;
  reconciliation: ProviderEventReconciliationPlan;
}

export function redactedWebhookPayloadSummary(input: ProviderWebhookRouteBoundaryInput): Record<string, unknown> {
  return {
    source: input.source,
    tenantResolved: Boolean(input.tenantId),
    providerEventIdPresent: Boolean(input.eventId),
    eventType: input.eventType,
    rawBodyBytes: input.rawBodyBytes,
    signatureHeaderPresent: input.signatureHeaderPresent,
    tenantIdEchoed: false,
    rawProviderEventIdEchoed: false,
    omittedFields: ["rawBody", "destination", "messageBody", "providerPayload", "signature", "token"],
  };
}

export function redactedProviderWebhookReconciliationSummary(
  reconciliation: ProviderEventReconciliationPlan,
): Omit<ProviderEventReconciliationPlan, "inboundBody" | "eventId" | "providerMessageId"> & {
  rawProviderEventIdEchoed: false;
  rawProviderMessageIdEchoed: false;
} {
  const {
    inboundBody: _inboundBody,
    eventId: _eventId,
    providerMessageId: _providerMessageId,
    ...safeReconciliation
  } = reconciliation as ProviderEventReconciliationPlan & { inboundBody?: unknown; providerMessageId?: unknown };
  return {
    ...safeReconciliation,
    rawProviderEventIdEchoed: false,
    rawProviderMessageIdEchoed: false,
  };
}

export const providerWebhookRouteBoundaryRequiredControls = [
  "Verify provider signature against the raw request body before side effects.",
  "Claim ProviderEvent idempotency before delivery, suppression, inbound, or push-token mutations.",
  "Apply exactly-once delivery updates under replay and concurrent callbacks.",
  "Persist suppression, inbound routing, invalid push-token, audit, and failed-webhook alert outcomes in tenant scope.",
  "Redact provider payloads, destinations, message bodies, private URLs, signatures, and tokens from logs and previews.",
] as const;

export function buildProviderWebhookRouteBoundary(input: ProviderWebhookRouteBoundaryInput) {
  return {
    source: input.source,
    status: input.tenantId ? "planned" as const : "blocked" as const,
    tenantResolved: Boolean(input.tenantId),
    reconciliation: redactedProviderWebhookReconciliationSummary(input.reconciliation),
    redactedWebhookPayloadSummary: redactedWebhookPayloadSummary(input),
    responseProjection: {
      tenantIdEchoed: false,
      rawProviderEventIdEchoed: false,
      rawProviderMessageIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
    requiredWrites: [
      "ProviderEvent",
      "NotificationDelivery",
      "SuppressionListEntry",
      "MessageThread",
      "PushToken",
      "WebhookAuditLog",
      "FailedWebhookAlert",
    ] as const,
    requiredControls: providerWebhookRouteBoundaryRequiredControls,
  };
}

export function buildProviderWebhookContract(): ProviderWebhookContract {
  return {
    runtimeReadiness: buildProviderWebhookRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      webRouteTestsPassed: false,
      emailSignatureVerificationImplemented: true,
      smsSignatureVerificationImplemented: true,
      pushReceiptTrustedSourceVerified: false,
      rawBodyPreservedForVerification: true,
      webhookSecretsConfigured: false,
      replayProtectionPersistenceAvailable: false,
      providerEventPersistenceAvailable: false,
      deliveryLogPersistenceAvailable: false,
      exactlyOnceDeliveryUpdatesEnforced: false,
      suppressionPersistenceAvailable: false,
      inboundRoutingPersistenceAvailable: false,
      invalidPushTokenPersistenceAvailable: false,
      tenantResolutionEnforced: true,
      payloadRedactionEnforced: true,
      failedWebhookAlertingConfigured: false,
      providerSandboxWebhookTestsPassed: false,
      routeInvalidSignatureTestsPassed: false,
    }),
    requiredRepositoryMethods: [
      "claimProviderEvent",
      "persistProviderEvent",
      "updateDeliveryLogExactlyOnce",
      "persistSuppression",
      "persistInboundRouting",
      "suppressInvalidPushToken",
      "persistWebhookAudit",
      "alertFailedWebhook",
    ],
    emailWebhookReadiness: emailProviderContract.webhookReadiness,
    smsStopWebhookReadiness: smsProviderContract.stopWebhookReadiness,
    smsHelpWebhookReadiness: smsProviderContract.helpWebhookReadiness,
  };
}

export async function executeProviderWebhookReconciliation(
  repository: ProviderWebhookPersistenceRepository,
  input: {
    tenantId?: string;
    reconciliation: ProviderEventReconciliationPlan;
    redactedPayload: Record<string, unknown>;
  },
): Promise<{ status: "processed" | "duplicate" | "blocked"; reconciliation: ProviderEventReconciliationPlan }> {
  const tenantId = input.tenantId;
  if (!tenantId) {
    await repository.alertFailedWebhook({ tenantId: null, reason: "tenant_unresolved", redactedPayload: input.redactedPayload });
    return { status: "blocked", reconciliation: input.reconciliation };
  }

  const claim = await repository.claimProviderEvent({
    tenantId,
    idempotencyKey: input.reconciliation.idempotencyKey,
    provider: input.reconciliation.provider,
    eventId: input.reconciliation.eventId,
  });
  if (claim === "duplicate") return { status: "duplicate", reconciliation: input.reconciliation };

  await repository.persistProviderEvent({ tenantId, reconciliation: input.reconciliation, redactedPayload: input.redactedPayload });
  if (input.reconciliation.shouldUpdateDeliveryLog) await repository.updateDeliveryLogExactlyOnce({ tenantId, reconciliation: input.reconciliation });
  if (input.reconciliation.shouldSuppressDestination) await repository.persistSuppression({ tenantId, reconciliation: input.reconciliation });
  if (input.reconciliation.shouldCreateInboundThread) await repository.persistInboundRouting({ tenantId, reconciliation: input.reconciliation });
  if (input.reconciliation.shouldMarkPushTokenInactive) await repository.suppressInvalidPushToken({ tenantId, reconciliation: input.reconciliation });
  await repository.persistWebhookAudit({ tenantId, reconciliation: input.reconciliation, redactedPayload: input.redactedPayload });

  return { status: "processed", reconciliation: input.reconciliation };
}

export const providerWebhookContract = buildProviderWebhookContract();


