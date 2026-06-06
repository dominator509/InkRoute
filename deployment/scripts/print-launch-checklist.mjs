#!/usr/bin/env node
import { readFileSync } from "node:fs";

const checklist = JSON.parse(readFileSync("deployment/manifests/production-launch-checklist.json", "utf8"));
const blockers = checklist.filter((item) => item.blocksProduction && item.status !== "implemented");
console.log("InkRoute production launch checklist");
console.log(`Items: ${checklist.length}; production blockers: ${blockers.length}`);
for (const item of checklist) {
  const marker = item.blocksProduction ? "BLOCKS" : "NOTE";
  console.log(`- [${marker}] ${item.id} — ${item.area} — ${item.status}`);
  console.log(`  Evidence: ${item.evidence}`);
}
