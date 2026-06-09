import { buildSeoA11yPerformanceAuditEvidencePlan } from "@inkroute/seo";

export type SeoA11yPerformanceAuditStatus =
  | "wired"
  | "browser-gated"
  | "schema-gated"
  | "accessibility-gated"
  | "performance-gated"
  | "mobile-gated"
  | "ci-gated";

export interface SeoAuditRouteTarget {
  readonly path: string;
  readonly category: "home" | "portfolio" | "booking" | "travel" | "faq" | "city" | "style" | "privacy" | "legal" | "trust";
  readonly requiresJsonLd: boolean;
  readonly requiresCanonical: boolean;
  readonly requiresAxe: boolean;
  readonly requiresLighthouse: boolean;
  readonly requiresMobileVisualQa: boolean;
}

export interface SeoA11yPerformanceAuditMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeoA11yPerformanceAuditStatus;
}


export interface SeoA11yPerformanceAuditRunPersistenceContract {
  readonly prismaModel: "SeoA11yPerformanceAuditRun";
  readonly tenantRelation: "seoA11yPerformanceAuditRuns";
  readonly migration: "20260609035200_add_seo_a11y_performance_audit_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesRenderedCrawlEvidence: true;
  readonly storesSchemaValidatorEvidence: true;
  readonly storesSitemapCanonicalEvidence: true;
  readonly storesAxeEvidence: true;
  readonly storesLighthouseCwvEvidence: true;
  readonly storesMobileVisualQaEvidence: true;
  readonly storesAccessibilityFixEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const seoA11yPerformanceAuditRunPersistenceContract = {
  prismaModel: "SeoA11yPerformanceAuditRun",
  tenantRelation: "seoA11yPerformanceAuditRuns",
  migration: "20260609035200_add_seo_a11y_performance_audit_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesRenderedCrawlEvidence: true,
  storesSchemaValidatorEvidence: true,
  storesSitemapCanonicalEvidence: true,
  storesAxeEvidence: true,
  storesLighthouseCwvEvidence: true,
  storesMobileVisualQaEvidence: true,
  storesAccessibilityFixEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies SeoA11yPerformanceAuditRunPersistenceContract;

export const seoA11yPerformanceAuditCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "browser crawl for public Phase 10 routes",
  "schema validator for rendered JSON-LD",
  "sitemap and canonical browser checks",
  "axe accessibility audit for public routes",
  "Lighthouse/Core Web Vitals audit",
  "mobile visual QA sweep",
  "GitHub Actions SEO accessibility performance evidence job",
] as const;

export const seoAuditRouteTargets = [
  { path: "/", category: "home", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/portfolio", category: "portfolio", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/booking", category: "booking", requiresJsonLd: false, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/travel", category: "travel", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/faq", category: "faq", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/cities/seattle-wa", category: "city", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/styles/blackwork", category: "style", requiresJsonLd: true, requiresCanonical: true, requiresAxe: true, requiresLighthouse: true, requiresMobileVisualQa: true },
  { path: "/privacy", category: "privacy", requiresJsonLd: false, requiresCanonical: true, requiresAxe: true, requiresLighthouse: false, requiresMobileVisualQa: true },
  { path: "/terms", category: "legal", requiresJsonLd: false, requiresCanonical: true, requiresAxe: true, requiresLighthouse: false, requiresMobileVisualQa: true },
  { path: "/consent-disclaimer", category: "legal", requiresJsonLd: false, requiresCanonical: true, requiresAxe: true, requiresLighthouse: false, requiresMobileVisualQa: true },
  { path: "/trust", category: "trust", requiresJsonLd: false, requiresCanonical: true, requiresAxe: true, requiresLighthouse: false, requiresMobileVisualQa: true },
] as const satisfies readonly SeoAuditRouteTarget[];

export const seoA11yPerformanceArtifactPaths = [
  "coverage/seo-a11y-performance-runtime.json",
  "coverage/seo-a11y-seo-typecheck.txt",
  "coverage/seo-a11y-seo-test.txt",
  "coverage/seo-a11y-web-typecheck.txt",
  "coverage/seo-a11y-web-build.txt",
  "coverage/seo-a11y-browser-crawl.json",
  "coverage/seo-a11y-schema-validator.json",
  "coverage/seo-a11y-sitemap-canonical.json",
  "coverage/seo-a11y-axe.json",
  "coverage/seo-a11y-lighthouse-cwv.json",
  "coverage/seo-a11y-mobile-visual-qa.json",
  "coverage/seo-a11y-ci-evidence.json",
  "test-results/seo-a11y-performance-runtime",
] as const;

export const seoA11yPerformanceAuditMatrix = [
  {
    id: "seo-and-web-package-gates",
    command: "pnpm --filter @inkroute/seo typecheck && pnpm --filter @inkroute/seo test && pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/seo-a11y-web-build.txt",
    status: "wired",
  },
  {
    id: "public-route-browser-crawl",
    command: "browser crawl for public Phase 10 routes",
    artifact: "coverage/seo-a11y-browser-crawl.json",
    status: "browser-gated",
  },
  {
    id: "schema-sitemap-canonical-rendered-checks",
    command: "schema validator for rendered JSON-LD && sitemap and canonical browser checks",
    artifact: "coverage/seo-a11y-sitemap-canonical.json",
    status: "schema-gated",
  },
  {
    id: "axe-heading-focus-contrast-label-landmark",
    command: "axe accessibility audit for public routes",
    artifact: "coverage/seo-a11y-axe.json",
    status: "accessibility-gated",
  },
  {
    id: "lighthouse-core-web-vitals",
    command: "Lighthouse/Core Web Vitals audit",
    artifact: "coverage/seo-a11y-lighthouse-cwv.json",
    status: "performance-gated",
  },
  {
    id: "mobile-visual-qa",
    command: "mobile visual QA sweep",
    artifact: "coverage/seo-a11y-mobile-visual-qa.json",
    status: "mobile-gated",
  },
  {
    id: "ci-redacted-audit-artifacts",
    command: "GitHub Actions SEO accessibility performance evidence job",
    artifact: "coverage/seo-a11y-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly SeoA11yPerformanceAuditMatrixEntry[];

export const seoA11yPerformanceAuditReadiness = buildSeoA11yPerformanceAuditEvidencePlan({
  packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
  seoTestsPassed: false,
  seoTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  browserCrawlPassed: false,
  schemaValidatorPassed: false,
  sitemapCanonicalChecksPassed: false,
  axeAuditPassed: false,
  lighthouseAuditPassed: false,
  coreWebVitalsCaptured: false,
  mobileVisualQaPassed: false,
  headingFocusContrastIssuesFixed: false,
  structuredDataSnapshotsCaptured: false,
  ciArtifactsCaptured: false,
  secretSafeArtifactsCaptured: false,
});
