import { defineWorkspace } from "vitest/config";

const coverageConfig = {
  provider: "v8" as const,
  reporter: ["text", "json", "html", "lcov"] as const,
  reportsDirectory: "coverage/unit",
  thresholds: {
    lines: 50,
    functions: 45,
    branches: 40,
    statements: 50
  }
};

export default defineWorkspace([
  {
    test: {
      name: "web-contracts",
      include: ["apps/web/tests/**/*.test.ts"],
      environment: "node",
      coverage: coverageConfig,
    },
  },
  {
    test: {
      name: "dashboard-contracts",
      include: ["apps/dashboard/tests/**/*.test.ts"],
      environment: "node",
      coverage: coverageConfig,
    },
  },
  {
    test: {
      name: "domain-packages",
      include: ["packages/**/tests/**/*.test.ts"],
      environment: "node",
      coverage: coverageConfig
    }
  },
  {
    test: {
      name: "mobile-static",
      include: ["apps/mobile/tests/**/*.test.ts"],
      environment: "node",
      coverage: coverageConfig
    }
  }
]);
