"use client";

import { useState } from "react";

type SettingsActionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function SettingsActionPanel() {
  const [state, setState] = useState<SettingsActionState>({
    status: "idle",
    message: "Saves safe tenant profile metadata without accepting provider secrets or credential-bearing settings.",
  });

  async function handleSaveSettingsDraft() {
    setState({ status: "submitting", message: "Submitting safe settings draft through the tenant settings API..." });

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `dashboard-settings-draft-${Date.now()}`,
        },
        body: JSON.stringify({
          publicSiteName: "InkRoute Demo Studio",
          primaryLocale: "en-US",
          defaultTimezone: "America/Los_Angeles",
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
            "Settings save is blocked until DB-backed tenant persistence, audit logs, and provider-secret handling evidence are ready.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Settings draft accepted as ${payload.persistence ?? "planned"}; provider secrets, member invites, custom roles, and policy/legal changes remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Settings save could not reach the dashboard API; retry after the local dashboard route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Settings actions</p>
        <h2>Save safe settings draft</h2>
        <p>
          Tenant settings writes are RBAC-gated, tenant-scoped, no-store, and audit-ready through the safe profile metadata contract.
          Provider secrets, member invitations, custom roles, and legal policy copy stay evidence-gated.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleSaveSettingsDraft} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Saving settings..." : "Save settings draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
