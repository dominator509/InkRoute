"use client";

import { useState } from "react";
import { createClientRequestKey } from "../lib/clientRequestKeys";

type PaymentActionPanelProps = {
  readonly bookingId: string;
};

type PaymentActionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function PaymentActionPanel({ bookingId }: PaymentActionPanelProps) {
  const [state, setState] = useState<PaymentActionState>({
    status: "idle",
    message: "Requests a deposit-session mutation plan through the booking lifecycle route without calling Stripe.",
  });

  async function handleCreateDepositSessionDraft() {
    setState({ status: "submitting", message: "Requesting deposit-session mutation plan..." });

    try {
      const response = await fetch(`/api/bookings/${bookingId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_deposit",
          idempotencyKey: createClientRequestKey("dashboard-payment-deposit"),
          note: "Dashboard payment page requested a credential-free deposit-session draft.",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        dashboardMutationPlan?: { action?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            "Deposit-session creation is blocked until DB-backed booking mutation persistence and Stripe credentials are available.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Deposit-session mutation ${payload.dashboardMutationPlan?.action ?? "create_deposit_session"} accepted; Stripe checkout, refunds, no-show forfeiture, receipts, tax exports, and webhook reconciliation remain evidence-gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Deposit-session request could not reach the dashboard API; retry after the local route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Stripe actions</p>
        <h2>Create deposit-session draft</h2>
        <p>
          This uses the existing booking mutation route for `create_deposit_session` planning. It does not call Stripe,
          issue refunds, forfeit deposits, send receipts, reconcile webhooks, or export tax records.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleCreateDepositSessionDraft} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Requesting draft..." : "Create deposit-session draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
