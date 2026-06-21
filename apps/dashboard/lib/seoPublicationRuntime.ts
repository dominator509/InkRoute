import { buildSeoPublicationRuntimeReadinessPlan } from "@inkroute/seo";

export type SeoPublicationRuntimeStatus =
  | "wired"
  | "repository-gated"
  | "association-gated"
  | "idempotency-gated"
  | "revalidation-gated"
  | "integration-gated"
  | "browser-gated"
  | "ci-gated";

export interface SeoPublicationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeoPublicationRuntimeStatus;
}

export type SeoPublicationLocalModel = "SeoCityPage" | "SeoStylePage" | "SeoRedirect";
export type SeoPublicationLocalAction = "create" | "update" | "publish" | "archive";

export interface SeoPublicationLocalMutation {
  readonly tenantId: string;
  readonly actorId: string;
  readonly model: SeoPublicationLocalModel;
  readonly action: SeoPublicationLocalAction;
  readonly entityId: string;
  readonly idempotencyKey: string;
  readonly revalidationTags: readonly string[];
  readonly relatedFaqIds?: readonly string[];
  readonly relatedReviewIds?: readonly string[];
  readonly relatedImageIds?: readonly string[];
}

export interface SeoPublicationLocalRepositorySnapshot {
  readonly idempotencyKeys: readonly string[];
  readonly entities: readonly { tenantId: string; model: SeoPublicationLocalModel; entityId: string; action: SeoPublicationLocalAction }[];
  readonly revalidationJobs: readonly { tenantId: string; entityId: string; tags: readonly string[] }[];
  readonly associations: readonly { tenantId: string; entityId: string; kind: "faq" | "review" | "image"; relatedId: string }[];
  readonly auditLogs: readonly { tenantId: string; actorId: string; entityId: string; action: string; metadata: Record<string, unknown> }[];
}

export interface SeoPublicationLocalRepository {
  claimIdempotencyKey(input: { tenantId: string; key: string }): "claimed" | "duplicate";
  persistMutation(input: SeoPublicationLocalMutation): void;
  persistRevalidationJob(input: SeoPublicationLocalMutation): void;
  persistAssociations(input: SeoPublicationLocalMutation): void;
  persistAuditLog(input: SeoPublicationLocalMutation): void;
  snapshot(): SeoPublicationLocalRepositorySnapshot;
}

export interface SeoPublicationArtifactReview {
  readonly status: "passed" | "blocked";
  readonly redactedArtifacts: readonly unknown[];
  readonly blockers: readonly string[];
}

