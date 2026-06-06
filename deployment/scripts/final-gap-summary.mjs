#!/usr/bin/env node
import { readFileSync } from "node:fs";

const text = readFileSync("GAP_TRACKER.md", "utf8");
const rows = text.split(/\r?\n/).filter((line) => /^\| GAP-\d+ /.test(line));
const bySeverity = new Map();
const productionBlockers = [];
for (const row of rows) {
  const cols = row.split("|").map((col) => col.trim());
  const id = cols[1];
  const severity = cols[5];
  const blocksProduction = cols[6];
  bySeverity.set(severity, (bySeverity.get(severity) ?? 0) + 1);
  if (/yes/i.test(blocksProduction)) productionBlockers.push(id);
}
console.log("InkRoute final gap summary");
console.log(`Total gaps: ${rows.length}`);
for (const [severity, count] of [...bySeverity.entries()].sort()) {
  console.log(`${severity}: ${count}`);
}
console.log(`Production blockers: ${productionBlockers.length}`);
console.log(productionBlockers.join(", "));
