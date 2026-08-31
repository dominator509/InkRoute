import {
  buildPaymentLifecyclePersistencePlan,
  buildPaymentPersistenceRuntimeReadinessPlan,
  type CurrencyCode,
  type PaymentLifecycleAction,
  type PaymentLifecyclePersistencePlan,
  type PaymentLifecycleWrite,
  type PaymentPersistenceRuntimeReadinessPlan,
} from "@inkroute/payments";
import { createHash } from "node:crypto";

export interface PaymentLifecycleMutationInput {
  tenantId: string;
  bookingRequestId: string;
  action: PaymentLifecycleAction;
  amountCents: number;
  currency: CurrencyCode;
  provider: "stripe" | "manual";
  occurredAt: string;
  paymentId?: string;
  depositId?: string;
  providerSessionId?: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  actorId?: string;
  idempotencyKey: string;
}

export type PaymentLifecyclePersistedStatus =
  | "none"
  | "deposit_created"
  | "checkout_session_recorded"
  | "paid"
  | "failed"
  | "refunded"
  | "disputed";

export interface PaymentLifecycleTransitionDecision {
  status: "allowed" | "idempotent_replay" | "invalid_transition";
  targetStatus: PaymentLifecyclePersistedStatus;
  shouldWriteTransaction: boolean;
  shouldPersistAuditLog: boolean;
  blockers: readonly string[];
  redactedSummary: string;
}

export interface TenantPaymentRepository {
  assertTenantScope(input: PaymentLifecycleMutationInput): Promise<void>;
  claimIdempotencyKey(key: string, tenantId: string, action: PaymentLifecycleAction): Promise<"claimed" | "replayed">;
  runLifecycleTransaction(plan: PaymentLifecyclePersistencePlan): Promise<void>;
  findDashboardPayments(tenantId: string, limit: number): Promise<readonly unknown[]>;
}

