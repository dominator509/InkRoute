import type { ArtistProfile, PortfolioItem, Review, Role, SeoCityPage, SeoPageStatus, SeoStylePage, TravelStop } from "@inkroute/types";

type JsonLd = Record<string, unknown>;

export type SeoRouteKind = "static" | "city" | "style" | "portfolio" | "travel" | "aftercare" | "booking" | "system";
export type SeoIndexMode = "index" | "noindex";
export type SeoChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
export type SeoIssueSeverity = "info" | "warning" | "error";
export type SeoPublicationStatus = SeoPageStatus | "static_demo";
export type SeoRedirectStatusCode = 301 | 302 | 307 | 308;
export type SeoRedirectDecisionAction = "allow" | "redirect" | "not_found" | "noindex";

export interface SeoRouteRecord {
  path: string;
  kind: SeoRouteKind;
  title: string;
  description: string;
  canonicalPath: string;
  status: SeoPublicationStatus;
  indexMode: SeoIndexMode;
  priority: number;
  changeFrequency: SeoChangeFrequency;
  lastModified: string;
  tenantSlug?: string;
  city?: string;
  region?: string;
  style?: string;
  relatedPortfolioIds?: string[];
  revalidationTags: string[];
}

export interface SeoMetadataDraft {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: "website" | "article" | "profile";
    images: Array<{ url: string; alt: string }>;
  };
  robots: {
    index: boolean;
    follow: boolean;
  };
  alternates: {
    canonical: string;
  };
}

export interface SitemapEntryDraft {
  url: string;
  lastModified: string;
  changeFrequency: SeoChangeFrequency;
  priority: number;
}

export interface SitemapPlan {
  generatedAt: string;
  baseUrl: string;
  indexableCount: number;
  noindexCount: number;
  entries: SitemapEntryDraft[];
}

export interface SeoIssue {
  code: string;
  severity: SeoIssueSeverity;
  message: string;
  field?: string;
  nextAction: string;
}

export interface SeoAuditResult {
  path: string;
  score: number;
  indexMode: SeoIndexMode;
  issues: SeoIssue[];
  passedChecks: string[];
}

export interface InternalLinkSuggestion {
  fromPath: string;
  toPath: string;
  anchorText: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface SeoContentBrief {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  canonicalPath: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  recommendedSections: string[];
  schemaTypes: string[];
  internalLinks: InternalLinkSuggestion[];
  analyticsEvents: SeoAnalyticsEventDraft[];
}

export interface SeoAnalyticsEventDraft {
  name:
    | "seo_page_viewed"
    | "seo_city_waitlist_clicked"
    | "seo_style_booking_clicked"
    | "seo_portfolio_attribution_clicked"
    | "seo_travel_cta_clicked";
  path: string;
  tenantSlug?: string;
  city?: string;
  style?: string;
  portfolioAttributionKey?: string;
}

export interface SeoImageFields {
  imageUrl: string;
  altText: string;
  caption: string;
  filenameHint: string;
  structuredData: JsonLd;
}

export type SeoImageDerivativeFormat = "webp" | "avif" | "jpeg";
export type SeoImageAcl = "public" | "private";

export interface SeoImageDerivativePlan {
  label: "thumbnail" | "card" | "hero" | "open_graph";
  width: number;
  format: SeoImageDerivativeFormat;
  objectKey: string;
  publicUrl?: string;
  blurDataUrl: string;
  acl: SeoImageAcl;
  cacheControl: string;
}

export interface SeoImagePipelineInput {
  item: PortfolioItem;
  tenantSlug: string;
  sourceObjectKey: string;
  sourceAcl: SeoImageAcl;
  cdnBaseUrl?: string;
  widths?: number[];
  formats?: SeoImageDerivativeFormat[];
  now?: string;
}

export interface SeoImagePipelinePlan {
  tenantId: string;
  tenantSlug: string;
  portfolioItemId: string;
  filenameHint: string;
  altText: string;
  caption: string;
  sourceObjectKey: string;
  sourceAcl: SeoImageAcl;
  sourceRemainsPrivate: boolean;
  requiresExifStrip: true;
  requiresDimensionProbe: true;
  requiresBlurPlaceholder: true;
  requiresDerivativePersistence: true;
  cacheControl: string;
  derivatives: SeoImageDerivativePlan[];
  blockers: string[];
  generatedAt: string;
}

export interface SeoImagePipelineRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  imageProcessingWorkerImplemented: boolean;
  storageProviderConfigured: boolean;
  sourceDimensionProbeImplemented: boolean;
  exifStrippingImplemented: boolean;
  responsiveDerivativeGenerationImplemented: boolean;
  blurPlaceholderGenerationImplemented: boolean;
  fileAssetPersistenceAvailable: boolean;
  portfolioImagePersistenceAvailable: boolean;
  derivativeMetadataPersistenceAvailable: boolean;
  privateOriginalAclEnforced: boolean;
  publicDerivativeAclEnforced: boolean;
  cdnCacheHeadersConfigured: boolean;
  immutableDerivativeUrlsConfigured: boolean;
  uploadImageProcessingTestsPassed: boolean;
  privateOriginalAccessTestsPassed: boolean;
  publicDerivativeLoadTestsPassed: boolean;
  cdnHeaderTestsPassed: boolean;
  lighthouseImageAuditPassed: boolean;
}

export interface SeoImagePipelineRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof seoImagePipelineRequiredCommands;
  requiredEvidence: readonly SeoImagePipelineRequiredEvidence[];
  requiredControls: typeof seoImagePipelineRequiredControls;
  blockers: readonly string[];
}

export const seoImagePipelineRequiredCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "storage-backed upload/image processing tests",
  "private original access denial tests",
  "public derivative load tests",
  "CDN cache header tests",
  "Lighthouse image optimization audit",
] as const;

export const seoImagePipelineRequiredControls = [
  "Keep original uploads private and strip EXIF before creating public derivatives.",
  "Probe source dimensions and persist derivative width, format, object key, blur placeholder, cache policy, and ACL metadata.",
  "Generate responsive WebP/AVIF/JPEG derivatives with immutable object keys.",
  "Persist FileAsset and PortfolioImage records transactionally with tenant and portfolio item scope.",
  "Serve only public derivatives through CDN cache headers; block direct public access to originals.",
  "Prove image optimization with Lighthouse and storage/CDN integration tests.",
] as const;

export const seoImagePipelineRequiredEvidence = [
  "storage-backed image processing worker and upload test evidence",
  "dimension probe, EXIF stripping, responsive derivative, and blur placeholder evidence",
  "FileAsset, PortfolioImage, and derivative metadata persistence evidence",
  "private original and public derivative ACL/load test evidence",
  "CDN cache header, immutable URL, and Lighthouse image audit evidence",
] as const;

export type SeoImagePipelineRequiredEvidence = typeof seoImagePipelineRequiredEvidence[number];

export interface SeoRevalidationPlan {
  reason: string;
  paths: string[];
  tags: string[];
  requiresRuntime: boolean;
  providerBoundary: "next_revalidate_path" | "next_revalidate_tag" | "cms_webhook" | "manual_preview";
}

export type SeoPublicationAction = "create" | "update" | "publish" | "archive" | "redirect";
export type SeoPublishableModel = "SeoCityPage" | "SeoStylePage" | "SeoRedirect";
export type SeoPublicationWriteModel = SeoPublishableModel | "AuditLog" | "RevalidationJob" | "SeoAssociation";
export type SeoPublicationPlanStatus = "ready" | "blocked" | "invalid";

export interface SeoPublicationMutationInput {
  action: SeoPublicationAction;
  model: SeoPublishableModel;
  tenantId: string;
  actorId: string;
  actorRole: Role;
  route: SeoRouteRecord;
  now: string;
  existingTenantId?: string;
  targetStatus?: SeoPageStatus;
  idempotencyKey?: string;
  relatedFaqIds?: string[];
  relatedReviewIds?: string[];
  relatedImageIds?: string[];
  redirectFromPath?: string;
  redirectToPath?: string;
}

export interface SeoPublicationWrite {
  model: SeoPublicationWriteModel;
  operation: "create" | "update" | "upsert" | "delete" | "enqueue";
  tenantId: string;
  summary: string;
  requiresTransaction: boolean;
}

export interface SeoPublicationMutationPlan {
  status: SeoPublicationPlanStatus;
  action: SeoPublicationAction;
  model: SeoPublishableModel;
  tenantId: string;
  actorId: string;
  actorRole: Role;
  targetStatus: SeoPageStatus;
  canCommit: boolean;
  requiresTenantScope: true;
  requiresRbac: true;
  requiresAuditLog: true;
  requiresTransaction: true;
  idempotencyKey: string;
  blockers: string[];
  writes: SeoPublicationWrite[];
  auditAction: string;
  revalidation: SeoRevalidationPlan;
}

export interface SeoPublicationRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  prismaModelsMigrated: boolean;
  dashboardCrudRoutesImplemented: boolean;
  authenticatedDashboardApiImplemented: boolean;
  rbacEnforced: boolean;
  tenantIsolationEnforced: boolean;
  prismaTransactionsConfigured: boolean;
  seoCityPageRepositoryImplemented: boolean;
  seoStylePageRepositoryImplemented: boolean;
  seoRedirectRepositoryImplemented: boolean;
  faqReviewImageAssociationPersistenceAvailable: boolean;
  publishStatePersistenceAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  revalidationJobPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  previewToPublishFlowImplemented: boolean;
  archiveRedirectFlowImplemented: boolean;
  prismaIntegrationTestsPassed: boolean;
  tenantIsolationTestsPassed: boolean;
  dashboardPublishFlowTestsPassed: boolean;
}

export const seoPublicationRuntimeRequiredControls = [
      "Use buildSeoPublicationMutationPlan as the service contract before every database mutation.",
      "Require authenticated owner or studio_manager actors for create, update, publish, archive, and redirect actions.",
      "Scope every SeoCityPage, SeoStylePage, SeoRedirect, FAQ, review, image, audit, and revalidation write by tenant.",
      "Commit SEO content, associations, audit logs, idempotency keys, and revalidation enqueueing through safe transaction boundaries.",
      "Persist draft, published, archived, and redirect states with dashboard preview-to-publish and archive/redirect flows.",
      "Prove tenant isolation, RBAC denial, audit writes, and revalidation jobs with integration tests.",
] as const;

export const seoPublicationRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/dashboard build",
      "SEO Prisma integration tests",
      "SEO tenant isolation tests",
      "dashboard SEO publish/edit/archive Playwright or route tests",
] as const;

export interface SeoPublicationRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof seoPublicationRuntimeRequiredCommands;
  requiredEvidence: readonly SeoPublicationRuntimeRequiredEvidence[];
  requiredControls: typeof seoPublicationRuntimeRequiredControls;
  blockers: readonly string[];
}

export const seoPublicationRuntimeRequiredEvidence = [
      "Prisma migration and SEO repository implementation evidence",
      "authenticated dashboard SEO CRUD, RBAC, preview, publish, archive, and redirect flow evidence",
      "tenant-scoped transaction, audit, and idempotency evidence",
      "SEO association, publish-state, and revalidation job persistence evidence",
      "SEO Prisma integration, tenant isolation, and dashboard publish-flow test evidence",
] as const;

export type SeoPublicationRuntimeRequiredEvidence = typeof seoPublicationRuntimeRequiredEvidence[number];

export interface CanonicalDomainRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  webBuildPassed: boolean;
  middlewareImplemented: boolean;
  tenantDomainRepositoryImplemented: boolean;
  seoRedirectRepositoryImplemented: boolean;
  canonicalPolicyWiredToPublicRoutes: boolean;
  allowedHostValidationEnforced: boolean;
  httpsRedirectEnforced: boolean;
  canonicalHostRedirectEnforced: boolean;
  persistedRedirectsExecuted: boolean;
  redirectStatusCodesPreserved: boolean;
  draftArchiveNoindexSitemapExclusionRuntimeVerified: boolean;
  noindexHeadersOrMetaRuntimeVerified: boolean;
  canonicalTagsUseTenantPrimaryHost: boolean;
  customDomainRouteTestsPassed: boolean;
  duplicateCanonicalRuntimeTestsPassed: boolean;
  deploymentDomainProofAvailable: boolean;
}

export const canonicalDomainRuntimeRequiredControls = [
      "Resolve tenant canonical policy for every public request before rendering canonical metadata or sitemap output.",
      "Reject or redirect unregistered hosts and enforce tenant primary-host canonical URLs.",
      "Force HTTPS where tenant domain policy requires it.",
      "Execute persisted tenant-scoped SeoRedirect records with their configured status codes.",
      "Exclude draft, archived, private, and noindex content from sitemap output at runtime.",
      "Assert noindex headers or metadata on private/noindex routes.",
      "Prove deployment primary and allowed domains match tenant configuration.",
] as const;

