import {
  buildDeploymentPlan,
  buildHandoffTasks,
  buildProductionLaunchChecklist,
  evaluateEnvironmentReadiness,
  providerOptions,
  summarizeLaunchChecklist,
} from "@inkroute/deployment";

export const deploymentPlanPreview = buildDeploymentPlan("production");
export const launchChecklistPreview = buildProductionLaunchChecklist();
export const launchChecklistSummary = summarizeLaunchChecklist(launchChecklistPreview);
export const handoffTasksPreview = buildHandoffTasks();
export const providerMatrixPreview = providerOptions;

export const exampleEnvironmentReadiness = evaluateEnvironmentReadiness(
  {
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://artist.inkroute.example",
    NEXT_PUBLIC_DASHBOARD_URL: "https://admin.inkroute.example",
    DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/inkroute",
    AUTH_SECRET: "replace-with-strong-random-secret",
    STRIPE_SECRET_KEY: "",
    VERCEL_TOKEN: "",
    EAS_PROJECT_ID: "",
    CSRF_SECRET: "",
    LEGAL_REVIEW_STATUS: "scaffolded_not_reviewed",
  },
  "production",
  "2026-06-03T00:00:00.000Z",
);

export const deploymentCommandCards = [
  {
    label: "Presence-only env check",
    command: "pnpm deploy:check-env",
    status: "Implemented script; safe against .env.example.",
  },
  {
    label: "Strict production env check",
    command: "pnpm deploy:check-env:strict",
    status: "Expected to fail until .env.local has real production-safe values.",
  },
  {
    label: "Print launch checklist",
    command: "pnpm deploy:checklist",
    status: "Implemented dependency-free script.",
  },
  {
    label: "Summarize gaps",
    command: "pnpm deploy:gaps",
    status: "Implemented dependency-free script that parses GAP_TRACKER.md.",
  },
];