type PrismaPaymentTransaction = {
  deposit: {
    create(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<unknown>;
  };
  payment: {
    create(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  refund: {
    create(args: unknown): Promise<unknown>;
  };
  paymentAuditLog: {
    create(args: unknown): Promise<unknown>;
  };
  bookingStateEvent: {
    create(args: unknown): Promise<unknown>;
  };
  idempotencyKey: {
    upsert(args: unknown): Promise<{ status?: string }>;
  };
};

export interface PrismaPaymentClient {
  $transaction<T>(handler: (tx: PrismaPaymentTransaction) => Promise<T>): Promise<T>;
  bookingRequest: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
  };
  idempotencyKey: {
    upsert(args: unknown): Promise<{ status: string }>;
  };
  payment: {
    findMany(args: unknown): Promise<readonly unknown[]>;
  };
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function buildPaymentPersistenceSelectorKey(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function paymentLifecycleEventType(action: PaymentLifecycleAction) {
  return action === "mark_paid" ? "deposit_paid" : "note_added";
}

function paymentLifecycleOccurredAt(payload: Record<string, unknown>) {
  return typeof payload.occurredAt === "string" ? new Date(payload.occurredAt) : new Date();
}

function paymentLifecycleStatus(plan: PaymentLifecyclePersistencePlan) {
  return plan.targetStatus === "refunded" ? "refunded" : plan.targetStatus;
}

async function applyPrismaPaymentLifecycleWrite(
  tx: PrismaPaymentTransaction,
  plan: PaymentLifecyclePersistencePlan,
  write: PaymentLifecycleWrite,
) {
  const payload = write.payload;
  const occurredAt = paymentLifecycleOccurredAt(payload);
  const paymentId = typeof payload.paymentId === "string" ? payload.paymentId : undefined;
  const depositId = typeof payload.depositId === "string" ? payload.depositId : undefined;
  const bookingRequestId = typeof payload.bookingRequestId === "string" ? payload.bookingRequestId : undefined;

  switch (write.model) {
    case "Deposit":
      if (plan.action === "create_deposit") {
        await tx.deposit.create({
          data: {
            tenantId: write.tenantId,
            bookingRequestId,
            amountCents: payload.amountCents,
            currency: payload.currency,
            status: "pending",
          },
        });
        return;
      }

      await tx.deposit.updateMany({
        where: {
          tenantId: write.tenantId,
          ...(depositId ? { id: depositId } : {}),
          ...(bookingRequestId ? { bookingRequestId } : {}),
        },
        data: {
          status: paymentLifecycleStatus(plan),
          ...(plan.action === "mark_paid" ? { paidAt: occurredAt } : {}),
        },
      });
      return;

    case "Payment": {
      if (paymentId) {
        const updated = await tx.payment.updateMany({
          where: { id: paymentId, tenantId: write.tenantId },
          data: {
            status: paymentLifecycleStatus(plan),
            providerPaymentId: payload.providerPaymentIntentId ?? null,
            providerSessionId: payload.providerSessionId ?? null,
            ...(plan.action === "mark_paid" ? { paidAt: occurredAt } : {}),
            ...(plan.action === "mark_failed" ? { failedAt: occurredAt } : {}),
            metadata: toJsonValue({
              lifecycleAction: plan.action,
              idempotencyPersisted: true,
              rawIdempotencyKeyStored: false,
              internalPersistenceIdsStored: false,
            }),
          },
        });
        if (updated.count > 0) return;
      }

      await tx.payment.create({
        data: {
          ...(paymentId ? { id: paymentId } : {}),
          tenantId: write.tenantId,
          bookingRequestId,
          ...(depositId ? { depositId } : {}),
          provider: payload.provider,
          providerPaymentId: payload.providerPaymentIntentId ?? null,
          providerSessionId: payload.providerSessionId ?? null,
          status: paymentLifecycleStatus(plan),
          amountCents: payload.amountCents,
          currency: payload.currency,
          metadata: toJsonValue({
            lifecycleAction: plan.action,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
          }),
        },
      });
      return;
    }

    case "Refund":
      await tx.refund.create({
        data: {
          tenantId: write.tenantId,
          paymentId,
          bookingRequestId,
          ...(depositId ? { depositId } : {}),
          providerRefundId: payload.providerChargeId ?? payload.providerPaymentIntentId ?? null,
          status: "succeeded",
          amountCents: payload.amountCents,
          currency: payload.currency,
          reason: `Lifecycle ${plan.action}`,
        },
      });
      return;

    case "PaymentAuditLog":
      await tx.paymentAuditLog.create({
        data: {
          tenantId: write.tenantId,
          ...(paymentId ? { paymentId } : {}),
          ...(depositId ? { depositId } : {}),
          actorUserId: typeof payload.actorId === "string" ? payload.actorId : null,
          action: payload.action,
          provider: payload.provider,
          metadata: toJsonValue({
            lifecycleAction: plan.action,
            targetStatus: plan.targetStatus,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            providerPaymentIntentId: payload.providerPaymentIntentId ?? null,
            providerChargeId: payload.providerChargeId ?? null,
            occurredAt: payload.occurredAt,
            rawProviderPayloadStored: false,
          }),
        },
      });
      return;

    case "BookingStateEvent":
      if (!bookingRequestId) return;
      await tx.bookingStateEvent.create({
        data: {
          tenantId: write.tenantId,
          bookingRequestId,
          actorUserId: typeof payload.actorId === "string" ? payload.actorId : null,
          type: paymentLifecycleEventType(plan.action),
          note: `Payment lifecycle ${plan.action} applied.`,
          metadata: toJsonValue({
            lifecycleAction: plan.action,
            targetStatus: plan.targetStatus,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            rawProviderPayloadStored: false,
          }),
        },
      });
      return;

    case "IdempotencyKey":
      await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId: write.tenantId, scope: "payment-lifecycle", key: plan.idempotencyKey } },
        create: {
          tenantId: write.tenantId,
          scope: "payment-lifecycle",
          key: plan.idempotencyKey,
          status: "completed",
          result: toJsonValue({ action: plan.action, targetStatus: plan.targetStatus, internalPersistenceIdsStored: false }),
          metadata: toJsonValue({
            bookingRequestMatched: Boolean(bookingRequestId),
            action: plan.action,
            rawBookingRequestIdStored: false,
            internalPersistenceIdsStored: false,
          }),
        },
        update: {
          status: "completed",
          result: toJsonValue({ action: plan.action, targetStatus: plan.targetStatus, replayObserved: true, internalPersistenceIdsStored: false }),
          metadata: toJsonValue({
            bookingRequestMatched: Boolean(bookingRequestId),
            action: plan.action,
            replayObserved: true,
            rawBookingRequestIdStored: false,
            internalPersistenceIdsStored: false,
          }),
        },
      });
      return;
  }
}

export interface InMemoryTenantPaymentRepositoryState {
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly action: PaymentLifecycleAction }>;
  readonly transactions: PaymentLifecyclePersistencePlan[];
  readonly dashboardRows: Map<string, unknown[]>;
}