export const canonicalDomainRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/web build",
      "custom-domain canonical/redirect route tests",
      "runtime sitemap exclusion and noindex route tests",
      "duplicate canonical runtime tests",
] as const;

export interface CanonicalDomainRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof canonicalDomainRuntimeRequiredCommands;
  requiredEvidence: readonly CanonicalDomainRuntimeRequiredEvidence[];
  requiredControls: typeof canonicalDomainRuntimeRequiredControls;
  blockers: readonly string[];
}

export const canonicalDomainRuntimeRequiredEvidence = [
      "public middleware/route canonical policy and allowed-host validation evidence",
      "tenant domain and SeoRedirect repository runtime evidence",
      "HTTPS/canonical host redirect, status-code, and canonical tag evidence",
      "sitemap exclusion, noindex, and duplicate canonical runtime test evidence",
      "custom-domain route test and deployment-domain proof evidence",
] as const;

export type CanonicalDomainRuntimeRequiredEvidence = typeof canonicalDomainRuntimeRequiredEvidence[number];

export interface StructuredDataCrawlQaReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  webBuildPassed: boolean;
  renderedPageCrawlerConfigured: boolean;
  renderedJsonLdExtractionImplemented: boolean;
  publicPageInventoryConfigured: boolean;
  googleRichResultsCompatibleChecksPassed: boolean;
  structuredDataCriticalErrorsAbsent: boolean;
  unsupportedSchemaWarningsReviewed: boolean;
  demoContentReplacedOrDocumented: boolean;
  sitemapCanonicalCrawlPassed: boolean;
  canonicalUrlConsistencyVerified: boolean;
  robotsNoindexCrawlVerified: boolean;
  crawlArtifactsCaptured: boolean;
  closeoutEvidenceAttached: boolean;
}

export interface StructuredDataCrawlQaReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof structuredDataCrawlQaRequiredCommands;
  requiredEvidence: readonly StructuredDataCrawlQaRequiredEvidence[];
  requiredControls: typeof structuredDataCrawlQaRequiredControls;
  blockers: readonly string[];
}

export const structuredDataCrawlQaRequiredCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web build",
  "rendered public-page JSON-LD crawl",
  "Google Rich Results-compatible structured-data validation",
  "sitemap/canonical/robots/noindex crawl QA",
] as const;

export const structuredDataCrawlQaRequiredControls = [
  "Extract JSON-LD from rendered public pages instead of relying only on helper snapshots.",
  "Run Google Rich Results-compatible validation for supported schema types.",
  "Review unsupported schema warnings and remove or document intentionally unsupported fields.",
  "Replace demo schema content with production data or document remaining demo fields before launch.",
  "Crawl sitemap, canonical URLs, robots, and noindex outputs together to catch indexing contradictions.",
  "Attach crawl artifacts and structured-data validation reports to the launch closeout.",
] as const;

export const structuredDataCrawlQaRequiredEvidence = [
  "rendered-page crawler, JSON-LD extraction, and public page inventory evidence",
  "Google Rich Results-compatible validation and unsupported-schema review evidence",
  "production/demo content, sitemap, canonical, robots, and noindex crawl evidence",
  "crawl artifact capture and closeout attachment evidence",
] as const;

export type StructuredDataCrawlQaRequiredEvidence = typeof structuredDataCrawlQaRequiredEvidence[number];

export interface TenantCanonicalDomain {
  tenantId: string;
  tenantSlug: string;
  primaryHost: string;
  allowedHosts: string[];
  forceHttps?: boolean;
}

export interface SeoRedirectRule {
  tenantId: string;
  fromPath: string;
  toPath: string;
  statusCode: SeoRedirectStatusCode;
  isActive: boolean;
}

export interface TenantCanonicalPolicyInput {
  requestHost: string;
  requestPath: string;
  tenantSlug: string;
  tenantId: string;
  domains: TenantCanonicalDomain[];
  routes: SeoRouteRecord[];
  protocol?: "http" | "https";
}

export interface TenantCanonicalPolicyResult {
  tenantId: string;
  tenantSlug: string;
  requestedHost: string;
  canonicalHost: string;
  canonicalPath: string;
  canonicalUrl: string;
  hostAllowed: boolean;
  shouldRedirectHost: boolean;
  shouldForceHttps: boolean;
  duplicateCanonicalPaths: string[];
  sitemapEntries: SitemapEntryDraft[];
  noindexPaths: string[];
  blockers: string[];
}

export interface SeoRedirectDecisionInput {
  tenantId: string;
  path: string;
  route?: SeoRouteRecord;
  rules: SeoRedirectRule[];
}

export interface SeoRedirectDecision {
  action: SeoRedirectDecisionAction;
  tenantId: string;
  path: string;
  destinationPath?: string;
  statusCode?: SeoRedirectStatusCode;
  reason: string;
  shouldIndex: boolean;
}

export interface SearchConsolePropertyDraft {
  siteUrl: string;
  propertyType: "url_prefix" | "domain";
  verificationMethod: "html_file" | "dns_txt" | "meta_tag";
  status: "credential_gated";
  nextAction: string;
}

export type SearchConsoleOperation = "verify_property" | "submit_sitemap" | "import_query_pages" | "monitor_indexing";
export type SearchConsolePlanStatus = "ready" | "blocked";

export interface SearchConsoleOperationInput {
  operation: SearchConsoleOperation;
  tenantId: string;
  tenantSlug: string;
  siteUrl: string;
  sitemapUrl?: string;
  propertyOwnerTenantId?: string;
  credentialsConfigured: boolean;
  serviceAccountEmail?: string;
  OAuthClientConfigured?: boolean;
  verificationMethod?: SearchConsolePropertyDraft["verificationMethod"];
  dateRangeDays?: number;
}

export interface SearchConsoleOperationStep {
  id: string;
  summary: string;
  providerEndpoint: string;
  requiresCredential: boolean;
  writesTenantData: boolean;
}

export interface SearchConsoleOperationPlan {
  status: SearchConsolePlanStatus;
  operation: SearchConsoleOperation;
  tenantId: string;
  tenantSlug: string;
  siteUrl: string;
  sitemapUrl?: string;
  propertyType: SearchConsolePropertyDraft["propertyType"];
  verificationMethod: SearchConsolePropertyDraft["verificationMethod"];
  canExecuteProviderCall: boolean;
  requiresCredential: true;
  requiresTenantOwnershipCheck: true;
  shouldStoreImportedRows: boolean;
  blockers: string[];
  steps: SearchConsoleOperationStep[];
  requiredEnv: string[];
  dashboardStatus: "not_configured" | "ready_for_provider" | "tenant_mismatch";
}

export interface SearchConsoleRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  providerRoutesImplemented: boolean;
  backgroundJobsImplemented: boolean;
  credentialsConfigured: boolean;
  OAuthOrServiceAccountFlowImplemented: boolean;
  tenantOwnershipPersistenceAvailable: boolean;
  tenantOwnershipChecksEnforced: boolean;
  verifiedPropertyProofAvailable: boolean;
  sitemapSubmissionImplemented: boolean;
  sitemapSubmittedForVerifiedProperty: boolean;
  queryPageImportImplemented: boolean;
  importedRowsPersisted: boolean;
  indexingMonitoringImplemented: boolean;
  dashboardStatusImplemented: boolean;
  approvedFixtureTestsPassed: boolean;
  providerSandboxOrTestPropertyPassed: boolean;
  auditLogPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
}

export const searchConsoleRuntimeRequiredControls = [
      "Execute Search Console operations only through credential-managed provider routes or jobs.",
      "Persist tenant property ownership and verify tenant ownership before property, sitemap, import, or monitoring operations.",
      "Submit sitemaps only for verified properties owned by the tenant.",
      "Persist imported query/page rows tenant-safely with idempotency and audit logs.",
      "Expose dashboard status for not-configured, tenant-mismatch, ready-for-provider, submitted, imported, and monitoring states.",
      "Use approved fixtures or verified test-property executions before production SEO operations.",
] as const;

export const searchConsoleRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "Search Console provider route tests",
      "Search Console background job tests",
      "verified test-property sitemap submission smoke",
      "Search Console query/page import fixture tests",
      "dashboard Search Console status tests",
] as const;

export interface SearchConsoleRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof searchConsoleRuntimeRequiredCommands;
  requiredEvidence: readonly SearchConsoleRuntimeRequiredEvidence[];
  requiredControls: typeof searchConsoleRuntimeRequiredControls;
  blockers: readonly string[];
}

export const searchConsoleRuntimeRequiredEvidence = [
      "credential-managed provider route/job execution evidence",
      "tenant ownership persistence, ownership checks, and verified property proof evidence",
      "verified-property sitemap submission evidence",
      "query/page import, persisted rows, indexing monitoring, and dashboard status evidence",
      "fixture/provider execution, audit, and idempotency evidence",
] as const;

export type SearchConsoleRuntimeRequiredEvidence = typeof searchConsoleRuntimeRequiredEvidence[number];

export interface SeoAutomatedTestReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  seoPackageTestsPassed: boolean;
  seoPackageTypecheckPassed: boolean;
  routeRecordTestsPassed: boolean;
  sitemapGenerationTestsPassed: boolean;
  metadataDraftTestsPassed: boolean;
  auditTestsPassed: boolean;
  contentBriefTestsPassed: boolean;
  internalLinkTestsPassed: boolean;
  jsonLdGraphTestsPassed: boolean;
  imagePipelineTestsPassed: boolean;
  canonicalRedirectTestsPassed: boolean;
  searchConsolePlanTestsPassed: boolean;
  webSitemapRouteTestsPassed: boolean;
  seoPreviewRouteTestsPassed: boolean;
  sitemapPreviewRouteTestsPassed: boolean;
  structuredDataSnapshotTestsPassed: boolean;
  runtimeBuildEvidenceCoveredByGap076: boolean;
  crawlEvidenceCoveredByGap073: boolean;
  ciRunsSeoTestGate: boolean;
}

export const seoAutomatedTestReadinessRequiredCommands = [
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
      "SEO preview route tests",
      "sitemap preview route tests",
      "CI SEO package and preview route test gate",
] as const;

export interface SeoAutomatedTestReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof seoAutomatedTestReadinessRequiredCommands;
  requiredEvidence: readonly SeoAutomatedTestReadinessRequiredEvidence[];
  requiredSuites: readonly string[];
  blockers: readonly string[];
}

export const seoAutomatedTestReadinessRequiredEvidence = [
      "route record, sitemap, metadata, and audit test output",
      "content brief, internal-link, JSON-LD, and structured-data snapshot test output",
      "image pipeline, canonical/redirect, and Search Console planner test output",
      "web sitemap, SEO preview, and sitemap preview route test output",
      "linked GAP-073/GAP-076 runtime evidence and CI SEO test-gate evidence",
] as const;

export type SeoAutomatedTestReadinessRequiredEvidence = typeof seoAutomatedTestReadinessRequiredEvidence[number];

export interface SeoTechnicalAuditInput {
  baseUrl: string;
  routes: SeoRouteRecord[];
  jsonLdGraphs?: JsonLd[];
}

export interface SeoTechnicalAuditSummary {
  status: "pass" | "warn" | "fail";
  routeCount: number;
  sitemapEntryCount: number;
  duplicateSitemapUrls: string[];
  findings: SeoIssue[];
}

export interface JsonLdValidationInput {
  graph: JsonLd | JsonLd[];
  sourcePath: string;
}

export interface JsonLdValidationResult {
  sourcePath: string;
  status: "pass" | "warn" | "fail";
  itemCount: number;
  types: string[];
  findings: SeoIssue[];
}

export interface RenderedJsonLdScriptExtraction {
  readonly index: number;
  readonly rawLength: number;
  readonly graphs: readonly JsonLd[];
  readonly parseError?: string;
}

export interface RenderedJsonLdExtractionResult {
  readonly status: "ready" | "blocked";
  readonly scriptCount: number;
  readonly graphs: readonly JsonLd[];
  readonly scripts: readonly RenderedJsonLdScriptExtraction[];
  readonly blockers: readonly string[];
}

export type PublicWebSurfaceKind = "page" | "api" | "webhook" | "metadata";
export type PublicWebBackingMode = "static_demo" | "local_runtime" | "database" | "provider";
export type PublicWebReadinessStatus = "ready" | "blocked";

export interface PublicWebSurfaceRequirement {
  id: string;
  path: string;
  kind: PublicWebSurfaceKind;
  backingMode: PublicWebBackingMode;
  hasRouteTest: boolean;
  requiresDatabase: boolean;
  requiresProvider: boolean;
  placeholderAssetsPresent?: boolean;
}

