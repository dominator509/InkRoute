import { buildLaunchOperationsRuntimeReadinessPlan } from "@inkroute/deployment";
import type { LaunchOperationCheckId } from "@inkroute/deployment";

export type LaunchOperationsRuntimeStatus =
  | "wired"
  | "owner-gated"
  | "drill-gated"
  | "monitoring-gated"
  | "approval-gated"
  | "ci-gated";

export interface LaunchOperationsRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: LaunchOperationsRuntimeStatus;
}

export const launchOperationsRuntimeCheckIds: readonly LaunchOperationCheckId[] = [
  "on-call-coverage",
  "alert-routing",
  "support-escalation",
  "privacy-request-drill",
  "incident-drill",
  "rollback-drill",
  "production-monitoring",
  "communications-templates"
] as const;

export const launchOperationsRuntimeArtifactPaths = [
  "coverage/launch-operations-runtime.json",
  "coverage/launch-operations-verifier.json",
  "coverage/launch-operations-owner-coverage-redacted.json",
  "coverage/launch-operations-alert-routing-redacted.json",
  "coverage/launch-operations-support-escalation-redacted.json",
  "coverage/launch-operations-privacy-request-drill-redacted.json",
  "coverage/launch-operations-incident-drill-redacted.json",
  "coverage/launch-operations-rollback-drill-redacted.json",
  "coverage/launch-operations-monitoring-dashboard-redacted.json",
  "coverage/launch-operations-communications-templates-redacted.json",
  "coverage/launch-operations-approval-redacted.json",
  "coverage/launch-operations-ci-run-redacted.json",
  "test-results/launch-operations-runtime"
] as const;

export const launchOperationsRuntimeCommands = [
  "pnpm deploy:verify-ops",
  "alert routing test",
  "incident drill",
  "rollback drill",
  "privacy export/delete drill",
  "support escalation drill",
  "production monitoring dashboard review",
  "communications template approval"
] as const;

export const launchOperationsRuntimeMatrix: readonly LaunchOperationsRuntimeMatrixEntry[] = [
  {
    id: "operations-verifier",
    command: "pnpm deploy:verify-ops",
    artifact: "coverage/launch-operations-verifier.json",
    status: "wired"
  },
  {
    id: "owner-coverage",
    command: "assign named primary and backup owners for incident, privacy, support, release, and security",
    artifact: "coverage/launch-operations-owner-coverage-redacted.json",
    status: "owner-gated"
  },
  {
    id: "alert-routing",
    command: "alert routing test",
    artifact: "coverage/launch-operations-alert-routing-redacted.json",
    status: "monitoring-gated"
  },
  {
    id: "incident-rollback-drills",
    command: "incident drill and rollback drill",
    artifact: "coverage/launch-operations-rollback-drill-redacted.json",
    status: "drill-gated"
  },
  {
    id: "privacy-support-drills",
    command: "privacy export/delete drill and support escalation drill",
    artifact: "coverage/launch-operations-support-escalation-redacted.json",
    status: "drill-gated"
  },
  {
    id: "monitoring-dashboard",
    command: "production monitoring dashboard review",
    artifact: "coverage/launch-operations-monitoring-dashboard-redacted.json",
    status: "monitoring-gated"
  },
  {
    id: "communications-templates-approval",
    command: "communications template approval",
    artifact: "coverage/launch-operations-communications-templates-redacted.json",
    status: "approval-gated"
  },
  {
    id: "ci-operations-artifacts",
    command: "GitHub Actions launch operations artifact capture",
    artifact: "coverage/launch-operations-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const launchOperationsRuntimeReadiness = buildLaunchOperationsRuntimeReadinessPlan({
  approvalStatus: "blocked",
  ownerModel: {
    incidentCommander: "unassigned",
    privacyOwner: "unassigned",
    supportOwner: "unassigned",
    releaseOwner: "unassigned",
    securityOwner: "unassigned",
    requiresNamedPrimaryAndBackup: true
  },
  operationChecks: [],
  verifierPassed: false,
  alertTestPassed: false,
  incidentDrillPassed: false,
  rollbackDrillPassed: false,
  privacyRequestDrillPassed: false,
  supportEscalationDrillPassed: false,
  monitoringDashboardVerified: false,
  communicationsTemplatesApproved: false
});
