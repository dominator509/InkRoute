#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/abuse-rate-limit-distributed.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing abuse rate-limit evidence artifact: ${artifactPath}. Run the distributed limiter and bot-challenge smoke checks before closing GAP-101.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const required = ["tenantSafeKeys", "distributedLimiter", "botChallenge", "failClosed"];
const missing = required.filter((key) => artifact[key] !== true);

if (missing.length > 0) {
  console.error(`Abuse rate-limit evidence is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Abuse rate-limit evidence verified: ${artifactPath}`);
