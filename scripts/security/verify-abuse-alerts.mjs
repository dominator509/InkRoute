#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/abuse-alert-delivery-redacted.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing abuse alert evidence artifact: ${artifactPath}. Capture redacted alert-delivery proof before closing GAP-101.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const required = ["redactedAbuseEvents", "alertDelivery", "secretSafeLogs"];
const missing = required.filter((key) => artifact[key] !== true);

if (missing.length > 0) {
  console.error(`Abuse alert evidence is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Abuse alert evidence verified: ${artifactPath}`);