export interface PublicWebReadinessInput {
  surfaces: readonly PublicWebSurfaceRequirement[];
  packageScripts: Readonly<Record<string, string>>;
  buildVerified: boolean;
  typecheckVerified: boolean;
  accessibilityAuditVerified: boolean;
  performanceAuditVerified: boolean;
  runtimePersistenceConfigured: boolean;
  realPortfolioAssetsConfigured: boolean;
}

export const publicWebReadinessRequiredControls = [
      "Keep static-demo and local-runtime responses explicitly labeled until database persistence is wired.",
      "Smoke every public page, public API route, provider webhook, sitemap, robots, and JSON-LD output before launch.",
      "Replace placeholder portfolio/media assets with scanned FileAsset-backed derivatives.",
      "Verify accessibility, mobile responsiveness, SEO metadata, sitemap, robots, and performance budgets.",
      "Persist booking, payment, upload, notification, privacy, and observability records tenant-safely before production.",
] as const;

export const publicWebReadinessRequiredCommands = [
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test",
      "pnpm test:e2e --project=web-chromium",
      "pnpm test:e2e --project=web-mobile",
] as const;

export interface PublicWebReadinessPlan {
  status: PublicWebReadinessStatus;
  surfaceCount: number;
  staticDemoSurfaceCount: number;
  localRuntimeSurfaceCount: number;
  databaseBackedSurfaceCount: number;
  providerBackedSurfaceCount: number;
  untestedSurfaces: readonly string[];
  placeholderAssetSurfaces: readonly string[];
  requiredCommands: typeof publicWebReadinessRequiredCommands;
  requiredControls: typeof publicWebReadinessRequiredControls;
  blockers: readonly string[];
}

export interface PublicWebLaunchEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  webRouteSmokePassed: boolean;
  webPlaywrightDesktopPassed: boolean;
  webPlaywrightMobilePassed: boolean;
  accessibilityAuditPassed: boolean;
  lighthousePerformancePassed: boolean;
  apiRoutesUseTenantScopedPersistence: boolean;
  providerBackedRoutesVerified: boolean;
  localRuntimeFallbackDisabledForProduction: boolean;
  realPortfolioDerivativesConfigured: boolean;
  placeholderAssetsRemovedOrDocumented: boolean;
  sitemapRuntimeVerified: boolean;
  robotsRuntimeVerified: boolean;
  jsonLdRuntimeVerified: boolean;
  canonicalRuntimeVerified: boolean;
  privacyAndLegalRoutesReviewed: boolean;
  ciEvidenceCaptured: boolean;
  launchArtifactsSecretSafe: boolean;
}

export const publicWebLaunchEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test",
      "pnpm test:e2e --project=web-chromium",
      "pnpm test:e2e --project=web-mobile",
      "axe accessibility audit for public routes",
      "Lighthouse performance audit for public launch routes",
      "runtime sitemap/robots/JSON-LD/canonical validation",
      "GitHub Actions public web launch evidence job",
] as const;

export interface PublicWebLaunchEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof publicWebLaunchEvidenceRequiredCommands;
  requiredEvidence: readonly PublicWebLaunchEvidenceRequiredEvidence[];
  blockers: readonly string[];
}

export const publicWebLaunchEvidenceRequiredEvidence = [
      "web typecheck, build, and route smoke output",
      "desktop/mobile Playwright, accessibility, and Lighthouse/performance evidence",
      "tenant-scoped persistence, provider-backed route, and production local-runtime fallback evidence",
      "real scanned media derivative evidence and placeholder asset disposition",
      "runtime sitemap, robots, rendered JSON-LD, and canonical validation evidence",
      "legal-route review, CI, and secret-safe launch artifact evidence",
] as const;

export type PublicWebLaunchEvidenceRequiredEvidence = typeof publicWebLaunchEvidenceRequiredEvidence[number];

export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

