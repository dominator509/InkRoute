import { buildPortfolioImagePerformanceEvidencePlan } from "@inkroute/config";

export type PortfolioImagePerformanceStatus =
  | "wired"
  | "asset-gated"
  | "optimization-gated"
  | "privacy-gated"
  | "browser-gated"
  | "ci-gated";

export interface PortfolioImagePerformanceMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PortfolioImagePerformanceStatus;
}


export interface PortfolioImagePerformanceRunPersistenceContract {
  readonly prismaModel: "PortfolioImagePerformanceRun";
  readonly tenantRelation: "portfolioImagePerformanceRuns";
  readonly migration: "20260609035000_add_portfolio_image_performance_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDerivativeFixtureEvidence: true;
  readonly storesNextImageEvidence: true;
  readonly storesExifStrippingEvidence: true;
  readonly storesPrivateOriginalDenialEvidence: true;
  readonly storesBrowserRenderingEvidence: true;
  readonly storesLighthouseEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const portfolioImagePerformanceRunPersistenceContract = {
  prismaModel: "PortfolioImagePerformanceRun",
  tenantRelation: "portfolioImagePerformanceRuns",
  migration: "20260609035000_add_portfolio_image_performance_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDerivativeFixtureEvidence: true,
  storesNextImageEvidence: true,
  storesExifStrippingEvidence: true,
  storesPrivateOriginalDenialEvidence: true,
  storesBrowserRenderingEvidence: true,
  storesLighthouseEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies PortfolioImagePerformanceRunPersistenceContract;

export interface PortfolioImagePerformanceRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PortfolioImagePerformanceEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly derivativeFixtureEvidenceCaptured: boolean;
  readonly nextImageEvidenceCaptured: boolean;
  readonly exifStrippingEvidenceCaptured: boolean;
  readonly privateOriginalDenialEvidenceCaptured: boolean;
  readonly browserRenderingEvidenceCaptured: boolean;
  readonly lighthouseEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly derivativeFixtureReportPath?: string | null;
  readonly lighthouseReportPath?: string | null;
}

export interface PortfolioImagePerformanceRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PortfolioImagePerformanceEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly derivativeFixtureEvidenceCaptured: boolean;
  readonly nextImageEvidenceCaptured: boolean;
  readonly exifStrippingEvidenceCaptured: boolean;
  readonly privateOriginalDenialEvidenceCaptured: boolean;
  readonly browserRenderingEvidenceCaptured: boolean;
  readonly lighthouseEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly derivativeFixtureReportPath: string | null;
  readonly lighthouseReportPath: string | null;
}

export interface PortfolioImagePerformanceRunRepository {
  readonly portfolioImagePerformanceRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: PortfolioImagePerformanceRunData;
      readonly update: Omit<PortfolioImagePerformanceRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildPortfolioImagePerformanceRunData(
  input: PortfolioImagePerformanceRunRecordInput,
): PortfolioImagePerformanceRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? portfolioImagePerformanceCommands,
    artifactManifest: input.artifacts ?? portfolioImagePerformanceArtifactPaths,
    derivativeFixtureEvidenceCaptured: input.derivativeFixtureEvidenceCaptured,
    nextImageEvidenceCaptured: input.nextImageEvidenceCaptured,
    exifStrippingEvidenceCaptured: input.exifStrippingEvidenceCaptured,
    privateOriginalDenialEvidenceCaptured: input.privateOriginalDenialEvidenceCaptured,
    browserRenderingEvidenceCaptured: input.browserRenderingEvidenceCaptured,
    lighthouseEvidenceCaptured: input.lighthouseEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    derivativeFixtureReportPath: input.derivativeFixtureReportPath ?? null,
    lighthouseReportPath: input.lighthouseReportPath ?? null,
  };
}

export async function persistPortfolioImagePerformanceRun(
  repository: PortfolioImagePerformanceRunRepository,
  input: PortfolioImagePerformanceRunRecordInput,
): Promise<unknown> {
  const data = buildPortfolioImagePerformanceRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.portfolioImagePerformanceRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const portfolioImagePerformanceCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "portfolio image browser rendering smoke",
  "private original/reference access-denial tests",
  "Lighthouse image/performance audit",
] as const;

export const portfolioImagePerformanceArtifactPaths = [
  "coverage/portfolio-image-performance-runtime.json",
  "coverage/portfolio-image-config-typecheck.txt",
  "coverage/portfolio-image-config-test.txt",
  "coverage/portfolio-image-web-typecheck.txt",
  "coverage/portfolio-image-web-build.txt",
  "coverage/portfolio-image-derivative-fixtures.json",
  "coverage/portfolio-image-next-image-wiring.json",
  "coverage/portfolio-image-private-original-denial.json",
  "coverage/portfolio-image-browser-rendering.json",
  "coverage/portfolio-image-lighthouse.json",
  "coverage/portfolio-image-ci-evidence.json",
  "test-results/portfolio-image-performance-runtime",
] as const;

