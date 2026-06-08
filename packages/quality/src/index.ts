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
    title: "Markdown link, path, and claim audit",
    priority: "high",
    command: "node scripts/quality/audit-doc-links.mjs",
    files: ["scripts/quality/audit-doc-links.mjs", "docs/quality/manifests/markdown-link-audit.json"],
    blocksGapIds: ["GAP-124", "GAP-128"],
    purpose: "Detect broken relative Markdown links, missing referenced repo paths, and unsupported production-ready claims before an agent relies on stale documentation.",
    acceptanceEvidence: ["Audit command output", "Updated markdown-link-audit.json", "No missing relative targets or unsupported production claims"],
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