export interface SeoPublicationExecutionPolicy {
  readonly codexMayClassifyStaticSeoPublicationReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly seededPrismaRequiredForClosure: boolean;
  readonly tenantIsolationRequiredForClosure: boolean;
  readonly durableIdempotencyRequiredForClosure: boolean;
  readonly durableRevalidationRequiredForClosure: boolean;
  readonly durableAssociationPersistenceRequiredForClosure: boolean;
  readonly dashboardBrowserFlowsRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface SeoPublicationExecutionPlan {
  readonly policy: typeof seoPublicationExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly seededPrismaExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly idempotencyExecutionAllowed: false;
  readonly revalidationExecutionAllowed: false;
  readonly associationExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof seoPublicationLocalCommands;
  readonly externalCommands: typeof seoPublicationExternalCommands;
  readonly requiredExternalEvidence: typeof seoPublicationRequiredExternalEvidence;
}

export const seoPublicationExecutionPolicy = {
  codexMayClassifyStaticSeoPublicationReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  seededPrismaRequiredForClosure: true,
  tenantIsolationRequiredForClosure: true,
  durableIdempotencyRequiredForClosure: true,
  durableRevalidationRequiredForClosure: true,
  durableAssociationPersistenceRequiredForClosure: true,
  dashboardBrowserFlowsRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies SeoPublicationExecutionPolicy;

export const seoPublicationRuntimeCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm vitest run apps/dashboard/tests/seo-publication-route-static.test.ts",
  "SEO Prisma integration tests",
  "SEO tenant isolation tests",
  "dashboard SEO publish/edit/archive Playwright or route tests",
] as const;

export const seoPublicationArtifactPaths = [
  "coverage/seo-publication-runtime.json",
  "coverage/seo-publication-seo-typecheck.txt",
  "coverage/seo-publication-seo-test.txt",
  "coverage/seo-publication-dashboard-build.txt",
  "coverage/seo-publication-static-contract.json",
  "coverage/seo-publication-city-prisma.json",
  "coverage/seo-publication-style-prisma.json",
  "coverage/seo-publication-redirect-prisma.json",
  "coverage/seo-publication-tenant-isolation.json",
  "coverage/seo-publication-rbac-denial.json",
  "coverage/seo-publication-idempotency-store.json",
  "coverage/seo-publication-revalidation-job.json",
  "coverage/seo-publication-faq-review-image-associations.json",
  "coverage/seo-publication-audit-log.json",
  "coverage/seo-publication-dashboard-publish-flow-redacted.json",
  "coverage/seo-publication-dashboard-edit-flow-redacted.json",
  "coverage/seo-publication-dashboard-archive-flow-redacted.json",
  "coverage/seo-publication-ci-evidence.json",
  "coverage/seo-publication-secret-safe-artifacts.json",
  "test-results/seo-publication-runtime",
] as const;

export const seoPublicationRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/seo/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/dashboard/app/seo/page.tsx",
  "apps/dashboard/components/SeoPublicationActionPanel.tsx",
  "apps/dashboard/lib/seoDemo.ts",
  "apps/dashboard/lib/seoPublicationRuntime.ts",
  "packages/db/prisma/schema.prisma",
  "apps/dashboard/app/api/seo/route.ts",
  "apps/dashboard/tests/seo-read-route-static.test.ts",
  "apps/dashboard/tests/seo-publication-route-static.test.ts",
  "apps/dashboard/tests/seo-publication-runtime-static.test.ts",
  "apps/dashboard/app/api/reviews/route.ts",
  "apps/dashboard/tests/review-read-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const seoPublicationRequiredExternalEvidence = [
  "actual SEO publication command output",
  "seeded SeoCityPage mutation integration tests",
  "seeded SeoStylePage mutation integration tests",
  "seeded SeoRedirect mutation integration tests",
  "SEO tenant isolation tests",
  "SEO publish RBAC denial tests",
  "dedicated SEO publication idempotency store tests",
  "dedicated SEO revalidation job persistence tests",
  "normalized FAQ/review/image association join persistence tests",
  "dashboard SEO publish/edit/archive browser flow evidence",
  "CI SEO publication artifacts",
  "secret-safe SEO publication artifact review",
] as const;

export const seoPublicationLocalCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm vitest run apps/dashboard/tests/seo-publication-runtime-static.test.ts apps/dashboard/tests/seo-publication-route-static.test.ts apps/dashboard/tests/seo-read-route-static.test.ts",
] as const;

export const seoPublicationExternalCommands = [
  "SEO Prisma integration tests",
  "SEO tenant isolation tests",
  "dashboard SEO publish/edit/archive Playwright or route tests",
  "GitHub Actions SEO publication runtime job",
  "secret-safe SEO publication artifact review",
] as const;

export const buildSeoPublicationExecutionPlan = (): SeoPublicationExecutionPlan => ({
  policy: seoPublicationExecutionPolicy,
  commandExecutionAllowed: false,
  seededPrismaExecutionAllowed: false,
  tenantIsolationExecutionAllowed: false,
  idempotencyExecutionAllowed: false,
  revalidationExecutionAllowed: false,
  associationExecutionAllowed: false,
  browserExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: seoPublicationLocalCommands,
  externalCommands: seoPublicationExternalCommands,
  requiredExternalEvidence: seoPublicationRequiredExternalEvidence,
});