export const portfolioImagePerformanceMatrix = [
  {
    id: "config-and-web-package-gates",
    command: "pnpm --filter @inkroute/config typecheck && pnpm --filter @inkroute/config test && pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/portfolio-image-web-build.txt",
    status: "wired",
  },
  {
    id: "checked-in-public-derivative-fixtures",
    command: "real public derivative assets or storage-backed fixture manifest",
    artifact: "coverage/portfolio-image-derivative-fixtures.json",
    status: "asset-gated",
  },
  {
    id: "next-image-dimensions-sizes-blur",
    command: "portfolio card next/image static contract",
    artifact: "coverage/portfolio-image-next-image-wiring.json",
    status: "optimization-gated",
  },
  {
    id: "exif-private-original-denial",
    command: "private original/reference access-denial tests",
    artifact: "coverage/portfolio-image-private-original-denial.json",
    status: "privacy-gated",
  },
  {
    id: "browser-rendering-and-lighthouse",
    command: "portfolio image browser rendering smoke && Lighthouse image/performance audit",
    artifact: "coverage/portfolio-image-lighthouse.json",
    status: "browser-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions portfolio image performance evidence job",
    artifact: "coverage/portfolio-image-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly PortfolioImagePerformanceMatrixEntry[];

export const portfolioImagePerformanceControls = [
  "serve-only-public-derivative-objects-from-public-portfolio-cards",
  "keep-private-originals-and-booking-reference-files-unavailable-to-public-routes",
  "preserve-dimensions-aspect-ratio-alt-responsive-sizes-cache-policy",
  "strip-exif-private-metadata-before-derivative-publication",
  "capture-browser-and-lighthouse-evidence-before-launch-ready",
] as const;

export const portfolioImagePerformanceEvidenceFlags = [
  "configTestsPassed",
  "configTypecheckPassed",
  "webTypecheckPassed",
  "webBuildPassed",
  "realPublicDerivativeAssetsAvailable",
  "storageBackedDerivativeFixturesAvailable",
  "nextImageMigrationCompleted",
  "derivativeDimensionsVerified",
  "blurPlaceholdersGenerated",
  "exifStrippingVerified",
  "privateOriginalsSeparated",
  "privateOriginalAccessDenied",
  "browserRenderingVerified",
  "lighthouseImageAuditPassed",
  "ciArtifactsCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PortfolioImagePerformanceEvidenceFlag = (typeof portfolioImagePerformanceEvidenceFlags)[number];

export interface PortfolioImagePerformanceEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<PortfolioImagePerformanceEvidenceFlag, boolean>>;
}

export interface PortfolioImagePerformanceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly PortfolioImagePerformanceEvidenceFlag[];
  readonly requiredCommands: typeof portfolioImagePerformanceCommands;
  readonly requiredArtifacts: typeof portfolioImagePerformanceArtifactPaths;
  readonly requiredControls: typeof portfolioImagePerformanceControls;
  readonly requiredEvidence: typeof portfolioImagePerformanceEvidenceFlags;
  readonly blockers: readonly string[];
}

const portfolioImagePerformanceEvidenceBlockers: Record<PortfolioImagePerformanceEvidenceFlag, string> = {
  configTestsPassed: "Config package public content tests must pass.",
  configTypecheckPassed: "Config package typecheck must pass.",
  webTypecheckPassed: "Web app typecheck must pass.",
  webBuildPassed: "Web app build must pass.",
  realPublicDerivativeAssetsAvailable: "Real public derivative assets or checked-in safe fixtures must be available.",
  storageBackedDerivativeFixturesAvailable:
    "Storage-backed derivative fixtures must prove public derivatives resolve independently from private originals.",
  nextImageMigrationCompleted: "Portfolio cards must render through next/image.",
  derivativeDimensionsVerified: "Derivative dimensions, aspect ratio, alt text, sizes, and cache policy must be verified.",
  blurPlaceholdersGenerated: "Shared public derivative metadata must provide blur placeholders for rendered portfolio derivatives.",
  exifStrippingVerified: "EXIF and private metadata stripping proof is required before launch readiness.",
  privateOriginalsSeparated: "Private originals must stay separated from public derivatives.",
  privateOriginalAccessDenied: "Private original/reference access-denial tests must pass.",
  browserRenderingVerified: "Portfolio image browser rendering smoke must pass.",
  lighthouseImageAuditPassed: "Lighthouse image/performance audit must pass or document accepted image-specific exceptions.",
  ciArtifactsCaptured: "CI portfolio image performance evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Portfolio image artifacts must be redacted and free of secrets, private object keys, raw PII, medical, and payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildPortfolioImagePerformanceEvidenceDecision = (
  input: PortfolioImagePerformanceEvidenceInput,
): PortfolioImagePerformanceEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, portfolioImagePerformanceCommands);
  const missingArtifacts = missingFrom(input.artifacts, portfolioImagePerformanceArtifactPaths);
  const missingControls = missingFrom(input.controls, portfolioImagePerformanceControls);
  const missingEvidence = portfolioImagePerformanceEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => portfolioImagePerformanceEvidenceBlockers[flag]);

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
    requiredCommands: portfolioImagePerformanceCommands,
    requiredArtifacts: portfolioImagePerformanceArtifactPaths,
    requiredControls: portfolioImagePerformanceControls,
    requiredEvidence: portfolioImagePerformanceEvidenceFlags,
    blockers,
  };
};

