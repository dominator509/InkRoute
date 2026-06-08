#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function normalizeCell(cell) {
  return cell.trim().replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ");
}

function parseGapRow(line) {
  if (!/^\|\s*GAP-/i.test(line)) {
    return null;
  }

  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(normalizeCell);

  if (cells.length < 12) {
    return null;
  }

  return {
    gapId: cells[0],
    currentStatus: cells[6] ?? "",
    blocksProduction: cells[5] ?? "",
    verificationNeeded: cells[11] ?? "",
    raw: line,
  };
}

function extractPrRefs(eventPath) {
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const pr = event.pull_request;
  if (!pr?.base?.sha || !pr?.head?.sha) {
    return null;
  }

  return {
    baseRef: pr.base.sha,
    headRef: pr.head.sha,
  };
}

function isSha(value) {
  return /^[a-fA-F0-9]{7,40}$/.test(value);
}

function isOpenStatus(value) {
  return /^\s*open\b/i.test(value || "");
}

function isNonOpenStatus(value) {
  return !isOpenStatus(value);
}

function hasEvidence(value) {
  const v = (value || "").toLowerCase();
  return /`[^`]+`/.test(value || "") || /\b(run|execute|pass|passed|output|log|ci|provider|verify|evidence|proof|proofs|snapshot|screenshot|artifact|command|check|verified|commanded|drill|reviewed|updated|command output)\b/.test(v);
}

function hasGapClosureEvidence(newRow) {
  const statusHasEvidence = hasEvidence(newRow.currentStatus);
  const verificationHasEvidence = hasEvidence(newRow.verificationNeeded);

  if (!statusHasEvidence || !verificationHasEvidence) {
    const checks = [];
    if (!statusHasEvidence) checks.push("current status");
    if (!verificationHasEvidence) checks.push("verification/test needed");
    return { ok: false, checks };
  }

  return { ok: true, checks: [] };
}

function collectGapDiff(diffText) {
  const added = new Map();
  const removed = new Map();

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith("+++") || line.startsWith("---")) {
      continue;
    }

    if (!line.startsWith("+") && !line.startsWith("-")) {
      continue;
    }

    const row = parseGapRow(line.slice(1));
    if (!row?.gapId) {
      continue;
    }

    if (line.startsWith("+")) {
      added.set(row.gapId, row);
    } else {
      removed.set(row.gapId, row);
    }
  }

  return { added, removed };
}

function resolveRefs(eventRefs) {
  if (eventRefs) {
    return eventRefs;
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  const headRef = process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA;
  if (baseRef || headRef) {
    return {
      baseRef: baseRef ? `origin/${baseRef}` : undefined,
      headRef,
    };
  }

  return null;
}

function runGapDiffAudit() {
  const isPullRequest = process.env.GITHUB_EVENT_NAME === "pull_request";
  if (!isPullRequest && process.env.GITHUB_EVENT_PATH == null) {
    console.log("Skipping gap-diff audit: no pull-request context available.");
    return;
  }

  const eventRefs = extractPrRefs(process.env.GITHUB_EVENT_PATH);
  const resolved = resolveRefs(eventRefs);
  if (!resolved?.baseRef || !resolved?.headRef) {
    console.log("Skipping gap-diff audit: missing pull-request base/head refs.");
    return;
  }

  const baseRef = resolved.baseRef;
  const headRef = resolved.headRef;
  const baseRefForFetch = baseRef.startsWith("origin/")
    ? baseRef.replace(/^origin\//, "")
    : baseRef;
  const headRefForFetch = headRef.startsWith("origin/")
    ? headRef.replace(/^origin\//, "")
    : headRef;

  if (isSha(baseRef) || baseRef.startsWith("origin/")) {
    execSync(`git fetch --no-tags --depth=1 origin ${baseRefForFetch}`, {
      cwd: root,
      stdio: "ignore",
    });
  }

  if (isSha(headRef) || headRef.startsWith("origin/")) {
    execSync(`git fetch --no-tags --depth=1 origin ${headRefForFetch}`, {
      cwd: root,
      stdio: "ignore",
    });
  }

  const diff = execSync(`git diff --unified=0 ${baseRef}...${headRef} -- GAP_TRACKER.md`, {
    cwd: root,
    encoding: "utf8",
  });

  const { added, removed } = collectGapDiff(diff);
  const changedGapIds = new Set([...added.keys(), ...removed.keys()]);
  const findings = [];

  for (const gapId of [...changedGapIds].sort()) {
    const newRow = added.get(gapId);
    const oldRow = removed.get(gapId);

    if (!oldRow || !newRow) {
      continue;
    }

    const statusChanged = oldRow.currentStatus !== newRow.currentStatus;
    const blockersDowngraded = /^\s*yes/i.test(oldRow.blocksProduction) && /^\s*no/i.test(newRow.blocksProduction);
    const statusClosing = statusChanged && isNonOpenStatus(newRow.currentStatus);
    const requiresEvidence = statusClosing || blockersDowngraded;

    if (!requiresEvidence) {
      continue;
    }

    const evidence = hasGapClosureEvidence(newRow);
    if (!evidence.ok) {
      findings.push(`GAP-TRK-DIFF: ${gapId} changed to non-open status or downgraded blocker but lacks evidence in ${evidence.checks.join(" and ")} column(s).`);
      continue;
    }

  }

  if (findings.length > 0) {
    console.error(":: GitHub PR gap-tracker diff enforcement failed ::");
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exitCode = 1;
  } else if (changedGapIds.size > 0) {
    console.log(`Gap tracker diff audit passed for ${changedGapIds.size} changed gap row(s).`);
  } else {
    console.log("Gap tracker diff audit skipped: GAP_TRACKER.md not modified in this PR.");
  }
}

runGapDiffAudit();
