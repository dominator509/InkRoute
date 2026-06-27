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

export interface SeoA11yPerformanceAuditRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: SeoA11yPerformanceAuditEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly renderedCrawlEvidenceCaptured: boolean;
  readonly schemaValidatorEvidenceCaptured: boolean;
  readonly sitemapCanonicalEvidenceCaptured: boolean;
  readonly axeEvidenceCaptured: boolean;
  readonly lighthouseCwvEvidenceCaptured: boolean;
  readonly mobileVisualQaEvidenceCaptured: boolean;
  readonly accessibilityFixEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly crawlReportPath?: string | null;
  readonly lighthouseReportPath?: string | null;
}

export interface SeoA11yPerformanceAuditRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: SeoA11yPerformanceAuditEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly renderedCrawlEvidenceCaptured: boolean;
  readonly schemaValidatorEvidenceCaptured: boolean;
  readonly sitemapCanonicalEvidenceCaptured: boolean;
  readonly axeEvidenceCaptured: boolean;
  readonly lighthouseCwvEvidenceCaptured: boolean;
  readonly mobileVisualQaEvidenceCaptured: boolean;
  readonly accessibilityFixEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly crawlReportPath: string | null;
  readonly lighthouseReportPath: string | null;
}

export interface SeoA11yPerformanceAuditRunRepository {
  readonly seoA11yPerformanceAuditRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: SeoA11yPerformanceAuditRunData;
      readonly update: Omit<SeoA11yPerformanceAuditRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildSeoA11yPerformanceAuditRunData(
  input: SeoA11yPerformanceAuditRunRecordInput,
): SeoA11yPerformanceAuditRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? seoA11yPerformanceAuditCommands,
    artifactManifest: input.artifacts ?? seoA11yPerformanceArtifactPaths,
    renderedCrawlEvidenceCaptured: input.renderedCrawlEvidenceCaptured,
    schemaValidatorEvidenceCaptured: input.schemaValidatorEvidenceCaptured,
    sitemapCanonicalEvidenceCaptured: input.sitemapCanonicalEvidenceCaptured,
    axeEvidenceCaptured: input.axeEvidenceCaptured,
    lighthouseCwvEvidenceCaptured: input.lighthouseCwvEvidenceCaptured,
    mobileVisualQaEvidenceCaptured: input.mobileVisualQaEvidenceCaptured,
    accessibilityFixEvidenceCaptured: input.accessibilityFixEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    crawlReportPath: input.crawlReportPath ?? null,
    lighthouseReportPath: input.lighthouseReportPath ?? null,
  };
}

export async function persistSeoA11yPerformanceAuditRun(
  repository: SeoA11yPerformanceAuditRunRepository,
  input: SeoA11yPerformanceAuditRunRecordInput,
): Promise<unknown> {
  const data = buildSeoA11yPerformanceAuditRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.seoA11yPerformanceAuditRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const seoA11yPerformanceAuditCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "browser crawl for public Phase 10 routes",
  "schema validator for rendered JSON-LD",
  "sitemap and canonical browser checks",
  "axe accessibility audit for public routes",
  "heading/focus/contrast accessibility fix verification",
  "Lighthouse audit for launch-critical public routes",
  "Core Web Vitals capture",
  "structured-data rendered snapshot capture",
  "mobile visual QA sweep",
  "GitHub Actions SEO accessibility performance evidence job",
  "secret-safe SEO accessibility performance artifact review",
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
  "coverage/seo-a11y-secret-safe-artifacts.json",
  "test-results/seo-a11y-performance-runtime",
] as const;

export const seoA11yPerformanceAuditRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/seo/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/web/lib/seoEngine.ts",
  "apps/web/app/sitemap.ts",
  "apps/dashboard/app/seo/page.tsx",
  "apps/web/lib/seoA11yPerformanceAuditRuntime.ts",
  "apps/web/tests/seo-a11y-performance-audit-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609035200_add_seo_a11y_performance_audit_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const seoA11yPerformanceAuditControls = [
  "audit-rendered-routes-not-only-package-metadata-helpers",
  "validate-jsonld-sitemap-canonical-internal-links-against-browser-output",
  "fix-heading-focus-landmark-label-contrast-form-accessibility-before-launch",
  "capture-lighthouse-core-web-vitals-for-launch-critical-desktop-mobile-routes",
  "keep-audit-artifacts-redacted-client-medical-payment-provider-file-safe",
] as const;

