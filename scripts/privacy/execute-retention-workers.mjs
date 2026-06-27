#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/retention-scheduled-worker.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing retention worker evidence artifact: ${artifactPath}. Run provider-backed delete/anonymize/export workers before closing GAP-099.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const required = ["databaseWorker", "storageWorker", "tombstonePersistence", "auditPersistence"];
const missing = required.filter((key) => artifact[key] !== true);

if (missing.length > 0) {
  console.error(`Retention worker evidence is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Retention worker evidence verified: ${artifactPath}`);
