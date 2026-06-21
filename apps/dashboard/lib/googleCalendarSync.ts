import {
  buildGoogleCalendarProviderSyncPlan,
  buildGoogleCalendarRuntimeReadinessPlan,
  type GoogleCalendarProviderSyncPlan,
  type GoogleCalendarRuntimeReadinessPlan,
  type GoogleCalendarSyncAction,
  type GoogleCalendarSyncPlanInput,
  type GoogleCalendarSyncWrite,
} from "@inkroute/calendar";

export type GoogleCalendarSyncMutationInput = GoogleCalendarSyncPlanInput & {
  requestId: string;
};

export interface GoogleCalendarProviderResult {
  providerCall: string;
  providerReference: string | null;
  nextSyncToken: string | null;
  redactedPayload: Record<string, unknown>;
}

export interface GoogleCalendarSyncRepository {
  assertTenantArtistConnection(input: {
    tenantId: string;
    artistId: string;
    calendarId: string;
    action: GoogleCalendarSyncAction;
  }): Promise<void>;
  loadEncryptedConnection(input: {
    tenantId: string;
    artistId: string;
    calendarId: string;
  }): Promise<{ refreshTokenEncrypted: boolean; requiredScopesGranted: boolean }>;
  claimIdempotencyKey(input: {
    tenantId: string;
    key: string;
    action: GoogleCalendarSyncAction;
    requestId: string;
  }): Promise<"claimed" | "duplicate">;
  runGoogleCalendarTransaction(input: {
    tenantId: string;
    action: GoogleCalendarSyncAction;
    writes: readonly GoogleCalendarSyncWrite[];
    providerResult: GoogleCalendarProviderResult | null;
  }): Promise<void>;
}

export interface InMemoryGoogleCalendarSyncRepositoryState {
  readonly authorizedConnectionKeys: Set<string>;
  readonly encryptedConnections: Map<string, { readonly refreshTokenEncrypted: boolean; readonly requiredScopesGranted: boolean }>;
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly action: GoogleCalendarSyncAction; readonly requestId: string }>;
  readonly transactions: {
    readonly tenantId: string;
    readonly action: GoogleCalendarSyncAction;
    readonly writes: readonly GoogleCalendarSyncWrite[];
    readonly providerResult: GoogleCalendarProviderResult | null;
  }[];
}

export interface GoogleCalendarSyncMutationResult {
  status: "ready" | "blocked" | "duplicate";
  plan: GoogleCalendarProviderSyncPlan;
  providerResult: GoogleCalendarProviderResult | null;
}

export interface DashboardGoogleCalendarSyncContract {
  supportedActions: readonly GoogleCalendarSyncAction[];
  samplePlans: readonly GoogleCalendarProviderSyncPlan[];
  readiness: GoogleCalendarRuntimeReadinessPlan;
}

const supportedActions = [
  "oauth_connect",
  "freebusy_check",
  "upsert_event",
  "delete_event",
  "incremental_sync",
  "full_resync",
  "renew_push_channel",
] as const satisfies readonly GoogleCalendarSyncAction[];

const sampleGoogleInput = {
  tenantId: "tenant_demo",
  artistId: "artist_demo",
  calendarId: "primary",
  occurredAt: "2026-06-09T12:00:00.000Z",
  oauthClientConfigured: true,
  requiredScopesGranted: true,
  refreshTokenEncrypted: true,
  providerWorkerEnabled: true,
  idempotencyKey: "google-calendar-demo",
  appointmentId: "appointment_demo",
  providerEventId: "google_event_demo_redacted",
  syncToken: "sync_token_demo_redacted",
  syncTokenInvalid: false,
  pushChannelId: "push_channel_demo",
  pushResourceId: "push_resource_demo_redacted",
  pushChannelExpiresAt: "2026-06-10T12:00:00.000Z",
  retryAttempt: 0,
} satisfies Omit<GoogleCalendarSyncPlanInput, "action">;

function buildSampleGoogleSyncPlans(): GoogleCalendarProviderSyncPlan[] {
  return supportedActions.map((action) =>
    buildGoogleCalendarProviderSyncPlan({
      ...sampleGoogleInput,
      action,
      idempotencyKey: `google-calendar-demo-${action}`,
    }),
  );
}

export function buildDashboardGoogleCalendarReadiness(): GoogleCalendarRuntimeReadinessPlan {
  return buildGoogleCalendarRuntimeReadinessPlan({
    packageScripts: {
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    calendarTestsPassed: false,
    calendarTypecheckPassed: false,
    googleSdkInstalled: false,
    oauthAppConfigured: false,
    oauthCallbackRouteImplemented: true,
    requiredScopesConfigured: true,
    encryptedTokenRepositoryImplemented: true,
    providerWorkerImplemented: true,
    freebusySmokeTested: false,
    eventInsertUpdateDeleteSmokeTested: false,
    fullSyncImplemented: true,
    incrementalSyncTokenPersisted: true,
    invalidSyncTokenFullResyncTested: false,
    pushChannelRenewalImplemented: true,
    pushWebhookHandlerImplemented: false,
    retryBackoffConfigured: true,
    idempotencyStoreConfigured: true,
    calendarAuditLogPersistenceConfigured: true,
    tenantIsolationTestsPassed: false,
    googleTestCalendarEvidenceAttached: false,
  });
}

export function buildDashboardGoogleCalendarSyncContract(): DashboardGoogleCalendarSyncContract {
  return {
    supportedActions,
    samplePlans: buildSampleGoogleSyncPlans(),
    readiness: buildDashboardGoogleCalendarReadiness(),
  };
}

const googleCalendarPrivateProviderKeys = new Set([
  "accessToken",
  "refreshToken",
  "authorization",
  "clientSecret",
  "providerEmail",
  "attendeeEmail",
  "calendarPrivateUrl",
]);

function redactGoogleCalendarProviderPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactGoogleCalendarProviderPayload(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        googleCalendarPrivateProviderKeys.has(key) ? "[redacted]" : redactGoogleCalendarProviderPayload(entry),
      ]),
    );
  }

  return value;
}

