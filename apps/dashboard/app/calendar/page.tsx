import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { IntegrationBoundaryCard } from "../../components/IntegrationBoundaryCard";
import { StatusPill } from "../../components/StatusPill";
import {
  dashboardAppointments,
  dashboardAvailabilitySlots,
  dashboardBufferedBlocks,
  dashboardCalendarConflictPreview,
  dashboardCalendarSyncPlans,
  dashboardGoogleEventDraft,
  dashboardGoogleFreeBusyDraft,
  dashboardSignedIcsFeedDraft,
  dashboardTravelIcsPreview,
} from "../../lib/demo";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function CalendarPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Calendar and availability"
        title="Appointment calendar"
        description="Phase 8 adds static availability slots, buffer math, conflict previews, ICS feed metadata, and Google Calendar draft payloads. OAuth sync and persistence remain externally dependent."
      />

      <section className="grid three">
        {dashboardCalendarSyncPlans.map((plan) => (
          <article className="card" key={plan.provider}>
            <div className="section-heading-row">
              <h2>{plan.provider.toUpperCase()}</h2>
              <StatusPill label={plan.status} tone={plan.status === "draft_ready" ? "success" : "warning"} />
            </div>
            <p>{plan.nextAction}</p>
            <dl className="detail-list single">
              <div><dt>Direction</dt><dd>{plan.direction}</dd></div>
              <div><dt>Sync token</dt><dd>{plan.storesSyncToken ? "Required" : "Not used"}</dd></div>
              <div><dt>Push channels</dt><dd>{plan.supportsPushChannels ? "Planned" : "Not supported"}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <section className="card table-card">
        <div className="table-header five">
          <span>Appointment</span><span>City</span><span>Time</span><span>Buffers</span><span>Status</span>
        </div>
        {dashboardAppointments.map((appointment) => (
          <div className="table-row five" key={appointment.id}>
            <span><strong>{appointment.title}</strong><small>{appointment.clientName}</small></span>
            <span>{appointment.city}<small>{appointment.timezone}</small></span>
            <span>{formatTime(appointment.startsAt)}<small>Ends {new Date(appointment.endsAt).toLocaleTimeString()}</small></span>
            <span>{appointment.bufferBeforeMinutes}m before<small>{appointment.bufferAfterMinutes}m after</small></span>
            <span><StatusPill label={appointment.status} tone={appointment.status === "confirmed" ? "success" : "warning"} /></span>
          </div>
        ))}
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>Generated availability slots</h2>
          <p>Slots are computed from demo availability windows, appointment blocks, and buffers. Production needs database writes and timezone QA.</p>
          <div className="stack compact-list">
            {dashboardAvailabilitySlots.map((slot) => (
              <div className="mini-row" key={slot.id}>
                <span><strong>{new Date(slot.startsAt).toLocaleTimeString()}</strong><small>{slot.timezone}</small></span>
                <span>{new Date(slot.endsAt).toLocaleTimeString()}</span>
                <StatusPill label={slot.status} tone={slot.status === "open" ? "success" : "warning"} />
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Conflict preview</h2>
          <p>Candidate holds are compared against buffered appointment blocks before a slot can be offered.</p>
          {dashboardCalendarConflictPreview.map((conflict) => (
            <div className="boundary-note" key={`${conflict.candidateId}-${conflict.conflictingBlockId}`}>
              <strong>{conflict.severity}: {conflict.conflictingTitle}</strong>
              <span>{conflict.reason} {new Date(conflict.overlapStartsAt).toLocaleTimeString()} → {new Date(conflict.overlapEndsAt).toLocaleTimeString()}</span>
            </div>
          ))}
          <h3>Buffered blocks</h3>
          <div className="stack compact-list">
            {dashboardBufferedBlocks.map((block) => (
              <div className="mini-row" key={block.id}>
                <span>{block.title}</span>
                <span>{new Date(block.bufferedStartsAt).toLocaleTimeString()} → {new Date(block.bufferedEndsAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two spacious">
        <article className="card">
          <h2>ICS feed preview</h2>
          <p>Public demo feed output prefix plus a signed-feed draft path. Real signed token storage is not implemented.</p>
          <pre className="code-preview">{dashboardTravelIcsPreview.join("\n")}</pre>
          <div className="boundary-note">
            <strong>Signed feed draft</strong>
            <span>{dashboardSignedIcsFeedDraft.path}</span>
          </div>
        </article>
        <article className="card">
          <h2>Google Calendar drafts</h2>
          <p>These payload shapes mirror the planned provider boundary. They are not sent to Google in this scaffold.</p>
          <pre className="code-preview">{JSON.stringify({ event: dashboardGoogleEventDraft, freeBusy: dashboardGoogleFreeBusyDraft }, null, 2)}</pre>
        </article>
      </section>

      <IntegrationBoundaryCard title="Calendar sync" status="Externally dependent" description="Google OAuth, encrypted token storage, incremental sync tokens, push channels, recurring-event reconciliation, and provider retry handling remain planned work." gapIds={["GAP-009", "GAP-055", "GAP-056", "GAP-057", "GAP-058"]} />
    </main>
  );
}
