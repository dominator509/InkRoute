import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..", "..");

function readWorkspaceFile(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("security package Next.js runtime integration", () => {
  it("transpiles the shared security package in web and dashboard apps", () => {
    const webConfig = readWorkspaceFile("apps/web/next.config.mjs");
    const dashboardConfig = readWorkspaceFile("apps/dashboard/next.config.mjs");

    expect(webConfig).toContain("@inkroute/security");
    expect(dashboardConfig).toContain("@inkroute/security");
  });
});
