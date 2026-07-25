import { buildDomainEventAuditTransactionEvidencePlan, domainEventAuditTransactionRequiredCommands } from "@inkroute/booking";

export type DomainEventAuditRuntimeStatus =
  | "wired"
  | "transaction-gated"
  | "persistence-gated"
  | "idempotency-gated"
  | "denial-gated"
  | "ci-gated";

export interface DomainEventAuditRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DomainEventAuditRuntimeStatus;
}


export interface DomainEventAuditRunPersistenceContract {
  readonly prismaModel: "DomainEventAuditRun";
  readonly tenantRelation: "domainEventAuditRuns";
  readonly migration: "20260609034600_add_domain_event_audit_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesTransactionServiceEvidence: true;
  readonly storesRepositoryEvidence: true;
  readonly storesAtomicityEvidence: true;
  readonly storesEventAuditPersistenceEvidence: true;
  readonly storesIdempotencyReplayEvidence: true;
  readonly storesRollbackEvidence: true;
  readonly storesDenialEvidence: true;
  readonly storesDatabaseCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const domainEventAuditRunPersistenceContract = {
  prismaModel: "DomainEventAuditRun",
  tenantRelation: "domainEventAuditRuns",
  migration: "20260609034600_add_domain_event_audit_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesTransactionServiceEvidence: true,
  storesRepositoryEvidence: true,
  storesAtomicityEvidence: true,
  storesEventAuditPersistenceEvidence: true,
  storesIdempotencyReplayEvidence: true,
  storesRollbackEvidence: true,
  storesDenialEvidence: true,
  storesDatabaseCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies DomainEventAuditRunPersistenceContract;

export interface DomainEventAuditRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DomainEventAuditEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly transactionServiceEvidenceCaptured: boolean;
  readonly repositoryEvidenceCaptured: boolean;
  readonly atomicityEvidenceCaptured: boolean;
  readonly eventAuditPersistenceEvidenceCaptured: boolean;
  readonly idempotencyReplayEvidenceCaptured: boolean;
  readonly rollbackEvidenceCaptured: boolean;
  readonly denialEvidenceCaptured: boolean;
  readonly databaseCiEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly transactionReportPath?: string | null;
  readonly idempotencyReportPath?: string | null;
}

export interface DomainEventAuditRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: DomainEventAuditEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly transactionServiceEvidenceCaptured: boolean;
  readonly repositoryEvidenceCaptured: boolean;
  readonly atomicityEvidenceCaptured: boolean;
  readonly eventAuditPersistenceEvidenceCaptured: boolean;
  readonly idempotencyReplayEvidenceCaptured: boolean;
  readonly rollbackEvidenceCaptured: boolean;
  readonly denialEvidenceCaptured: boolean;
  readonly databaseCiEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly transactionReportPath: string | null;
  readonly idempotencyReportPath: string | null;
}

export interface DomainEventAuditRunRepository {
  readonly domainEventAuditRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: DomainEventAuditRunData;
      readonly update: Omit<DomainEventAuditRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildDomainEventAuditRunData(input: DomainEventAuditRunRecordInput): DomainEventAuditRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? domainEventAuditRuntimeCommands,
    artifactManifest: input.artifacts ?? domainEventAuditArtifactPaths,
    transactionServiceEvidenceCaptured: input.transactionServiceEvidenceCaptured,
    repositoryEvidenceCaptured: input.repositoryEvidenceCaptured,
    atomicityEvidenceCaptured: input.atomicityEvidenceCaptured,
    eventAuditPersistenceEvidenceCaptured: input.eventAuditPersistenceEvidenceCaptured,
    idempotencyReplayEvidenceCaptured: input.idempotencyReplayEvidenceCaptured,
    rollbackEvidenceCaptured: input.rollbackEvidenceCaptured,
    denialEvidenceCaptured: input.denialEvidenceCaptured,
    databaseCiEvidenceCaptured: input.databaseCiEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    transactionReportPath: input.transactionReportPath ?? null,
    idempotencyReportPath: input.idempotencyReportPath ?? null,
  };
}

