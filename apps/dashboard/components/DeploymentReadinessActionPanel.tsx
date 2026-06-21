"use client";

import { useState } from "react";

type DeploymentReadinessState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function DeploymentReadinessActionPanel() {
  const [state, setState] = useState<DeploymentReadinessState>({
    status: "idle",
    message: "Requests a deployment readiness review without executing provider deploys, migrations, EAS updates, or rollbacks.",
  });

  async function handleRequestReadinessReview() {
    setState({ status: "submitting", message: "Requesting deployment readiness review through the dashboard API..." });

    try {
      const response = await fetch("/api/deployment/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "readiness-review",
          targetEnvironment: "production",
          requestId: `dashboard-deployment-readiness-${Date.now()}`,
          reason: "Dashboard operator requested a production readiness review without provider execution.",
          blockerIds: ["GAP-014", "GAP-089"],
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        persistence?: string;
        operationResult?: { status?: string; boundary?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            "Deployment readiness request is blocked until DB-backed audit persistence, protected environments, and provider evidence exist.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Readiness review ${payload.operationResult?.status ?? "requested"} as ${payload.persistence ?? "planned"}; provider deploys, migrations, EAS updates, Sentry uploads, and rollback execution remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Deployment readiness request could not reach the dashboard API; retry after the local route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Deployment actions</p>
        <h2>Request readiness review</h2>
        <p>
          Deployment readiness writes are RBAC-gated, no-store, and audit-ready. This action records a readiness review request
          while keeping deploy, migrate, EAS publish, production approval, and rollback execution outside the app.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleRequestReadinessReview} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Requesting review..." : "Request readiness review"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
