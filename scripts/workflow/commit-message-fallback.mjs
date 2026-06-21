#!/usr/bin/env node

import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const [, , messageFile] = process.argv;
const resolveGitDir = () => {
  try {
    const rawGitDir = execSync("git rev-parse --git-dir", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      cwd: process.cwd(),
    }).trim();

    return path.isAbsolute(rawGitDir)
      ? rawGitDir
      : path.join(process.cwd(), rawGitDir);
  } catch {
    return path.join(process.cwd(), ".git");
  }
};

const targetMessageFile = messageFile
  ? messageFile
  : path.join(resolveGitDir(), "COMMIT_EDITMSG");

if (!messageFile) {
  // Some clients invoke core.editor without passing the temporary file path.
  // Fall back to the default repository message file so commit can still proceed.
}

let stagedOutput = "";
try {
  stagedOutput = execSync("git diff --cached --name-only --", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  stagedOutput = "";
}

const stagedFiles = stagedOutput
  ? stagedOutput.split(/\r?\n/).filter(Boolean)
  : [];

const fileSummary =
  stagedFiles.length === 0
    ? "maintenance update"
    : stagedFiles.slice(0, 3).join(", ");

const subject =
  stagedFiles.length > 0
    ? `chore: update ${stagedFiles.length} staged file(s)`
    : "chore: maintenance update";

const extra =
  stagedFiles.length > 3
    ? `, ... and ${stagedFiles.length - 3} more`
    : "";

const body = `${subject}

Summary:
- ${fileSummary}${extra}

Validation:
- GUI-triggered auto-generated commit message fallback was used.

Risk:
- Review generated diff and regenerate the message if needed before push.
`;

fs.mkdirSync(path.dirname(targetMessageFile), { recursive: true });
fs.writeFileSync(targetMessageFile, `${body}\n`);