export async function persistDomainEventAuditRun(
  repository: DomainEventAuditRunRepository,
  input: DomainEventAuditRunRecordInput,
): Promise<unknown> {
  const data = buildDomainEventAuditRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.domainEventAuditRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export type DomainEventAuditLifecycleKind = "booking" | "payment";

export interface DomainEventAuditLifecycleTransactionInput {
  readonly kind: DomainEventAuditLifecycleKind;
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly subjectId: string;
  readonly previousStatus: string | null;
  readonly nextStatus: string;
  readonly idempotencyKey: string;
  readonly rollbackReason?: string | null;
}

export interface DomainEventAuditLifecycleTransactionResult {
  readonly status: "committed" | "replayed";
  readonly kind: DomainEventAuditLifecycleKind;
  readonly nextStatus: string;
  readonly stateMutationPersisted: boolean;
  readonly bookingStateEventPersisted: boolean;
  readonly paymentAuditPersisted: boolean;
  readonly auditLogged: boolean;
  readonly internalPersistenceIdsStored: false;
}

export interface DomainEventAuditTransactionClient {
  readonly idempotencyKey: {
    findUnique(args: { where: { tenantId_scope_key: { tenantId: string; scope: string; key: string } }; select: { result: true } }): Promise<{ result: unknown } | null>;
    create(args: { data: { tenantId: string; scope: string; key: string; status: string; metadata: Record<string, unknown> } }): Promise<unknown>;
    update(args: { where: { tenantId_scope_key: { tenantId: string; scope: string; key: string } }; data: { status: string; result: DomainEventAuditLifecycleTransactionResult } }): Promise<unknown>;
  };
  readonly bookingRequest: {
    update(args: { where: { id: string; tenantId: string }; data: { status: string } }): Promise<unknown>;
  };
  readonly bookingStateEvent: {
    create(args: { data: { tenantId: string; bookingRequestId: string; actorUserId: string; type: string; fromStatus: string | null; toStatus: string; metadata: Record<string, unknown> } }): Promise<unknown>;
  };
  readonly payment: {
    update(args: { where: { id: string; tenantId: string }; data: { status: string } }): Promise<unknown>;
  };
  readonly paymentAuditLog: {
    create(args: { data: { tenantId: string; paymentId: string; actorUserId: string; action: string; metadata: Record<string, unknown> } }): Promise<unknown>;
  };
  readonly auditLog: {
    create(args: { data: { tenantId: string; actorUserId: string; action: string; entityType: string; entityId: string; metadata: Record<string, unknown> } }): Promise<unknown>;
  };
}

export interface DomainEventAuditTransactionRepository {
  readonly $transaction: <T>(callback: (tx: DomainEventAuditTransactionClient) => Promise<T>) => Promise<T>;
}

function isDomainEventAuditLifecycleTransactionResult(value: unknown): value is DomainEventAuditLifecycleTransactionResult {
  return Boolean(value && typeof value === "object" && "status" in value && "kind" in value && "nextStatus" in value);
}

function toDomainEventAuditLifecycleTransactionResult(
  value: DomainEventAuditLifecycleTransactionResult,
  status: DomainEventAuditLifecycleTransactionResult["status"],
): DomainEventAuditLifecycleTransactionResult {
  return {
    status,
    kind: value.kind,
    nextStatus: value.nextStatus,
    stateMutationPersisted: value.stateMutationPersisted === true,
    bookingStateEventPersisted: value.bookingStateEventPersisted === true,
    paymentAuditPersisted: value.paymentAuditPersisted === true,
    auditLogged: value.auditLogged === true,
    internalPersistenceIdsStored: false,
  };
}

export async function executeDomainEventAuditLifecycleTransaction(
  repository: DomainEventAuditTransactionRepository,
  input: DomainEventAuditLifecycleTransactionInput,
): Promise<DomainEventAuditLifecycleTransactionResult> {
  const scope = `domain-event-audit:${input.kind}`;

  return repository.$transaction(async (tx) => {
    const existing = await tx.idempotencyKey.findUnique({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope, key: input.idempotencyKey } },
      select: { result: true },
    });
    if (existing && isDomainEventAuditLifecycleTransactionResult(existing.result)) {
      return toDomainEventAuditLifecycleTransactionResult(existing.result, "replayed");
    }

    await tx.idempotencyKey.create({
      data: {
        tenantId: input.tenantId,
        scope,
        key: input.idempotencyKey,
        status: "claimed",
        metadata: {
          kind: input.kind,
          subjectMatched: true,
          rawSubjectIdStored: false,
          previousStatus: input.previousStatus,
          nextStatus: input.nextStatus,
        },
      },
    });

    if (input.kind === "booking") {
      await tx.bookingRequest.update({
        where: { id: input.subjectId, tenantId: input.tenantId },
        data: { status: input.nextStatus },
      });
      await tx.bookingStateEvent.create({
        data: {
          tenantId: input.tenantId,
          bookingRequestId: input.subjectId,
          actorUserId: input.actorUserId,
          type: "status_changed",
          fromStatus: input.previousStatus,
          toStatus: input.nextStatus,
          metadata: {
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            rollbackReason: input.rollbackReason ?? null,
          },
        },
      });
    } else {
      await tx.payment.update({
        where: { id: input.subjectId, tenantId: input.tenantId },
        data: { status: input.nextStatus },
      });
      await tx.paymentAuditLog.create({
        data: {
          tenantId: input.tenantId,
          paymentId: input.subjectId,
          actorUserId: input.actorUserId,
          action: "payment_status_changed",
          metadata: {
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
            previousStatus: input.previousStatus,
            nextStatus: input.nextStatus,
            rollbackReason: input.rollbackReason ?? null,
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: `${input.kind}:status_changed`,
        entityType: input.kind === "booking" ? "BookingRequest" : "Payment",
        entityId: input.subjectId,
        metadata: {
          idempotencyPersisted: true,
          rawIdempotencyKeyStored: false,
          internalPersistenceIdsStored: false,
          previousStatus: input.previousStatus,
          nextStatus: input.nextStatus,
          rollbackReason: input.rollbackReason ?? null,
        },
      },
    });

    const result: DomainEventAuditLifecycleTransactionResult = {
      status: "committed",
      kind: input.kind,
      nextStatus: input.nextStatus,
      stateMutationPersisted: true,
      bookingStateEventPersisted: input.kind === "booking",
      paymentAuditPersisted: input.kind === "payment",
      auditLogged: true,
      internalPersistenceIdsStored: false,
    };

    await tx.idempotencyKey.update({
      where: { tenantId_scope_key: { tenantId: input.tenantId, scope, key: input.idempotencyKey } },
      data: { status: "completed", result },
    });

    return result;
  });
}

export const domainEventAuditRuntimeCommands = domainEventAuditTransactionRequiredCommands;

export const domainEventAuditArtifactPaths = [
  "coverage/domain-event-audit-runtime.json",
  "coverage/domain-event-booking-typecheck.txt",
  "coverage/domain-event-booking-test.txt",
  "coverage/domain-event-payments-typecheck.txt",
  "coverage/domain-event-payments-test.txt",
  "coverage/domain-event-prisma-transactions-redacted.json",
  "coverage/domain-event-tenant-repositories.json",
  "coverage/domain-event-booking-atomicity.json",
  "coverage/domain-event-payment-atomicity.json",
  "coverage/domain-event-booking-state-events.json",
  "coverage/domain-event-audit-logs-redacted.json",
  "coverage/domain-event-payment-audit-logs-redacted.json",
  "coverage/domain-event-idempotency-persistence.json",
  "coverage/domain-event-idempotency-replay.json",
  "coverage/domain-event-provider-rollback.json",
  "coverage/domain-event-invalid-transition-denial.json",
  "coverage/domain-event-cross-tenant-denial.json",
  "coverage/domain-event-database-evidence-redacted.json",
  "coverage/domain-event-ci-evidence.json",
  "coverage/domain-event-secret-safe-artifacts.json",
  "test-results/domain-event-audit-runtime",
] as const;

export const domainEventAuditLocalArtifacts = [
  "coverage/domain-event-audit-runtime.json",
  "coverage/domain-event-booking-typecheck.txt",
  "coverage/domain-event-booking-test.txt",
  "coverage/domain-event-payments-typecheck.txt",
  "coverage/domain-event-payments-test.txt",
] as const;

export const domainEventAuditExternalArtifacts = [
  "coverage/domain-event-prisma-transactions-redacted.json",
  "coverage/domain-event-tenant-repositories.json",
  "coverage/domain-event-booking-atomicity.json",
  "coverage/domain-event-payment-atomicity.json",
  "coverage/domain-event-booking-state-events.json",
  "coverage/domain-event-audit-logs-redacted.json",
  "coverage/domain-event-payment-audit-logs-redacted.json",
  "coverage/domain-event-idempotency-persistence.json",
  "coverage/domain-event-idempotency-replay.json",
  "coverage/domain-event-provider-rollback.json",
  "coverage/domain-event-invalid-transition-denial.json",
  "coverage/domain-event-cross-tenant-denial.json",
  "coverage/domain-event-database-evidence-redacted.json",
  "coverage/domain-event-ci-evidence.json",
  "coverage/domain-event-secret-safe-artifacts.json",
  "test-results/domain-event-audit-runtime",
  "provider-backed DomainEventAuditRun persistence proof",
] as const;

export const domainEventAuditRuntimeProofFiles = [
  "packages/booking/package.json",
  "packages/payments/package.json",
  "packages/booking/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "packages/payments/src/index.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "apps/web/lib/domainEventAuditRuntime.ts",
  "apps/web/tests/domain-event-audit-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034600_add_domain_event_audit_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const domainEventAuditRuntimeMatrix = [
  {
    id: "booking-payment-package-gates",
    command: "pnpm --filter @inkroute/booking typecheck && pnpm --filter @inkroute/booking test && pnpm --filter @inkroute/payments typecheck && pnpm --filter @inkroute/payments test",
    artifact: "coverage/domain-event-booking-test.txt",
    status: "wired",
  },
  {
    id: "prisma-transaction-services",
    command: "booking/payment lifecycle Prisma transaction integration tests",
    artifact: "coverage/domain-event-prisma-transactions-redacted.json",
    status: "transaction-gated",
  },
  {
    id: "tenant-scoped-repositories",
    command: "tenant-scoped booking/payment repository integration tests",
    artifact: "coverage/domain-event-tenant-repositories.json",
    status: "transaction-gated",
  },
  {
    id: "state-event-audit-persistence",
    command: "booking/payment state, event, AuditLog, and PaymentAuditLog persistence tests",
    artifact: "coverage/domain-event-booking-state-events.json",
    status: "persistence-gated",
  },
  {
    id: "idempotency-and-replay",
    command: "booking/payment idempotency replay integration tests",
    artifact: "coverage/domain-event-idempotency-replay.json",
    status: "idempotency-gated",
  },
  {
    id: "provider-rollback-invalid-cross-tenant-denial",
    command: "provider failure rollback integration tests && cross-tenant lifecycle mutation denial tests",
    artifact: "coverage/domain-event-provider-rollback.json",
    status: "denial-gated",
  },
  {
    id: "database-ci-secret-safe-artifacts",
    command: "GitHub Actions domain event/audit transaction evidence job",
    artifact: "coverage/domain-event-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DomainEventAuditRuntimeMatrixEntry[];

export const domainEventAuditRuntimeControls = [
  "commit-state-event-audit-payment-audit-idempotency-in-one-tenant-transaction",
  "reject-invalid-transition-missing-tenant-actor-duplicate-idempotency-before-side-effects",
  "return-original-result-for-idempotency-replay-without-duplicate-writes",
  "record-provider-rollback-failure-audit-before-retry-or-exposure",
  "redact-client-medical-payment-provider-private-url-data-from-artifacts",
] as const;

export const domainEventAuditEvidenceFlags = [
  "bookingTestsPassed",
  "bookingTypecheckPassed",
  "paymentTestsPassed",
  "paymentTypecheckPassed",
  "prismaTransactionServicesImplemented",
  "tenantScopedRepositoriesImplemented",
  "bookingStateMutationAtomicityPassed",
  "paymentStateMutationAtomicityPassed",
  "bookingStateEventRowsPersisted",
  "auditLogRowsPersisted",
  "paymentAuditLogRowsPersisted",
  "idempotencyPersistenceEnforced",
  "replayedMutationReturnsOriginalResult",
  "providerRollbackIntegrationPassed",
  "invalidTransitionDenialPassed",
  "crossTenantMutationDenialPassed",
  "databaseIntegrationEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type DomainEventAuditEvidenceFlag = (typeof domainEventAuditEvidenceFlags)[number];

export interface DomainEventAuditEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<DomainEventAuditEvidenceFlag, boolean>>;
}

export interface DomainEventAuditEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly DomainEventAuditEvidenceFlag[];
  readonly requiredCommands: typeof domainEventAuditRuntimeCommands;
  readonly requiredArtifacts: typeof domainEventAuditArtifactPaths;
  readonly requiredControls: typeof domainEventAuditRuntimeControls;
  readonly requiredEvidence: typeof domainEventAuditEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface DomainEventAuditExecutionPlan {
  readonly localCommands: typeof domainEventAuditLocalCommands;
  readonly externalCommands: typeof domainEventAuditExternalCommands;
  readonly localArtifacts: typeof domainEventAuditLocalArtifacts;
  readonly externalArtifacts: typeof domainEventAuditExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerRollbackExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof domainEventAuditExecutionPolicy;
  readonly requiredExternalEvidence: typeof domainEventAuditRequiredExternalEvidence;
}

export interface DomainEventAuditArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof domainEventAuditRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const domainEventAuditLocalCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
] as const;

export const domainEventAuditExternalCommands = [
  "booking/payment lifecycle Prisma transaction integration tests",
  "booking/payment idempotency replay integration tests",
  "provider failure rollback integration tests",
  "cross-tenant lifecycle mutation denial tests",
  "GitHub Actions domain event/audit transaction evidence job",
  "provider-backed persistDomainEventAuditRun execution proof",
] as const;

const domainEventAuditEvidenceBlockers: Record<DomainEventAuditEvidenceFlag, string> = {
  bookingTestsPassed: "Booking package tests must pass.",
  bookingTypecheckPassed: "Booking package typecheck must pass.",
  paymentTestsPassed: "Payments package tests must pass.",
  paymentTypecheckPassed: "Payments package typecheck must pass.",
  prismaTransactionServicesImplemented: "Booking/payment lifecycle services must execute writes inside Prisma transactions.",
  tenantScopedRepositoriesImplemented: "Tenant-scoped booking/payment repositories must be implemented.",
  bookingStateMutationAtomicityPassed: "Booking state mutation atomicity tests must pass.",
  paymentStateMutationAtomicityPassed: "Payment state mutation atomicity tests must pass.",
  bookingStateEventRowsPersisted: "BookingStateEvent rows must persist atomically with booking state mutations.",
  auditLogRowsPersisted: "AuditLog rows must persist atomically with lifecycle mutations.",
  paymentAuditLogRowsPersisted: "PaymentAuditLog rows must persist atomically with payment lifecycle mutations.",
  idempotencyPersistenceEnforced: "Idempotency persistence must be enforced inside the lifecycle transaction.",
  replayedMutationReturnsOriginalResult: "Replayed lifecycle mutations must return the original committed result without duplicate writes.",
  providerRollbackIntegrationPassed: "Provider rollback integration tests must pass.",
  invalidTransitionDenialPassed: "Invalid lifecycle transitions must be denied before writes.",
  crossTenantMutationDenialPassed: "Cross-tenant lifecycle mutation denial tests must pass.",
  databaseIntegrationEvidenceCaptured: "Redacted database integration evidence must be captured.",
  ciEvidenceCaptured: "CI domain event/audit evidence must be captured.",
  secretSafeArtifactsCaptured: "Domain event/audit artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

export const domainEventAuditExecutionPolicy = {
  codexMayClassifyStaticDomainEventAuditReadiness: true,
  prismaTransactionEvidenceRequiredForClosure: true,
  idempotencyReplayEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const domainEventAuditRequiredExternalEvidence = [
  "Tenant-scoped Prisma transaction service evidence for booking and payment lifecycle mutations.",
  "Atomic BookingStateEvent, AuditLog, PaymentAuditLog, idempotency, state mutation, and repository evidence.",
  "Idempotency persistence and replay original-result evidence without duplicate writes.",
  "Provider rollback integration, invalid-transition denial, and cross-tenant mutation denial evidence.",
  "Provider-backed DomainEventAuditRun persistence row captured through persistDomainEventAuditRun.",
  "Redacted database, CI, and secret-safe domain event/audit artifacts.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveDomainEventAuditKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|tenant|user|client|actor|provider|database|postgres|url|uri|dsn|key|id|payload|artifact|audit|event|refund|deposit|booking|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitiveDomainEventAuditValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedDomainEventAuditValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedDomainEventAuditValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveDomainEventAuditKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedDomainEventAuditValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveDomainEventAuditValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildDomainEventAuditExecutionPlan(): DomainEventAuditExecutionPlan {
  return {
    localCommands: domainEventAuditLocalCommands,
    externalCommands: domainEventAuditExternalCommands,
    localArtifacts: domainEventAuditLocalArtifacts,
    externalArtifacts: domainEventAuditExternalArtifacts,
    commandExecutionAllowed: false,
    databaseExecutionAllowed: false,
    providerRollbackExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: domainEventAuditExecutionPolicy,
    requiredExternalEvidence: domainEventAuditRequiredExternalEvidence,
  };
}

export function buildRedactedDomainEventAuditArtifact(artifact: unknown): unknown {
  return buildRedactedDomainEventAuditValue(artifact, "", []);
}

export function buildDomainEventAuditArtifactReview(artifact: unknown): DomainEventAuditArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedDomainEventAuditValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: domainEventAuditRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildDomainEventAuditEvidenceDecision = (
  input: DomainEventAuditEvidenceInput,
): DomainEventAuditEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, domainEventAuditRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, domainEventAuditArtifactPaths);
  const missingControls = missingFrom(input.controls, domainEventAuditRuntimeControls);
  const missingEvidence = domainEventAuditEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => domainEventAuditEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: domainEventAuditRuntimeCommands,
    requiredArtifacts: domainEventAuditArtifactPaths,
    requiredControls: domainEventAuditRuntimeControls,
    requiredEvidence: domainEventAuditEvidenceFlags,
    blockers,
  };
};

export const domainEventAuditRuntimeReadiness = buildDomainEventAuditTransactionEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  bookingTestsPassed: false,
  bookingTypecheckPassed: false,
  paymentTestsPassed: false,
  paymentTypecheckPassed: false,
  prismaTransactionServicesImplemented: true,
  tenantScopedRepositoriesImplemented: true,
  bookingStateMutationAtomicityPassed: false,
  paymentStateMutationAtomicityPassed: false,
  bookingStateEventRowsPersisted: false,
  auditLogRowsPersisted: false,
  paymentAuditLogRowsPersisted: false,
  idempotencyPersistenceEnforced: false,
  replayedMutationReturnsOriginalResult: false,
  providerRollbackIntegrationPassed: false,
  invalidTransitionDenialPassed: false,
  crossTenantMutationDenialPassed: false,
  databaseIntegrationEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});