export const seoA11yPerformanceAuditEvidenceFlags = [
  "seoTestsPassed",
  "seoTypecheckPassed",
  "webTypecheckPassed",
  "webBuildPassed",
  "browserCrawlPassed",
  "schemaValidatorPassed",
  "sitemapCanonicalChecksPassed",
  "axeAuditPassed",
  "lighthouseAuditPassed",
  "coreWebVitalsCaptured",
  "mobileVisualQaPassed",
  "headingFocusContrastIssuesFixed",
  "structuredDataSnapshotsCaptured",
  "ciArtifactsCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type SeoA11yPerformanceAuditEvidenceFlag =
  (typeof seoA11yPerformanceAuditEvidenceFlags)[number];

export interface SeoA11yPerformanceAuditEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<SeoA11yPerformanceAuditEvidenceFlag, boolean>>;
}

export interface SeoA11yPerformanceAuditEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly SeoA11yPerformanceAuditEvidenceFlag[];
  readonly requiredCommands: typeof seoA11yPerformanceAuditCommands;
  readonly requiredArtifacts: typeof seoA11yPerformanceArtifactPaths;
  readonly requiredControls: typeof seoA11yPerformanceAuditControls;
  readonly requiredEvidence: typeof seoA11yPerformanceAuditEvidenceFlags;
  readonly requiredRouteTargets: readonly SeoAuditRouteTarget[];
  readonly blockers: readonly string[];
}

const seoA11yPerformanceAuditEvidenceBlockers: Record<SeoA11yPerformanceAuditEvidenceFlag, string> = {
  seoTestsPassed: "SEO package tests must pass.",
  seoTypecheckPassed: "SEO package typecheck must pass.",
  webTypecheckPassed: "Web app typecheck must pass.",
  webBuildPassed: "Web production build evidence is required.",
  browserCrawlPassed: "Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.",
  schemaValidatorPassed: "Rendered JSON-LD schema validator must pass.",
  sitemapCanonicalChecksPassed: "Sitemap and canonical browser checks must pass.",
  axeAuditPassed: "axe accessibility audit must pass for launch-critical public routes.",
  lighthouseAuditPassed: "Lighthouse audit must pass or document accepted launch-specific exceptions.",
  coreWebVitalsCaptured: "Core Web Vitals evidence must be captured.",
  mobileVisualQaPassed: "Mobile visual QA sweep must pass.",
  headingFocusContrastIssuesFixed: "Heading, focus, landmark, label, contrast, and form accessibility issues must be fixed.",
  structuredDataSnapshotsCaptured: "Structured-data snapshots must be captured from rendered routes.",
  ciArtifactsCaptured: "CI SEO/accessibility/performance evidence must be captured.",
  secretSafeArtifactsCaptured:
    "SEO/accessibility/performance artifacts must be redacted and free of secrets, client-private data, raw medical notes, private file URLs, and provider tokens.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildSeoA11yPerformanceAuditEvidenceDecision = (
  input: SeoA11yPerformanceAuditEvidenceInput,
): SeoA11yPerformanceAuditEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, seoA11yPerformanceAuditCommands);
  const missingArtifacts = missingFrom(input.artifacts, seoA11yPerformanceArtifactPaths);
  const missingControls = missingFrom(input.controls, seoA11yPerformanceAuditControls);
  const missingEvidence = seoA11yPerformanceAuditEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => seoA11yPerformanceAuditEvidenceBlockers[flag]);

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
    requiredCommands: seoA11yPerformanceAuditCommands,
    requiredArtifacts: seoA11yPerformanceArtifactPaths,
    requiredControls: seoA11yPerformanceAuditControls,
    requiredEvidence: seoA11yPerformanceAuditEvidenceFlags,
    requiredRouteTargets: seoAuditRouteTargets,
    blockers,
  };
};

