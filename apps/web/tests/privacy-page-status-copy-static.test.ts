import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workspaceRoot = join(__dirname, "..", "..", "..");

function readWorkspaceFile(path: string): string {
  return readFileSync(join(workspaceRoot, path), "utf8");
}

describe("privacy page status copy", () => {
  it("describes privacy request intake as locally wired but production-gated", () => {
    const privacyPage = readWorkspaceFile("apps/web/app/privacy/page.tsx");

    expect(privacyPage).toContain("Privacy request intake is wired for demo-scope persistence and production fail-closed handling");
    expect(privacyPage).toContain("production must still verify identity");
    expect(privacyPage).not.toContain("Privacy request flows are scaffolded only");
    expect(privacyPage).not.toContain("Legal placeholder Â· Not final");
  });
});
