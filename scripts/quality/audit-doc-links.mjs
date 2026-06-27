#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/quality/manifests/markdown-link-audit.json");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".claude", ".serena"]);

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const absolute = join(dir, name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) entries.push(...walk(absolute));
    if (stat.isFile()) entries.push(absolute);
  }
  return entries;
}

function walkPaths(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const absolute = join(dir, name);
    const stat = statSync(absolute);
    entries.push(absolute);
    if (stat.isDirectory()) entries.push(...walkPaths(absolute));
  }
  return entries;
}

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function classifyHref(href) {
  if (href.startsWith("http://") || href.startsWith("https://")) return "external";
  if (href.startsWith("mailto:")) return "email";
  if (href.startsWith("#")) return "anchor";
  if (href.startsWith("sandbox:")) return "sandbox";
  if (href.startsWith("tel:")) return "phone";
  return "relative";
}

function stripFragmentAndQuery(href) {
  return href.split("#")[0].split("?")[0];
}

function resolveTarget(sourceAbsolute, href) {
  const bare = stripFragmentAndQuery(href);
  if (!bare) return sourceAbsolute;
  if (bare.startsWith("/")) return join(root, bare.slice(1));
  return normalize(join(dirname(sourceAbsolute), bare));
}

function extractLinks(text) {
  const links = [];
  const regex = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of text.matchAll(regex)) {
    links.push({ label: match[1] ?? "", href: match[2] ?? "" });
  }
  return links;
}

function isPathReference(value) {
  if (!value || /\s/.test(value) || /[*?[\]{}]/.test(value)) return false;
  if (/^(pnpm|npm|node|npx|git|gh|curl|eas|prisma)(:|\b)/i.test(value)) return false;
  if (/^[A-Z0-9_]+$/.test(value)) return false;
  return /^(apps|packages|scripts|docs|deployment|testing|\.github)\//.test(value) || /^[A-Z0-9_-]+\.(md|json|yml|yaml)$/i.test(value);
}

function normalizeReferencedPath(value) {
  return stripFragmentAndQuery(value.replace(/^\.?\//, "").replace(/[:#]L?\d+.*$/i, "")).replace(/\\/g, "/").replace(/\/$/, "");
}

function extractInlineCodeReferences(text) {
  const references = [];
  const regex = /`([^`\n]+)`/g;
  for (const match of text.matchAll(regex)) {
    const reference = normalizeReferencedPath(match[1] ?? "");
    if (isPathReference(reference)) references.push(reference);
  }
  return references;
}

function resolveInlineReference(sourcePath, reference) {
  if (/^(apps|packages|scripts|docs|deployment|testing|\.github)\//.test(reference)) return reference;
  const relativeCandidate = normalize(`${dirname(sourcePath)}/${reference}`).split("\\").join("/");
  if (existingRepoPaths.has(relativeCandidate)) return relativeCandidate;
  return reference;
}

function hasUnsupportedProductionClaim(line) {
  if (!/\b(production[- ]ready|launch[- ]ready|ready for production|safe for production)\b/i.test(line)) return false;
  return !/\b(not|none|without|blocked|gated|requires?|until|before|placeholder|unverified|prematurely|not legal advice|not production[- ]ready)\b/i.test(line);
}

const markdownFiles = walk(root).filter((file) => file.endsWith(".md"));
const existingRepoPaths = new Set(walkPaths(root).map(toRepoPath));
const findings = [];
const semanticFindings = [];
const linkRecords = [];
const referencedPathRecords = [];
for (const absolutePath of markdownFiles) {
  const repoPath = toRepoPath(absolutePath);
  const text = readFileSync(absolutePath, "utf8");
  for (const link of extractLinks(text)) {
    const kind = classifyHref(link.href);
    const record = { sourcePath: repoPath, label: link.label, href: link.href, kind };
    if (kind === "relative") {
      const targetAbsolute = resolveTarget(absolutePath, link.href);
      const targetRepoPath = toRepoPath(targetAbsolute);
      record.targetPath = targetRepoPath;
      const insideRoot = resolve(targetAbsolute).startsWith(resolve(root));
      if (!insideRoot) {
        findings.push({ status: "fail", sourcePath: repoPath, href: link.href, message: "Relative link resolves outside the repository." });
      } else if (!existsSync(targetAbsolute)) {
        findings.push({ status: "fail", sourcePath: repoPath, href: link.href, message: `Missing relative link target: ${targetRepoPath}` });
      }
    }
    linkRecords.push(record);
  }

  for (const rawReference of extractInlineCodeReferences(text)) {
    const reference = resolveInlineReference(repoPath, rawReference);
    referencedPathRecords.push({ sourcePath: repoPath, reference });
    if (!existingRepoPaths.has(reference)) {
      semanticFindings.push({ status: "fail", sourcePath: repoPath, reference, message: `Referenced repo path does not exist: ${reference}.` });
    }
  }

  text.split(/\r?\n/).forEach((line, index) => {
    if (hasUnsupportedProductionClaim(line)) {
      semanticFindings.push({ status: "fail", sourcePath: repoPath, message: `Unsupported production-readiness claim on line ${index + 1}.` });
    }
  });
}

const allFindings = [...findings, ...semanticFindings];
const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 17 quality gate hardening",
  status: allFindings.some((finding) => finding.status === "fail") ? "fail" : allFindings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  markdownFilesChecked: markdownFiles.length,
  totalLinks: linkRecords.length,
  relativeLinksChecked: linkRecords.filter((record) => record.kind === "relative").length,
  referencedPathsChecked: referencedPathRecords.length,
  findings,
  semanticFindings,
  linkRecords,
  referencedPathRecords,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Markdown link audit status: ${report.status}`);
console.log(`Markdown files: ${report.markdownFilesChecked}; links: ${report.totalLinks}; relative checked: ${report.relativeLinksChecked}; referenced paths checked: ${report.referencedPathsChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
