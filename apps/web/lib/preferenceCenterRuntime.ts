import { preferenceCenterContract } from "./preferenceCenter";

export type PreferenceCenterRuntimeStatus =
  | "wired"
  | "token-gated"
  | "persistence-gated"
  | "provider-gated"
  | "legal-gated"
  | "integration-gated"
  | "ci-gated";

export interface PreferenceCenterRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PreferenceCenterRuntimeStatus;
}

export const preferenceCenterRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/preference-center-static.test.ts",
  "preference center and unsubscribe route/API tests",
  "tenant notification settings dashboard tests",
  "signed preference token forgery and expiry tests",
  "pre-send suppression integration tests",
] as const;

export const preferenceCenterArtifactPaths = [
  "coverage/preference-center-runtime.json",
  "coverage/preference-center-notifications-typecheck.txt",
  "coverage/preference-center-notifications-test.txt",
  "coverage/preference-center-static-contract.json",
  "coverage/preference-center-route-api.json",
  "coverage/preference-center-dashboard-settings.json",
  "coverage/preference-center-token-crypto.json",
  "coverage/preference-center-token-hash-persistence.json",
  "coverage/preference-center-token-expiry-forgery-reuse.json",
  "coverage/preference-center-client-preference-persistence.json",
  "coverage/preference-center-suppression-persistence.json",
  "coverage/preference-center-tenant-settings-persistence.json",
  "coverage/preference-center-audit-log-persistence.json",
  "coverage/preference-center-idempotency-key.json",
  "coverage/preference-center-list-unsubscribe-provider.json",
  "coverage/preference-center-legal-copy-approval.json",
  "coverage/preference-center-pre-send-suppression.json",
  "coverage/preference-center-ci-evidence.json",
  "coverage/preference-center-secret-safe-artifacts.json",
  "test-results/preference-center-runtime",
] as const;

export const preferenceCenterRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/preference-center-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/preference-center-notifications-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/preference-center-static.test.ts", artifact: "coverage/preference-center-static-contract.json", status: "wired" },
  { id: "route-api", command: "preference center and unsubscribe route/API tests", artifact: "coverage/preference-center-route-api.json", status: "integration-gated" },
  { id: "dashboard-settings", command: "tenant notification settings dashboard tests", artifact: "coverage/preference-center-dashboard-settings.json", status: "integration-gated" },
  { id: "signed-token-crypto", command: "real signed preference token crypto tests", artifact: "coverage/preference-center-token-crypto.json", status: "token-gated" },
  { id: "token-hash-persistence", command: "PreferenceToken hash-only persistence tests", artifact: "coverage/preference-center-token-hash-persistence.json", status: "persistence-gated" },
  { id: "token-expiry-forgery-reuse", command: "signed preference token forgery and expiry tests", artifact: "coverage/preference-center-token-expiry-forgery-reuse.json", status: "token-gated" },
  { id: "client-preference-persistence", command: "ClientNotificationPreference persistence tests", artifact: "coverage/preference-center-client-preference-persistence.json", status: "persistence-gated" },
  { id: "suppression-persistence", command: "SuppressionListEntry unsubscribe/STOP persistence tests", artifact: "coverage/preference-center-suppression-persistence.json", status: "persistence-gated" },
  { id: "tenant-settings-persistence", command: "TenantNotificationSetting persistence tests", artifact: "coverage/preference-center-tenant-settings-persistence.json", status: "persistence-gated" },
  { id: "audit-log-persistence", command: "NotificationAuditLog preference mutation tests", artifact: "coverage/preference-center-audit-log-persistence.json", status: "persistence-gated" },
  { id: "idempotency-key", command: "preference IdempotencyKey tests", artifact: "coverage/preference-center-idempotency-key.json", status: "persistence-gated" },
  { id: "list-unsubscribe-provider", command: "provider List-Unsubscribe header integration tests", artifact: "coverage/preference-center-list-unsubscribe-provider.json", status: "provider-gated" },
  { id: "legal-copy", command: "legal-approved preference/STOP/START/settings copy review", artifact: "coverage/preference-center-legal-copy-approval.json", status: "legal-gated" },
  { id: "pre-send-suppression", command: "pre-send suppression integration tests", artifact: "coverage/preference-center-pre-send-suppression.json", status: "integration-gated" },
  { id: "ci-preference-center-job", command: "GitHub Actions preference center runtime job", artifact: "coverage/preference-center-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review preference artifacts for raw tokens, destinations, message bodies, PII, and secrets", artifact: "coverage/preference-center-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly PreferenceCenterRuntimeMatrixEntry[];

export const preferenceCenterRuntimeReadiness = preferenceCenterContract.runtimeReadiness;
