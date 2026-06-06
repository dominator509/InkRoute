import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "domain-packages",
      include: ["packages/**/tests/**/*.test.ts"],
      environment: "node",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        reportsDirectory: "coverage/unit"
      }
    }
  },
  {
    test: {
      name: "mobile-static",
      include: ["apps/mobile/tests/**/*.test.ts"],
      environment: "node"
    }
  }
]);
