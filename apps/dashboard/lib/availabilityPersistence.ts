import {
  buildAvailabilityPersistencePlan,
  buildAvailabilityRuntimeReadinessPlan,
  type AvailabilityPersistenceAction,
  type AvailabilityPersistencePlan,
  type AvailabilityPersistencePlanInput,
  type AvailabilityPersistenceWrite,
  type AvailabilityRuntimeReadinessPlan,
} from "@inkroute/calendar";

export type AvailabilityMutationInput = AvailabilityPersistencePlanInput & {
  requestId: string;
};

export interface AvailabilityConflictLookupInput {
  tenantId: string;
  artistId: string;
  startsAt: string;
  endsAt: string;
  availabilityWindowId?: string;
  holdId?: string;
}

export interface AvailabilityRepository {
  assertTenantArtistAccess(input: {
    tenantId: string;
    artistId: string;
    actorId: string;
    action: AvailabilityPersistenceAction;
  }): Promise<void>;
  claimIdempotencyKey(input: {
    tenantId: string;
    key: string;
    action: AvailabilityPersistenceAction;
    requestId: string;
  }): Promise<"claimed" | "duplicate">;
  findPersistedConflictIds(input: AvailabilityConflictLookupInput): Promise<readonly string[]>;
  findExistingHoldIds(input: AvailabilityConflictLookupInput): Promise<readonly string[]>;
  runAvailabilityTransaction(input: {
    tenantId: string;
    action: AvailabilityPersistenceAction;
    writes: readonly AvailabilityPersistenceWrite[];
  }): Promise<void>;
}

export interface InMemoryAvailabilityRepositoryState {
  readonly authorizedActorKeys: Set<string>;
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly action: AvailabilityPersistenceAction; readonly requestId: string }>;
  readonly persistedConflictIds: Map<string, readonly string[]>;
  readonly existingHoldIds: Map<string, readonly string[]>;
  readonly transactions: {
    readonly tenantId: string;
    readonly action: AvailabilityPersistenceAction;
    readonly writes: readonly AvailabilityPersistenceWrite[];
  }[];
}

export interface AvailabilityMutationResult {
  status: "ready" | "blocked" | "duplicate";
  plan: AvailabilityPersistencePlan;
}

export interface DashboardAvailabilityPersistenceContract {
  supportedActions: readonly AvailabilityPersistenceAction[];
  samplePlans: readonly AvailabilityPersistencePlan[];
  readiness: AvailabilityRuntimeReadinessPlan;
}

const supportedActions = [
  "create_availability_window",
  "create_slot_hold",
  "confirm_appointment",
  "release_slot_hold",
] as const satisfies readonly AvailabilityPersistenceAction[];

const sampleAvailabilityInput = {
  tenantId: "tenant_demo",
  artistId: "artist_demo",
  startsAt: "2026-06-10T16:00:00.000Z",
  endsAt: "2026-06-10T18:00:00.000Z",
  timezone: "America/Los_Angeles",
  actorId: "operator_demo",
  bookingRequestId: "booking_demo",
  availabilityWindowId: "availability_window_demo",
  holdId: "availability_hold_demo",
  appointmentId: "appointment_demo",
  idempotencyKey: "availability-demo",
  conflictIds: [],
  existingHoldIds: [],
} satisfies Omit<AvailabilityPersistencePlanInput, "action">;

function buildSampleAvailabilityPlans(): AvailabilityPersistencePlan[] {
  return supportedActions.map((action) =>
    buildAvailabilityPersistencePlan({
      ...sampleAvailabilityInput,
      action,
      idempotencyKey: `availability-demo-${action}`,
    }),
  );
}

