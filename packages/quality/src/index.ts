export type QualityGateStatus = "pass" | "warn" | "fail";
export type QualityGatePriority = "critical" | "high" | "medium" | "low";
export type GapSeverity = "Critical" | "High" | "Medium" | "Low";
export type NormalizedBlocker = "Yes" | "No" | "Unknown";
export type MarkdownLinkKind = "external" | "email" | "anchor" | "relative" | "root-relative" | "ignored";

export interface MarkdownDocumentInput {
  readonly path: string;
  readonly contents: string;
}

export interface MarkdownLinkRecord {
  readonly sourcePath: string;
  readonly label: string;
  readonly href: string;
  readonly targetPath: string | null;
  readonly kind: MarkdownLinkKind;
}

export interface MarkdownLinkFinding {
  readonly status: QualityGateStatus;
  readonly sourcePath: string;
  readonly href: string;
  readonly message: string;
}

export interface MarkdownLinkAuditSummary {
  readonly totalDocuments: number;
  readonly totalLinks: number;
  readonly checkedRelativeLinks: number;
  readonly findings: readonly MarkdownLinkFinding[];
  readonly status: QualityGateStatus;
}

export interface SemanticDocumentationFinding {
  readonly status: QualityGateStatus;
  readonly sourcePath: string;
  readonly reference?: string;
  readonly message: string;
}

export interface SemanticDocumentationAuditSummary {
  readonly totalDocuments: number;
  readonly referencedPathsChecked: number;
  readonly findings: readonly SemanticDocumentationFinding[];
  readonly status: QualityGateStatus;
}

export interface DocumentationConsistencyContract {
  readonly routeReference: {
    readonly apps: readonly string[];
    readonly ignoredPrefixes?: readonly string[];
    readonly ignoredRouteFragments?: readonly string[];
  };
  readonly providerReadinessLanguage: {
    readonly providers: readonly string[];
    readonly claimTerms: readonly string[];
    readonly allowedQualifiers: readonly string[];
  };
  readonly legalReadinessLanguage: {
    readonly claimTerms: readonly string[];
    readonly allowedQualifiers: readonly string[];
  };
}

export interface DocumentationConsistencyFinding {
  readonly status: QualityGateStatus;
  readonly rule: "route-reference" | "provider-readiness-language" | "legal-readiness-language";
  readonly sourcePath: string;
  readonly reference?: string;
  readonly line?: number;
  readonly message: string;
}

export interface DocumentationConsistencyAuditSummary {
  readonly totalDocuments: number;
  readonly routeReferencesChecked: number;
  readonly findings: readonly DocumentationConsistencyFinding[];
  readonly status: QualityGateStatus;
}

export interface RepositoryGovernanceContract {
  readonly requiredFiles: readonly string[];
  readonly requiredCodeownersPatterns: readonly string[];
  readonly pullRequestTemplateTerms: readonly string[];
  readonly issueTemplateTerms: readonly string[];
  readonly ciRequiredTerms: readonly string[];
  readonly externalSettingsStillRequired: readonly string[];
}

export interface RepositoryGovernanceInput {
  readonly existingPaths: ReadonlySet<string>;
  readonly codeowners: string;
  readonly pullRequestTemplate: string;
  readonly gapClosureIssueTemplate: string;
  readonly ciWorkflow: string;
}

export interface RepositoryGovernanceFinding {
  readonly status: QualityGateStatus;
  readonly rule: "required-file" | "codeowners-pattern" | "pr-template-term" | "issue-template-term" | "ci-required-term";
  readonly path?: string;
  readonly pattern?: string;
  readonly term?: string;
  readonly message: string;
}

export interface RepositoryGovernanceAuditSummary {
  readonly findings: readonly RepositoryGovernanceFinding[];
  readonly requiredFilesChecked: number;
  readonly codeownersPatternsChecked: number;
  readonly templateTermsChecked: number;
  readonly ciTermsChecked: number;
  readonly externalSettingsStillRequired: readonly string[];
  readonly status: QualityGateStatus;
}

