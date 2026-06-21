#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/retention-backup-restore-tombstone-replay.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing backup/restore tombstone evidence artifact: ${artifactPath}. Capture restore replay proof before closing GAP-099.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const required = ["backupSnapshot", "restoreReplay", "tombstoneReplay", "rollbackNotes"];
const missing = required.filter((key) => artifact[key] !== true);

if (missing.length > 0) {
  console.error(`Backup/restore tombstone evidence is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Backup/restore tombstone evidence verified: ${artifactPath}`);
