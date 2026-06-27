import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const fixtureDir = join(root, "scripts/quality/fixtures/pr-gap-diff");
const outputPath = join(root, "docs/quality/manifests/pr-gap-diff-fixtures.json");
const fixtures = [
  { file: "invalid-missing-evidence.diff", expectedOk: false },
  { file: "valid-with-evidence.diff", expectedOk: true }
];

function normalizeCell(cell) {
  return cell.trim().replace(/<br\s*\/?>(\s*)/gi, " ").replace(/\s+/g, " ");
}

function parseGapRow(line) {
  if (!/^\|\s*GAP-/i.test(line)) return null;
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(normalizeCell);
  if (cells.length < 12) return null;
  return {
    gapId: cells[0],
    currentStatus: cells[6] ?? "",
    verificationNeeded: cells[11] ?? ""
  };
}

function hasEvidence(value) {
  const v = (value || "").toLowerCase();
  return /`[^`]+`/.test(value || "") || /\b(run|execute|pass|passed|output|log|ci|provider|verify|evidence|proof|proofs|snapshot|screenshot|artifact|command|check|verified|commanded|drill|reviewed|updated|command output)\b/.test(v);
}

function collectAddedGapRows(diffText) {
  const rows = [];
  for (const line of diffText.split(/\r?\n/)) {
    if (!line.startsWith("+") || line.startsWith("+++") || line.startsWith("++++")) continue;
    const row = parseGapRow(line.slice(1));
    if (row) rows.push(row);
  }
  return rows;
}

const failures = [];
const results = [];
for (const fixture of fixtures) {
  const fixturePath = join(fixtureDir, fixture.file);
  if (!existsSync(fixturePath)) {
    failures.push(`Missing PR gap diff fixture ${fixture.file}.`);
    results.push({ file: fixture.file, expectedOk: fixture.expectedOk, status: "missing", addedGapRows: 0 });
    continue;
  }
  const rows = collectAddedGapRows(readFileSync(fixturePath, "utf8"));
  if (rows.length === 0) {
    failures.push(`Fixture ${fixture.file} must contain an added GAP row.`);
    results.push({ file: fixture.file, expectedOk: fixture.expectedOk, status: "empty", addedGapRows: 0 });
    continue;
  }
  const actualOk = rows.every((row) => hasEvidence(row.currentStatus) && hasEvidence(row.verificationNeeded));
  if (actualOk !== fixture.expectedOk) {
    failures.push(`Fixture ${fixture.file} expected ok=${fixture.expectedOk} but got ok=${actualOk}.`);
  }
  results.push({
    file: fixture.file,
    expectedOk: fixture.expectedOk,
    actualOk,
    status: actualOk === fixture.expectedOk ? "pass" : "fail",
    addedGapRows: rows.length,
    gapIds: rows.map((row) => row.gapId),
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length > 0 ? "fail" : "pass",
  fixtureCount: fixtures.length,
  results,
  failures,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures, report: outputPath }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, fixtureCount: fixtures.length, report: outputPath }, null, 2));