const sensitiveSeoArtifactKeyPattern = /(token|secret|password|authorization|cookie|draft|body|copy|email|phone|searchconsole|provider|payload)/i;
const sensitiveSeoArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:searchconsole|provider|token|secret)[\w:./?=&-]*/gi,
];

export function buildRedactedSeoPublicationArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedSeoPublicationArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveSeoArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveSeoArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedSeoPublicationArtifact(value),
    ]),
  );
}

export function buildSeoPublicationArtifactReview(input: {
  readonly artifacts: readonly unknown[];
  readonly expectedArtifactPaths?: readonly string[];
}): SeoPublicationArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedSeoPublicationArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No SEO publication artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|searchconsole)\b/i.test(serialized)
      ? ["SEO publication artifacts still contain secrets, provider payloads, draft copy, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["SEO publication artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export function createInMemorySeoPublicationRepository(): SeoPublicationLocalRepository {
  const idempotencyKeys = new Set<string>();
  const entities: { tenantId: string; model: SeoPublicationLocalModel; entityId: string; action: SeoPublicationLocalAction }[] = [];
  const revalidationJobs: { tenantId: string; entityId: string; tags: readonly string[] }[] = [];
  const associations: { tenantId: string; entityId: string; kind: "faq" | "review" | "image"; relatedId: string }[] = [];
  const auditLogs: { tenantId: string; actorId: string; entityId: string; action: string; metadata: Record<string, unknown> }[] = [];

  return {
    claimIdempotencyKey(input) {
      const scopedKey = `${input.tenantId}:${input.key}`;
      if (idempotencyKeys.has(scopedKey)) return "duplicate";
      idempotencyKeys.add(scopedKey);
      return "claimed";
    },
    persistMutation(input) {
      entities.push({ tenantId: input.tenantId, model: input.model, entityId: input.entityId, action: input.action });
    },
    persistRevalidationJob(input) {
      revalidationJobs.push({ tenantId: input.tenantId, entityId: input.entityId, tags: input.revalidationTags });
    },
    persistAssociations(input) {
      associations.push(
        ...(input.relatedFaqIds ?? []).map((relatedId) => ({ tenantId: input.tenantId, entityId: input.entityId, kind: "faq" as const, relatedId })),
        ...(input.relatedReviewIds ?? []).map((relatedId) => ({ tenantId: input.tenantId, entityId: input.entityId, kind: "review" as const, relatedId })),
        ...(input.relatedImageIds ?? []).map((relatedId) => ({ tenantId: input.tenantId, entityId: input.entityId, kind: "image" as const, relatedId })),
      );
    },
    persistAuditLog(input) {
      auditLogs.push({
        tenantId: input.tenantId,
        actorId: input.actorId,
        entityId: input.entityId,
        action: `seo:${input.model}:${input.action}`,
        metadata: buildRedactedSeoPublicationArtifact({
          idempotencyKey: input.idempotencyKey,
          revalidationTags: input.revalidationTags,
          relatedFaqIds: input.relatedFaqIds ?? [],
          relatedReviewIds: input.relatedReviewIds ?? [],
          relatedImageIds: input.relatedImageIds ?? [],
        }) as Record<string, unknown>,
      });
    },
    snapshot() {
      return {
        idempotencyKeys: [...idempotencyKeys],
        entities: [...entities],
        revalidationJobs: [...revalidationJobs],
        associations: [...associations],
        auditLogs: [...auditLogs],
      };
    },
  };
}

export function executeLocalSeoPublicationMutation(
  repository: SeoPublicationLocalRepository,
  input: SeoPublicationLocalMutation,
): { readonly status: "processed" | "duplicate"; readonly snapshot: SeoPublicationLocalRepositorySnapshot } {
  const claim = repository.claimIdempotencyKey({ tenantId: input.tenantId, key: input.idempotencyKey });
  if (claim === "duplicate") return { status: "duplicate", snapshot: repository.snapshot() };

  repository.persistMutation(input);
  repository.persistRevalidationJob(input);
  repository.persistAssociations(input);
  repository.persistAuditLog(input);

  return { status: "processed", snapshot: repository.snapshot() };
}

export type SeoPublicationEvidenceArtifact = (typeof seoPublicationArtifactPaths)[number];

export interface SeoPublicationEvidenceInput {
  readonly seoTypecheckPassed: boolean;
  readonly seoTestsPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly staticContractPassed: boolean;
  readonly cityPrismaIntegrationPassed: boolean;
  readonly stylePrismaIntegrationPassed: boolean;
  readonly redirectPrismaIntegrationPassed: boolean;
  readonly tenantIsolationPassed: boolean;
  readonly rbacDenialPassed: boolean;
  readonly idempotencyStoreVerified: boolean;
  readonly revalidationJobVerified: boolean;
  readonly associationPersistenceVerified: boolean;
  readonly auditLogVerified: boolean;
  readonly dashboardPublishFlowPassed: boolean;
  readonly dashboardEditFlowPassed: boolean;
  readonly dashboardArchiveFlowPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SeoPublicationEvidenceArtifact[];
}

export interface SeoPublicationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SeoPublicationEvidenceArtifact[];
  readonly requiredCommands: typeof seoPublicationRuntimeCommands;
  readonly requiredEvidence: typeof seoPublicationDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const seoPublicationDecisionRequiredEvidence = [
  "seeded city, style, and redirect Prisma mutation evidence",
  "SEO association, publish-state, and revalidation job persistence evidence",
  "SEO Prisma integration, tenant isolation, and dashboard publish-flow test evidence",
  "tenant-scoped transaction, audit, RBAC, and idempotency evidence",
  "dashboard publish, edit, archive, and redirect browser flow evidence",
  "secret-safe review of retained SEO publication artifacts",
] as const;

export const buildSeoPublicationEvidenceDecision = (
  input: SeoPublicationEvidenceInput,
): SeoPublicationEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = seoPublicationArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.seoTypecheckPassed ? ["@inkroute/seo typecheck evidence is missing."] : []),
    ...(!input.seoTestsPassed ? ["@inkroute/seo test evidence is missing."] : []),
    ...(!input.dashboardBuildPassed ? ["Dashboard build evidence is missing."] : []),
    ...(!input.staticContractPassed ? ["SEO publication static contract evidence is missing."] : []),
    ...(!input.cityPrismaIntegrationPassed ? ["Seeded SeoCityPage mutation evidence is missing."] : []),
    ...(!input.stylePrismaIntegrationPassed ? ["Seeded SeoStylePage mutation evidence is missing."] : []),
    ...(!input.redirectPrismaIntegrationPassed ? ["Seeded SeoRedirect mutation evidence is missing."] : []),
    ...(!input.tenantIsolationPassed ? ["SEO tenant-isolation evidence is missing."] : []),
    ...(!input.rbacDenialPassed ? ["SEO publish RBAC denial evidence is missing."] : []),
    ...(!input.idempotencyStoreVerified ? ["SEO publication idempotency store evidence is missing."] : []),
    ...(!input.revalidationJobVerified ? ["SEO revalidation job persistence evidence is missing."] : []),
    ...(!input.associationPersistenceVerified
      ? ["FAQ/review/image association persistence evidence is missing."]
      : []),
    ...(!input.auditLogVerified ? ["SEO publication AuditLog evidence is missing."] : []),
    ...(!input.dashboardPublishFlowPassed ? ["Dashboard SEO publish flow evidence is missing."] : []),
    ...(!input.dashboardEditFlowPassed ? ["Dashboard SEO edit flow evidence is missing."] : []),
    ...(!input.dashboardArchiveFlowPassed ? ["Dashboard SEO archive/redirect flow evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["SEO publication CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe SEO publication artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All SEO publication artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: seoPublicationRuntimeCommands,
    requiredEvidence: seoPublicationDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: seoPublicationArtifactPaths.length,
    },
  };
};