export function createCanonicalUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${normalizePath(path)}`;
}

export function clampSitemapPriority(priority: number): number {
  if (priority < 0) return 0;
  if (priority > 1) return 1;
  return Number(priority.toFixed(2));
}

export function createSeoRouteRecord(input: {
  path: string;
  kind: SeoRouteKind;
  title: string;
  description: string;
  status?: SeoPublicationStatus;
  indexMode?: SeoIndexMode;
  priority?: number;
  changeFrequency?: SeoChangeFrequency;
  lastModified?: string;
  tenantSlug?: string;
  city?: string;
  region?: string;
  style?: string;
  relatedPortfolioIds?: string[];
  revalidationTags?: string[];
}): SeoRouteRecord {
  const canonicalPath = normalizePath(input.path);
  return {
    path: canonicalPath,
    kind: input.kind,
    title: input.title,
    description: input.description,
    canonicalPath,
    status: input.status ?? "static_demo",
    indexMode: input.indexMode ?? "index",
    priority: clampSitemapPriority(input.priority ?? 0.7),
    changeFrequency: input.changeFrequency ?? "monthly",
    lastModified: input.lastModified ?? new Date().toISOString(),
    ...(input.tenantSlug ? { tenantSlug: input.tenantSlug } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.region ? { region: input.region } : {}),
    ...(input.style ? { style: input.style } : {}),
    ...(input.relatedPortfolioIds ? { relatedPortfolioIds: input.relatedPortfolioIds } : {}),
    revalidationTags: input.revalidationTags ?? [`seo:path:${canonicalPath}`],
  };
}

export function buildMetadataDraft(input: {
  route: SeoRouteRecord;
  baseUrl: string;
  image?: { url: string; alt: string };
  type?: "website" | "article" | "profile";
}): SeoMetadataDraft {
  const canonicalUrl = createCanonicalUrl(input.baseUrl, input.route.canonicalPath);
  return {
    title: input.route.title,
    description: input.route.description,
    canonicalUrl,
    openGraph: {
      title: input.route.title,
      description: input.route.description,
      url: canonicalUrl,
      type: input.type ?? "website",
      images: input.image ? [input.image] : [],
    },
    robots: {
      index: input.route.indexMode === "index",
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function routeToSitemapEntry(route: SeoRouteRecord, baseUrl: string): SitemapEntryDraft | undefined {
  if (route.indexMode === "noindex" || route.status === "draft" || route.status === "archived") return undefined;
  return {
    url: createCanonicalUrl(baseUrl, route.canonicalPath),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  };
}

export function buildSitemapPlan(input: { baseUrl: string; routes: SeoRouteRecord[]; generatedAt?: string }): SitemapPlan {
  const entries = input.routes
    .map((route) => routeToSitemapEntry(route, input.baseUrl))
    .filter((entry): entry is SitemapEntryDraft => Boolean(entry));
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    baseUrl: input.baseUrl,
    indexableCount: entries.length,
    noindexCount: input.routes.length - entries.length,
    entries,
  };
}

export function auditSeoRoute(route: SeoRouteRecord): SeoAuditResult {
  const issues: SeoIssue[] = [];
  const passedChecks: string[] = [];

  if (route.title.length < 30 || route.title.length > 65) {
    issues.push({
      code: "TITLE_LENGTH",
      severity: "warning",
      field: "title",
      message: `Title length is ${route.title.length}; target a concise, descriptive title near 30-65 characters.`,
      nextAction: "Revise the title before publishing from the SEO dashboard.",
    });
  } else {
    passedChecks.push("title_length");
  }

  if (route.description.length < 80 || route.description.length > 160) {
    issues.push({
      code: "META_DESCRIPTION_LENGTH",
      severity: "warning",
      field: "description",
      message: `Meta description length is ${route.description.length}; target roughly 80-160 characters for the snippet draft.`,
      nextAction: "Rewrite the description to mention city/style intent and booking value.",
    });
  } else {
    passedChecks.push("meta_description_length");
  }

  if (!route.canonicalPath.startsWith("/")) {
    issues.push({
      code: "CANONICAL_PATH_FORMAT",
      severity: "error",
      field: "canonicalPath",
      message: "Canonical path must start with a slash.",
      nextAction: "Normalize canonicalPath using normalizePath before saving.",
    });
  } else {
    passedChecks.push("canonical_path_format");
  }

  if (route.kind === "city" && (!route.city || !route.region)) {
    issues.push({
      code: "CITY_CONTEXT_MISSING",
      severity: "error",
      message: "City landing pages need city and region context for local SEO and schema composition.",
      nextAction: "Attach the TravelCity/SeoCityPage record before publishing.",
    });
  } else if (route.kind !== "city" || (route.city && route.region)) {
    passedChecks.push("local_context");
  }

  if (route.indexMode === "noindex" && route.priority > 0) {
    issues.push({
      code: "NOINDEX_PRIORITY",
      severity: "info",
      message: "Noindex routes should not be included in public sitemap output.",
      nextAction: "Confirm this route is intentionally omitted from sitemap generation.",
    });
  }

  const penalty = issues.reduce((total, issue) => total + (issue.severity === "error" ? 30 : issue.severity === "warning" ? 12 : 4), 0);
  return {
    path: route.path,
    score: Math.max(0, 100 - penalty),
    indexMode: route.indexMode,
    issues,
    passedChecks,
  };
}

export function buildInternalLinkPlan(routes: SeoRouteRecord[]): InternalLinkSuggestion[] {
  const home = routes.find((route) => route.path === "/");
  const booking = routes.find((route) => route.kind === "booking");
  const cityRoutes = routes.filter((route) => route.kind === "city");
  const styleRoutes = routes.filter((route) => route.kind === "style");
  const suggestions: InternalLinkSuggestion[] = [];

  for (const city of cityRoutes) {
    if (home) {
      suggestions.push({
        fromPath: home.path,
        toPath: city.path,
        anchorText: `${city.city ?? "Upcoming city"} tattoo availability`,
        reason: "Homepage should pass authority to active travel/city landing pages.",
        priority: "high",
      });
    }
    if (booking) {
      suggestions.push({
        fromPath: city.path,
        toPath: booking.path,
        anchorText: `Request a ${city.city ?? "travel"} appointment`,
        reason: "City landing pages must convert search traffic into booking requests or waitlist joins.",
        priority: "high",
      });
    }
  }

  for (const style of styleRoutes) {
    if (booking) {
      suggestions.push({
        fromPath: style.path,
        toPath: booking.path,
        anchorText: `Book a ${(style.style ?? "style").toString()} tattoo consultation`,
        reason: "Style pages should provide a direct booking call to action even before city landing pages are available.",
        priority: "high",
      });
    }
    for (const city of cityRoutes.slice(0, 3)) {
      suggestions.push({
        fromPath: style.path,
        toPath: city.path,
        anchorText: `${(style.title.split("|")[0] ?? style.title).trim()} in ${city.city ?? city.region ?? "upcoming cities"}`,
        reason: "Style pages should connect search intent to active travel availability.",
        priority: "medium",
      });
    }
  }

  return suggestions;
}

export function deriveImageSeoFields(item: PortfolioItem): SeoImageFields {
  const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stylePart = item.styles.join("-").replace(/_/g, "-");
  return {
    imageUrl: item.imageUrl,
    altText: item.altText,
    caption: item.caption,
    filenameHint: `${normalizedTitle}-${stylePart}-${item.placement}-${item.freshness}.jpg`,
    structuredData: buildPortfolioImageSchema(item),
  };
}

function imageDerivativeLabel(width: number): SeoImageDerivativePlan["label"] {
  if (width <= 320) return "thumbnail";
  if (width <= 768) return "card";
  if (width <= 1280) return "hero";
  return "open_graph";
}

function buildBlurPlaceholderDataUrl(item: PortfolioItem, width: number): string {
  const seed = `${item.tenantId}:${item.id}:${item.freshness}:${width}`;
  const hue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="10" viewBox="0 0 16 10"><rect width="16" height="10" fill="hsl(${hue} 28% 18%)"/><path d="M0 8C4 4 7 6 10 2c2 2 4 3 6 2v6H0z" fill="hsl(${(hue + 34) % 360} 34% 34%)" opacity=".72"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

export function buildSeoImagePipelinePlan(input: SeoImagePipelineInput): SeoImagePipelinePlan {
  const seo = deriveImageSeoFields(input.item);
  const widths = input.widths ?? [320, 768, 1280, 1600];
  const formats = input.formats ?? ["webp", "avif"];
  const cacheControl = "public, max-age=31536000, immutable";
  const blockers: string[] = [];

  if (!input.sourceObjectKey.trim()) blockers.push("Source object key is required before image derivative processing.");
  if (input.sourceAcl !== "private") blockers.push("Original portfolio uploads must remain private; only reviewed derivatives may be public.");
  if (!seo.altText.trim()) blockers.push("Reviewed alt text is required before publishing image derivatives.");
  if (!seo.caption.trim()) blockers.push("Reviewed caption is required before publishing image derivatives.");

  const baseKey = `${trimSlashes(input.tenantSlug)}/portfolio/${input.item.id}/${seo.filenameHint.replace(/\.[^.]+$/, "")}`;
  const publicBase = input.cdnBaseUrl ? trimSlashes(input.cdnBaseUrl) : undefined;
  const derivatives = widths.flatMap((width) =>
    formats.map((format) => {
      const objectKey = `${baseKey}-${width}w.${format}`;
      return {
        label: imageDerivativeLabel(width),
        width,
        format,
        objectKey,
        ...(publicBase ? { publicUrl: `${publicBase}/${objectKey}` } : {}),
        blurDataUrl: buildBlurPlaceholderDataUrl(input.item, width),
        acl: "public" as const,
        cacheControl,
      };
    }),
  );

  return {
    tenantId: input.item.tenantId,
    tenantSlug: input.tenantSlug,
    portfolioItemId: input.item.id,
    filenameHint: seo.filenameHint,
    altText: seo.altText,
    caption: seo.caption,
    sourceObjectKey: input.sourceObjectKey,
    sourceAcl: input.sourceAcl,
    sourceRemainsPrivate: input.sourceAcl === "private",
    requiresExifStrip: true,
    requiresDimensionProbe: true,
    requiresBlurPlaceholder: true,
    requiresDerivativePersistence: true,
    cacheControl,
    derivatives,
    blockers,
    generatedAt: input.now ?? new Date().toISOString(),
  };
}

export function buildSeoImagePipelineRuntimeReadinessPlan(input: SeoImagePipelineRuntimeReadinessInput): SeoImagePipelineRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SeoImagePipelineRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo image pipeline tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.imageProcessingWorkerImplemented) blockers.push("Image processing worker evidence must be captured before image pipeline readiness.");
  if (!input.storageProviderConfigured) blockers.push("Storage provider must be configured for image pipeline jobs.");
  if (!input.sourceDimensionProbeImplemented) blockers.push("Source image dimension probing evidence must be captured before image pipeline readiness.");
  if (!input.exifStrippingImplemented) blockers.push("EXIF stripping evidence must be captured before public derivative creation readiness.");
  if (!input.responsiveDerivativeGenerationImplemented) blockers.push("Responsive WebP/AVIF/JPEG derivative generation evidence must be captured before image pipeline readiness.");
  if (!input.blurPlaceholderGenerationImplemented) blockers.push("Blur placeholder generation proof must be captured for storage-backed derivatives.");
  if (!input.fileAssetPersistenceAvailable) blockers.push("FileAsset persistence must be available for source and derivative records.");
  if (!input.portfolioImagePersistenceAvailable) blockers.push("PortfolioImage persistence must be available for SEO image metadata.");
  if (!input.derivativeMetadataPersistenceAvailable) blockers.push("Derivative metadata persistence must be available.");
  if (!input.privateOriginalAclEnforced) blockers.push("Private original ACL enforcement must be verified.");
  if (!input.publicDerivativeAclEnforced) blockers.push("Public derivative ACL enforcement must be verified.");
  if (!input.cdnCacheHeadersConfigured) blockers.push("CDN cache headers must be configured for public derivatives.");
  if (!input.immutableDerivativeUrlsConfigured) blockers.push("Immutable derivative URLs or object keys must be configured.");
  if (!input.uploadImageProcessingTestsPassed) blockers.push("Upload/image processing tests must pass.");
  if (!input.privateOriginalAccessTestsPassed) blockers.push("Private original access tests must pass.");
  if (!input.publicDerivativeLoadTestsPassed) blockers.push("Public derivative load tests must pass.");
  if (!input.cdnHeaderTestsPassed) blockers.push("CDN cache header tests must pass.");
  if (!input.lighthouseImageAuditPassed) blockers.push("Lighthouse image optimization audit must pass.");

  if (!input.imageProcessingWorkerImplemented || !input.storageProviderConfigured || !input.uploadImageProcessingTestsPassed) {
    requiredEvidence.push(seoImagePipelineRequiredEvidence[0]);
  }
  if (!input.sourceDimensionProbeImplemented || !input.exifStrippingImplemented || !input.responsiveDerivativeGenerationImplemented || !input.blurPlaceholderGenerationImplemented) {
    requiredEvidence.push(seoImagePipelineRequiredEvidence[1]);
  }
  if (!input.fileAssetPersistenceAvailable || !input.portfolioImagePersistenceAvailable || !input.derivativeMetadataPersistenceAvailable) {
    requiredEvidence.push(seoImagePipelineRequiredEvidence[2]);
  }
  if (!input.privateOriginalAclEnforced || !input.publicDerivativeAclEnforced || !input.privateOriginalAccessTestsPassed || !input.publicDerivativeLoadTestsPassed) {
    requiredEvidence.push(seoImagePipelineRequiredEvidence[3]);
  }
  if (!input.cdnCacheHeadersConfigured || !input.immutableDerivativeUrlsConfigured || !input.cdnHeaderTestsPassed || !input.lighthouseImageAuditPassed) {
    requiredEvidence.push(seoImagePipelineRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: seoImagePipelineRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === seoImagePipelineRequiredEvidence.length
        ? seoImagePipelineRequiredEvidence
        : requiredEvidence,
    requiredControls: seoImagePipelineRequiredControls,
    blockers,
  };
}

export function buildCitySeoBrief(args: {
  cityPage: Pick<SeoCityPage, "slug" | "city" | "region" | "country" | "title" | "metaDescription" | "canonicalPath">;
  artist: ArtistProfile;
  travelStops: TravelStop[];
  portfolioItems: PortfolioItem[];
}): SeoContentBrief {
  const matchingStops = args.travelStops.filter((stop) => stop.city === args.cityPage.city && stop.region === args.cityPage.region);
  const matchingPortfolio = args.portfolioItems.filter((item) => item.city === args.cityPage.city);
  const route = createSeoRouteRecord({
    path: args.cityPage.canonicalPath,
    kind: "city",
    title: args.cityPage.title,
    description: args.cityPage.metaDescription,
    city: args.cityPage.city,
    region: args.cityPage.region,
    relatedPortfolioIds: matchingPortfolio.map((item) => item.id),
  });
  return {
    slug: args.cityPage.slug,
    title: args.cityPage.title,
    metaDescription: args.cityPage.metaDescription,
    h1: `${args.artist.displayName} tattoo booking in ${args.cityPage.city}`,
    canonicalPath: route.canonicalPath,
    primaryKeyword: `${args.cityPage.city} tattoo artist`,
    secondaryKeywords: [
      `${args.cityPage.city} guest spot tattoo`,
      `${args.cityPage.city} blackwork tattoo`,
      `${args.cityPage.city} ornamental tattoo`,
      `${args.cityPage.city} fine line tattoo`,
    ],
    recommendedSections: [
      "Current booking status and travel dates",
      "Best-fit tattoo styles for this city",
      "Featured portfolio pieces with city/style metadata",
      "Deposit and cancellation expectations",
      "Travel waitlist and guest spot call to action",
      matchingStops.length > 0 ? "Structured travel event details" : "Future travel interest capture",
    ],
    schemaTypes: ["Person", "TattooParlor", "Service", "Event", "FAQPage", "ImageObject"],
    internalLinks: buildInternalLinkPlan([route, createSeoRouteRecord({ path: "/booking", kind: "booking", title: "Booking request", description: "Request a tattoo appointment." })]),
    analyticsEvents: [
      { name: "seo_page_viewed", path: route.path, city: args.cityPage.city },
      { name: "seo_city_waitlist_clicked", path: route.path, city: args.cityPage.city },
    ],
  };
}

export function buildStyleSeoBrief(args: {
  stylePage: Pick<SeoStylePage, "slug" | "styleName" | "title" | "metaDescription" | "canonicalPath">;
  artist: ArtistProfile;
  portfolioItems: PortfolioItem[];
  cityRoutes?: SeoRouteRecord[];
}): SeoContentBrief {
  const styleKey = args.stylePage.styleName.toLowerCase().replace(/\s+/g, "_");
  const normalizedStyleName = args.stylePage.styleName.toLowerCase();
  const matchingPortfolio = args.portfolioItems.filter((item) => item.styles.some((style) => style === styleKey));
  const route = createSeoRouteRecord({
    path: args.stylePage.canonicalPath,
    kind: "style",
    title: args.stylePage.title,
    description: args.stylePage.metaDescription,
    style: args.stylePage.styleName,
    relatedPortfolioIds: matchingPortfolio.map((item) => item.id),
  });
  return {
    slug: args.stylePage.slug,
    title: args.stylePage.title,
    metaDescription: args.stylePage.metaDescription,
    h1: `${args.stylePage.styleName} tattoos by ${args.artist.displayName}`,
    canonicalPath: route.canonicalPath,
    primaryKeyword: `${args.stylePage.styleName} tattoo artist`,
    secondaryKeywords: [
      `${normalizedStyleName} tattoo booking`,
      `${normalizedStyleName} tattoo portfolio`,
      `healed ${normalizedStyleName} tattoo examples`,
    ],
    recommendedSections: [
      "Style overview and fit criteria",
      "Placement and sizing guidance",
      "Healed/fresh portfolio examples",
      "Best city/travel windows for this style",
      "Booking readiness checklist",
    ],
    schemaTypes: ["Person", "Service", "ImageObject", "FAQPage"],
    internalLinks: buildInternalLinkPlan([route, ...(args.cityRoutes ?? []), createSeoRouteRecord({ path: "/booking", kind: "booking", title: "Booking request", description: "Request a tattoo appointment." })]),
    analyticsEvents: [
      { name: "seo_page_viewed", path: route.path, style: args.stylePage.styleName },
      { name: "seo_style_booking_clicked", path: route.path, style: args.stylePage.styleName },
    ],
  };
}

export function buildRevalidationPlan(input: { reason: string; routes: SeoRouteRecord[]; contentIds?: string[] }): SeoRevalidationPlan {
  const paths = Array.from(new Set(input.routes.map((route) => route.path)));
  const routeTags = input.routes.flatMap((route) => route.revalidationTags);
  const contentTags = (input.contentIds ?? []).map((id) => `seo:content:${id}`);
  return {
    reason: input.reason,
    paths,
    tags: Array.from(new Set([...routeTags, ...contentTags])),
    requiresRuntime: true,
    providerBoundary: "next_revalidate_tag",
  };
}

export function buildSearchConsolePropertyDraft(siteUrl: string, propertyType: "url_prefix" | "domain" = "url_prefix"): SearchConsolePropertyDraft {
  return {
    siteUrl,
    propertyType,
    verificationMethod: propertyType === "domain" ? "dns_txt" : "html_file",
    status: "credential_gated",
    nextAction: "Verify ownership in Google Search Console, submit sitemap, and connect query/page metrics to the SEO dashboard.",
  };
}

function inferSearchConsolePropertyType(siteUrl: string): SearchConsolePropertyDraft["propertyType"] {
  return /^https?:\/\//i.test(siteUrl) ? "url_prefix" : "domain";
}

export function buildSearchConsoleOperationPlan(input: SearchConsoleOperationInput): SearchConsoleOperationPlan {
  const propertyType = inferSearchConsolePropertyType(input.siteUrl);
  const verificationMethod = input.verificationMethod ?? (propertyType === "domain" ? "dns_txt" : "html_file");
  const blockers: string[] = [];

  if (!input.tenantId.trim()) blockers.push("Tenant id is required before Search Console operations.");
  if (!input.tenantSlug.trim()) blockers.push("Tenant slug is required before Search Console operations.");
  if (!input.siteUrl.trim()) blockers.push("Search Console site URL or domain property is required.");
  if (!input.credentialsConfigured) blockers.push("Google Search Console credentials are not configured.");
  if (input.propertyOwnerTenantId && input.propertyOwnerTenantId !== input.tenantId) blockers.push("Search Console property belongs to a different tenant.");
  if (input.operation === "submit_sitemap" && !input.sitemapUrl) blockers.push("Sitemap submission requires a sitemap URL.");
  if (input.operation === "import_query_pages" && (input.dateRangeDays ?? 0) <= 0) blockers.push("Query/page import requires a positive date range.");

  const steps: SearchConsoleOperationStep[] = [];
  if (input.operation === "verify_property") {
    steps.push({
      id: "verify-property",
      summary: `Verify ${input.siteUrl} ownership using ${verificationMethod}.`,
      providerEndpoint: "searchconsole.sites.add / ownership verification",
      requiresCredential: true,
      writesTenantData: true,
    });
  } else if (input.operation === "submit_sitemap") {
    steps.push({
      id: "submit-sitemap",
      summary: `Submit sitemap ${input.sitemapUrl ?? "missing"} for ${input.siteUrl}.`,
      providerEndpoint: "searchconsole.sitemaps.submit",
      requiresCredential: true,
      writesTenantData: true,
    });
  } else if (input.operation === "import_query_pages") {
    steps.push({
      id: "import-query-pages",
      summary: `Import query/page performance for the last ${input.dateRangeDays ?? 0} day(s).`,
      providerEndpoint: "searchconsole.searchanalytics.query",
      requiresCredential: true,
      writesTenantData: true,
    });
  } else {
    steps.push({
      id: "monitor-indexing",
      summary: "Check sitemap/indexing status and surface dashboard alerts for coverage regressions.",
      providerEndpoint: "searchconsole.sitemaps.get / urlInspection.index.inspect",
      requiresCredential: true,
      writesTenantData: true,
    });
  }

  const tenantMismatch = blockers.some((blocker) => blocker.includes("different tenant"));
  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    operation: input.operation,
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    siteUrl: input.siteUrl,
    ...(input.sitemapUrl ? { sitemapUrl: input.sitemapUrl } : {}),
    propertyType,
    verificationMethod,
    canExecuteProviderCall: blockers.length === 0,
    requiresCredential: true,
    requiresTenantOwnershipCheck: true,
    shouldStoreImportedRows: input.operation === "import_query_pages" || input.operation === "monitor_indexing",
    blockers,
    steps,
    requiredEnv: ["GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL", "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY", "GOOGLE_SEARCH_CONSOLE_SITE_URL"],
    dashboardStatus: tenantMismatch ? "tenant_mismatch" : blockers.length === 0 ? "ready_for_provider" : "not_configured",
  };
}

function addTechnicalFinding(findings: SeoIssue[], input: Omit<SeoIssue, "severity" | "nextAction"> & { severity?: SeoIssueSeverity; nextAction?: string }): void {
  findings.push({
    severity: input.severity ?? "error",
    nextAction: input.nextAction ?? "Fix the SEO technical audit finding before treating the route as launch-ready.",
    code: input.code,
    message: input.message,
    ...(input.field ? { field: input.field } : {}),
  });
}

function findDuplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort();
}

function isJsonLdGraph(value: JsonLd): value is { "@graph": unknown[] } {
  return Array.isArray(value["@graph"]);
}

function decodeJsonLdScriptText(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function asRenderedJsonLdGraphs(value: unknown): JsonLd[] {
  if (Array.isArray(value)) return value.filter((item): item is JsonLd => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  if (value && typeof value === "object") return [value as JsonLd];
  return [];
}

export function extractRenderedJsonLdScriptsFromHtml(html: string): RenderedJsonLdExtractionResult {
  const scriptPattern = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const scripts: RenderedJsonLdScriptExtraction[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    const raw = decodeJsonLdScriptText(match[1] ?? "");
    try {
      const parsed = JSON.parse(raw) as unknown;
      const graphs = asRenderedJsonLdGraphs(parsed);
      scripts.push({
        index: scripts.length,
        rawLength: raw.length,
        graphs,
        ...(graphs.length === 0 ? { parseError: "JSON-LD script parsed but did not contain object graph entries." } : {}),
      });
    } catch (error) {
      scripts.push({
        index: scripts.length,
        rawLength: raw.length,
        graphs: [],
        parseError: error instanceof Error ? error.message : "JSON-LD parse failed.",
      });
    }
  }

  const graphs = scripts.flatMap((script) => script.graphs);
  const blockers = [
    scripts.length === 0 ? "Rendered HTML did not contain application/ld+json scripts." : null,
    scripts.some((script) => script.parseError) ? "One or more rendered JSON-LD scripts could not be parsed into object graph entries." : null,
    scripts.length > 0 && graphs.length === 0 ? "Rendered JSON-LD extraction produced no structured-data graph objects." : null,
  ].filter((blocker): blocker is string => blocker !== null);

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    scriptCount: scripts.length,
    graphs,
    scripts,
    blockers,
  };
}

function asJsonLdItems(graph: JsonLd | JsonLd[]): unknown[] {
  if (Array.isArray(graph)) return graph;
  if (isJsonLdGraph(graph)) return graph["@graph"];
  return [graph];
}

function hasTextField(item: Record<string, unknown>, field: string): boolean {
  return typeof item[field] === "string" && item[field].trim().length > 0;
}

function hasArrayField(item: Record<string, unknown>, field: string): boolean {
  return Array.isArray(item[field]) && (item[field] as unknown[]).length > 0;
}

function addJsonLdFinding(findings: SeoIssue[], input: Omit<SeoIssue, "nextAction"> & { nextAction?: string }): void {
  findings.push({
    ...input,
    nextAction: input.nextAction ?? "Fix structured data before treating rendered SEO output as launch-ready.",
  });
}

export function auditJsonLdRichResultCompatibility(input: JsonLdValidationInput): JsonLdValidationResult {
  const findings: SeoIssue[] = [];
  const items = asJsonLdItems(input.graph);
  const types: string[] = [];
  const requiredByType: Record<string, string[]> = {
    WebSite: ["name", "url"],
    WebPage: ["name", "description", "url"],
    Person: ["name", "description", "url"],
    Service: ["name", "description", "provider", "serviceType"],
    ImageObject: ["name", "contentUrl", "description"],
    Event: ["name", "startDate", "endDate", "location", "performer", "description"],
    Review: ["reviewRating", "author", "reviewBody", "datePublished"],
    FAQPage: ["mainEntity"],
    BreadcrumbList: ["itemListElement"],
  };
  const supportedTypes = new Set([...Object.keys(requiredByType), "TattooParlor"]);

  if (items.length === 0) {
    addJsonLdFinding(findings, {
      code: "JSON_LD_GRAPH_EMPTY",
      severity: "error",
      field: "jsonLd",
      message: `${input.sourcePath} rendered no structured data items.`,
    });
  }

  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      addJsonLdFinding(findings, {
        code: "JSON_LD_ITEM_INVALID",
        severity: "error",
        field: "jsonLd",
        message: `${input.sourcePath} contains a non-object structured data item.`,
      });
      continue;
    }

    const record = item as Record<string, unknown>;
    const rawType = record["@type"];
    const type = typeof rawType === "string" ? rawType : "";
    if (!type) {
      addJsonLdFinding(findings, {
        code: "JSON_LD_ITEM_TYPE_MISSING",
        severity: "error",
        field: "@type",
        message: `${input.sourcePath} contains a structured data item without @type.`,
      });
      continue;
    }

    types.push(type);
    if (!supportedTypes.has(type)) {
      addJsonLdFinding(findings, {
        code: "JSON_LD_TYPE_UNSUPPORTED",
        severity: "warning",
        field: "@type",
        message: `${input.sourcePath} uses unsupported schema type ${type}; confirm rich-result eligibility before launch.`,
        nextAction: "Replace unsupported schema type or document why it is retained outside rich-result eligibility.",
      });
      continue;
    }

    if (type === "TattooParlor") {
      addJsonLdFinding(findings, {
        code: "JSON_LD_TYPE_NOT_GOOGLE_RICH_RESULT",
        severity: "warning",
        field: "@type",
        message: "TattooParlor is schema.org vocabulary but not a Google rich-result type in this local compatibility gate.",
        nextAction: "Validate rendered LocalBusiness output with external rich-result/crawler tooling before launch.",
      });
    }

    for (const field of requiredByType[type] ?? []) {
      const ok = field === "mainEntity" || field === "itemListElement" ? hasArrayField(record, field) : Boolean(record[field]) && (typeof record[field] !== "string" || hasTextField(record, field));
      if (!ok) {
        addJsonLdFinding(findings, {
          code: "JSON_LD_REQUIRED_FIELD_MISSING",
          severity: "error",
          field,
          message: `${input.sourcePath} ${type} item is missing required field ${field}.`,
        });
      }
    }
  }

  const status = findings.some((finding) => finding.severity === "error") ? "fail" : findings.length > 0 ? "warn" : "pass";
  return {
    sourcePath: input.sourcePath,
    status,
    itemCount: items.length,
    types: Array.from(new Set(types)).sort(),
    findings,
  };
}

export function auditSeoTechnicalReadiness(input: SeoTechnicalAuditInput): SeoTechnicalAuditSummary {
  const findings: SeoIssue[] = [];
  const sitemap = buildSitemapPlan({ baseUrl: input.baseUrl, routes: input.routes });
  const duplicateSitemapUrls = findDuplicateValues(sitemap.entries.map((entry) => entry.url));

  for (const duplicate of duplicateSitemapUrls) {
    addTechnicalFinding(findings, {
      code: "DUPLICATE_SITEMAP_URL",
      field: "sitemap",
      message: `Duplicate sitemap URL detected: ${duplicate}.`,
      nextAction: "Deduplicate route canonical paths before publishing the sitemap.",
    });
  }

  for (const route of input.routes) {
    const metadata = buildMetadataDraft({ baseUrl: input.baseUrl, route });
    const expectedCanonical = createCanonicalUrl(input.baseUrl, route.canonicalPath);
    if (metadata.canonicalUrl !== expectedCanonical || metadata.alternates.canonical !== expectedCanonical || metadata.openGraph.url !== expectedCanonical) {
      addTechnicalFinding(findings, {
        code: "CANONICAL_METADATA_MISMATCH",
        field: "canonicalUrl",
        message: `Metadata canonical fields do not agree for ${route.path}.`,
      });
    }
    if (metadata.robots.index !== (route.indexMode !== "noindex")) {
      addTechnicalFinding(findings, {
        code: "ROBOTS_INDEX_MISMATCH",
        field: "robots",
        message: `Robots index flag does not match route indexMode for ${route.path}.`,
        nextAction: "Regenerate robots metadata from route.indexMode.",
      });
    }

    const routeAudit = auditSeoRoute(route);
    for (const issue of routeAudit.issues.filter((issue) => issue.severity === "error")) {
      findings.push(issue);
    }
  }

  for (const graph of input.jsonLdGraphs ?? []) {
    const richResultAudit = auditJsonLdRichResultCompatibility({ graph, sourcePath: "technical-audit" });
    findings.push(...richResultAudit.findings);

    if (!isJsonLdGraph(graph)) {
      addTechnicalFinding(findings, {
        code: "JSON_LD_GRAPH_EMPTY",
        field: "jsonLd",
        message: "JSON-LD graph must include at least one schema item.",
        nextAction: "Render JSON-LD as a graph with schema.org items.",
      });
      continue;
    }
    for (const item of graph["@graph"]) {
      if (!item || typeof item !== "object" || !("@type" in item)) {
        addTechnicalFinding(findings, {
          code: "JSON_LD_ITEM_TYPE_MISSING",
          field: "jsonLd",
          message: "Every JSON-LD graph item must include @type.",
          nextAction: "Add a schema.org @type to each structured data object.",
        });
      }
    }
  }

  const status = findings.some((finding) => finding.severity === "error") ? "fail" : findings.some((finding) => finding.severity === "warning") ? "warn" : "pass";
  return {
    status,
    routeCount: input.routes.length,
    sitemapEntryCount: sitemap.entries.length,
    duplicateSitemapUrls,
    findings,
  };
}

export function buildPublicWebReadinessPlan(input: PublicWebReadinessInput): PublicWebReadinessPlan {
  const blockers: string[] = [];
  const untestedSurfaces = input.surfaces.filter((surface) => !surface.hasRouteTest).map((surface) => surface.id).sort();
  const placeholderAssetSurfaces = input.surfaces.filter((surface) => surface.placeholderAssetsPresent).map((surface) => surface.id).sort();
  const staticDemoSurfaceCount = input.surfaces.filter((surface) => surface.backingMode === "static_demo").length;
  const localRuntimeSurfaceCount = input.surfaces.filter((surface) => surface.backingMode === "local_runtime").length;
  const databaseBackedSurfaceCount = input.surfaces.filter((surface) => surface.backingMode === "database").length;
  const providerBackedSurfaceCount = input.surfaces.filter((surface) => surface.backingMode === "provider").length;

  for (const script of ["typecheck", "build", "test"]) {
    if (!input.packageScripts[script]) {
      blockers.push(`@inkroute/web package script is missing ${script}.`);
    }
  }
  if (!input.typecheckVerified) blockers.push("Web typecheck command has not been verified in the installed workspace.");
  if (!input.buildVerified) blockers.push("Next.js web build has not been verified in the installed workspace.");
  if (!input.accessibilityAuditVerified) blockers.push("Public web accessibility audit has not been verified.");
  if (!input.performanceAuditVerified) blockers.push("Public web performance/Core Web Vitals audit has not been verified.");
  if (!input.runtimePersistenceConfigured && input.surfaces.some((surface) => surface.requiresDatabase)) {
    blockers.push("Public routes that require persistence are still static-demo or local-runtime backed.");
  }
  if (input.surfaces.some((surface) => surface.requiresProvider && surface.backingMode !== "provider")) {
    blockers.push("Provider-backed public routes still use local runtime or static provider boundaries.");
  }
  if (!input.realPortfolioAssetsConfigured && placeholderAssetSurfaces.length > 0) {
    blockers.push("Public portfolio/media surfaces still depend on placeholder or demo assets.");
  }
  if (untestedSurfaces.length > 0) {
    blockers.push("Every public page/API/webhook surface needs route smoke or contract coverage before launch.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    surfaceCount: input.surfaces.length,
    staticDemoSurfaceCount,
    localRuntimeSurfaceCount,
    databaseBackedSurfaceCount,
    providerBackedSurfaceCount,
    untestedSurfaces,
    placeholderAssetSurfaces,
    requiredCommands: publicWebReadinessRequiredCommands,
    requiredControls: publicWebReadinessRequiredControls,
    blockers,
  };
}

export function buildPublicationChecklist(route: SeoRouteRecord): string[] {
  const checklist = [
    "Confirm tenant/artist ownership and RBAC permission before editing.",
    "Validate title, meta description, canonical path, and noindex/index mode.",
    "Preview JSON-LD graph and test structured data before production publishing.",
    "Confirm image alt text, captions, and public/private visibility.",
    "Generate internal links from homepage, city pages, style pages, portfolio, and booking CTA surfaces.",
    "Trigger sitemap update and public route revalidation after publish.",
    "Record audit log entry for the SEO content change.",
  ];
  if (route.kind === "city") checklist.push("Confirm travel dates, waitlist status, studio/guest spot details, and local legal wording.");
  if (route.kind === "style") checklist.push("Confirm style descriptions accurately represent artist scope and healed-result expectations.");
  return checklist;
}

function canMutateSeo(role: Role): boolean {
  return role === "owner" || role === "studio_manager";
}

function resolvePublicationStatus(action: SeoPublicationAction, targetStatus?: SeoPageStatus): SeoPageStatus {
  if (action === "publish") return "published";
  if (action === "archive") return "archived";
  return targetStatus ?? "draft";
}

export function buildSeoPublicationMutationPlan(input: SeoPublicationMutationInput): SeoPublicationMutationPlan {
  const targetStatus = resolvePublicationStatus(input.action, input.targetStatus);
  const blockers: string[] = [];
  const audit = auditSeoRoute({ ...input.route, status: targetStatus });

  if (!input.tenantId.trim()) blockers.push("Tenant id is required before mutating SEO content.");
  if (!input.actorId.trim()) blockers.push("Actor id is required for SEO audit logging.");
  if (!canMutateSeo(input.actorRole)) blockers.push("Actor role must be owner or studio_manager for SEO publishing mutations.");
  if (input.existingTenantId && input.existingTenantId !== input.tenantId) blockers.push("Existing SEO record belongs to a different tenant.");
  if (input.action === "publish" && audit.issues.some((issue) => issue.severity === "error")) blockers.push("SEO route has blocking audit errors and cannot be published.");
  if (input.action === "redirect" && (!input.redirectFromPath || !input.redirectToPath)) blockers.push("Redirect mutations require source and destination paths.");

  const routeWithTargetStatus = { ...input.route, status: targetStatus };
  const idempotencyKey = input.idempotencyKey ?? `seo:${input.tenantId}:${input.model}:${input.action}:${routeWithTargetStatus.canonicalPath}`;
  const associationCount = (input.relatedFaqIds?.length ?? 0) + (input.relatedReviewIds?.length ?? 0) + (input.relatedImageIds?.length ?? 0);
  const writes: SeoPublicationWrite[] = [
    {
      model: input.model,
      operation: input.action === "create" ? "create" : input.action === "redirect" ? "upsert" : "update",
      tenantId: input.tenantId,
      summary: `${input.action} ${input.model} at ${routeWithTargetStatus.canonicalPath} with status ${targetStatus}.`,
      requiresTransaction: true,
    },
  ];

  if (associationCount > 0) {
    writes.push({
      model: "SeoAssociation",
      operation: "upsert",
      tenantId: input.tenantId,
      summary: `Attach ${associationCount} FAQ/review/image association(s) within the same tenant transaction.`,
      requiresTransaction: true,
    });
  }

  writes.push(
    {
      model: "AuditLog",
      operation: "create",
      tenantId: input.tenantId,
      summary: `Record actor ${input.actorId} ${input.action} mutation for ${input.model}.`,
      requiresTransaction: true,
    },
    {
      model: "RevalidationJob",
      operation: "enqueue",
      tenantId: input.tenantId,
      summary: "Queue sitemap, canonical route, and tag revalidation after transaction commit.",
      requiresTransaction: false,
    },
  );

  return {
    status: blockers.length > 0 ? (audit.issues.some((issue) => issue.severity === "error") ? "invalid" : "blocked") : "ready",
    action: input.action,
    model: input.model,
    tenantId: input.tenantId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetStatus,
    canCommit: blockers.length === 0,
    requiresTenantScope: true,
    requiresRbac: true,
    requiresAuditLog: true,
    requiresTransaction: true,
    idempotencyKey,
    blockers,
    writes,
    auditAction: `seo.${input.model}.${input.action}`,
    revalidation: buildRevalidationPlan({
      reason: `SEO ${input.action} mutation for ${input.model}`,
      routes: [routeWithTargetStatus],
      contentIds: [input.model, routeWithTargetStatus.canonicalPath],
    }),
  };
}

export function buildSeoPublicationRuntimeReadinessPlan(input: SeoPublicationRuntimeReadinessInput): SeoPublicationRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SeoPublicationRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo publication tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with SEO publication routes.");
  if (!input.prismaModelsMigrated) blockers.push("SEO Prisma models must be migrated.");
  if (!input.dashboardCrudRoutesImplemented) blockers.push("Dashboard SEO CRUD mutation route evidence must be captured before SEO publication readiness.");
  if (!input.authenticatedDashboardApiImplemented) blockers.push("SEO dashboard API routes must require authenticated actors.");
  if (!input.rbacEnforced) blockers.push("SEO publish/edit/archive/redirect actions must enforce owner or studio_manager RBAC.");
  if (!input.tenantIsolationEnforced) blockers.push("SEO repositories must enforce tenant isolation for reads and writes.");
  if (!input.prismaTransactionsConfigured) blockers.push("SEO publication mutations must run inside Prisma transactions.");
  if (!input.seoCityPageRepositoryImplemented) blockers.push("SeoCityPage repository must be implemented.");
  if (!input.seoStylePageRepositoryImplemented) blockers.push("SeoStylePage repository must be implemented.");
  if (!input.seoRedirectRepositoryImplemented) blockers.push("SeoRedirect repository must be implemented.");
  if (!input.faqReviewImageAssociationPersistenceAvailable) blockers.push("FAQ, review, and image association persistence must be available.");
  if (!input.publishStatePersistenceAvailable) blockers.push("SEO publish-state persistence must be available.");
  if (!input.auditLogPersistenceAvailable) blockers.push("SEO audit-log persistence must be available.");
  if (!input.revalidationJobPersistenceAvailable) blockers.push("SEO revalidation jobs must persist after publication commits.");
  if (!input.idempotencyStoreAvailable) blockers.push("SEO idempotency store must be available.");
  if (!input.previewToPublishFlowImplemented) blockers.push("Dashboard SEO preview-to-publish flow evidence must be captured before SEO publication readiness.");
  if (!input.archiveRedirectFlowImplemented) blockers.push("Dashboard SEO archive and redirect flow evidence must be captured before SEO publication readiness.");
  if (!input.prismaIntegrationTestsPassed) blockers.push("SEO Prisma integration tests must pass.");
  if (!input.tenantIsolationTestsPassed) blockers.push("SEO tenant isolation tests must pass.");
  if (!input.dashboardPublishFlowTestsPassed) blockers.push("Dashboard SEO publish/edit/archive flow tests must pass.");

  if (!input.prismaModelsMigrated || !input.seoCityPageRepositoryImplemented || !input.seoStylePageRepositoryImplemented || !input.seoRedirectRepositoryImplemented) {
    requiredEvidence.push(seoPublicationRuntimeRequiredEvidence[0]);
  }
  if (!input.dashboardCrudRoutesImplemented || !input.authenticatedDashboardApiImplemented || !input.rbacEnforced || !input.previewToPublishFlowImplemented || !input.archiveRedirectFlowImplemented) {
    requiredEvidence.push(seoPublicationRuntimeRequiredEvidence[1]);
  }
  if (!input.tenantIsolationEnforced || !input.prismaTransactionsConfigured || !input.auditLogPersistenceAvailable || !input.idempotencyStoreAvailable) {
    requiredEvidence.push(seoPublicationRuntimeRequiredEvidence[2]);
  }
  if (!input.faqReviewImageAssociationPersistenceAvailable || !input.publishStatePersistenceAvailable || !input.revalidationJobPersistenceAvailable) {
    requiredEvidence.push(seoPublicationRuntimeRequiredEvidence[3]);
  }
  if (!input.prismaIntegrationTestsPassed || !input.tenantIsolationTestsPassed || !input.dashboardPublishFlowTestsPassed) {
    requiredEvidence.push(seoPublicationRuntimeRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: seoPublicationRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === seoPublicationRuntimeRequiredEvidence.length
        ? seoPublicationRuntimeRequiredEvidence
        : requiredEvidence,
    requiredControls: seoPublicationRuntimeRequiredControls,
    blockers,
  };
}

export function buildCanonicalDomainRuntimeReadinessPlan(input: CanonicalDomainRuntimeReadinessInput): CanonicalDomainRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: CanonicalDomainRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo canonical/domain tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass with canonical middleware/routes.");
  if (!input.middlewareImplemented) blockers.push("Public canonical/domain middleware or route handler evidence must be captured before canonical-domain readiness.");
  if (!input.tenantDomainRepositoryImplemented) blockers.push("TenantDomain repository runtime evidence must be captured before canonical-domain readiness.");
  if (!input.seoRedirectRepositoryImplemented) blockers.push("SeoRedirect repository runtime evidence must be captured before canonical-domain readiness.");
  if (!input.canonicalPolicyWiredToPublicRoutes) blockers.push("Tenant canonical policy must be wired to public routes.");
  if (!input.allowedHostValidationEnforced) blockers.push("Allowed-host validation must be enforced.");
  if (!input.httpsRedirectEnforced) blockers.push("HTTPS redirects must be enforced where required.");
  if (!input.canonicalHostRedirectEnforced) blockers.push("Canonical host redirects must be enforced.");
  if (!input.persistedRedirectsExecuted) blockers.push("Persisted SeoRedirect records must execute at runtime.");
  if (!input.redirectStatusCodesPreserved) blockers.push("SEO redirect status codes must be preserved at runtime.");
  if (!input.draftArchiveNoindexSitemapExclusionRuntimeVerified) blockers.push("Runtime sitemap must exclude draft, archived, private, and noindex content.");
  if (!input.noindexHeadersOrMetaRuntimeVerified) blockers.push("Noindex headers or metadata must be asserted for private/noindex routes.");
  if (!input.canonicalTagsUseTenantPrimaryHost) blockers.push("Canonical tags must use the tenant primary host.");
  if (!input.customDomainRouteTestsPassed) blockers.push("Custom-domain canonical and redirect route tests must pass.");
  if (!input.duplicateCanonicalRuntimeTestsPassed) blockers.push("Duplicate canonical runtime tests must pass.");
  if (!input.deploymentDomainProofAvailable) blockers.push("Deployment-domain proof must show configured tenant primary and allowed hosts.");

  if (!input.middlewareImplemented || !input.canonicalPolicyWiredToPublicRoutes || !input.allowedHostValidationEnforced) {
    requiredEvidence.push(canonicalDomainRuntimeRequiredEvidence[0]);
  }
  if (!input.tenantDomainRepositoryImplemented || !input.seoRedirectRepositoryImplemented || !input.persistedRedirectsExecuted) {
    requiredEvidence.push(canonicalDomainRuntimeRequiredEvidence[1]);
  }
  if (!input.httpsRedirectEnforced || !input.canonicalHostRedirectEnforced || !input.redirectStatusCodesPreserved || !input.canonicalTagsUseTenantPrimaryHost) {
    requiredEvidence.push(canonicalDomainRuntimeRequiredEvidence[2]);
  }
  if (!input.draftArchiveNoindexSitemapExclusionRuntimeVerified || !input.noindexHeadersOrMetaRuntimeVerified || !input.duplicateCanonicalRuntimeTestsPassed) {
    requiredEvidence.push(canonicalDomainRuntimeRequiredEvidence[3]);
  }
  if (!input.customDomainRouteTestsPassed || !input.deploymentDomainProofAvailable) {
    requiredEvidence.push(canonicalDomainRuntimeRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: canonicalDomainRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === canonicalDomainRuntimeRequiredEvidence.length
        ? canonicalDomainRuntimeRequiredEvidence
        : requiredEvidence,
    requiredControls: canonicalDomainRuntimeRequiredControls,
    blockers,
  };
}

export function buildStructuredDataCrawlQaReadinessPlan(input: StructuredDataCrawlQaReadinessInput): StructuredDataCrawlQaReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: StructuredDataCrawlQaRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo structured-data tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass before rendered-page crawl QA.");
  if (!input.renderedPageCrawlerConfigured) blockers.push("Rendered-page crawler tooling must be configured.");
  if (!input.renderedJsonLdExtractionImplemented) blockers.push("Rendered JSON-LD extraction must be implemented for public pages.");
  if (!input.publicPageInventoryConfigured) blockers.push("Public page inventory must be configured for structured-data crawl QA.");
  if (!input.googleRichResultsCompatibleChecksPassed) blockers.push("Google Rich Results-compatible structured-data checks must pass.");
  if (!input.structuredDataCriticalErrorsAbsent) blockers.push("Structured-data validation must report no critical errors.");
  if (!input.unsupportedSchemaWarningsReviewed) blockers.push("Unsupported schema warnings must be reviewed and accepted or removed.");
  if (!input.demoContentReplacedOrDocumented) blockers.push("Demo schema content must be replaced with production content or documented as intentional.");
  if (!input.sitemapCanonicalCrawlPassed) blockers.push("Sitemap and canonical crawl checks must pass against rendered pages.");
  if (!input.canonicalUrlConsistencyVerified) blockers.push("Rendered canonical URLs must match route canonical policy.");
  if (!input.robotsNoindexCrawlVerified) blockers.push("Robots and noindex behavior must be verified by crawler output.");
  if (!input.crawlArtifactsCaptured) blockers.push("Structured-data crawl artifacts must be captured.");
  if (!input.closeoutEvidenceAttached) blockers.push("Structured-data crawl and rich-results evidence must be attached to closeout.");

  if (!input.renderedPageCrawlerConfigured || !input.renderedJsonLdExtractionImplemented || !input.publicPageInventoryConfigured) {
    requiredEvidence.push(structuredDataCrawlQaRequiredEvidence[0]);
  }
  if (!input.googleRichResultsCompatibleChecksPassed || !input.structuredDataCriticalErrorsAbsent || !input.unsupportedSchemaWarningsReviewed) {
    requiredEvidence.push(structuredDataCrawlQaRequiredEvidence[1]);
  }
  if (!input.demoContentReplacedOrDocumented || !input.sitemapCanonicalCrawlPassed || !input.canonicalUrlConsistencyVerified || !input.robotsNoindexCrawlVerified) {
    requiredEvidence.push(structuredDataCrawlQaRequiredEvidence[2]);
  }
  if (!input.crawlArtifactsCaptured || !input.closeoutEvidenceAttached) {
    requiredEvidence.push(structuredDataCrawlQaRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: structuredDataCrawlQaRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === structuredDataCrawlQaRequiredEvidence.length
        ? structuredDataCrawlQaRequiredEvidence
        : requiredEvidence,
    requiredControls: structuredDataCrawlQaRequiredControls,
    blockers,
  };
}

export function buildSearchConsoleRuntimeReadinessPlan(input: SearchConsoleRuntimeReadinessInput): SearchConsoleRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SearchConsoleRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo Search Console tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.providerRoutesImplemented) blockers.push("Search Console provider route evidence must be captured before Search Console readiness.");
  if (!input.backgroundJobsImplemented) blockers.push("Search Console background job evidence must be captured before Search Console readiness.");
  if (!input.credentialsConfigured) blockers.push("Google Search Console credentials must be configured in a secret store.");
  if (!input.OAuthOrServiceAccountFlowImplemented) blockers.push("OAuth or service-account execution flow must be implemented.");
  if (!input.tenantOwnershipPersistenceAvailable) blockers.push("Tenant Search Console property ownership persistence must be available.");
  if (!input.tenantOwnershipChecksEnforced) blockers.push("Tenant ownership checks must be enforced before provider operations.");
  if (!input.verifiedPropertyProofAvailable) blockers.push("Verified test property proof must be available.");
  if (!input.sitemapSubmissionImplemented) blockers.push("Search Console sitemap submission must be implemented.");
  if (!input.sitemapSubmittedForVerifiedProperty) blockers.push("Sitemap must be submitted for a verified test property.");
  if (!input.queryPageImportImplemented) blockers.push("Search Console query/page import must be implemented.");
  if (!input.importedRowsPersisted) blockers.push("Imported query/page rows must persist tenant-safely.");
  if (!input.indexingMonitoringImplemented) blockers.push("Search Console indexing monitoring must be implemented.");
  if (!input.dashboardStatusImplemented) blockers.push("Dashboard Search Console import/monitoring status evidence must be captured before Search Console readiness.");
  if (!input.approvedFixtureTestsPassed) blockers.push("Approved Search Console fixture tests must pass.");
  if (!input.providerSandboxOrTestPropertyPassed) blockers.push("Provider sandbox or verified test-property execution must pass.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Search Console operation audit-log persistence must be available.");
  if (!input.idempotencyStoreAvailable) blockers.push("Search Console operation idempotency store must be available.");

  if (!input.providerRoutesImplemented || !input.backgroundJobsImplemented || !input.OAuthOrServiceAccountFlowImplemented || !input.credentialsConfigured) {
    requiredEvidence.push(searchConsoleRuntimeRequiredEvidence[0]);
  }
  if (!input.tenantOwnershipPersistenceAvailable || !input.tenantOwnershipChecksEnforced || !input.verifiedPropertyProofAvailable) {
    requiredEvidence.push(searchConsoleRuntimeRequiredEvidence[1]);
  }
  if (!input.sitemapSubmissionImplemented || !input.sitemapSubmittedForVerifiedProperty) {
    requiredEvidence.push(searchConsoleRuntimeRequiredEvidence[2]);
  }
  if (!input.queryPageImportImplemented || !input.importedRowsPersisted || !input.indexingMonitoringImplemented || !input.dashboardStatusImplemented) {
    requiredEvidence.push(searchConsoleRuntimeRequiredEvidence[3]);
  }
  if (!input.approvedFixtureTestsPassed || !input.providerSandboxOrTestPropertyPassed || !input.auditLogPersistenceAvailable || !input.idempotencyStoreAvailable) {
    requiredEvidence.push(searchConsoleRuntimeRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: searchConsoleRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === searchConsoleRuntimeRequiredEvidence.length
        ? searchConsoleRuntimeRequiredEvidence
        : requiredEvidence,
    requiredControls: searchConsoleRuntimeRequiredControls,
    blockers,
  };
}

export function buildSeoAutomatedTestReadinessPlan(input: SeoAutomatedTestReadinessInput): SeoAutomatedTestReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SeoAutomatedTestReadinessRequiredEvidence[] = [];
  const requiredSuites = [
    "SEO route record and canonical normalization tests",
    "sitemap generation and indexing filter tests",
    "metadata draft and audit tests",
    "city/style content brief and internal-link tests",
    "JSON-LD graph and structured-data snapshot tests",
    "canonical/domain/redirect helper tests",
    "image SEO pipeline tests",
    "Search Console operation planner tests",
    "web sitemap, SEO preview, and sitemap preview route tests",
    "CI SEO package and preview route test gate",
  ];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoPackageTestsPassed) blockers.push("@inkroute/seo tests must pass.");
  if (!input.seoPackageTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass.");
  if (!input.routeRecordTestsPassed) blockers.push("SEO route record tests must pass.");
  if (!input.sitemapGenerationTestsPassed) blockers.push("Sitemap generation and indexing filter tests must pass.");
  if (!input.metadataDraftTestsPassed) blockers.push("Metadata draft tests must pass.");
  if (!input.auditTestsPassed) blockers.push("SEO audit tests must pass.");
  if (!input.contentBriefTestsPassed) blockers.push("City/style content brief tests must pass.");
  if (!input.internalLinkTestsPassed) blockers.push("Internal-link recommendation tests must pass.");
  if (!input.jsonLdGraphTestsPassed) blockers.push("JSON-LD graph tests must pass.");
  if (!input.imagePipelineTestsPassed) blockers.push("Image SEO pipeline tests must pass.");
  if (!input.canonicalRedirectTestsPassed) blockers.push("Canonical/domain/redirect tests must pass.");
  if (!input.searchConsolePlanTestsPassed) blockers.push("Search Console operation planner tests must pass.");
  if (!input.webSitemapRouteTestsPassed) blockers.push("Web sitemap route tests must pass.");
  if (!input.seoPreviewRouteTestsPassed) blockers.push("SEO preview route tests must pass.");
  if (!input.sitemapPreviewRouteTestsPassed) blockers.push("Sitemap preview route tests must pass.");
  if (!input.structuredDataSnapshotTestsPassed) blockers.push("Structured-data snapshot tests must pass.");
  if (!input.runtimeBuildEvidenceCoveredByGap076) blockers.push("Runtime/build evidence must be covered by GAP-076.");
  if (!input.crawlEvidenceCoveredByGap073) blockers.push("Rendered crawl and external structured-data evidence must be covered by GAP-073.");
  if (!input.ciRunsSeoTestGate) blockers.push("CI must run the SEO package and preview route test gate.");

  if (!input.routeRecordTestsPassed || !input.sitemapGenerationTestsPassed || !input.metadataDraftTestsPassed || !input.auditTestsPassed) {
    requiredEvidence.push(seoAutomatedTestReadinessRequiredEvidence[0]);
  }
  if (!input.contentBriefTestsPassed || !input.internalLinkTestsPassed || !input.jsonLdGraphTestsPassed || !input.structuredDataSnapshotTestsPassed) {
    requiredEvidence.push(seoAutomatedTestReadinessRequiredEvidence[1]);
  }
  if (!input.imagePipelineTestsPassed || !input.canonicalRedirectTestsPassed || !input.searchConsolePlanTestsPassed) {
    requiredEvidence.push(seoAutomatedTestReadinessRequiredEvidence[2]);
  }
  if (!input.webSitemapRouteTestsPassed || !input.seoPreviewRouteTestsPassed || !input.sitemapPreviewRouteTestsPassed) {
    requiredEvidence.push(seoAutomatedTestReadinessRequiredEvidence[3]);
  }
  if (!input.runtimeBuildEvidenceCoveredByGap076 || !input.crawlEvidenceCoveredByGap073 || !input.ciRunsSeoTestGate) {
    requiredEvidence.push(seoAutomatedTestReadinessRequiredEvidence[4]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === seoAutomatedTestReadinessRequiredEvidence.length
      ? seoAutomatedTestReadinessRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: seoAutomatedTestReadinessRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    requiredSuites,
    blockers,
  };
}

export function buildPublicWebLaunchEvidencePlan(
  input: PublicWebLaunchEvidenceInput,
): PublicWebLaunchEvidencePlan {
  const requiredScripts = ["typecheck", "build", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: PublicWebLaunchEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/web package script is missing ${script}.`);
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass.");
  if (!input.webRouteSmokePassed) blockers.push("Public route smoke tests must pass for pages, APIs, metadata, and webhooks.");
  if (!input.webPlaywrightDesktopPassed) blockers.push("Desktop public web Playwright smoke tests must pass.");
  if (!input.webPlaywrightMobilePassed) blockers.push("Mobile viewport public web Playwright smoke tests must pass.");
  if (!input.accessibilityAuditPassed) blockers.push("Public web accessibility audit must pass.");
  if (!input.lighthousePerformancePassed) blockers.push("Lighthouse/performance audit must pass for launch-critical public routes.");
  if (!input.apiRoutesUseTenantScopedPersistence) blockers.push("Public API routes must use tenant-scoped persistence instead of local runtime state in production.");
  if (!input.providerBackedRoutesVerified) blockers.push("Provider-backed public routes must be verified against their configured providers.");
  if (!input.localRuntimeFallbackDisabledForProduction) blockers.push("Local runtime fallback must be disabled or fail-closed for production.");
  if (!input.realPortfolioDerivativesConfigured) blockers.push("Real scanned portfolio derivatives must be configured for public media surfaces.");
  if (!input.placeholderAssetsRemovedOrDocumented) blockers.push("Placeholder/demo public assets must be removed or explicitly documented as non-launch blockers.");
  if (!input.sitemapRuntimeVerified) blockers.push("Runtime sitemap output must be verified.");
  if (!input.robotsRuntimeVerified) blockers.push("Runtime robots.txt output must be verified.");
  if (!input.jsonLdRuntimeVerified) blockers.push("Rendered JSON-LD output must be verified.");
  if (!input.canonicalRuntimeVerified) blockers.push("Runtime canonical URL output must be verified.");
  if (!input.privacyAndLegalRoutesReviewed) blockers.push("Public privacy, terms, consent, and aftercare routes must match the legal review boundary.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for public web launch gates must be captured.");
  if (!input.launchArtifactsSecretSafe) blockers.push("Public web launch artifacts must be redacted and free of secrets or client-private data.");

  if (!input.webTypecheckPassed || !input.webBuildPassed || !input.webRouteSmokePassed) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[0]);
  }
  if (!input.webPlaywrightDesktopPassed || !input.webPlaywrightMobilePassed || !input.accessibilityAuditPassed || !input.lighthousePerformancePassed) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[1]);
  }
  if (!input.apiRoutesUseTenantScopedPersistence || !input.providerBackedRoutesVerified || !input.localRuntimeFallbackDisabledForProduction) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[2]);
  }
  if (!input.realPortfolioDerivativesConfigured || !input.placeholderAssetsRemovedOrDocumented) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[3]);
  }
  if (!input.sitemapRuntimeVerified || !input.robotsRuntimeVerified || !input.jsonLdRuntimeVerified || !input.canonicalRuntimeVerified) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[4]);
  }
  if (!input.privacyAndLegalRoutesReviewed || !input.ciEvidenceCaptured || !input.launchArtifactsSecretSafe) {
    requiredEvidence.push(publicWebLaunchEvidenceRequiredEvidence[5]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === publicWebLaunchEvidenceRequiredEvidence.length
      ? publicWebLaunchEvidenceRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: publicWebLaunchEvidenceRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    blockers,
  };
}

