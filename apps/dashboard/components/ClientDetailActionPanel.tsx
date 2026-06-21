"use client";

import { useState } from "react";

type ClientDetailActionPanelProps = {
  readonly clientId: string;
};

type ClientActionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function ClientDetailActionPanel({ clientId }: ClientDetailActionPanelProps) {
  const [state, setState] = useState<ClientActionState>({
    status: "idle",
    message: "Adds a private CRM note through a tenant-scoped client write boundary without exporting data or sending notifications.",
  });

  async function handleAddPrivateNote() {
    setState({ status: "submitting", message: "Saving private-note draft through the dashboard client API..." });

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `dashboard-client-note-${clientId}-${Date.now()}`,
        },
        body: JSON.stringify({
          action: "append_private_note",
          privateNote: "Dashboard operator follow-up note drafted from the gated client action panel.",
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
            "Private client note writes are blocked until database-backed tenant membership, audit logging, and retention policy evidence exist.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Private-note write ${payload.persistence ?? "accepted"}; consent resend, healed-photo requests, exports, deletes, and provider sends remain evidence-gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Client write request could not reach the dashboard API; retry after the local route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Private CRM actions</p>
        <h2>Save private-note draft</h2>
        <p>
          Client writes are RBAC-gated, tenant-scoped, audited, and no-store. This action avoids data export, consent
          resend, healed-photo request, delete, and notification provider side effects.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleAddPrivateNote} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Saving note..." : "Save private note"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
