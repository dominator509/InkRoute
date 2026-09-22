import { defineConfig, devices } from "@playwright/test";

const webBaseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const dashboardBaseUrl = process.env.DASHBOARD_BASE_URL ?? "http://127.0.0.1:3001";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "coverage/playwright-report", open: "never" }], ["json", { outputFile: "coverage/playwright-results.json" }], ["junit", { outputFile: "coverage/playwright-junit.xml" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "web-chromium",
      testMatch: /apps\/web\/tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: webBaseUrl }
    },
    {
      name: "web-mobile",
      testMatch: /apps\/web\/tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: webBaseUrl }
    },
    {
      name: "dashboard-chromium",
      testMatch: /apps\/dashboard\/tests\/e2e\/.*\.spec\.ts/,
      // Dashboard e2e exercises owner-level operator surfaces; authenticate every
      // request as the demo tenant owner via the same demo auth headers the API
      // specs already send manually. The dashboard middleware and layout honor
      // x-user-role, and the dev local-fallback keeps tenant resolution DB-free.
      use: {
        ...devices["Desktop Chrome"],
        baseURL: dashboardBaseUrl,
        extraHTTPHeaders: { "x-user-role": "owner" },
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : [
        {
          command: "pnpm --filter @inkroute/web dev",
          url: webBaseUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000
        },
        {
          command: "pnpm --filter @inkroute/dashboard dev",
          url: dashboardBaseUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000
        }
      ]
});