export interface PortfolioImagePerformanceExecutionPolicy {
  readonly codexMayClassifyStaticImageComponentReadiness: true;
  readonly storageBackedDerivativesRequiredForClosure: true;
  readonly exifAndPrivateOriginalDenialRequiredForClosure: true;
  readonly browserAndLighthouseRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PortfolioImagePerformanceExecutionPlan {
  readonly localCommands: typeof portfolioImagePerformanceLocalCommands;
  readonly externalCommands: typeof portfolioImagePerformanceExternalCommands;
  readonly requiredExternalEvidence: typeof portfolioImagePerformanceRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly storageExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly lighthouseExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof portfolioImagePerformanceExecutionPolicy;
}

export interface PortfolioImagePerformanceArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof portfolioImagePerformanceRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const portfolioImagePerformanceRequiredExternalEvidence = [
  "storage-backed public derivative fixture manifest",
  "provider-backed PortfolioImagePerformanceRun persistence execution",
  "EXIF and private metadata stripping proof",
  "private original and booking reference access-denial transcript",
  "portfolio image browser rendering proof",
  "Lighthouse image/performance audit",
  "web typecheck and build evidence",
  "CI portfolio image performance artifacts",
  "secret-safe portfolio image artifact review",
] as const;

export const portfolioImagePerformanceExecutionPolicy: PortfolioImagePerformanceExecutionPolicy = {
  codexMayClassifyStaticImageComponentReadiness: true,
  storageBackedDerivativesRequiredForClosure: true,
  exifAndPrivateOriginalDenialRequiredForClosure: true,
  browserAndLighthouseRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const portfolioImagePerformanceLocalCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "static PortfolioCard next/image contract review",
  "static public derivative fixture review",
] as const;

export const portfolioImagePerformanceExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "portfolio image browser rendering smoke",
  "private original/reference access-denial tests",
  "Lighthouse image/performance audit",
  "provider-backed persistPortfolioImagePerformanceRun execution",
  "CI portfolio image performance artifact capture",
] as const;

export const buildPortfolioImagePerformanceExecutionPlan = (): PortfolioImagePerformanceExecutionPlan => ({
  localCommands: portfolioImagePerformanceLocalCommands,
  externalCommands: portfolioImagePerformanceExternalCommands,
  requiredExternalEvidence: portfolioImagePerformanceRequiredExternalEvidence,
  commandExecutionAllowed: false,
  storageExecutionAllowed: false,
  databaseExecutionAllowed: false,
  browserExecutionAllowed: false,
  lighthouseExecutionAllowed: false,
  ciExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  executionPolicy: portfolioImagePerformanceExecutionPolicy,
});

const portfolioImagePerformanceSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|object|key|original|reference|booking|email|phone|exif|gps|medical|payment|card)/i;

export const buildRedactedPortfolioImagePerformanceArtifact = (
  artifact: unknown,
): Pick<PortfolioImagePerformanceArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (portfolioImagePerformanceSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_PORTFOLIO_IMAGE_PRIVATE_VALUE]"];
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

export const buildPortfolioImagePerformanceArtifactReview = (
  artifact: unknown,
): PortfolioImagePerformanceArtifactReview => {
  const redacted = buildRedactedPortfolioImagePerformanceArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "private-original",
    "booking-reference",
    "s3://",
    "gs://",
    "sk_",
    "gps:",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: portfolioImagePerformanceRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};

export const portfolioImagePerformanceReadiness = buildPortfolioImagePerformanceEvidencePlan({
  packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  realPublicDerivativeAssetsAvailable: true,
  storageBackedDerivativeFixturesAvailable: false,
  nextImageMigrationCompleted: true,
  derivativeDimensionsVerified: true,
  blurPlaceholdersGenerated: true,
  exifStrippingVerified: false,
  privateOriginalsSeparated: true,
  privateOriginalAccessDenied: false,
  browserRenderingVerified: false,
  lighthouseImageAuditPassed: false,
  ciArtifactsCaptured: false,
});



