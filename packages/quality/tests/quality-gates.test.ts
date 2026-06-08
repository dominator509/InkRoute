import { describe, expect, it } from "vitest";
import {
  auditGapEvidenceRecords,
  auditMarkdownLinks,
  extractMarkdownLinks,
  parseGapEvidenceRecords,
  phase17QualityGates,
  summarizeQualityGates,
} from "../src/index";

describe("quality gates", () => {
  it("summarizes the Phase 17 quality gate catalog", () => {
    const summary = summarizeQualityGates(phase17QualityGates);
    expect(summary.totalGates).toBeGreaterThan(0);
    expect(summary.criticalGates).toBe(1);
    expect(summary.highGates).toBe(1);
    expect(summary.mediumGates).toBe(1);
    expect(summary.referencedGapIds).toContain("GAP-122");
    expect(summary.commands).toContain("node scripts/quality/audit-gap-evidence.mjs");
  });

  it("parses and audits a gap row", () => {
    const markdown = "| GAP-126 | Phase 17 | Quality | Example. | Medium | Yes | Open | `file.ts` | Run a verification command. | Codex | Implement and verify the gap evidence rule. | `pnpm quality:all` passes with evidence. |";
    const records = parseGapEvidenceRecords(markdown);
    const audit = auditGapEvidenceRecords(records);
    expect(records).toHaveLength(1);
    expect(audit.totalGaps).toBe(1);
  });

  it("flags malformed, duplicate, and weak evidence gap rows", () => {
    const markdown = [
      "| GAP-001 | Phase 1 | Quality | Example. | Severe | Maybe | Closed | file.ts | TBD | Codex | Do it | soon |",
      "| GAP-001 | Phase 1 | Quality | Example. | High | Yes | Open | file.ts | TODO | Codex | TODO | none |",
      "| GAP-003 | Phase 1 | Quality | Example. | Medium | No for demo | Open | file.ts | Add focused tests and command evidence. | Codex | Implement and verify gap checks. | `pnpm quality:all` passes with evidence. |",
    ].join("\n");
    const audit = auditGapEvidenceRecords(parseGapEvidenceRecords(markdown));

    expect(audit.status).toBe("fail");
    expect(audit.findings.some((finding) => finding.message.includes("Unsupported severity"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Duplicate gap ID"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Expected sequential GAP-002"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Verification/test needed field lacks concrete evidence"))).toBe(true);
  });

  it("checks relative markdown links", () => {
    const audit = auditMarkdownLinks([{ path: "docs/example.md", contents: "See [readme](../README.md)." }], new Set(["README.md", "docs/example.md"]));
    expect(audit.status).toBe("pass");
  });

  it("classifies and resolves markdown links", () => {
    const links = extractMarkdownLinks({
      path: "docs/quality/example.md",
      contents: "See [local](../README.md), [root](/GAP_TRACKER.md), [site](https://example.test), and [mail](mailto:test@example.test).",
    });

    expect(links.map((link) => link.kind)).toEqual(["relative", "root-relative", "external", "email"]);
    expect(links[0]?.targetPath).toBe("docs/README.md");
    expect(links[1]?.targetPath).toBe("GAP_TRACKER.md");
  });

  it("fails missing relative markdown targets", () => {
    const audit = auditMarkdownLinks(
      [{ path: "docs/example.md", contents: "See [missing](./missing.md)." }],
      new Set(["docs/example.md"]),
    );

    expect(audit.status).toBe("fail");
    expect(audit.findings[0]?.message).toContain("Missing relative link target docs/missing.md");
  });
});
