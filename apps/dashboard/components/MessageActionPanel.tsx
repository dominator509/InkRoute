"use client";

import { useState } from "react";

type MessageActionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "queued"; message: string }
  | { status: "blocked"; message: string };

export function MessageActionPanel() {
  const [state, setState] = useState<MessageActionState>({ status: "idle" });

  const queueFollowUp = async () => {
    setState({ status: "submitting" });
    let response: Response;
    let payload: { boundary?: string; error?: { message?: string }; ids?: { threadId?: string } } | null = null;
    try {
      response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId: "client_ari",
          subject: "Dashboard follow-up draft",
          body: "Safe dashboard follow-up draft queued from the gated message action panel. Provider delivery remains disabled until credentials and reconciliation evidence exist.",
          requestId: `dashboard-message-ui-${Date.now()}`,
          notificationType: "dashboard_message",
        }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setState({ status: "blocked", message: "Message write could not reach the dashboard API runtime." });
      return;
    }

    if (!response.ok) {
      setState({ status: "blocked", message: payload?.error?.message ?? "Message write was blocked by the dashboard API." });
      return;
    }

    setState({
      status: "queued",
      message: payload?.boundary ?? `Message write accepted${payload?.ids?.threadId ? ` for thread ${payload.ids.threadId}` : ""}.`,
    });
  };

  return (
    <section className="card action-panel">
      <h2>Message actions</h2>
      <p>Queue a safe in-app follow-up through POST /api/messages. Provider email, SMS, push delivery, inbound routing, and reconciliation remain evidence-gated.</p>
      <div className="button-row">
        <button type="button" disabled={state.status === "submitting"} onClick={() => void queueFollowUp()}>
          {state.status === "submitting" ? "Queueing..." : "Queue safe follow-up"}
        </button>
        <button type="button" disabled>Assign thread</button>
        <button type="button" disabled>Sync delivery status</button>
        <button type="button" disabled>Export message audit</button>
      </div>
      {state.status === "queued" ? <p className="form-boundary-note success">{state.message}</p> : null}
      {state.status === "blocked" ? <p className="form-boundary-note danger">{state.message}</p> : null}
    </section>
  );
}
