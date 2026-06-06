import { describe, expect, it } from "vitest";
import { auditGapEvidenceRecords, auditMarkdownLinks, parseGapEvidenceRecords, phase17QualityGates, summarizeQualityGates } from "../src/index";

describe("quality gates", () => {
  it("summarizes the Phase 17 quality gate catalog", () => {
    const summary = summarizeQualityGates(phase17QualityGates);
    expect(summary.totalGates).toBeGreaterThan(0);
    expect(summary.referencedGapIds).toContain("GAP-122");
  });

  it("parses and audits a gap row", () => {
    const markdown = "| GAP-126 | Phase 17 | Quality | Example. | Medium | Yes | Open | `file.ts` | Run a verification command. | Codex | Implement and verify the gap evidence rule. | `pnpm quality:all` passes with evidence. |";
    const records = parseGapEvidenceRecords(markdown);
    const audit = auditGapEvidenceRecords(records);
    expect(records).toHaveLength(1);
    expect(audit.totalGaps).toBe(1);
  });

  it("checks relative markdown links", () => {
    const audit = auditMarkdownLinks([{ path: "docs/example.md", contents: "See [readme](../README.md)." }], new Set(["README.md", "docs/example.md"]));
    expect(audit.status).toBe("pass");
  });
});