export function sanitizeGoogleCalendarProviderResult(
  result: GoogleCalendarProviderResult | null,
): GoogleCalendarProviderResult | null {
  if (!result) {
    return null;
  }

  return {
    providerCall: result.providerCall,
    providerReference: result.providerReference,
    nextSyncToken: result.nextSyncToken,
    redactedPayload: redactGoogleCalendarProviderPayload(result.redactedPayload) as Record<string, unknown>,
  };
}

function buildGoogleCalendarConnectionKey(input: {
  readonly tenantId: string;
  readonly artistId: string;
  readonly calendarId: string;
}): string {
  return `${input.tenantId}:${input.artistId}:${input.calendarId}`;
}

function buildGoogleCalendarActionKey(input: {
  readonly tenantId: string;
  readonly artistId: string;
  readonly calendarId: string;
  readonly action: GoogleCalendarSyncAction;
}): string {
  return `${buildGoogleCalendarConnectionKey(input)}:${input.action}`;
}

function buildGoogleCalendarIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `${input.tenantId}:${input.key}`;
}

export function createInMemoryGoogleCalendarSyncRepository(
  state: InMemoryGoogleCalendarSyncRepositoryState = {
    authorizedConnectionKeys: new Set(),
    encryptedConnections: new Map(),
    idempotencyKeys: new Map(),
    transactions: [],
  },
): GoogleCalendarSyncRepository & { readonly state: InMemoryGoogleCalendarSyncRepositoryState } {
  return {
    state,
    async assertTenantArtistConnection(input) {
      if (!state.authorizedConnectionKeys.has(buildGoogleCalendarActionKey(input))) {
        throw new Error("GOOGLE_CALENDAR_CONNECTION_ACCESS_DENIED");
      }
    },
    async loadEncryptedConnection(input) {
      return state.encryptedConnections.get(buildGoogleCalendarConnectionKey(input)) ?? {
        refreshTokenEncrypted: false,
        requiredScopesGranted: false,
      };
    },
    async claimIdempotencyKey(input) {
      const key = buildGoogleCalendarIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, {
          tenantId: input.tenantId,
          action: input.action,
          requestId: input.requestId,
        });
        return "claimed";
      }

      if (existing.action === input.action && existing.requestId === input.requestId) {
        return "duplicate";
      }

      throw new Error("GOOGLE_CALENDAR_IDEMPOTENCY_KEY_CONFLICT");
    },
    async runGoogleCalendarTransaction(input) {
      state.transactions.push({
        tenantId: input.tenantId,
        action: input.action,
        writes: input.writes,
        providerResult: input.providerResult,
      });
    },
  };
}

export async function executeGoogleCalendarSyncMutation(
  input: GoogleCalendarSyncMutationInput,
  repository: GoogleCalendarSyncRepository,
  executeProviderCall?: (plan: GoogleCalendarProviderSyncPlan) => Promise<GoogleCalendarProviderResult | null>,
): Promise<GoogleCalendarSyncMutationResult> {
  await repository.assertTenantArtistConnection({
    tenantId: input.tenantId,
    artistId: input.artistId,
    calendarId: input.calendarId,
    action: input.action,
  });

  const connection = await repository.loadEncryptedConnection({
    tenantId: input.tenantId,
    artistId: input.artistId,
    calendarId: input.calendarId,
  });

  const plan = buildGoogleCalendarProviderSyncPlan({
    ...input,
    requiredScopesGranted: input.requiredScopesGranted && connection.requiredScopesGranted,
    refreshTokenEncrypted: input.refreshTokenEncrypted && connection.refreshTokenEncrypted,
  });

  if (plan.status === "blocked" || !plan.idempotencyKey) {
    return { status: "blocked", plan, providerResult: null };
  }

  const idempotencyStatus = await repository.claimIdempotencyKey({
    tenantId: input.tenantId,
    key: plan.idempotencyKey,
    action: input.action,
    requestId: input.requestId,
  });

  if (idempotencyStatus === "duplicate") {
    return { status: "duplicate", plan, providerResult: null };
  }

  const providerResult = sanitizeGoogleCalendarProviderResult(executeProviderCall ? await executeProviderCall(plan) : null);

  await repository.runGoogleCalendarTransaction({
    tenantId: input.tenantId,
    action: input.action,
    writes: plan.writes,
    providerResult,
  });

  return { status: "ready", plan, providerResult };
}

export const dashboardGoogleCalendarSyncContract = buildDashboardGoogleCalendarSyncContract();
