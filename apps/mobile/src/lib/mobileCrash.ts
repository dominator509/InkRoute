import {
  buildMobileCrashCaptureContract,
  buildMobileCrashRuntimeReadinessPlan,
  buildObservabilityReportDraft,
  buildSentrySdkConfigurationPlan,
  type MobileCrashRuntimeReadinessPlan,
  type ObservabilityEventInput,
  type ObservabilityReportDraft,
  type SentrySdkConfigurationPlan,
} from "@inkroute/observability";
import { inkrouteDemoTenant } from "@inkroute/config";

export interface MobileCrashCaptureContext {
  tenantId: string;
  release: string;
  environment: "development" | "preview" | "production" | "test";
  route: string;
  requestId: string;
  easChannel?: string;
  runtimeVersion?: string;
}

export interface MobileCrashReporterAdapter {
  captureSanitizedReport(report: ObservabilityReportDraft): Promise<void>;
  persistFallbackReport(report: ObservabilityReportDraft): Promise<void>;
  bufferOfflineReport(report: ObservabilityReportDraft): Promise<void>;
}

export interface MobileCrashCaptureResult {
  report: ObservabilityReportDraft;
  sentryPlan: SentrySdkConfigurationPlan;
  readiness: MobileCrashRuntimeReadinessPlan;
  externalCaptureAttempted: boolean;
  externalCaptureSucceeded: boolean;
  externalCaptureErrorRedacted: string | null;
  fallbackPersisted: boolean;
  offlineBuffered: boolean;
}

function redactMobileCrashCaptureError(error: unknown): string {
  if (error instanceof Error && error.name.trim()) {
    return `External mobile crash capture failed with ${error.name}; provider response, payload, and credentials redacted.`;
  }

  return "External mobile crash capture failed; provider response, payload, and credentials redacted.";
}

export function buildMobileCrashReportDraft(
  error: Error,
  context: MobileCrashCaptureContext,
  metadata: Record<string, unknown> = {},
): ObservabilityReportDraft {
  const input: ObservabilityEventInput = {
    tenantId: context.tenantId,
    source: "mobile",
    runtime: "react-native",
    environment: context.environment,
    handled: false,
    message: error.message,
    stack: error.stack,
    route: context.route,
    release: context.release,
    metadata: {
      ...metadata,
      requestId: context.requestId,
      easChannel: context.easChannel ?? "unknown",
      runtimeVersion: context.runtimeVersion ?? "unknown",
    },
    tags: {
      surface: "mobile",
      release: context.release,
      environment: context.environment,
    },
  };

  return buildObservabilityReportDraft(input);
}

export function buildMobileSentryPlan(context: MobileCrashCaptureContext): SentrySdkConfigurationPlan {
  return buildSentrySdkConfigurationPlan({
    surface: "mobile-expo",
    dsnConfigured: false,
    authTokenConfigured: false,
    orgConfigured: false,
    projectConfigured: false,
    release: context.release,
    environment: context.environment,
    sourceMapsEnabled: false,
    debugSymbolsEnabled: false,
    beforeSendRedactionEnabled: true,
    tenantTaggingEnabled: true,
  });
}

export function buildMobileCrashReadinessPreview(): MobileCrashRuntimeReadinessPlan {
  return buildMobileCrashRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityTestsPassed: false,
    observabilityTypecheckPassed: false,
    mobileTypecheckPassed: false,
    sentryExpoSdkConfigured: false,
    fallbackReporterConfigured: true,
    sentryDsnConfigured: false,
    releaseTagsConfigured: true,
    beforeSendRedactionConfigured: true,
    piiRedactionTestsPassed: false,
    sourceMapsUploaded: false,
    debugSymbolsUploaded: false,
    forcedCrashSimulatorVerified: false,
    forcedCrashDeviceVerified: false,
    errorReportPersistenceConfigured: false,
    sanitizedDashboardSyncVerified: false,
    offlineCrashBufferingVerified: false,
    noPiiProviderPayloadVerified: false,
  });
}

export async function captureMobileCrash(input: {
  error: Error;
  context: MobileCrashCaptureContext;
  adapter: MobileCrashReporterAdapter;
  online: boolean;
  metadata?: Record<string, unknown>;
}): Promise<MobileCrashCaptureResult> {
  const report = buildMobileCrashReportDraft(input.error, input.context, input.metadata);
  const sentryPlan = buildMobileSentryPlan(input.context);
  const readiness = buildMobileCrashReadinessPreview();

  if (!input.online) {
    await input.adapter.bufferOfflineReport(report);
    return {
      report,
      sentryPlan,
      readiness,
      externalCaptureAttempted: false,
      externalCaptureSucceeded: false,
      externalCaptureErrorRedacted: null,
      fallbackPersisted: false,
      offlineBuffered: true,
    };
  }

  const canUseExternalCapture = sentryPlan.status === "ready" && report.redactionLevel !== "blocked_high_risk_payload";
  let externalCaptureSucceeded = false;
  let externalCaptureErrorRedacted: string | null = null;

  if (canUseExternalCapture) {
    try {
      await input.adapter.captureSanitizedReport(report);
      externalCaptureSucceeded = true;
    } catch (error) {
      externalCaptureErrorRedacted = redactMobileCrashCaptureError(error);
    }
  }

  await input.adapter.persistFallbackReport(report);

  return {
    report,
    sentryPlan,
    readiness,
    externalCaptureAttempted: canUseExternalCapture,
    externalCaptureSucceeded,
    externalCaptureErrorRedacted,
    fallbackPersisted: true,
    offlineBuffered: false,
  };
}

export const mobileCrashCapturePreview = {
  contract: buildMobileCrashCaptureContract({
    fallbackReporterConfigured: true,
    offlineBufferConfigured: true,
    beforeSendRedactionConfigured: true,
    sourceMapsUploaded: false,
    debugSymbolsUploaded: false,
    forcedCrashProofCaptured: false,
    providerPayloadNoPiiVerified: false,
  }),
  report: buildMobileCrashReportDraft(
    new Error("Expo crash from artist@example.test with auth token demo-token and payment card 4242 4242 4242 4242"),
    {
      tenantId: inkrouteDemoTenant.id,
      release: "mobile-preview-0.1.0",
      environment: "preview",
      route: "SystemStatusScreen",
      requestId: "mobile_crash_preview",
      easChannel: "preview",
      runtimeVersion: "0.1.0",
    },
    {
      clientEmail: "artist@example.test",
      medicalNote: "sensitive medical context",
      pushToken: "ExponentPushToken[demo-token]",
      privateFileUrl: "signed-upload-url-redacted",
    },
  ),
  sentryPlan: buildMobileSentryPlan({
    tenantId: inkrouteDemoTenant.id,
    release: "mobile-preview-0.1.0",
    environment: "preview",
    route: "SystemStatusScreen",
    requestId: "mobile_crash_preview",
    easChannel: "preview",
    runtimeVersion: "0.1.0",
  }),
  readiness: buildMobileCrashReadinessPreview(),
  boundary:
    "Mobile crash capture now has a package-backed sanitized fallback/offline-buffer contract; live Sentry SDK credentials, source maps, debug symbols, no-PII provider payload proof, and forced simulator/device crash proof remain gated.",
};
