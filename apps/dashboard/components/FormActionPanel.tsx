"use client";

import { useState } from "react";
import { createClientRequestKey } from "../lib/clientRequestKeys";

type FormActionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function FormActionPanel() {
  const [state, setState] = useState<FormActionState>({
    status: "idle",
    message: "Archives a form metadata draft through a tenant-scoped write boundary without publishing legal copy or requesting signatures.",
  });

  async function handleArchiveFormDraft() {
    setState({ status: "submitting", message: "Archiving form metadata draft through the dashboard form API..." });

    try {
      const response = await fetch("/api/forms/local-consent-form", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": createClientRequestKey("dashboard-form-archive"),
        },
        body: JSON.stringify({ action: "archive_form_version" }),
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
            "Form metadata writes are blocked until DB-backed form persistence, audit logging, and legal-copy review evidence exist.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Form archive ${payload.persistence ?? "accepted"}; form publishing, signature requests, private upload retention, and attorney-reviewed copy remain evidence-gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Form write request could not reach the dashboard API; retry after the local route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Form actions</p>
        <h2>Archive form metadata draft</h2>
        <p>
          Form writes are RBAC-gated, tenant-scoped, audited, and no-store through the archive metadata contract.
          Consent publishing, signature requests, private upload retention, and raw medical payload handling stay evidence-gated.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleArchiveFormDraft} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Archiving draft..." : "Archive form draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