function normalizeHost(host: string): string {
  return host.toLowerCase().trim().replace(/:\d+$/, "");
}

function findTenantDomain(input: TenantCanonicalPolicyInput): TenantCanonicalDomain | undefined {
  const requestedHost = normalizeHost(input.requestHost);
  return input.domains.find(
    (domain) =>
      domain.tenantId === input.tenantId &&
      (normalizeHost(domain.primaryHost) === requestedHost || domain.allowedHosts.map(normalizeHost).includes(requestedHost)),
  );
}

export function resolveTenantCanonicalPolicy(input: TenantCanonicalPolicyInput): TenantCanonicalPolicyResult {
  const canonicalPath = normalizePath(input.requestPath);
  const requestedHost = normalizeHost(input.requestHost);
  const tenantDomain = findTenantDomain(input);
  const tenantRoutes = input.routes.filter((route) => route.tenantSlug === input.tenantSlug || route.tenantSlug == null);
  const canonicalCounts = new Map<string, number>();
  for (const route of tenantRoutes) {
    const path = normalizePath(route.canonicalPath);
    canonicalCounts.set(path, (canonicalCounts.get(path) ?? 0) + 1);
  }
  const duplicateCanonicalPaths = [...canonicalCounts.entries()].filter(([, count]) => count > 1).map(([path]) => path).sort();
  const canonicalHost = normalizeHost(tenantDomain?.primaryHost ?? requestedHost);
  const protocol = input.protocol ?? "https";
  const shouldForceHttps = (tenantDomain?.forceHttps ?? true) && protocol !== "https";
  const blockers: string[] = [];

  if (!tenantDomain) blockers.push("Request host is not registered for the requested tenant.");
  if (duplicateCanonicalPaths.length > 0) blockers.push("Duplicate canonical paths must be resolved before publishing sitemap output.");

  const sitemap = buildSitemapPlan({ baseUrl: `https://${canonicalHost}`, routes: tenantRoutes });
  return {
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    requestedHost,
    canonicalHost,
    canonicalPath,
    canonicalUrl: createCanonicalUrl(`https://${canonicalHost}`, canonicalPath),
    hostAllowed: Boolean(tenantDomain),
    shouldRedirectHost: Boolean(tenantDomain) && requestedHost !== canonicalHost,
    shouldForceHttps,
    duplicateCanonicalPaths,
    sitemapEntries: sitemap.entries,
    noindexPaths: tenantRoutes.filter((route) => !routeToSitemapEntry(route, `https://${canonicalHost}`)).map((route) => route.path).sort(),
    blockers,
  };
}

