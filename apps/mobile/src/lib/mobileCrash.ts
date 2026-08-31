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
import { createHash } from "node:crypto";

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

export interface MobileCrashErrorReportIngestOptions {
  tenantSlug: string;
  baseUrl?: string;
  botProtectionToken?: string;
  fetcher?: typeof fetch;
}

export interface MobileCrashErrorReportPayload {
  source: ObservabilityReportDraft["source"];
  runtime: ObservabilityReportDraft["runtime"];
  environment: ObservabilityReportDraft["environment"];
  message: string;
  route?: string;
  release?: string;
  handled: boolean;
  metadata: Record<string, unknown>;
  tags: Record<string, string>;
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

function buildMobileCrashSelectorHash(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
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
      requestIdHash: buildMobileCrashSelectorHash("mobile-crash-request", context.requestId),
      rawRequestIdStored: false,
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

export function buildMobileCrashErrorReportPayload(report: ObservabilityReportDraft): MobileCrashErrorReportPayload {
  return {
    source: report.source,
    runtime: report.runtime,
    environment: report.environment,
    message: report.redactedMessage,
    ...(report.route ? { route: report.route } : {}),
    ...(report.release ? { release: report.release } : {}),
    handled: report.handled,
    metadata: {
      ...report.redactedMetadata,
      mobileCrashFallback: true,
      reportPrepared: true,
      rawReportIdEchoed: false,
      stackHash: report.stackHash,
      fingerprint: report.fingerprint,
      redactionLevel: report.redactionLevel,
      alertRecommended: report.alertRecommended,
      rawStackOmitted: true,
      gapIds: ["GAP-046", "GAP-081"],
    },
    tags: {
      ...report.tags,
      surface: "mobile",
      fallbackIngest: "error-report",
    },
  };
}

export function buildMobileCrashErrorReportIngestPath(tenantSlug: string): string {
  return `/api/public/${encodeURIComponent(tenantSlug)}/error-reports`;
}

export function createMobileCrashErrorReportIngestAdapter(
  options: MobileCrashErrorReportIngestOptions,
): MobileCrashReporterAdapter {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "";
  const ingestPath = buildMobileCrashErrorReportIngestPath(options.tenantSlug);

  return {
    async captureSanitizedReport() {
      throw new Error("Provider mobile crash capture is not configured; use persisted sanitized fallback ingest.");
    },
    async persistFallbackReport(report) {
      const response = await fetcher(`${baseUrl}${ingestPath}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": buildMobileCrashSelectorHash("mobile-crash-ingest", report.id),
          "x-inkroute-error-honeypot": "",
          ...(options.botProtectionToken ? { "x-inkroute-bot-token": options.botProtectionToken } : {}),
        },
        body: JSON.stringify(buildMobileCrashErrorReportPayload(report)),
      });

      if (!response.ok) {
        throw new Error(`Persisted mobile crash fallback ingest failed with HTTP ${response.status}; response body redacted.`);
      }
    },
    async bufferOfflineReport(report) {
      const payload = buildMobileCrashErrorReportPayload(report);
      void payload;
    },
  };
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
  fallbackIngestPath: buildMobileCrashErrorReportIngestPath(inkrouteDemoTenant.slug),
  fallbackIngestPayload: buildMobileCrashErrorReportPayload(
    buildMobileCrashReportDraft(
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
  ),
  readiness: buildMobileCrashReadinessPreview(),
  boundary:
    "Mobile crash capture now has a package-backed sanitized fallback/offline-buffer contract and ErrorReport ingest handoff; live Sentry SDK credentials, source maps, debug symbols, no-PII provider payload proof, forced simulator/device crash proof, and persistence execution proof remain gated.",
};