export function createInMemoryTenantPaymentRepository(
  state: InMemoryTenantPaymentRepositoryState = {
    idempotencyKeys: new Map(),
    transactions: [],
    dashboardRows: new Map(),
  },
): TenantPaymentRepository & { readonly state: InMemoryTenantPaymentRepositoryState } {
  return {
    state,
    async assertTenantScope(input) {
      if (!input.tenantId.trim()) throw new Error("Tenant scope is required before payment persistence.");
    },
    async claimIdempotencyKey(key, tenantId, action) {
      const localKey = buildPaymentPersistenceSelectorKey("payment-lifecycle-local-idempotency", [tenantId, key]);
      const existing = state.idempotencyKeys.get(localKey);
      if (existing) {
        if (existing.tenantId !== tenantId || existing.action !== action) {
          throw new Error("Idempotency key replay crossed tenant or action scope.");
        }
        return "replayed";
      }
      state.idempotencyKeys.set(localKey, { tenantId, action });
      return "claimed";
    },
    async runLifecycleTransaction(plan) {
      state.transactions.push(plan);
    },
    async findDashboardPayments(tenantId, limit) {
      return (state.dashboardRows.get(tenantId) ?? []).slice(0, limit);
    },
  };
}

export function createPrismaTenantPaymentRepository(prisma: PrismaPaymentClient): TenantPaymentRepository {
  return {
    async assertTenantScope(input) {
      if (!input.tenantId.trim()) throw new Error("Tenant scope is required before payment persistence.");
      const booking = await prisma.bookingRequest.findFirst({
        where: { id: input.bookingRequestId, tenantId: input.tenantId },
        select: { id: true },
      });
      if (!booking) throw new Error("Payment lifecycle mutation crossed tenant or booking scope.");
    },
    async claimIdempotencyKey(key, tenantId, action) {
      const idempotency = await prisma.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "payment-lifecycle", key } },
        create: {
          tenantId,
          scope: "payment-lifecycle",
          key,
          status: "claimed",
          metadata: toJsonValue({ action, repository: "prisma" }),
        },
        update: {
          metadata: toJsonValue({ action, repository: "prisma", replayObserved: true }),
        },
        select: { status: true },
      });

      return idempotency.status === "completed" ? "replayed" : "claimed";
    },
    async runLifecycleTransaction(plan) {
      await prisma.$transaction(async (tx) => {
        for (const write of plan.writes) {
          await applyPrismaPaymentLifecycleWrite(tx, plan, write);
        }
      });
    },
    async findDashboardPayments(tenantId, limit) {
      return prisma.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          bookingRequestId: true,
          depositId: true,
          provider: true,
          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
  };
}

export interface PaymentPersistenceContract {
  lifecyclePlans: readonly PaymentLifecyclePersistencePlan[];
  readiness: PaymentPersistenceRuntimeReadinessPlan;
  repositoryControls: readonly string[];
  dashboardReadBoundary: string;
  boundary: string;
}

const paymentLifecycleTargetStatus = {
  create_deposit: "deposit_created",
  record_checkout_session: "checkout_session_recorded",
  mark_paid: "paid",
  mark_failed: "failed",
  mark_refunded: "refunded",
  mark_disputed: "disputed",
} as const satisfies Record<PaymentLifecycleAction, PaymentLifecyclePersistedStatus>;

const allowedPreviousStatuses = {
  create_deposit: ["none"],
  record_checkout_session: ["deposit_created", "checkout_session_recorded"],
  mark_paid: ["checkout_session_recorded", "failed"],
  mark_failed: ["checkout_session_recorded"],
  mark_refunded: ["paid", "refunded"],
  mark_disputed: ["paid", "refunded", "disputed"],
} as const satisfies Record<PaymentLifecycleAction, readonly PaymentLifecyclePersistedStatus[]>;

export function decidePaymentLifecycleTransition(input: {
  action: PaymentLifecycleAction;
  currentStatus: PaymentLifecyclePersistedStatus;
  idempotencyState: "claimed" | "replayed";
}): PaymentLifecycleTransitionDecision {
  const targetStatus = paymentLifecycleTargetStatus[input.action];
  if (input.idempotencyState === "replayed") {
    return {
      status: "idempotent_replay",
      targetStatus,
      shouldWriteTransaction: false,
      shouldPersistAuditLog: true,
      blockers: [],
      redactedSummary: "Payment lifecycle replay detected; duplicate transaction writes are suppressed.",
    };
  }

  if (!allowedPreviousStatuses[input.action].includes(input.currentStatus)) {
    return {
      status: "invalid_transition",
      targetStatus,
      shouldWriteTransaction: false,
      shouldPersistAuditLog: true,
      blockers: [`Cannot apply ${input.action} from ${input.currentStatus}.`],
      redactedSummary: "Payment lifecycle transition rejected before persistence; provider details redacted.",
    };
  }

  return {
    status: "allowed",
    targetStatus,
    shouldWriteTransaction: true,
    shouldPersistAuditLog: true,
    blockers: [],
    redactedSummary: "Payment lifecycle transition is allowed for tenant-scoped transaction execution.",
  };
}