export function buildSeoRedirectDecision(input: SeoRedirectDecisionInput): SeoRedirectDecision {
  const path = normalizePath(input.path);
  const rule = input.rules.find((candidate) => candidate.tenantId === input.tenantId && candidate.isActive && normalizePath(candidate.fromPath) === path);
  if (rule) {
    return {
      action: "redirect",
      tenantId: input.tenantId,
      path,
      destinationPath: normalizePath(rule.toPath),
      statusCode: rule.statusCode,
      reason: "Matched active tenant-scoped SEO redirect rule.",
      shouldIndex: false,
    };
  }

  if (!input.route) {
    return {
      action: "not_found",
      tenantId: input.tenantId,
      path,
      reason: "No tenant route or redirect rule matched this path.",
      shouldIndex: false,
    };
  }

  if (input.route.indexMode === "noindex" || input.route.status === "draft" || input.route.status === "archived") {
    return {
      action: "noindex",
      tenantId: input.tenantId,
      path,
      reason: "Matched route is draft, archived, or explicitly noindex.",
      shouldIndex: false,
    };
  }

  return {
    action: "allow",
    tenantId: input.tenantId,
    path,
    reason: "Matched published/indexable tenant route.",
    shouldIndex: true,
  };
}

export function buildWebsiteSchema(args: { name: string; url: string; description?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: args.name,
    url: args.url,
    description: args.description,
  };
}

