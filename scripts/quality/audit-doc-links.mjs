#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/quality/manifests/markdown-link-audit.json");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);

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

const markdownFiles = walk(root).filter((file) => file.endsWith(".md"));
const findings = [];
const linkRecords = [];
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
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 17 quality gate hardening",
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  markdownFilesChecked: markdownFiles.length,
  totalLinks: linkRecords.length,
  relativeLinksChecked: linkRecords.filter((record) => record.kind === "relative").length,
  findings,
  linkRecords,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Markdown link audit status: ${report.status}`);
console.log(`Markdown files: ${report.markdownFilesChecked}; links: ${report.totalLinks}; relative checked: ${report.relativeLinksChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
