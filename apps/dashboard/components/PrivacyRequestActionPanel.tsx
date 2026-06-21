"use client";

import { useState } from "react";

type PrivacyActionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "accepted"; message: string }
  | { status: "blocked"; message: string };

export function PrivacyRequestActionPanel() {
  const [state, setState] = useState<PrivacyActionState>({ status: "idle" });

  const submitAccessDraft = async () => {
    setState({ status: "submitting" });
    let response: Response;
    let payload: { data?: { persisted?: { id?: string }; nextStep?: string }; error?: { message?: string } } | null = null;
    try {
      response = await fetch("/api/security/privacy-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": "demo-studio-alpha",
          "x-user-role": "owner",
          "x-user-id": "dashboard-demo-user",
        },
        body: JSON.stringify({
          type: "access",
          email: "privacy-requester@example.test",
          details: {
            source: "dashboard-trust-action-panel",
            note: "Safe dashboard privacy request draft. Production persistence and workers remain evidence-gated.",
          },
        }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setState({ status: "blocked", message: "Privacy request action could not reach the dashboard API runtime." });
      return;
    }

    if (!response.ok) {
      setState({ status: "blocked", message: payload?.error?.message ?? "Privacy request action was blocked by the dashboard API." });
      return;
    }

    setState({
      status: "accepted",
      message: payload?.data?.nextStep ?? `Privacy request draft accepted${payload?.data?.persisted?.id ? ` as ${payload.data.persisted.id}` : ""}.`,
    });
  };

  return (
    <section className="card action-panel">
      <h2>Trust center actions</h2>
      <p>Submit a safe dashboard privacy request draft through POST /api/security/privacy-requests. Production durable privacy workers, audit persistence, storage export/delete, and attorney-reviewed policy text remain evidence-gated.</p>
      <div className="button-row">
        <button type="button" disabled={state.status === "submitting"} onClick={() => void submitAccessDraft()}>
          {state.status === "submitting" ? "Submitting..." : "Submit privacy access draft"}
        </button>
        <button type="button" disabled>Enable auth guard</button>
        <button type="button" disabled>Run tenant isolation tests</button>
        <button type="button" disabled>Approve legal pack</button>
      </div>
      {state.status === "accepted" ? <p className="form-boundary-note success">{state.message}</p> : null}
      {state.status === "blocked" ? <p className="form-boundary-note danger">{state.message}</p> : null}
    </section>
  );
}
