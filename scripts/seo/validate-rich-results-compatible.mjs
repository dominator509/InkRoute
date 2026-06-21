#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/structured-data-crawl.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing structured-data crawl artifact: ${artifactPath}. Generate rendered JSON-LD extraction evidence before closing GAP-073.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const unsupported = artifact.unsupportedSchemaTypes ?? artifact.unsupportedSchemas ?? [];
const invalid = artifact.invalidRichResults ?? artifact.invalidSchemas ?? [];

if (!Array.isArray(unsupported) || !Array.isArray(invalid)) {
  console.error("Structured-data artifact must expose unsupportedSchemaTypes/invalidRichResults arrays.");
  process.exit(1);
}

if (invalid.length > 0) {
  console.error(`Rich Results-compatible validation failed: ${invalid.join(", ")}`);
  process.exit(1);
}

console.log(`Rich Results-compatible structured data verified: ${artifactPath}`);