export interface GapEvidenceRecord {
  readonly gapId: string;
  readonly phase: string;
  readonly area: string;
  readonly description: string;
  readonly severity: string;
  readonly blocksProductionRaw: string;
  readonly normalizedBlocksProduction: NormalizedBlocker;
  readonly currentStatus: string;
  readonly filesAffected: string;
  readonly remainingWork: string;
  readonly target: string;
  readonly suggestedPrompt: string;
  readonly verificationNeeded: string;
  readonly columnCount: number;
}

export interface GapEvidenceFinding {
  readonly status: QualityGateStatus;
  readonly gapId?: string;
  readonly message: string;
}

export interface GapEvidenceAuditSummary {
  readonly totalGaps: number;
  readonly blockingGaps: number;
  readonly criticalBlockingGaps: readonly string[];
  readonly bySeverity: Record<string, number>;
  readonly byPhase: Record<string, number>;
  readonly findings: readonly GapEvidenceFinding[];
  readonly status: QualityGateStatus;
}

export interface QualityGateDefinition {
  readonly id: string;
  readonly title: string;
  readonly priority: QualityGatePriority;
  readonly command: string;
  readonly files: readonly string[];
  readonly blocksGapIds: readonly string[];
  readonly purpose: string;
  readonly acceptanceEvidence: readonly string[];
}

export interface QualityGatePlanSummary {
  readonly totalGates: number;
  readonly criticalGates: number;
  readonly highGates: number;
  readonly mediumGates: number;
  readonly lowGates: number;
  readonly commands: readonly string[];
  readonly referencedGapIds: readonly string[];
}

export const gapTrackerColumnNames = [
  "Gap ID",
  "Phase",
  "Area",
  "Description",
  "Severity",
  "Blocks production",
  "Current status",
  "Files affected",
  "What still needs to be done",
  "Best target tool/platform",
  "Suggested handoff prompt",
  "Verification/test needed",
] as const;

const severityValues = new Set(["Critical", "High", "Medium", "Low"]);

function replaceHtmlBreaks(value: string): string {
  return value.replace(/<br\s*\/?>(\s*)/gi, " ");
}

function normalizeWhitespace(value: string): string {
  return replaceHtmlBreaks(value).replace(/\s+/g, " ").trim();
}

function splitMarkdownTableRow(row: string): readonly string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => normalizeWhitespace(cell));
}

function normalizeBlocker(value: string): NormalizedBlocker {
  if (value.startsWith("Yes")) {
    return "Yes";
  }
  if (value.startsWith("No")) {
    return "No";
  }
  return "Unknown";
}

export function parseGapEvidenceRecords(markdown: string): readonly GapEvidenceRecord[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\| GAP-\d{3,}/.test(line.trim()))
    .map((row) => {
      const cells = splitMarkdownTableRow(row);
      return {
        gapId: cells[0] ?? "GAP-UNKNOWN",
        phase: cells[1] ?? "Unknown phase",
        area: cells[2] ?? "Unknown area",
        description: cells[3] ?? "",
        severity: cells[4] ?? "Unknown",
        blocksProductionRaw: cells[5] ?? "Unknown",
        normalizedBlocksProduction: normalizeBlocker(cells[5] ?? "Unknown"),
        currentStatus: cells[6] ?? "",
        filesAffected: cells[7] ?? "",
        remainingWork: cells[8] ?? "",
        target: cells[9] ?? "",
        suggestedPrompt: cells[10] ?? "",
        verificationNeeded: cells[11] ?? "",
        columnCount: cells.length,
      } satisfies GapEvidenceRecord;
    });
}