export function buildDashboardAvailabilityReadiness(): AvailabilityRuntimeReadinessPlan {
  return buildAvailabilityRuntimeReadinessPlan({
    packageScripts: {
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    calendarTestsPassed: false,
    calendarTypecheckPassed: false,
    dbSchemaIncludesAvailabilityModels: true,
    repositoriesImplemented: true,
    tenantScopedQueriesEnforced: true,
    transactionalWindowCreationImplemented: true,
    transactionalSlotHoldImplemented: true,
    appointmentConfirmationImplemented: true,
    holdReleaseImplemented: true,
    auditLogPersistenceConfigured: true,
    idempotencyStoreConfigured: true,
    conflictDetectionAgainstPersistedRows: true,
    concurrentHoldProtectionConfigured: true,
    overlappingSlotDbRejectionTested: false,
    crossTenantIsolationTestsPassed: false,
    seededPostgresIntegrationTestsPassed: false,
    dashboardAndApiUseRepository: true,
  });
}

export function buildDashboardAvailabilityPersistenceContract(): DashboardAvailabilityPersistenceContract {
  return {
    supportedActions,
    samplePlans: buildSampleAvailabilityPlans(),
    readiness: buildDashboardAvailabilityReadiness(),
  };
}

function buildAvailabilityAccessKey(input: {
  readonly tenantId: string;
  readonly artistId: string;
  readonly actorId: string;
  readonly action: AvailabilityPersistenceAction;
}): string {
  return `${input.tenantId}:${input.artistId}:${input.actorId}:${input.action}`;
}

function buildAvailabilityLookupKey(input: {
  readonly tenantId: string;
  readonly artistId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}): string {
  return `${input.tenantId}:${input.artistId}:${input.startsAt}:${input.endsAt}`;
}

function buildAvailabilityIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `${input.tenantId}:${input.key}`;
}

export function createInMemoryAvailabilityRepository(
  state: InMemoryAvailabilityRepositoryState = {
    authorizedActorKeys: new Set(),
    idempotencyKeys: new Map(),
    persistedConflictIds: new Map(),
    existingHoldIds: new Map(),
    transactions: [],
  },
): AvailabilityRepository & { readonly state: InMemoryAvailabilityRepositoryState } {
  return {
    state,
    async assertTenantArtistAccess(input) {
      if (!state.authorizedActorKeys.has(buildAvailabilityAccessKey(input))) {
        throw new Error("AVAILABILITY_TENANT_ARTIST_ACCESS_DENIED");
      }
    },
    async claimIdempotencyKey(input) {
      const key = buildAvailabilityIdempotencyKey(input);
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

      throw new Error("AVAILABILITY_IDEMPOTENCY_KEY_CONFLICT");
    },
    async findPersistedConflictIds(input) {
      return state.persistedConflictIds.get(buildAvailabilityLookupKey(input)) ?? [];
    },
    async findExistingHoldIds(input) {
      return state.existingHoldIds.get(buildAvailabilityLookupKey(input)) ?? [];
    },
    async runAvailabilityTransaction(input) {
      state.transactions.push({
        tenantId: input.tenantId,
        action: input.action,
        writes: input.writes,
      });
    },
  };
}

export async function executeAvailabilityMutation(
  input: AvailabilityMutationInput,
  repository: AvailabilityRepository,
): Promise<AvailabilityMutationResult> {
  await repository.assertTenantArtistAccess({
    tenantId: input.tenantId,
    artistId: input.artistId,
    actorId: input.actorId ?? "",
    action: input.action,
  });

  const conflictIds = await repository.findPersistedConflictIds(input);
  const existingHoldIds = input.action === "create_slot_hold"
    ? await repository.findExistingHoldIds(input)
    : [];

  const plan = buildAvailabilityPersistencePlan({
    ...input,
    conflictIds,
    existingHoldIds,
  });

  if (plan.status === "blocked" || !plan.idempotencyKey) {
    return { status: "blocked", plan };
  }

  const idempotencyStatus = await repository.claimIdempotencyKey({
    tenantId: input.tenantId,
    key: plan.idempotencyKey,
    action: input.action,
    requestId: input.requestId,
  });

  if (idempotencyStatus === "duplicate") {
    return { status: "duplicate", plan };
  }

  await repository.runAvailabilityTransaction({
    tenantId: input.tenantId,
    action: input.action,
    writes: plan.writes,
  });

  return { status: "ready", plan };
}

export const dashboardAvailabilityPersistenceContract = buildDashboardAvailabilityPersistenceContract();
