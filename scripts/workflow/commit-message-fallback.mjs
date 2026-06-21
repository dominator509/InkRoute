#!/usr/bin/env node

import fs from "node:fs";
import { execSync } from "node:child_process";

const [, , messageFile] = process.argv;

if (!messageFile) {
  process.exit(1);
}

const stagedOutput = execSync("git diff --cached --name-only --", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

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

fs.writeFileSync(messageFile, `${body}\n`);