function hasVerificationSpecificity(value: string): boolean {
  const normalized = value.toLowerCase();
  return value.length >= 20 && (/`[^`]+`/.test(value) || normalized.includes("test") || normalized.includes("evidence") || normalized.includes("passes") || normalized.includes("output"));
}

function hasActionSpecificity(value: string): boolean {
  return value.length >= 20 && /\b(run|implement|configure|verify|test|provision|wire|add|create|document|validate|execute)\b/i.test(value);
}

export function auditGapEvidenceRecords(records: readonly GapEvidenceRecord[]): GapEvidenceAuditSummary {
  const findings: GapEvidenceFinding[] = [];
  const seen = new Set<string>();
  let previous = 0;
  for (const record of records) {
    const numericId = Number(record.gapId.replace("GAP-", ""));
    if (record.columnCount !== gapTrackerColumnNames.length) {
      findings.push({ status: "fail", gapId: record.gapId, message: `Expected ${gapTrackerColumnNames.length} columns, found ${record.columnCount}.` });
    }
    if (!Number.isFinite(numericId)) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Gap ID is not numeric." });
    }
    if (seen.has(record.gapId)) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Duplicate gap ID." });
    }
    seen.add(record.gapId);
    if (Number.isFinite(numericId) && numericId !== previous + 1) {
      findings.push({ status: "warn", gapId: record.gapId, message: `Expected sequential GAP-${String(previous + 1).padStart(3, "0")}.` });
    }
    previous = Number.isFinite(numericId) ? numericId : previous;
    if (!severityValues.has(record.severity)) {
      findings.push({ status: "fail", gapId: record.gapId, message: `Unsupported severity ${record.severity}.` });
    }
    if (record.normalizedBlocksProduction === "Unknown") {
      findings.push({ status: "fail", gapId: record.gapId, message: `Blocks production must begin with Yes or No, found ${record.blocksProductionRaw}.` });
    }
    if (record.blocksProductionRaw !== record.normalizedBlocksProduction && record.normalizedBlocksProduction !== "Unknown") {
      findings.push({ status: "warn", gapId: record.gapId, message: `Blocks production uses qualified value: ${record.blocksProductionRaw}.` });
    }
    if (!hasActionSpecificity(record.remainingWork)) {
      findings.push({ status: "warn", gapId: record.gapId, message: "Remaining work is too vague for agent execution." });
    }
    if (!hasActionSpecificity(record.suggestedPrompt)) {
      findings.push({ status: "warn", gapId: record.gapId, message: "Suggested handoff prompt is too vague." });
    }
    if (!hasVerificationSpecificity(record.verificationNeeded)) {
      findings.push({ status: record.normalizedBlocksProduction === "Yes" ? "fail" : "warn", gapId: record.gapId, message: "Verification/test needed field lacks concrete evidence detail." });
    }
    if (/\bclosed\b/i.test(record.currentStatus) && !/\bevidence\b|\bcommand\b|\bprovider\b|\bci\b/i.test(record.currentStatus)) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Closed gap language lacks evidence wording." });
    }
  }
  const bySeverity = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.severity] = (acc[record.severity] ?? 0) + 1;
    return acc;
  }, {});
  const byPhase = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.phase] = (acc[record.phase] ?? 0) + 1;
    return acc;
  }, {});
  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    totalGaps: records.length,
    blockingGaps: records.filter((record) => record.normalizedBlocksProduction === "Yes").length,
    criticalBlockingGaps: records.filter((record) => record.severity === "Critical" && record.normalizedBlocksProduction === "Yes").map((record) => record.gapId),
    bySeverity,
    byPhase,
    findings,
    status,
  };
}

function classifyHref(href: string): MarkdownLinkKind {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return "external";
  }
  if (href.startsWith("mailto:")) {
    return "email";
  }
  if (href.startsWith("#")) {
    return "anchor";
  }
  if (href.startsWith("sandbox:")) {
    return "ignored";
  }
  if (href.startsWith("/")) {
    return "root-relative";
  }
  return "relative";
}

function stripFragmentAndQuery(href: string): string {
  return href.split("#")[0]?.split("?")[0] ?? href;
}

function dirname(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

function normalizePath(path: string): string {
  const output: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      output.pop();
      continue;
    }
    output.push(part);
  }
  return output.join("/");
}

function resolveRelativePath(sourcePath: string, href: string): string {
  const target = stripFragmentAndQuery(href);
  if (!target) {
    return sourcePath;
  }
  if (target.startsWith("/")) {
    return normalizePath(target.slice(1));
  }
  return normalizePath(`${dirname(sourcePath)}/${target}`);
}

export function extractMarkdownLinks(document: MarkdownDocumentInput): readonly MarkdownLinkRecord[] {
  const records: MarkdownLinkRecord[] = [];
  const regex = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of document.contents.matchAll(regex)) {
    const label = match[1] ?? "";
    const href = match[2] ?? "";
    const kind = classifyHref(href);
    records.push({
      sourcePath: document.path,
      label,
      href,
      targetPath: kind === "relative" || kind === "root-relative" ? resolveRelativePath(document.path, href) : null,
      kind,
    });
  }
  return records;
}

export function auditMarkdownLinks(documents: readonly MarkdownDocumentInput[], existingPaths: ReadonlySet<string>): MarkdownLinkAuditSummary {
  const findings: MarkdownLinkFinding[] = [];
  const links = documents.flatMap((document) => [...extractMarkdownLinks(document)]);
  const relativeLinks = links.filter((link) => link.kind === "relative" || link.kind === "root-relative");
  for (const link of relativeLinks) {
    if (!link.targetPath) {
      findings.push({ status: "fail", sourcePath: link.sourcePath, href: link.href, message: "Relative link target could not be resolved." });
      continue;
    }
    if (!existingPaths.has(link.targetPath)) {
      findings.push({ status: "fail", sourcePath: link.sourcePath, href: link.href, message: `Missing relative link target ${link.targetPath}.` });
    }
  }
  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    totalDocuments: documents.length,
    totalLinks: links.length,
    checkedRelativeLinks: relativeLinks.length,
    findings,
    status,
  };
}

function isPathReference(value: string): boolean {
  if (!value || /\s/.test(value) || /[*?[\]{}]/.test(value)) {
    return false;
  }

  if (/^(pnpm|npm|node|npx|git|gh|curl|eas|prisma)(:|\b)/i.test(value)) {
    return false;
  }

  if (/^[A-Z0-9_]+$/.test(value)) {
    return false;
  }

  return /^(apps|packages|scripts|docs|deployment|testing|\.github)\//.test(value) || /^[A-Z0-9_-]+\.(md|json|yml|yaml)$/i.test(value);
}

function normalizeReferencedPath(value: string): string {
  return stripFragmentAndQuery(value.replace(/^\.?\//, "").replace(/[:#]L?\d+.*$/i, ""));
}

function extractInlineCodeReferences(contents: string): readonly string[] {
  const references: string[] = [];
  const regex = /`([^`\n]+)`/g;
  for (const match of contents.matchAll(regex)) {
    const reference = normalizeReferencedPath(match[1] ?? "");
    if (isPathReference(reference)) {
      references.push(reference.replace(/\\/g, "/").replace(/\/$/, ""));
    }
  }
  return references;
}

function resolveReferencedPath(sourcePath: string, reference: string, existingPaths: ReadonlySet<string>): string {
  if (/^(apps|packages|scripts|docs|deployment|testing|\.github)\//.test(reference)) {
    return reference;
  }

  const relativeCandidate = normalizePath(`${dirname(sourcePath)}/${reference}`);
  if (existingPaths.has(relativeCandidate)) {
    return relativeCandidate;
  }

  return reference;
}

function hasUnsupportedProductionClaim(line: string): boolean {
  if (!/\b(production[- ]ready|launch[- ]ready|ready for production|safe for production)\b/i.test(line)) {
    return false;
  }

  return !/\b(not|none|without|blocked|gated|requires?|until|before|placeholder|unverified|prematurely|not legal advice|not production[- ]ready)\b/i.test(line);
}

function normalizeRoutePath(routePath: string): string {
  return routePath
    .replace(/^['"]|['"]$/g, "")
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "")
    .replace(/\/$/, "");
}

function extractBacktickedRouteReferences(contents: string): readonly { raw: string; routePath: string }[] {
  const references: { raw: string; routePath: string }[] = [];
  const regex = /`((?:(?:GET|POST|PUT|PATCH|DELETE)\s+)?\/api\/[^`\s]+)`/g;
  for (const match of contents.matchAll(regex)) {
    const raw = match[1] ?? "";
    references.push({ raw, routePath: normalizeRoutePath(raw.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, "")) });
  }
  return references;
}

function routeToSegmentPath(routePath: string): string {
  return routePath
    .replace(/^\//, "")
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        return `[${segment.slice(1)}]`;
      }
      if (segment === "*") {
        return "[...slug]";
      }
      return segment;
    })
    .join("/");
}

function shouldIgnoreRoute(routePath: string, contract: DocumentationConsistencyContract): boolean {
  return (
    (contract.routeReference.ignoredPrefixes ?? []).some((prefix) => routePath.startsWith(prefix)) ||
    (contract.routeReference.ignoredRouteFragments ?? []).some((fragment) => routePath.includes(fragment))
  );
}

function routeReferenceExists(routePath: string, contract: DocumentationConsistencyContract, existingPaths: ReadonlySet<string>): boolean {
  const segmentPath = routeToSegmentPath(routePath);
  return contract.routeReference.apps.some((appRoot) => existingPaths.has(`${appRoot}/${segmentPath}/route.ts`));
}

function containsAnyTerm(line: string, terms: readonly string[]): boolean {
  const lower = line.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

export function auditDocumentationConsistency(
  documents: readonly MarkdownDocumentInput[],
  existingPaths: ReadonlySet<string>,
  contract: DocumentationConsistencyContract,
): DocumentationConsistencyAuditSummary {
  const findings: DocumentationConsistencyFinding[] = [];
  let routeReferencesChecked = 0;

  for (const document of documents) {
    for (const reference of extractBacktickedRouteReferences(document.contents)) {
      if (shouldIgnoreRoute(reference.routePath, contract)) {
        continue;
      }
      routeReferencesChecked += 1;
      if (!routeReferenceExists(reference.routePath, contract, existingPaths)) {
        findings.push({
          status: "fail",
          rule: "route-reference",
          sourcePath: document.path,
          reference: reference.raw,
          message: `Backticked API route reference does not resolve to a route.ts handler: ${reference.routePath}.`,
        });
      }
    }

    document.contents.split(/\r?\n/).forEach((line, index) => {
      if (
        containsAnyTerm(line, contract.providerReadinessLanguage.providers) &&
        containsAnyTerm(line, contract.providerReadinessLanguage.claimTerms) &&
        !containsAnyTerm(line, contract.providerReadinessLanguage.allowedQualifiers)
      ) {
        findings.push({
          status: "fail",
          rule: "provider-readiness-language",
          sourcePath: document.path,
          line: index + 1,
          message: "Provider readiness claim lacks blocked/gated/evidence/sandbox qualifier.",
        });
      }

      if (
        containsAnyTerm(line, contract.legalReadinessLanguage.claimTerms) &&
        !containsAnyTerm(line, contract.legalReadinessLanguage.allowedQualifiers)
      ) {
        findings.push({
          status: "fail",
          rule: "legal-readiness-language",
          sourcePath: document.path,
          line: index + 1,
          message: "Legal readiness claim lacks pending/gated/evidence qualifier.",
        });
      }
    });
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    totalDocuments: documents.length,
    routeReferencesChecked,
    findings,
    status,
  };
}

function codeownersHasPattern(codeowners: string, pattern: string): boolean {
  return codeowners.split(/\r?\n/).some((line) => line.trim().startsWith(pattern));
}

function textIncludesTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

export function auditRepositoryGovernance(
  contract: RepositoryGovernanceContract,
  input: RepositoryGovernanceInput,
): RepositoryGovernanceAuditSummary {
  const findings: RepositoryGovernanceFinding[] = [];

  for (const path of contract.requiredFiles) {
    if (!input.existingPaths.has(path)) {
      findings.push({ status: "fail", rule: "required-file", path, message: `Required governance file is missing: ${path}.` });
    }
  }

  for (const pattern of contract.requiredCodeownersPatterns) {
    if (!codeownersHasPattern(input.codeowners, pattern)) {
      findings.push({ status: "fail", rule: "codeowners-pattern", pattern, message: `CODEOWNERS is missing required pattern: ${pattern}.` });
    }
  }

  for (const term of contract.pullRequestTemplateTerms) {
    if (!textIncludesTerm(input.pullRequestTemplate, term)) {
      findings.push({ status: "fail", rule: "pr-template-term", term, message: `Pull request template is missing governance term: ${term}.` });
    }
  }

  for (const term of contract.issueTemplateTerms) {
    if (!textIncludesTerm(input.gapClosureIssueTemplate, term)) {
      findings.push({ status: "fail", rule: "issue-template-term", term, message: `Gap closure issue template is missing governance term: ${term}.` });
    }
  }

  for (const term of contract.ciRequiredTerms) {
    if (!textIncludesTerm(input.ciWorkflow, term)) {
      findings.push({ status: "fail", rule: "ci-required-term", term, message: `CI workflow is missing required governance gate: ${term}.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    findings,
    requiredFilesChecked: contract.requiredFiles.length,
    codeownersPatternsChecked: contract.requiredCodeownersPatterns.length,
    templateTermsChecked: contract.pullRequestTemplateTerms.length + contract.issueTemplateTerms.length,
    ciTermsChecked: contract.ciRequiredTerms.length,
    externalSettingsStillRequired: contract.externalSettingsStillRequired,
    status,
  };
}

