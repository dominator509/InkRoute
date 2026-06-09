import {
  buildPhase9AppRuntimeBuildReadinessPlan,
  type Phase9AppRuntimeBuildReadinessPlan,
} from "@inkroute/testing";

export type Phase9RuntimeSurfaceId =
  | "testing-package"
  | "web-build"
  | "dashboard-build"
  | "mobile-typecheck"
  | "notification-routes"
  | "provider-webhook-routes"
  | "booking-route-runtime-smoke"
  | "deposit-route-runtime-smoke"
  | "dashboard-template-playwright-smoke"
  | "dashboard-message-playwright-smoke"
  | "dashboard-provider-disabled-state"
  | "mobile-notification-screen-smoke"
  | "expo-simulator-notification-smoke"
  | "expo-device-notification-smoke"
  | "booking-to-notification-runtime-smoke"
  | "phase9-runtime-artifacts";

export type Phase9RuntimeSurface = {
  id: Phase9RuntimeSurfaceId;
  command: string;
  artifacts: string[];
  providerPolicy: "disabled-or-sandboxed";
};

export const phase9AppRuntimeSurfaces: Phase9RuntimeSurface[] = [
  {
    id: "testing-package",
    command: "pnpm --filter @inkroute/testing test && pnpm --filter @inkroute/testing typecheck",
    artifacts: ["coverage/phase9-testing-package.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "web-build",
    command: "pnpm --filter @inkroute/web build",
    artifacts: ["coverage/phase9-web-build.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifacts: ["coverage/phase9-dashboard-build.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifacts: ["coverage/phase9-mobile-typecheck.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "notification-routes",
    command: "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
    artifacts: ["coverage/phase9-notification-routes.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "provider-webhook-routes",
    command: "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
    artifacts: ["coverage/phase9-provider-webhook-routes.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "booking-route-runtime-smoke",
    command: "pnpm vitest run apps/web/tests/booking-requests-contract.test.ts",
    artifacts: ["coverage/phase9-booking-route-runtime-smoke.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "deposit-route-runtime-smoke",
    command: "pnpm vitest run apps/web/tests/payment-routes.test.ts",
    artifacts: ["coverage/phase9-deposit-route-runtime-smoke.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "dashboard-template-playwright-smoke",
    command: "pnpm playwright test apps/dashboard/tests/template-smoke.spec.ts",
    artifacts: ["coverage/phase9-dashboard-template-smoke.json", "test-results/phase9-dashboard"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "dashboard-message-playwright-smoke",
    command: "pnpm playwright test apps/dashboard/tests/message-smoke.spec.ts",
    artifacts: ["coverage/phase9-dashboard-message-smoke.json", "test-results/phase9-dashboard"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "dashboard-provider-disabled-state",
    command: "pnpm playwright test apps/dashboard/tests/provider-disabled-notifications.spec.ts",
    artifacts: ["coverage/phase9-provider-disabled-dashboard.json", "test-results/phase9-dashboard"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "mobile-notification-screen-smoke",
    command: "pnpm --filter @inkroute/mobile test -- notifications",
    artifacts: ["coverage/phase9-mobile-notification-screen.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "expo-simulator-notification-smoke",
    command: "pnpm --filter @inkroute/mobile expo:notification-simulator-smoke",
    artifacts: ["coverage/phase9-expo-simulator-notification-smoke.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "expo-device-notification-smoke",
    command: "pnpm --filter @inkroute/mobile expo:notification-device-smoke",
    artifacts: ["coverage/phase9-expo-device-notification-smoke-redacted.json"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "booking-to-notification-runtime-smoke",
    command: "pnpm playwright test apps/web/tests/booking-to-notification-runtime.spec.ts",
    artifacts: ["coverage/phase9-booking-to-notification-runtime.json", "test-results/phase9-notifications"],
    providerPolicy: "disabled-or-sandboxed",
  },
  {
    id: "phase9-runtime-artifacts",
    command: "publish Phase 9 runtime/build artifacts from CI",
    artifacts: ["coverage/phase9-*.json", "test-results/phase9-notifications", "test-results/phase9-dashboard"],
    providerPolicy: "disabled-or-sandboxed",
  },
];

export const phase9RuntimeArtifactPaths = [
  "coverage/phase9-*.json",
  "coverage/phase9-*-redacted.json",
  "test-results/phase9-notifications",
  "test-results/phase9-dashboard",
  "test-results/phase9-mobile",
] as const;

export function buildPhase9AppRuntimeBuildContract(): Phase9AppRuntimeBuildReadinessPlan {
  return buildPhase9AppRuntimeBuildReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    testingPackageTestsPassed: false,
    testingPackageTypecheckPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    mobileTypecheckPassed: false,
    notificationRouteTestsPassed: false,
    providerWebhookRouteTestsPassed: false,
    bookingRouteRuntimeSmokePassed: false,
    depositRouteRuntimeSmokePassed: false,
    dashboardTemplatesPlaywrightSmokePassed: false,
    dashboardMessagesPlaywrightSmokePassed: false,
    dashboardProviderDisabledStatesVerified: false,
    mobileNotificationScreenSmokePassed: false,
    expoSimulatorNotificationSmokePassed: false,
    expoDeviceNotificationSmokePassed: false,
    bookingToNotificationRuntimeSmokePassed: false,
    providerSendsDisabledInRuntimeSmoke: true,
    runtimeArtifactsCaptured: false,
    ciRequiresPhase9AppRuntimeGate: true,
  });
}

export const phase9AppRuntimeBuildContract = buildPhase9AppRuntimeBuildContract();
