"use client";

import { useState } from "react";

type ReleaseActionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function ReleaseActionPanel() {
  const [state, setState] = useState<ReleaseActionState>({
    status: "idle",
    message: "Creates a tenant-scoped release draft without deploying providers or touching protected environments.",
  });

  async function handleCreateReleaseDraft() {
    setState({ status: "submitting", message: "Submitting release draft through the dashboard release API..." });

    try {
      const version = `0.0.0-dashboard-draft-${Date.now()}`;
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-release-expected-version": version,
          "x-release-approval-state": "draft",
        },
        body: JSON.stringify({
          version,
          channel: "preview",
          commitSha: "release-draft",
          notes: "Dashboard-created release draft for route-boundary verification.",
          surfaces: ["web", "dashboard", "mobile", "database"],
          createdBy: "dashboard-release-action",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        persistence?: string;
        error?: { message?: string };
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            "Release draft creation is blocked until DB-backed release persistence, tenant membership, and CI evidence are available.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Release draft accepted as ${payload.persistence ?? "planned"}; protected environments, deploy jobs, EAS, and provider proof remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Release draft creation could not reach the dashboard API; retry after the local dashboard route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Release actions</p>
        <h2>Create preview release draft</h2>
        <p>
          Release and feature-flag routes are tenant-scoped and audited. This action exercises the release draft API while
          keeping Vercel deploys, EAS updates, Sentry uploads, rollback execution, and protected environment approval gated.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleCreateReleaseDraft} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Creating release draft..." : "Create release draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