export function auditSemanticDocumentationClaims(documents: readonly MarkdownDocumentInput[], existingPaths: ReadonlySet<string>): SemanticDocumentationAuditSummary {
  const findings: SemanticDocumentationFinding[] = [];
  let referencedPathsChecked = 0;

  for (const document of documents) {
    for (const rawReference of extractInlineCodeReferences(document.contents)) {
      const reference = resolveReferencedPath(document.path, rawReference, existingPaths);
      referencedPathsChecked += 1;
      if (!existingPaths.has(reference)) {
        findings.push({ status: "fail", sourcePath: document.path, reference, message: `Referenced repo path does not exist: ${reference}.` });
      }
    }

    const lines = document.contents.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (hasUnsupportedProductionClaim(line)) {
        findings.push({ status: "fail", sourcePath: document.path, message: `Unsupported production-readiness claim on line ${index + 1}.` });
      }
    });
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    totalDocuments: documents.length,
    referencedPathsChecked,
    findings,
    status,
  };
}

export const phase17QualityGates: readonly QualityGateDefinition[] = [
  {
    id: "quality-doc-links",
    title: "Markdown link, path, and documentation consistency audit",
    priority: "high",
    command: "node scripts/quality/audit-doc-links.mjs && node scripts/quality/verify-documentation-consistency.mjs && node scripts/quality/verify-documentation-inventory.mjs",
    files: ["scripts/quality/audit-doc-links.mjs", "scripts/quality/verify-documentation-consistency.mjs", "scripts/quality/verify-documentation-inventory.mjs", "docs/quality/manifests/markdown-link-audit.json", "docs/quality/manifests/documentation-consistency-audit.json", "docs/quality/manifests/documentation-inventory-audit.json"],
    blocksGapIds: ["GAP-124", "GAP-128"],
    purpose: "Detect broken relative Markdown links, missing referenced repo paths, unsupported production-ready claims, unresolved API route references, stale provider/legal readiness claims, and stale app/package inventory references before an agent relies on stale documentation.",
    acceptanceEvidence: ["Audit command output", "Updated markdown-link-audit.json", "Updated documentation-consistency-audit.json", "Updated documentation-inventory-audit.json", "No missing relative targets, unsupported production claims, unresolved API route references, unqualified provider/legal readiness claims, or stale app/package roots"],
  },
  {
    id: "quality-gap-evidence",
    title: "Gap tracker evidence audit",
    priority: "critical",
    command: "node scripts/quality/audit-gap-evidence.mjs",
    files: ["scripts/quality/audit-gap-evidence.mjs", "docs/quality/manifests/gap-evidence-audit.json", "GAP_TRACKER.md"],
    blocksGapIds: ["GAP-122", "GAP-119"],
    purpose: "Prevent malformed or evidence-free gap changes from being treated as production progress.",
    acceptanceEvidence: ["Audit command output", "Updated gap-evidence-audit.json", "No fail findings before closing a production blocker"],
  },
  {
    id: "repository-governance",
    title: "Repository governance prerequisite audit",
    priority: "critical",
    command: "node scripts/quality/verify-repository-governance.mjs",
    files: ["scripts/quality/verify-repository-governance.mjs", "docs/quality/manifests/repository-governance-audit.json", ".github/CODEOWNERS", ".github/PULL_REQUEST_TEMPLATE.md"],
    blocksGapIds: ["GAP-125", "GAP-129", "GAP-133"],
    purpose: "Verify source-controlled branch-protection prerequisites before claiming external GitHub repository settings are enforced.",
    acceptanceEvidence: ["Audit command output", "Updated repository-governance-audit.json", "CODEOWNERS covers governance and sensitive surfaces", "CI includes quality, handoff, workspace, and secret-management gates"],
  },
  {
    id: "required-quality-checks",
    title: "Required quality checks contract audit",
    priority: "critical",
    command: "node scripts/quality/verify-required-checks.mjs",
    files: ["scripts/quality/verify-required-checks.mjs", "docs/quality/manifests/required-checks-audit.json", ".github/workflows/ci.yml", "package.json"],
    blocksGapIds: ["GAP-129", "GAP-111", "GAP-133"],
    purpose: "Verify required package scripts, CI workflow terms, and branch-protection check names before external GitHub branch protection is claimed.",
    acceptanceEvidence: ["Audit command output", "Updated required-checks-audit.json", "CI contains required quality, handoff, workspace, workspace enforcement, typecheck, lint, unit, and e2e gates", "External branch-protection check names documented"],
  },
  {
    id: "workspace-required-checks",
    title: "Workspace required checks contract audit",
    priority: "critical",
    command: "node scripts/workspace/verify-workspace-required-checks.mjs",
    files: ["scripts/workspace/verify-workspace-required-checks.mjs", "docs/workspace/manifests/workspace-required-checks-audit.json", "docs/workspace/manifests/workspace-required-checks-contract.json", "package.json", ".github/workflows/ci.yml"],
    blocksGapIds: ["GAP-133", "GAP-130", "GAP-132"],
    purpose: "Verify workspace audit scripts are chained, visible in CI, and named for future branch protection before workspace enforcement is claimed.",
    acceptanceEvidence: ["Audit command output", "Updated workspace-required-checks-audit.json", "workspace:all chains import/script/readiness/enforcement/toolchain checks", "CI includes workspace checks", "PR gap-diff and required-check enforcement terms are present"],
  },
  {
    id: "workspace-toolchain-readiness",
    title: "Workspace toolchain readiness audit",
    priority: "high",
    command: "node scripts/workspace/verify-workspace-toolchain.mjs",
    files: ["scripts/workspace/verify-workspace-toolchain.mjs", "docs/workspace/manifests/workspace-toolchain-readiness-audit.json", "docs/workspace/manifests/workspace-toolchain-readiness-contract.json", "packages/workspace/src/index.ts", "packages/workspace/tests/workspace-audit.test.ts", "package.json", ".github/workflows/ci.yml"],
    blocksGapIds: ["GAP-130", "GAP-132"],
    purpose: "Verify the workspace helper package, scripts, generated report placeholders, root command chain, and CI wiring stay aligned before runtime readiness evidence is claimed.",
    acceptanceEvidence: ["Audit command output", "Updated workspace-toolchain-readiness-audit.json", "Workspace helper package, scripts, manifests, root scripts, and CI terms are aligned", "Runtime/provider proof remains separately blocked until install/build/test evidence exists"],
  },
  {
    id: "runtime-evidence",
    title: "Runtime evidence audit",
    priority: "critical",
    command: "node scripts/workspace/verify-runtime-evidence.mjs",
    files: ["scripts/workspace/verify-runtime-evidence.mjs", "docs/workspace/manifests/runtime-evidence-contract.json", "docs/workspace/manifests/runtime-evidence.json", "docs/workspace/manifests/runtime-evidence-audit.json", "scripts/workspace/print-runtime-readiness.mjs"],
    blocksGapIds: ["GAP-132", "GAP-001", "GAP-012"],
    purpose: "Keep install, workspace, handoff, quality, typecheck, unit, and app-build evidence explicit before runtime readiness is claimed.",
    acceptanceEvidence: ["Audit command output", "Updated runtime-evidence-audit.json", "Required command evidence is marked passed only after real runs", "Missing evidence remains explicit and secret-safe"],
  },
  {
    id: "legal-review",
    title: "Legal review evidence audit",
    priority: "critical",
    command: "node scripts/legal/verify-legal-review.mjs",
    files: ["scripts/legal/verify-legal-review.mjs", "docs/legal/LEGAL_REVIEW_PACKET.md", "docs/legal/manifests/legal-review-contract.json", "docs/legal/manifests/legal-review-evidence.json", "docs/legal/manifests/legal-review-audit.json"],
    blocksGapIds: ["GAP-013", "GAP-120"],
    purpose: "Keep attorney review requirements explicit and secret-safe before production legal readiness is claimed.",
    acceptanceEvidence: ["Audit command output", "Updated legal-review-audit.json", "All required legal review items are approved with redacted evidence labels", "No privileged attorney communications, secrets, or client data appear in evidence"],
  },
  {
    id: "quality-gate-summary",
    title: "Quality gate summary",
    priority: "medium",
    command: "node scripts/quality/print-quality-gates.mjs",
    files: ["scripts/quality/print-quality-gates.mjs", "docs/quality/manifests/quality-gates.json"],
    blocksGapIds: ["GAP-121", "GAP-125"],
    purpose: "Give Codex, Jules, Claude Code, and CI the same command list for repo quality verification.",
    acceptanceEvidence: ["Printed command list", "CI includes the quality gate scripts", "Handoff docs reference the gates"],
  },
];

export function summarizeQualityGates(gates: readonly QualityGateDefinition[]): QualityGatePlanSummary {
  const referencedGapIds = Array.from(new Set(gates.flatMap((gate) => gate.blocksGapIds))).sort();
  return {
    totalGates: gates.length,
    criticalGates: gates.filter((gate) => gate.priority === "critical").length,
    highGates: gates.filter((gate) => gate.priority === "high").length,
    mediumGates: gates.filter((gate) => gate.priority === "medium").length,
    lowGates: gates.filter((gate) => gate.priority === "low").length,
    commands: gates.map((gate) => gate.command),
    referencedGapIds,
  };
}