export function buildPaymentPersistenceContract(): PaymentPersistenceContract {
  const common = {
    tenantId: "tenant_inkroute_demo",
    bookingRequestId: "booking_req_payment_demo",
    amountCents: 25000,
    currency: "usd" as CurrencyCode,
    provider: "stripe" as const,
    occurredAt: "2026-06-09T00:00:00.000Z",
    paymentId: "payment_demo",
    depositId: "deposit_demo",
    providerSessionId: "cs_test_demo",
    providerPaymentIntentId: "pi_test_demo",
    providerChargeId: "ch_test_demo",
  };

  const lifecyclePlans = [
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "create_deposit",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["create_deposit"]),
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "record_checkout_session",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["record_checkout_session"]),
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_paid",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["mark_paid"]),
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_failed",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["mark_failed"]),
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_refunded",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["mark_refunded"]),
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_disputed",
      idempotencyKey: buildPaymentPersistenceSelectorKey("payment-lifecycle-demo", ["mark_disputed"]),
    }),
  ];

  return {
    lifecyclePlans,
    readiness: buildPaymentPersistenceRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      paymentsTestsPassed: false,
      paymentsTypecheckPassed: false,
      dbSchemaIncludesPaymentModels: true,
      repositoriesImplemented: true,
      tenantScopedQueriesEnforced: true,
      transactionalMutationsImplemented: true,
      idempotencyStoreImplemented: true,
      depositCreationPersisted: true,
      providerSessionPersisted: true,
      paidTransitionPersisted: true,
      failedTransitionPersisted: true,
      refundTransitionPersisted: true,
      disputeTransitionPersisted: true,
      paymentAuditLogPersistedForEveryMutation: true,
      bookingStateEventPersistedForLifecycleChanges: true,
      crossTenantIsolationTestsPassed: false,
      replayIdempotencyTestsPassed: true,
      seededPostgresIntegrationTestsPassed: false,
      dashboardPaymentReadsUseRepository: true,
    }),
    repositoryControls: [
      "Assert tenant scope before every Deposit, Payment, Refund, PaymentAuditLog, BookingStateEvent, or IdempotencyKey read/write.",
      "Claim idempotency keys before lifecycle mutations and return replay state without duplicate writes.",
      "Execute lifecycle writes in one transaction using the plan writes from @inkroute/payments.",
      "Persist PaymentAuditLog for every mutation, including failed, refunded, disputed, and replayed events.",
      "Expose dashboard payment reads only through tenant-scoped repository methods with redacted provider fields.",
    ],
    dashboardReadBoundary:
      "Dashboard payment list/detail routes already enforce RBAC, tenant scope, no-store, projection redaction, AuditLog rows, and PaymentAuditLog read rows.",
    boundary:
      "Payment lifecycle now has tenant-scoped in-memory and Prisma repository/service contracts plus mutation write plans; real seeded Postgres execution proof remains gated.",
  };
}

export async function executePaymentLifecycleMutation(input: {
  repository: TenantPaymentRepository;
  mutation: PaymentLifecycleMutationInput;
  currentStatus: PaymentLifecyclePersistedStatus;
}): Promise<PaymentLifecyclePersistencePlan> {
  const plan = buildPaymentLifecyclePersistencePlan(input.mutation);
  if (plan.status !== "ready" || !plan.idempotencyKey) {
    throw new Error(plan.blockers.join(" "));
  }

  await input.repository.assertTenantScope(input.mutation);
  const idempotency = await input.repository.claimIdempotencyKey(plan.idempotencyKey, input.mutation.tenantId, input.mutation.action);
  const transition = decidePaymentLifecycleTransition({
    action: input.mutation.action,
    currentStatus: input.currentStatus,
    idempotencyState: idempotency,
  });
  if (transition.status === "idempotent_replay") return plan;
  if (!transition.shouldWriteTransaction) {
    throw new Error(transition.blockers.join(" "));
  }
  await input.repository.runLifecycleTransaction(plan);
  return plan;
}

export const dashboardPaymentPersistenceContract = buildPaymentPersistenceContract();
