#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const checks = [];

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function readIfExists(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function check(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function routeClassification(taskText) {
  try {
    const output = execFileSync(
      process.execPath,
      ["scripts/workflow/route-serena-obsidian.mjs", "--json", taskText],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      },
    );
    return JSON.parse(output).classification;
  } catch {
    return null;
  }
}

const projectConfig = read(".serena/project.yml");
const gitignore = read(".gitignore");
const router = read("scripts/workflow/route-serena-obsidian.mjs");
const packageJson = read("package.json");
const activationCard = read(".serena/memories/inkroute/activation.md");
const healthCard = read(".serena/memories/inkroute/serena-health.md");
const workflowDoc = read("docs/ai/SERENA_OBSIDIAN_WORKFLOW.md");
const codexConfig = readIfExists(path.join(process.env.USERPROFILE ?? "", ".codex", "config.toml"));
const unquotedLeadingGlobIgnoreLines =
  projectConfig
    ?.split(/\r?\n/)
    .filter((line) => /^\s*-\s+\*\*\//.test(line)) ?? [];

check(".serena/project.yml exists", projectConfig !== null, "Serena project config is required.");
check(
  "Serena project identity is InkRoute",
  /project_name:\s*["']?InkRoute["']?/i.test(projectConfig ?? ""),
  "Set project_name to InkRoute.",
);
check(
  "Serena indexes TypeScript",
  /language:\s*typescript/i.test(projectConfig ?? ""),
  "Use TypeScript as the live semantic navigation language.",
);
check(
  "Serena respects .gitignore",
  /ignore_all_files_in_gitignore:\s*true/i.test(projectConfig ?? ""),
  "Keep generated and local-only paths out of the index.",
);
check(
  "Serena leading glob ignores are YAML-quoted",
  unquotedLeadingGlobIgnoreLines.length === 0,
  "Quote ignored_paths entries that start with **/ so YAML parsers do not treat them as aliases.",
);
check(
  "Serena is read-only",
  /read_only:\s*true/i.test(projectConfig ?? ""),
  "Use Serena for navigation/references only; make edits through Codex patching tools or RTK-scoped repo commands.",
);
check(
  "Serena response budget is bounded",
  /default_max_tool_answer_chars:\s*(?:[1-3]\d{3}|4000)\b/i.test(projectConfig ?? ""),
  "Keep live Serena answers compact; prefer 3500 or less for this repo.",
);
check(
  "Serena symbol-info budget is bounded",
  /symbol_info_budget:\s*(?:0(?:\.\d+)?|0\.1\d*)\b/i.test(projectConfig ?? ""),
  "Keep symbol expansion narrow; use one owner/reference jump, not broad exploration.",
);
check(
  "Serena routing prefers micro or hot packets",
  /workflow:micro/i.test(projectConfig ?? "") && /workflow:route:hot/i.test(projectConfig ?? ""),
  "Expose compact routing commands so agents avoid dumping full workflow docs.",
);
check(
  "workflow:admit uses the micro stoplight",
  /"workflow:admit"\s*:\s*"node scripts\/workflow\/route-serena-obsidian\.mjs --micro"/.test(packageJson ?? ""),
  "Keep the default admission shortcut compact; use workflow:route:brief only when extra route text is useful.",
);
check(
  "Activation card is the first startup memory",
  /read only \.serena\/memories\/inkroute\/activation\.md/i.test(projectConfig ?? ""),
  "Startup should not sweep every memory card.",
);
check(
  "Activation uses the absolute InkRoute project root",
  /absolute project root C:\\dev\\InkRoute/i.test(projectConfig ?? "") &&
    /activate the absolute project root `C:\\dev\\InkRoute`/i.test(activationCard ?? "") &&
    /always target the absolute project root `C:\\dev\\InkRoute`/i.test(workflowDoc ?? ""),
  "Live Serena activation should target C:\\dev\\InkRoute, not a parent, symlink, temp checkout, or generated docs bundle.",
);
check(
  "Unavailable live tools have an RTK fallback",
  /no callable Serena MCP tools/i.test(projectConfig ?? "") &&
    /workflow:codex/i.test(projectConfig ?? "") &&
    /RTK/i.test(projectConfig ?? "") &&
    /outside the repository/i.test(healthCard ?? "") &&
    /outside this repository/i.test(workflowDoc ?? "") &&
    /attach or restart the Serena MCP server/i.test(healthCard ?? "") &&
    /attach or restart the Serena MCP server/i.test(workflowDoc ?? ""),
  "Codex sessions can have repo config without live Serena MCP tools.",
);
check(
  "Serena health separates repo config from live MCP mounting",
  /session\/tool-mount boundary/i.test(healthCard ?? "") &&
    /workflow:serena:check/i.test(healthCard ?? "") &&
    /does not prove that the current Codex session has mounted live Serena MCP tools/i.test(workflowDoc ?? ""),
  "Keep repo-side Serena health distinct from external MCP/tool exposure.",
);
check(
  "Codex host Serena launcher is deterministic when local config is present",
  codexConfig === null ||
    (/\[mcp_servers\.serena\][\s\S]*command\s*=\s*['"][A-Z]:\\[^'"]*\\serena\.exe['"]/i.test(codexConfig) &&
      /\[mcp_servers\.serena\][\s\S]*startup_timeout_sec\s*=/i.test(codexConfig) &&
      /\[mcp_servers\.serena\][\s\S]*tool_timeout_sec\s*=/i.test(codexConfig)),
  "Use an absolute Serena launcher and explicit timeouts in the Codex host config so desktop PATH differences do not hide live Serena tools.",
);
check(
  "Serena semantic lookup lane is explicit",
  /serena-semantic-lookup/.test(router ?? "") &&
    /Activate C:\\\\dev\\\\InkRoute if the Serena project is not active/.test(router ?? "") &&
    /symbols, owners, references, call sites, or route\/service-boundary/i.test(workflowDoc ?? "") &&
    /activate\/use Serena and find symbols/i.test(activationCard ?? "") &&
    /Do not apply this maintenance lane to requests that say to activate or use Serena and then find symbols/i.test(healthCard ?? ""),
  "Activation plus symbol/reference requests should route to one live semantic lookup, not Serena maintenance.",
);
check(
  "Router keeps bare Serena activation live",
  routeClassification("activate Serena for current project") === "serena-activation",
  "Do not treat plain activation wording as maintenance.",
);
check(
  "Router keeps Serena activation noun phrase live",
  routeClassification("Serena activation") === "serena-activation",
  "Do not treat a bare Serena activation noun phrase as maintenance.",
);
check(
  "Router sends Serena activation plus symbols to semantic lookup",
  routeClassification(
    "Use Serena to activate the current project. Then find the main backend auth/session symbols and their references.",
  ) === "serena-semantic-lookup",
  "Activation plus symbols/references should be one live semantic lookup, not Serena maintenance.",
);
check(
  "Router sends Serena maintenance to workflow tooling",
  routeClassification("fix and optimize Serena for this repo") === "workflow-tooling",
  "Serena config/health/optimization work should patch repo workflow surfaces without live-tool ceremony.",
);

const ignoredPathNeedles = [
  "node_modules/**",
  ".next/**",
  "coverage/**",
  "testing/artifacts/**",
  "docs/quality/reports/**",
  "docs/quality/manifests/**",
  "audit-artifacts/**",
  "artifacts/**",
  ".serena/cache/**",
  ".serena/backups/**",
  ".serena/db/**",
  ".serena/history/**",
  ".serena/index/**",
  ".serena/logs/**",
  ".serena/snapshots/**",
  ".serena/tmp/**",
  ".serena/workspace/**",
  ".serena/project.local.yml",
  ".obsidian/**",
  "docs/ai/repomix-summary.xml",
  ".repomix/**",
  "tmp/**",
  "temp/**",
  "storybook-static/**",
  ".vite/**",
  "**/.env",
  "**/.env.*",
  "**/*.pem",
  "**/*.key",
  "**/*.har",
  "**/*.trace",
  "**/*.zip",
  "**/*.sarif",
  "**/*.sqlite",
  "**/*.db",
];

for (const ignoredPath of ignoredPathNeedles) {
  check(
    `ignored_paths includes ${ignoredPath}`,
    (projectConfig ?? "").includes(ignoredPath),
    "Keep dependency, generated, secret, and database artifacts out of Serena.",
  );
}

const requiredCards = [
  ".serena/memories/inkroute/activation.md",
  ".serena/memories/inkroute/quickstart.md",
  ".serena/memories/inkroute/routing-contract.md",
  ".serena/memories/inkroute/tool-admission.md",
  ".serena/memories/inkroute/workflow-optimizer.md",
  ".serena/memories/inkroute/serena-health.md",
];

for (const cardPath of requiredCards) {
  check(`${cardPath} exists`, read(cardPath) !== null, "Required Serena routing card is missing.");
}

const localSerenaStatePaths = [
  ".serena/backups/",
  ".serena/cache/",
  ".serena/db/",
  ".serena/history/",
  ".serena/index/",
  ".serena/logs/",
  ".serena/snapshots/",
  ".serena/tmp/",
  ".serena/workspace/",
];

for (const statePath of localSerenaStatePaths) {
  check(
    `${statePath} is gitignored`,
    new RegExp(`^${statePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m").test(gitignore ?? ""),
    "Keep local Serena cache, index, logs, and temp state out of commits.",
  );
}
check(
  ".serena/project.local.yml is gitignored",
  /^\.serena\/project\.local\.yml$/m.test(gitignore ?? ""),
  "Keep local Serena override settings out of commits.",
);
check(
  "Local Obsidian vault is gitignored",
  /^\.obsidian\/$/m.test(gitignore ?? ""),
  "Keep local vault state out of commits.",
);
check(
  "Canonical workflow doc exists",
  workflowDoc !== null,
  "docs/ai/SERENA_OBSIDIAN_WORKFLOW.md should remain the stable contract.",
);
check(
  "Executable router exists",
  router !== null,
  "Router script should stay aligned with the cards.",
);

const failed = checks.filter((entry) => !entry.passed);

console.log(`Serena config check: ${failed.length === 0 ? "PASS" : "FAIL"}`);

for (const entry of checks) {
  const marker = entry.passed ? "ok" : "fail";
  console.log(`[${marker}] ${entry.name}`);
  if (!entry.passed) {
    console.log(`      ${entry.detail}`);
  }
}

process.exitCode = failed.length === 0 ? 0 : 1;
