import {
  buildMobileDeviceQaChecklist,
  buildMobileDeviceQaRuntimeReadinessPlan,
  mobileScreenRegistry,
  summarizeMobileDeviceQa,
  type MobileScreenId,
} from "@inkroute/mobile-support";

export interface MobileScreenRenderContract {
  screenId: MobileScreenId;
  componentName: string;
  staticEvidence: string;
  runtimeEvidence: string;
  deviceEvidenceRequired: boolean;
}

export interface MobileQaExecutionContract {
  screens: readonly MobileScreenRenderContract[];
  checklistIds: readonly string[];
  runtimeReadiness: ReturnType<typeof buildMobileDeviceQaRuntimeReadinessPlan>;
  blockingItemIds: readonly string[];
  artifactPolicy: readonly string[];
  boundary: string;
}

export const mobileScreenRenderContracts: readonly MobileScreenRenderContract[] = [
  { screenId: "auth", componentName: "AuthScreen", staticEvidence: "Auth route is rendered by App.tsx switch.", runtimeEvidence: "Signed-out, expired, and biometric-locked render smoke.", deviceEvidenceRequired: true },
  { screenId: "home", componentName: "HomeScreen", staticEvidence: "Home route is rendered by App.tsx switch.", runtimeEvidence: "Dashboard summary and API sync contract render smoke.", deviceEvidenceRequired: false },
  { screenId: "bookings", componentName: "BookingRequestsScreen", staticEvidence: "Booking route is rendered by App.tsx switch.", runtimeEvidence: "Booking API sync and action-disabled state render smoke.", deviceEvidenceRequired: false },
  { screenId: "appointments", componentName: "AppointmentsScreen", staticEvidence: "Appointments route is rendered by App.tsx switch.", runtimeEvidence: "Calendar list render smoke.", deviceEvidenceRequired: false },
  { screenId: "clients", componentName: "ClientsScreen", staticEvidence: "Clients route is rendered by App.tsx switch.", runtimeEvidence: "Client privacy boundary render smoke.", deviceEvidenceRequired: false },
  { screenId: "travel", componentName: "TravelUpdateScreen", staticEvidence: "Travel route is rendered by App.tsx switch.", runtimeEvidence: "Travel publishing boundary render smoke.", deviceEvidenceRequired: false },
  { screenId: "portfolio", componentName: "PortfolioUploadScreen", staticEvidence: "Portfolio route is rendered by App.tsx switch.", runtimeEvidence: "Upload metadata boundary render smoke.", deviceEvidenceRequired: false },
  { screenId: "notifications", componentName: "NotificationsScreen", staticEvidence: "Notifications route is rendered by App.tsx switch.", runtimeEvidence: "Push registration/delivery/tap contract render smoke.", deviceEvidenceRequired: true },
  { screenId: "offline", componentName: "OfflineNotesScreen", staticEvidence: "Offline route is rendered by App.tsx switch.", runtimeEvidence: "Offline queue/reconnect contract render smoke.", deviceEvidenceRequired: true },
  { screenId: "system", componentName: "SystemStatusScreen", staticEvidence: "System route is rendered by App.tsx switch.", runtimeEvidence: "Crash and OTA contract render smoke.", deviceEvidenceRequired: true },
];

export function buildMobileQaExecutionContract(): MobileQaExecutionContract {
  const checklist = buildMobileDeviceQaChecklist();
  const summary = summarizeMobileDeviceQa(checklist);
  const registryIds = mobileScreenRegistry.map((screen) => screen.id);
  const screens = mobileScreenRenderContracts.filter((contract) => registryIds.includes(contract.screenId));

  return {
    screens,
    checklistIds: checklist.map((item) => item.id),
    runtimeReadiness: buildMobileDeviceQaRuntimeReadinessPlan({
      packageScripts: {
        test: "vitest run apps/mobile/tests/**/*.test.ts",
        typecheck: "tsc --noEmit",
        ios: "expo start --ios",
        android: "expo start --android",
      },
      mobileSupportTestsPassed: false,
      mobileSupportTypecheckPassed: false,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: false,
      expoComponentRenderTestsPassed: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceSmokePassed: false,
      accessibilityChecksPassed: false,
      offlineQaPassed: false,
      pushQaPassed: false,
      crashQaPassed: false,
      otaRollbackQaPassed: false,
      qaManifestSynced: true,
      ciHooksConfigured: false,
      qaArtifactsAttached: false,
    }),
    blockingItemIds: summary.blockingItemIds,
    artifactPolicy: [
      "Keep screenshots, simulator logs, provider receipts, and device transcripts free of secrets, PII, medical details, payment data, and raw push tokens.",
      "Attach one artifact bundle per checklist id and keep GAP-048/GAP-108 references in the manifest.",
      "Do not mark mobile runtime QA ready until iOS, Android, physical-device, accessibility, offline, push, crash, and OTA artifacts are all present.",
    ],
    boundary:
      "Mobile QA now has an app-side execution contract mapping every registered screen to static, runtime, and device evidence slots; actual simulator/device artifacts remain gated.",
  };
}

export const mobileQaExecutionPreview = buildMobileQaExecutionContract();
