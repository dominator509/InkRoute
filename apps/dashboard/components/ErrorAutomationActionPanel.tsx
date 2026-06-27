"use client";

import { useState } from "react";

type ErrorAutomationState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "accepted"; message: string }
  | { status: "blocked"; message: string };

export function ErrorAutomationActionPanel() {
  const [state, setState] = useState<ErrorAutomationState>({ status: "idle" });

  const submitGithubIssueDraft = async () => {
    setState({ status: "submitting" });
    let response: Response;
    let payload: { data?: { dispatch?: { dispatchState?: string }; requiredNextWork?: string[] }; error?: { message?: string } } | null = null;
    try {
      response = await fetch("/api/observability/github-issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          humanApproved: true,
          message: "Sanitized dashboard issue automation smoke draft",
          route: "/dashboard/errors",
          release: "local-dashboard",
        }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setState({ status: "blocked", message: "GitHub issue automation could not reach the dashboard API runtime." });
      return;
    }

    if (!response.ok) {
      setState({ status: "blocked", message: payload?.error?.message ?? "GitHub issue automation was blocked by the dashboard API." });
      return;
    }

    setState({
      status: "accepted",
      message: `GitHub issue automation returned ${payload?.data?.dispatch?.dispatchState ?? "a credential-gated draft"}.`,
    });
  };

  return (
    <section className="card action-panel">
      <h2>Bug-fix workflow actions</h2>
      <p>Create a sanitized GitHub issue automation draft through POST /api/observability/github-issues. Live dispatch, Sentry links, trace replay, screenshots, and provider-backed evidence remain gated.</p>
      <div className="button-row">
        <button type="button" disabled={state.status === "submitting"} onClick={() => void submitGithubIssueDraft()}>
          {state.status === "submitting" ? "Submitting..." : "Create sanitized issue draft"}
        </button>
        <button type="button" disabled>Assign severity</button>
        <button type="button" disabled>Open Sentry event</button>
        <button type="button" disabled>Generate agent handoff</button>
      </div>
      {state.status === "accepted" ? <p className="form-boundary-note success">{state.message}</p> : null}
      {state.status === "blocked" ? <p className="form-boundary-note danger">{state.message}</p> : null}
    </section>
  );
}
