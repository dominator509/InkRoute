#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath = process.argv[2] ?? "coverage/retention-enforcement-dry-run.json";

mkdirSync(dirname(outputPath), { recursive: true });
const artifact = {
  generatedAt: new Date().toISOString(),
  mode: "dry-run",
  destructiveExecution: false,
  requiresProviderExecution: true,
  dueRecordLoading: false,
  tenantIsolation: false,
  legalHoldSkips: false,
  auditPersistence: false,
};

if (existsSync(outputPath) && !process.argv.includes("--overwrite")) {
  console.error(`Refusing to overwrite existing retention dry-run artifact without --overwrite: ${outputPath}`);
  process.exit(1);
}

writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote retention dry-run evidence scaffold: ${outputPath}`);
