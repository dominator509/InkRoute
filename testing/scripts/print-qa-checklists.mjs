import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = [
  "testing/manifests/accessibility-checklist.json",
  "testing/manifests/security-checklist.json",
  "testing/manifests/mobile-device-qa-checklist.json",
  "testing/manifests/manual-qa-checklist.json",
  "testing/manifests/provider-test-plan.json"
];

for (const file of files) {
  const parsed = JSON.parse(readFileSync(join(root, file), "utf8"));
  console.log(`\n## ${file}`);
  for (const entry of parsed.checks ?? parsed.manualRuns ?? parsed.providers ?? []) {
    console.log(`- ${entry.id ?? entry.name}: ${entry.description ?? entry.evidenceRequired ?? entry.commands?.join("; ")}`);
  }
}