export function buildWebPageSchema(args: { name: string; description: string; url: string; dateModified?: string; breadcrumb?: JsonLd }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: args.name,
    description: args.description,
    url: args.url,
    ...(args.dateModified ? { dateModified: args.dateModified } : {}),
    ...(args.breadcrumb ? { breadcrumb: args.breadcrumb } : {}),
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>, baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: createCanonicalUrl(baseUrl, item.path),
    })),
  };
}

export function composeJsonLdGraph(items: JsonLd[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": items,
  };
}

export function buildArtistPersonSchema(artist: ArtistProfile): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.displayName,
    description: artist.bio,
    url: `/${artist.slug}`,
    sameAs: artist.instagramUrl ? [artist.instagramUrl] : undefined,
    knowsAbout: artist.specialties,
  };
}

export function buildTattooServiceSchema(args: {
  artist: ArtistProfile;
  name: string;
  description: string;
  areaServed?: string[];
  url?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: args.name,
    description: args.description,
    provider: {
      "@type": "Person",
      name: args.artist.displayName,
    },
    areaServed: args.areaServed,
    url: args.url,
    serviceType: "Tattoo appointment",
  };
}

export function buildLocalTattooBusinessSchema(args: {
  name: string;
  description: string;
  city: string;
  region: string;
  country: string;
  url?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: args.name,
    description: args.description,
    url: args.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: args.city,
      addressRegion: args.region,
      addressCountry: args.country,
    },
  };
}