export interface SeoA11yPerformanceAuditExecutionPolicy {
  readonly codexMayClassifyStaticSeoAuditReadiness: true;
  readonly renderedBrowserAuditRequiredForClosure: true;
  readonly accessibilityFixVerificationRequiredForClosure: true;
  readonly lighthouseAndCoreWebVitalsRequiredForClosure: true;
  readonly mobileVisualQaRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface SeoA11yPerformanceAuditExecutionPlan {
  readonly localCommands: typeof seoA11yPerformanceAuditLocalCommands;
  readonly externalCommands: typeof seoA11yPerformanceAuditExternalCommands;
  readonly requiredExternalEvidence: typeof seoA11yPerformanceAuditRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly lighthouseExecutionAllowed: false;
  readonly accessibilityToolExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof seoA11yPerformanceAuditExecutionPolicy;
}

export interface SeoA11yPerformanceAuditArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof seoA11yPerformanceAuditRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const seoA11yPerformanceAuditRequiredExternalEvidence = [
  "rendered browser crawl evidence for all Phase 10 public routes",
  "provider-backed SeoA11yPerformanceAuditRun persistence execution",
  "schema validator output for rendered JSON-LD",
  "sitemap and canonical rendered browser checks",
  "axe accessibility audit output",
  "heading, focus, label, landmark, and contrast fix verification",
  "Lighthouse and Core Web Vitals evidence",
  "structured-data rendered snapshot bundle",
  "mobile visual QA artifacts",
  "CI SEO accessibility performance artifacts",
  "secret-safe SEO accessibility performance artifact review",
] as const;

export const seoA11yPerformanceAuditExecutionPolicy: SeoA11yPerformanceAuditExecutionPolicy = {
  codexMayClassifyStaticSeoAuditReadiness: true,
  renderedBrowserAuditRequiredForClosure: true,
  accessibilityFixVerificationRequiredForClosure: true,
  lighthouseAndCoreWebVitalsRequiredForClosure: true,
  mobileVisualQaRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const seoA11yPerformanceAuditLocalCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "static SEO engine and sitemap helper review",
  "static route target inventory review",
] as const;

export const seoA11yPerformanceAuditExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "browser crawl for public Phase 10 routes",
  "schema validator for rendered JSON-LD",
  "sitemap and canonical browser checks",
  "axe accessibility audit for public routes",
  "heading/focus/contrast accessibility fix verification",
  "Lighthouse audit for launch-critical public routes",
  "Core Web Vitals capture",
  "mobile visual QA sweep",
  "provider-backed persistSeoA11yPerformanceAuditRun execution",
  "CI SEO accessibility performance artifact capture",
] as const;

export const buildSeoA11yPerformanceAuditExecutionPlan =
  (): SeoA11yPerformanceAuditExecutionPlan => ({
    localCommands: seoA11yPerformanceAuditLocalCommands,
    externalCommands: seoA11yPerformanceAuditExternalCommands,
    requiredExternalEvidence: seoA11yPerformanceAuditRequiredExternalEvidence,
    commandExecutionAllowed: false,
    browserExecutionAllowed: false,
    lighthouseExecutionAllowed: false,
    accessibilityToolExecutionAllowed: false,
    databaseExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: seoA11yPerformanceAuditExecutionPolicy,
  });

const seoA11yPerformanceAuditSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|medical|payment|email|phone|cookie|session|screenshot|visual|snapshot|html|body|headers|authorization)/i;

export const buildRedactedSeoA11yPerformanceAuditArtifact = (
  artifact: unknown,
): Pick<SeoA11yPerformanceAuditArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (seoA11yPerformanceAuditSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_SEO_A11Y_PERFORMANCE_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildSeoA11yPerformanceAuditArtifactReview = (
  artifact: unknown,
): SeoA11yPerformanceAuditArtifactReview => {
  const redacted = buildRedactedSeoA11yPerformanceAuditArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "sk_",
    "medical:",
    "private-file",
    "authorization:",
    "<html",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: seoA11yPerformanceAuditRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};

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



