import {
  buildTravelPublishMutationPlan,
  buildTravelPublishRuntimeReadinessPlan,
  type TravelPublishMutationAction,
  type TravelPublishMutationPlan,
  type TravelPublishMutationPlanInput,
  type TravelPublishMutationWrite,
  type TravelPublishRuntimeReadinessPlan,
} from "@inkroute/calendar";
import { demoTravelStops } from "@inkroute/config";
import type { TravelStop } from "@inkroute/types";

export type TravelPublishMutationInput = TravelPublishMutationPlanInput & {
  requestId: string;
};

export interface TravelPublishRepository {
  assertTenantArtistAccess(input: {
    tenantId: string;
    artistId: string;
    actorId: string;
    action: TravelPublishMutationAction;
  }): Promise<void>;
  loadPreviousStop(input: {
    tenantId: string;
    artistId: string;
    stopId: string;
  }): Promise<TravelStop | null>;
  findConsentedWaitlistClientIds(input: {
    tenantId: string;
    city: string;
    region: string;
    country: string;
  }): Promise<readonly string[]>;
  claimIdempotencyKey(input: {
    tenantId: string;
    key: string;
    action: TravelPublishMutationAction;
    requestId: string;
  }): Promise<"claimed" | "duplicate">;
  runTravelPublishTransaction(input: {
    tenantId: string;
    action: TravelPublishMutationAction;
    writes: readonly TravelPublishMutationWrite[];
    revalidationTags: readonly string[];
  }): Promise<void>;
  enqueuePostCommitEffects(input: {
    tenantId: string;
    action: TravelPublishMutationAction;
    revalidationTags: readonly string[];
    notificationJobCount: number;
  }): Promise<void>;
  rollbackFailedPublish(input: {
    tenantId: string;
    action: TravelPublishMutationAction;
    plan: TravelPublishMutationPlan;
    reason: string;
  }): Promise<void>;
}

export interface TravelPublishMutationResult {
  status: "ready" | "blocked" | "duplicate" | "rolled_back";
  plan: TravelPublishMutationPlan;
}

export interface DashboardTravelPublishContract {
  supportedActions: readonly TravelPublishMutationAction[];
  samplePlans: readonly TravelPublishMutationPlan[];
  readiness: TravelPublishRuntimeReadinessPlan;
}

const supportedActions = ["publish", "update", "unpublish", "rollback"] as const satisfies readonly TravelPublishMutationAction[];

const sampleStop = demoTravelStops[0] as TravelStop;
const previousSampleStop = {
  ...sampleStop,
  bookingStatus: "closed",
  publicNotes: "Previous travel snapshot for rollback.",
} satisfies TravelStop;

function buildSampleTravelPublishPlans(): TravelPublishMutationPlan[] {
  return supportedActions.map((action) =>
    buildTravelPublishMutationPlan({
      tenantId: sampleStop.tenantId,
      artistId: sampleStop.artistId,
      actorId: "operator_demo",
      action,
      stop: sampleStop,
      previousStop: action === "publish" ? undefined : previousSampleStop,
      idempotencyKey: `travel-publish-demo-${action}`,
      consentedWaitlistClientIds: ["client_demo_waitlist"],
      changedFieldNames: action === "publish" ? ["created"] : ["bookingStatus", "startsAt", "endsAt"],
      providerActionsSucceeded: action === "rollback" ? false : true,
      rollbackReason: action === "rollback" ? "Provider revalidation failed after publish." : undefined,
    }),
  );
}

export function buildDashboardTravelPublishReadiness(): TravelPublishRuntimeReadinessPlan {
  return buildTravelPublishRuntimeReadinessPlan({
    packageScripts: {
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    calendarTestsPassed: false,
    calendarTypecheckPassed: false,
    dashboardMutationRouteImplemented: true,
    dashboardAuthorizationEnforced: true,
    persistedTravelRepositoryImplemented: true,
    publicDataApiImplemented: false,
    cacheRevalidationCalledAfterCommit: true,
    cityWaitlistMatchingImplemented: true,
    consentFilteredNotificationQueueImplemented: true,
    notificationProviderQueueTested: false,
    mobileSyncTransportImplemented: true,
    dashboardSyncTransportImplemented: true,
    webSyncEventPersistenceConfigured: true,
    auditLogPersistenceConfigured: true,
    rollbackExecutorImplemented: true,
    failedProviderRollbackTested: false,
    tenantIsolationTestsPassed: false,
    e2eTravelPublishFlowPassed: false,
  });
}

export function buildDashboardTravelPublishContract(): DashboardTravelPublishContract {
  return {
    supportedActions,
    samplePlans: buildSampleTravelPublishPlans(),
    readiness: buildDashboardTravelPublishReadiness(),
  };
}

export async function executeTravelPublishMutation(
  input: TravelPublishMutationInput,
  repository: TravelPublishRepository,
): Promise<TravelPublishMutationResult> {
  await repository.assertTenantArtistAccess({
    tenantId: input.tenantId,
    artistId: input.artistId,
    actorId: input.actorId ?? "",
    action: input.action,
  });

  const previousStop = input.previousStop ?? await repository.loadPreviousStop({
    tenantId: input.tenantId,
    artistId: input.artistId,
    stopId: input.stop.id,
  }) ?? undefined;
  const consentedWaitlistClientIds = input.consentedWaitlistClientIds ?? await repository.findConsentedWaitlistClientIds({
    tenantId: input.tenantId,
    city: input.stop.city,
    region: input.stop.region,
    country: input.stop.country,
  });

  const plan = buildTravelPublishMutationPlan({
    ...input,
    previousStop,
    consentedWaitlistClientIds,
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

  try {
    await repository.runTravelPublishTransaction({
      tenantId: input.tenantId,
      action: input.action,
      writes: plan.writes,
      revalidationTags: plan.revalidationTags,
    });
    await repository.enqueuePostCommitEffects({
      tenantId: input.tenantId,
      action: input.action,
      revalidationTags: plan.revalidationTags,
      notificationJobCount: plan.notificationJobCount,
    });
  } catch (error) {
    await repository.rollbackFailedPublish({
      tenantId: input.tenantId,
      action: input.action,
      plan,
      reason: error instanceof Error ? error.message : "Unknown travel publish failure.",
    });
    return { status: "rolled_back", plan };
  }

  return { status: "ready", plan };
}

export const dashboardTravelPublishContract = buildDashboardTravelPublishContract();
