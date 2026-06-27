#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const artifactPath = process.argv[2] ?? "coverage/structured-data-crawl.json";

if (!existsSync(artifactPath)) {
  console.error(
    `Missing sitemap/canonical/noindex crawl artifact: ${artifactPath}. Capture rendered crawl output before closing GAP-073.`,
  );
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const required = ["sitemapVerified", "canonicalVerified", "robotsVerified", "noindexVerified"];
const missing = required.filter((key) => artifact[key] !== true);

if (missing.length > 0) {
  console.error(`Sitemap/canonical/noindex crawl evidence is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Sitemap/canonical/noindex crawl evidence verified: ${artifactPath}`);
