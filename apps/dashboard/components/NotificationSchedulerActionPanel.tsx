"use client";

import { useState } from "react";
import { createClientRequestKey } from "../lib/clientRequestKeys";

type SchedulerState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function NotificationSchedulerActionPanel() {
  const [state, setState] = useState<SchedulerState>({
    status: "idle",
    message: "Plans a notification automation sequence without sending email, SMS, push, or provider payloads.",
  });

  async function handleQueueSequencePlan() {
    setState({ status: "submitting", message: "Planning notification scheduler writes through the dashboard API..." });

    try {
      const now = new Date();
      const response = await fetch("/api/notifications/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule_sequence",
          idempotencyKey: createClientRequestKey("dashboard-notification-sequence"),
          bookingRequestId: createClientRequestKey("dashboard-scheduler-booking-subject"),
          appointmentId: createClientRequestKey("dashboard-scheduler-appointment-subject"),
          appointmentStartsAt: new Date(now.getTime() + 86_400_000).toISOString(),
          providerReady: false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        plan?: { status?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            "Notification scheduling is blocked until durable queue repositories, idempotency, and worker execution evidence exist.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Scheduler plan ${payload.plan?.status ?? "accepted"}; provider sends, queue persistence, retries, dead letters, and delivery reconciliation remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Notification scheduler request could not reach the dashboard API; retry after the local route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Notification actions</p>
        <h2>Queue automation plan</h2>
        <p>
          Scheduler writes are RBAC-gated, tenant-scoped, no-store, and wired through the local queue contract. This action exercises
          scheduling while keeping live provider sends, durable workers, suppression mutations, and delivery reconciliation evidence-gated.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleQueueSequencePlan} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Planning sequence..." : "Queue automation plan"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
