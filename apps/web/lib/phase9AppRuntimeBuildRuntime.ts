import { phase9AppRuntimeBuildContract, phase9AppRuntimeSurfaces } from "./phase9AppRuntimeBuild";

export type Phase9AppRuntimeBuildRuntimeStatus =
  | "wired"
  | "build-gated"
  | "route-gated"
  | "playwright-gated"
  | "mobile-gated"
  | "provider-disabled-gated"
  | "ci-gated";

export interface Phase9AppRuntimeBuildRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: Phase9AppRuntimeBuildRuntimeStatus;
}

export const phase9AppRuntimeBuildRuntimeCommands = [
  "pnpm --filter @inkroute/testing typecheck",
  "pnpm --filter @inkroute/testing test",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm vitest run apps/web/tests/phase9-app-runtime-build-static.test.ts",
  "Playwright dashboard templates/messages smoke tests",
  "Expo simulator notification screen smoke test",
  "Expo device notification screen smoke test",
  "booking-to-notification runtime smoke with provider sends disabled",
] as const;

export const phase9AppRuntimeBuildRuntimeArtifactPaths = [
  "coverage/phase9-app-runtime-build-runtime.json",
  "coverage/phase9-testing-package-typecheck.txt",
  "coverage/phase9-testing-package-test.txt",
  "coverage/phase9-web-build.log",
  "coverage/phase9-dashboard-build.log",
  "coverage/phase9-mobile-typecheck.txt",
  "coverage/phase9-static-contract.json",
  "coverage/phase9-notification-routes.json",
  "coverage/phase9-provider-webhook-routes.json",
  "coverage/phase9-booking-route-runtime-smoke.json",
  "coverage/phase9-deposit-route-runtime-smoke.json",
  "coverage/phase9-dashboard-template-smoke-redacted.json",
  "coverage/phase9-dashboard-message-smoke-redacted.json",
  "coverage/phase9-dashboard-provider-disabled.json",
  "coverage/phase9-mobile-notification-screen.json",
  "coverage/phase9-expo-simulator-notification-smoke.json",
  "coverage/phase9-expo-device-notification-smoke-redacted.json",
  "coverage/phase9-booking-to-notification-runtime-redacted.json",
  "coverage/phase9-provider-disabled-runtime-proof.json",
  "coverage/phase9-app-runtime-build-ci-evidence.json",
  "coverage/phase9-app-runtime-build-secret-safe-artifacts.json",
  "test-results/phase9-app-runtime-build",
] as const;

export const phase9AppRuntimeBuildRuntimeMatrix = [
  { id: "testing-typecheck", command: "pnpm --filter @inkroute/testing typecheck", artifact: "coverage/phase9-testing-package-typecheck.txt", status: "wired" },
  { id: "testing-tests", command: "pnpm --filter @inkroute/testing test", artifact: "coverage/phase9-testing-package-test.txt", status: "wired" },
  { id: "web-build", command: "pnpm --filter @inkroute/web build", artifact: "coverage/phase9-web-build.log", status: "build-gated" },
  { id: "dashboard-build", command: "pnpm --filter @inkroute/dashboard build", artifact: "coverage/phase9-dashboard-build.log", status: "build-gated" },
  { id: "mobile-typecheck", command: "pnpm --filter @inkroute/mobile typecheck", artifact: "coverage/phase9-mobile-typecheck.txt", status: "mobile-gated" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/phase9-app-runtime-build-static.test.ts", artifact: "coverage/phase9-static-contract.json", status: "wired" },
  { id: "notification-routes", command: "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts", artifact: "coverage/phase9-notification-routes.json", status: "route-gated" },
  { id: "provider-webhook-routes", command: "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts", artifact: "coverage/phase9-provider-webhook-routes.json", status: "route-gated" },
  { id: "booking-route-runtime-smoke", command: "pnpm vitest run apps/web/tests/booking-requests-contract.test.ts", artifact: "coverage/phase9-booking-route-runtime-smoke.json", status: "route-gated" },
  { id: "deposit-route-runtime-smoke", command: "pnpm vitest run apps/web/tests/payment-routes.test.ts", artifact: "coverage/phase9-deposit-route-runtime-smoke.json", status: "route-gated" },
  { id: "dashboard-template-smoke", command: "Playwright dashboard templates smoke test", artifact: "coverage/phase9-dashboard-template-smoke-redacted.json", status: "playwright-gated" },
  { id: "dashboard-message-smoke", command: "Playwright dashboard messages smoke test", artifact: "coverage/phase9-dashboard-message-smoke-redacted.json", status: "playwright-gated" },
  { id: "dashboard-provider-disabled", command: "dashboard provider-disabled runtime smoke", artifact: "coverage/phase9-dashboard-provider-disabled.json", status: "provider-disabled-gated" },
  { id: "mobile-notification-screen", command: "mobile notification screen smoke", artifact: "coverage/phase9-mobile-notification-screen.json", status: "mobile-gated" },
  { id: "expo-simulator", command: "Expo simulator notification screen smoke test", artifact: "coverage/phase9-expo-simulator-notification-smoke.json", status: "mobile-gated" },
  { id: "expo-device", command: "Expo device notification screen smoke test", artifact: "coverage/phase9-expo-device-notification-smoke-redacted.json", status: "mobile-gated" },
  { id: "booking-to-notification", command: "booking-to-notification runtime smoke with provider sends disabled", artifact: "coverage/phase9-booking-to-notification-runtime-redacted.json", status: "provider-disabled-gated" },
  { id: "provider-disabled-proof", command: "prove provider sends disabled or sandboxed during runtime smoke", artifact: "coverage/phase9-provider-disabled-runtime-proof.json", status: "provider-disabled-gated" },
  { id: "ci-phase9-gate", command: "GitHub Actions Phase 9 app runtime/build gate", artifact: "coverage/phase9-app-runtime-build-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review Phase 9 runtime/build artifacts for provider tokens, message bodies, PII, and secrets", artifact: "coverage/phase9-app-runtime-build-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly Phase9AppRuntimeBuildRuntimeMatrixEntry[];

export const phase9AppRuntimeBuildRuntimeReadiness = phase9AppRuntimeBuildContract;
export const phase9AppRuntimeBuildSurfaceIds = phase9AppRuntimeSurfaces.map((surface) => surface.id);
