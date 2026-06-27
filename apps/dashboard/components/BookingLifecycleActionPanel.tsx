"use client";

import { useState } from "react";
import type { BookingLifecycleAction } from "@inkroute/booking";

interface BookingLifecycleActionPanelProps {
  bookingId: string;
  actions: BookingLifecycleAction[];
}

type MutationState =
  | { status: "idle" }
  | { status: "submitting"; action: BookingLifecycleAction }
  | { status: "persisted"; message: string }
  | { status: "blocked"; message: string };

function labelForAction(action: BookingLifecycleAction) {
  return action.replace(/_/g, " ");
}

export function BookingLifecycleActionPanel({ bookingId, actions }: BookingLifecycleActionPanelProps) {
  const [state, setState] = useState<MutationState>({ status: "idle" });

  const submitAction = async (action: BookingLifecycleAction) => {
    setState({ status: "submitting", action });
    let response: Response;
    let payload: { boundary?: string; error?: { message?: string }; booking?: { status?: string } } | null = null;
    try {
      response = await fetch(`/api/bookings/${bookingId}/state`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          idempotencyKey: `dashboard-ui-${bookingId}-${action}-${Date.now()}`,
        }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setState({ status: "blocked", message: "Booking lifecycle mutation could not reach the dashboard API runtime." });
      return;
    }

    if (!response.ok) {
      setState({ status: "blocked", message: payload?.error?.message ?? "Booking lifecycle mutation was blocked by the dashboard API." });
      return;
    }

    setState({
      status: "persisted",
      message: payload?.boundary ?? `Booking state persisted${payload?.booking?.status ? ` as ${payload.booking.status}` : ""}.`,
    });
  };

  return (
    <section className="card action-panel">
      <h2>Lifecycle actions</h2>
      <p>These buttons call POST /api/bookings/{bookingId}/state. The route enforces dashboard RBAC, tenant checks, BookingStateEvent writes, AuditLog persistence, and provider boundaries.</p>
      <div className="button-row">
        {(actions.length > 0 ? actions : ["archive" as BookingLifecycleAction]).map((action) => (
          <button key={action} type="button" disabled={state.status === "submitting"} onClick={() => void submitAction(action)}>
            {state.status === "submitting" && state.action === action ? "Submitting..." : labelForAction(action)}
          </button>
        ))}
      </div>
      {state.status === "persisted" ? <p className="form-boundary-note success">{state.message}</p> : null}
      {state.status === "blocked" ? <p className="form-boundary-note danger">{state.message}</p> : null}
    </section>
  );
}