export function buildPortfolioImageSchema(item: PortfolioItem): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: item.title,
    caption: item.caption,
    contentUrl: item.imageUrl,
    description: item.altText,
    keywords: item.styles.join(", "),
  };
}

export function buildTravelEventSchema(stop: TravelStop, artist: ArtistProfile): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${artist.displayName} tattoo guest spot in ${stop.city}`,
    startDate: stop.startsAt,
    endDate: stop.endsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: stop.studioName ?? `${stop.city} guest spot`,
      address: {
        "@type": "PostalAddress",
        addressLocality: stop.city,
        addressRegion: stop.region,
        addressCountry: stop.country,
      },
    },
    performer: {
      "@type": "Person",
      name: artist.displayName,
    },
    description: stop.publicNotes,
  };
}

export function buildReviewSchema(review: Review): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
    author: {
      "@type": "Person",
      name: review.publicDisplayName ?? "Tattoo client",
    },
    reviewBody: review.body,
    datePublished: review.publishedAt,
  };
}

export function buildFaqSchema(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface SeoA11yPerformanceAuditEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  seoTestsPassed: boolean;
  seoTypecheckPassed: boolean;
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  browserCrawlPassed: boolean;
  schemaValidatorPassed: boolean;
  sitemapCanonicalChecksPassed: boolean;
  axeAuditPassed: boolean;
  lighthouseAuditPassed: boolean;
  coreWebVitalsCaptured: boolean;
  mobileVisualQaPassed: boolean;
  headingFocusContrastIssuesFixed: boolean;
  structuredDataSnapshotsCaptured: boolean;
  ciArtifactsCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface SeoA11yPerformanceAuditEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof seoA11yPerformanceAuditRequiredCommands;
  requiredControls: typeof seoA11yPerformanceAuditRequiredControls;
  requiredEvidence: readonly SeoA11yPerformanceAuditRequiredEvidence[];
  blockers: readonly string[];
}

export const seoA11yPerformanceAuditRequiredCommands = [
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

export const seoA11yPerformanceAuditRequiredControls = [
  "Audit rendered routes, not only package-level metadata helpers.",
  "Validate JSON-LD, sitemap, canonical URLs, and internal links against browser-visible output.",
  "Fix heading order, focus state, landmark, label, contrast, and form accessibility issues before launch.",
  "Capture Lighthouse and Core Web Vitals evidence for launch-critical desktop and mobile routes.",
  "Keep audit artifacts redacted and free of client-private, medical, payment, provider, and private file data.",
] as const;

export const seoA11yPerformanceAuditRequiredEvidence = [
  "web typecheck and production build evidence",
  "browser crawl, sitemap/canonical, schema validator, and structured-data snapshot evidence",
  "axe accessibility audit output plus heading/focus/contrast fix evidence",
  "Lighthouse and Core Web Vitals evidence for launch-critical routes",
  "mobile visual QA screenshots or transcript evidence",
  "CI artifact bundle with redaction/secret-safety proof",
] as const;

export type SeoA11yPerformanceAuditRequiredEvidence = typeof seoA11yPerformanceAuditRequiredEvidence[number];

export function buildSeoA11yPerformanceAuditEvidencePlan(
  input: SeoA11yPerformanceAuditEvidenceInput,
): SeoA11yPerformanceAuditEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SeoA11yPerformanceAuditRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/seo package script is missing ${script}.`);
  if (!input.seoTestsPassed) blockers.push("@inkroute/seo tests must pass before SEO/accessibility/performance audit evidence can close.");
  if (!input.seoTypecheckPassed) blockers.push("@inkroute/seo typecheck must pass before SEO/accessibility/performance audit evidence can close.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass before browser audit evidence can be trusted.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass before production-like SEO/accessibility/performance audits.");
  if (!input.browserCrawlPassed) blockers.push("Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.");
  if (!input.schemaValidatorPassed) blockers.push("Structured data validator must pass for rendered JSON-LD graphs.");
  if (!input.sitemapCanonicalChecksPassed) blockers.push("Sitemap and canonical browser checks must pass for rendered public routes.");
  if (!input.axeAuditPassed) blockers.push("axe accessibility audit must pass for launch-critical public routes.");
  if (!input.lighthouseAuditPassed) blockers.push("Lighthouse audit must pass for launch-critical public routes.");
  if (!input.coreWebVitalsCaptured) blockers.push("Core Web Vitals evidence must be captured for launch-critical public routes.");
  if (!input.mobileVisualQaPassed) blockers.push("Mobile visual QA must pass for public route layouts, navigation, forms, and portfolio media.");
  if (!input.headingFocusContrastIssuesFixed) blockers.push("Heading, focus, contrast, label, and landmark issues found by audits must be fixed or explicitly accepted.");
  if (!input.structuredDataSnapshotsCaptured) blockers.push("Rendered structured-data snapshots must be captured for schema, sitemap, and canonical review.");
  if (!input.ciArtifactsCaptured) blockers.push("CI artifacts must capture SEO, accessibility, performance, crawl, and mobile visual QA evidence.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("SEO/accessibility/performance artifacts must be redacted and free of secrets, client-private data, raw medical notes, private file URLs, and provider tokens.");

  if (!input.webTypecheckPassed || !input.webBuildPassed) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[0]);
  }
  if (!input.browserCrawlPassed || !input.sitemapCanonicalChecksPassed || !input.schemaValidatorPassed || !input.structuredDataSnapshotsCaptured) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[1]);
  }
  if (!input.axeAuditPassed || !input.headingFocusContrastIssuesFixed) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[2]);
  }
  if (!input.lighthouseAuditPassed || !input.coreWebVitalsCaptured) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[3]);
  }
  if (!input.mobileVisualQaPassed) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[4]);
  }
  if (!input.ciArtifactsCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(seoA11yPerformanceAuditRequiredEvidence[5]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === seoA11yPerformanceAuditRequiredEvidence.length
      ? seoA11yPerformanceAuditRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: seoA11yPerformanceAuditRequiredCommands,
    requiredControls: seoA11yPerformanceAuditRequiredControls,
    requiredEvidence: requiredEvidenceResult,
    blockers,
  };
}