export const seoPublicationRuntimeMatrix = [
  { id: "seo-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/seo-publication-seo-typecheck.txt", status: "wired" },
  { id: "seo-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/seo-publication-seo-test.txt", status: "wired" },
  { id: "dashboard-build", command: "pnpm --filter @inkroute/dashboard build", artifact: "coverage/seo-publication-dashboard-build.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/seo-publication-route-static.test.ts", artifact: "coverage/seo-publication-static-contract.json", status: "wired" },
  { id: "city-prisma", command: "seeded SeoCityPage mutation integration tests", artifact: "coverage/seo-publication-city-prisma.json", status: "integration-gated" },
  { id: "style-prisma", command: "seeded SeoStylePage mutation integration tests", artifact: "coverage/seo-publication-style-prisma.json", status: "integration-gated" },
  { id: "redirect-prisma", command: "seeded SeoRedirect mutation integration tests", artifact: "coverage/seo-publication-redirect-prisma.json", status: "integration-gated" },
  { id: "tenant-isolation", command: "SEO tenant isolation tests", artifact: "coverage/seo-publication-tenant-isolation.json", status: "integration-gated" },
  { id: "rbac-denial", command: "SEO publish RBAC denial tests", artifact: "coverage/seo-publication-rbac-denial.json", status: "integration-gated" },
  { id: "idempotency-store", command: "dedicated SEO publication idempotency store tests", artifact: "coverage/seo-publication-idempotency-store.json", status: "idempotency-gated" },
  { id: "revalidation-job", command: "dedicated SEO revalidation job persistence tests", artifact: "coverage/seo-publication-revalidation-job.json", status: "revalidation-gated" },
  { id: "associations", command: "normalized FAQ/review/image association join persistence tests", artifact: "coverage/seo-publication-faq-review-image-associations.json", status: "association-gated" },
  { id: "audit-log", command: "SEO publication AuditLog persistence tests", artifact: "coverage/seo-publication-audit-log.json", status: "repository-gated" },
  { id: "dashboard-publish-flow", command: "dashboard SEO publish browser flow", artifact: "coverage/seo-publication-dashboard-publish-flow-redacted.json", status: "browser-gated" },
  { id: "dashboard-edit-flow", command: "dashboard SEO edit browser flow", artifact: "coverage/seo-publication-dashboard-edit-flow-redacted.json", status: "browser-gated" },
  { id: "dashboard-archive-flow", command: "dashboard SEO archive/redirect browser flow", artifact: "coverage/seo-publication-dashboard-archive-flow-redacted.json", status: "browser-gated" },
  { id: "ci-seo-publication-job", command: "GitHub Actions SEO publication runtime job", artifact: "coverage/seo-publication-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review SEO publication artifacts for tenant data, draft copy, provider payloads, and secrets", artifact: "coverage/seo-publication-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly SeoPublicationRuntimeMatrixEntry[];

export const seoPublicationRuntimeReadiness = buildSeoPublicationRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  seoPackageTestsPassed: false,
  seoPackageTypecheckPassed: false,
  dashboardBuildPassed: false,
  prismaModelsMigrated: true,
  dashboardCrudRoutesImplemented: true,
  authenticatedDashboardApiImplemented: true,
  rbacEnforced: true,
  tenantIsolationEnforced: true,
  prismaTransactionsConfigured: true,
  seoCityPageRepositoryImplemented: true,
  seoStylePageRepositoryImplemented: true,
  seoRedirectRepositoryImplemented: true,
  faqReviewImageAssociationPersistenceAvailable: false,
  publishStatePersistenceAvailable: true,
  auditLogPersistenceAvailable: true,
  revalidationJobPersistenceAvailable: false,
  idempotencyStoreAvailable: false,
  previewToPublishFlowImplemented: true,
  archiveRedirectFlowImplemented: true,
  prismaIntegrationTestsPassed: false,
  tenantIsolationTestsPassed: false,
  dashboardPublishFlowTestsPassed: false,
});


