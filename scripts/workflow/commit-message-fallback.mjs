#!/usr/bin/env node

import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const normalizeArg = (value) => {
  if (!value) return value;
  return value.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
};

const normalizeArgs = process.argv
  .slice(2)
  .map(normalizeArg)
  .filter(Boolean);

const parseMessageArg = (arg, nextArg) => {
  if (!arg) return null;
  if (arg === "--file" || arg === "-f") {
    return nextArg;
  }
  const fileFlagMatch = arg.match(/^--(?:file=|path=)(.+)$/i);
  return fileFlagMatch ? fileFlagMatch[1] : null;
};

const possibleMessageArgs = [];
for (let i = 0; i < normalizeArgs.length; i += 1) {
  const rawArg = normalizeArgs[i];
  const messageArg = parseMessageArg(rawArg, normalizeArgs[i + 1]);
  if (messageArg) {
    possibleMessageArgs.push(messageArg);
    if (rawArg === "--file" || rawArg === "-f") {
      i += 1;
    }
    continue;
  }

  if (!rawArg.startsWith("-")) {
    possibleMessageArgs.push(rawArg);
  }
}

const resolveMessageFile = () => {
  const maybeFileArg = possibleMessageArgs.find((arg) => {
    if (!arg) return false;
    const resolved = path.resolve(process.cwd(), arg);
    return (
      fs.existsSync(resolved) ||
      /[\\/]COMMIT_EDITMSG$/i.test(arg) ||
      /[\\/]COMMIT_EDITMSG$/i.test(resolved)
    );
  });

  if (!maybeFileArg) return null;
  return path.resolve(process.cwd(), maybeFileArg);
};

const messageFile = resolveMessageFile();

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const resolveGitDir = () => {
  const explicitGitDir = process.env.GIT_DIR;
  if (explicitGitDir) {
    return path.isAbsolute(explicitGitDir)
      ? explicitGitDir
      : path.resolve(process.cwd(), explicitGitDir);
  }

  try {
    const rawGitDir = execSync("git rev-parse --absolute-git-dir", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      cwd: process.cwd(),
    }).trim();

    return rawGitDir;
  } catch {
    const cwdGitDir = path.join(process.cwd(), ".git");
    if (fs.existsSync(cwdGitDir)) {
      return cwdGitDir;
    }

    const scriptGitDir = path.join(scriptRoot, ".git");
    if (fs.existsSync(scriptGitDir)) {
      return scriptGitDir;
    }

    return path.join(process.cwd(), ".git");
  }
};

const targetMessageFile = messageFile
  ? path.resolve(process.cwd(), messageFile)
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
