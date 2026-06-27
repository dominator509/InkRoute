"use client";

import { useState } from "react";
import { demoTravelStops } from "@inkroute/config";

type TravelPublishState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "planned"; message: string }
  | { status: "blocked"; message: string };

export function TravelPublishActionPanel() {
  const [state, setState] = useState<TravelPublishState>({ status: "idle" });
  const stop = demoTravelStops[0];

  const submitPublishDraft = async () => {
    setState({ status: "submitting" });
    let response: Response;
    let payload: { message?: string; status?: string; error?: { message?: string }; productionBoundary?: unknown } | null = null;
    try {
      response = await fetch("/api/travel/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          artistId: stop.artistId,
          stop,
          idempotencyKey: `dashboard-travel-publish-${stop.id}-${Date.now()}`,
        }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setState({ status: "blocked", message: "Travel publish action could not reach the dashboard API runtime." });
      return;
    }

    if (!response.ok) {
      setState({ status: "blocked", message: payload?.error?.message ?? "Travel publish action was blocked by the dashboard API." });
      return;
    }

    setState({
      status: "planned",
      message: payload?.message ?? `Travel publish plan returned ${payload?.status ?? "without durable repository execution"}.`,
    });
  };

  return (
    <section className="card action-panel">
      <h2>Travel publishing actions</h2>
      <p>Submit a safe publish draft through POST /api/travel/publish. Durable travel repositories, public cache revalidation, provider rollback handling, waitlist notifications, and dashboard-to-public E2E proof remain evidence-gated.</p>
      <div className="button-row">
        <button type="button" disabled={state.status === "submitting"} onClick={() => void submitPublishDraft()}>
          {state.status === "submitting" ? "Submitting..." : "Submit publish draft"}
        </button>
        <button type="button" disabled>Add city</button>
        <button type="button" disabled>Open waitlist</button>
        <button type="button" disabled>Queue calendar sync</button>
      </div>
      {state.status === "planned" ? <p className="form-boundary-note success">{state.message}</p> : null}
      {state.status === "blocked" ? <p className="form-boundary-note danger">{state.message}</p> : null}
    </section>
  );
}
