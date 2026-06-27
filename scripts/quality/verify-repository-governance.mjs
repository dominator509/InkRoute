#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/quality/manifests/repository-governance-contract.json");
const outputPath = join(root, "docs/quality/manifests/repository-governance-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function readRepoFile(path) {
  return readFileSync(join(root, path), "utf8");
}

function includesTerm(text, term) {
  return text.toLowerCase().includes(term.toLowerCase());
}

const findings = [];
const requiredFilesChecked = [];
for (const filePath of contract.requiredFiles ?? []) {
  const present = existsSync(join(root, filePath));
  requiredFilesChecked.push({ path: filePath, present });
  if (!present) {
    findings.push({ status: "fail", rule: "required-file", path: filePath, message: `Required governance file is missing: ${filePath}.` });
  }
}

const codeownersPatternsChecked = [];
if (existsSync(join(root, ".github/CODEOWNERS"))) {
  const codeowners = readRepoFile(".github/CODEOWNERS");
  for (const pattern of contract.requiredCodeownersPatterns ?? []) {
    const present = codeowners.split(/\r?\n/).some((line) => line.trim().startsWith(pattern));
    codeownersPatternsChecked.push({ pattern, present });
    if (!present) {
      findings.push({ status: "fail", rule: "codeowners-pattern", pattern, message: `CODEOWNERS is missing required pattern: ${pattern}.` });
    }
  }
}

const templateTermsChecked = [];
if (existsSync(join(root, ".github/PULL_REQUEST_TEMPLATE.md"))) {
  const template = readRepoFile(".github/PULL_REQUEST_TEMPLATE.md");
  for (const term of contract.pullRequestTemplateTerms ?? []) {
    const present = includesTerm(template, term);
    templateTermsChecked.push({ file: ".github/PULL_REQUEST_TEMPLATE.md", term, present });
    if (!present) {
      findings.push({ status: "fail", rule: "pr-template-term", term, message: `Pull request template is missing governance term: ${term}.` });
    }
  }
}

if (existsSync(join(root, ".github/ISSUE_TEMPLATE/gap_closure.md"))) {
  const template = readRepoFile(".github/ISSUE_TEMPLATE/gap_closure.md");
  for (const term of contract.issueTemplateTerms ?? []) {
    const present = includesTerm(template, term);
    templateTermsChecked.push({ file: ".github/ISSUE_TEMPLATE/gap_closure.md", term, present });
    if (!present) {
      findings.push({ status: "fail", rule: "issue-template-term", term, message: `Gap closure issue template is missing governance term: ${term}.` });
    }
  }
}

const ciTermsChecked = [];
if (existsSync(join(root, ".github/workflows/ci.yml"))) {
  const workflow = readRepoFile(".github/workflows/ci.yml");
  for (const term of contract.ciRequiredTerms ?? []) {
    const present = includesTerm(workflow, term);
    ciTermsChecked.push({ file: ".github/workflows/ci.yml", term, present });
    if (!present) {
      findings.push({ status: "fail", rule: "ci-required-term", term, message: `CI workflow is missing required governance gate: ${term}.` });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
  findings,
  requiredFilesChecked,
  codeownersPatternsChecked,
  templateTermsChecked,
  ciTermsChecked,
  externalSettingsStillRequired: contract.externalSettingsStillRequired ?? []
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Repository governance audit status: ${report.status}`);
console.log(`Required files: ${requiredFilesChecked.length}; CODEOWNERS patterns: ${codeownersPatternsChecked.length}; CI terms: ${ciTermsChecked.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
