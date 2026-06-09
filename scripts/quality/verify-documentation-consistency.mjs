#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/quality/manifests/documentation-consistency-contract.json");
const outputPath = join(root, "docs/quality/manifests/documentation-consistency-audit.json");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".claude", ".serena"]);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

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

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function normalizeRoutePath(routePath) {
  return routePath
    .replace(/^['"]|['"]$/g, "")
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "")
    .replace(/\/$/, "");
}

function extractBacktickedRouteReferences(text) {
  const references = [];
  const regex = /`((?:(?:GET|POST|PUT|PATCH|DELETE)\s+)?\/api\/[^`\s]+)`/g;
  for (const match of text.matchAll(regex)) {
    const raw = match[1] ?? "";
    const routePath = normalizeRoutePath(raw.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, ""));
    references.push({ raw, routePath });
  }
  return references;
}

function routeToSegmentPath(routePath) {
  return routePath
    .replace(/^\//, "")
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) return `[${segment.slice(1)}]`;
      if (segment === "*") return "[...slug]";
      return segment;
    })
    .join("/");
}

function shouldIgnoreRoute(routePath) {
  const ignoredPrefixes = contract.routeReference.ignoredPrefixes ?? [];
  const ignoredFragments = contract.routeReference.ignoredRouteFragments ?? [];
  return ignoredPrefixes.some((prefix) => routePath.startsWith(prefix)) || ignoredFragments.some((fragment) => routePath.includes(fragment));
}

function routeExists(routePath) {
  const segmentPath = routeToSegmentPath(routePath);
  return (contract.routeReference.apps ?? []).some((appRoot) => existsSync(join(root, appRoot, segmentPath, "route.ts")));
}

function containsAny(line, terms) {
  const lower = line.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function hasProviderName(line) {
  return containsAny(line, contract.providerReadinessLanguage.providers ?? []);
}

function hasProviderClaim(line) {
  return containsAny(line, contract.providerReadinessLanguage.claimTerms ?? []);
}

function hasProviderQualifier(line) {
  return containsAny(line, contract.providerReadinessLanguage.allowedQualifiers ?? []);
}

function hasLegalClaim(line) {
  return containsAny(line, contract.legalReadinessLanguage.claimTerms ?? []);
}

function hasLegalQualifier(line) {
  return containsAny(line, contract.legalReadinessLanguage.allowedQualifiers ?? []);
}

const markdownFiles = walk(root).filter((file) => file.endsWith(".md"));
const routeReferences = [];
const findings = [];

for (const absolutePath of markdownFiles) {
  const sourcePath = toRepoPath(absolutePath);
  const text = readFileSync(absolutePath, "utf8");
  const lines = text.split(/\r?\n/);

  for (const reference of extractBacktickedRouteReferences(text)) {
    if (shouldIgnoreRoute(reference.routePath)) continue;
    const record = { sourcePath, ...reference };
    routeReferences.push(record);
    if (!routeExists(reference.routePath)) {
      findings.push({
        status: "fail",
        rule: "route-reference",
        sourcePath,
        reference: reference.raw,
        message: `Backticked API route reference does not resolve to a web/dashboard route.ts handler: ${reference.routePath}.`
      });
    }
  }

  lines.forEach((line, index) => {
    if (hasProviderName(line) && hasProviderClaim(line) && !hasProviderQualifier(line)) {
      findings.push({
        status: "fail",
        rule: "provider-readiness-language",
        sourcePath,
        line: index + 1,
        message: "Provider readiness claim lacks blocked/gated/evidence/sandbox qualifier."
      });
    }

    if (hasLegalClaim(line) && !hasLegalQualifier(line)) {
      findings.push({
        status: "fail",
        rule: "legal-readiness-language",
        sourcePath,
        line: index + 1,
        message: "Legal readiness claim lacks pending/gated/evidence qualifier."
      });
    }
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
  markdownFilesChecked: markdownFiles.length,
  routeReferencesChecked: routeReferences.length,
  findings,
  routeReferences
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Documentation consistency audit status: ${report.status}`);
console.log(`Markdown files: ${report.markdownFilesChecked}; API routes checked: ${report.routeReferencesChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
