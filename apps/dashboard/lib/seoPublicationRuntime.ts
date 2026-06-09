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
