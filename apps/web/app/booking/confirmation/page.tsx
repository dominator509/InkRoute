import type { Metadata } from "next";
import { bookingIntegrationBoundaries, demoTravelStops } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import {
  getBookingPostPersistWorkflowConsumers,
  getBookingPostPersistWorkflows,
  getBookingRequest,
  resolveTenant,
  type LocalBookingWorkflowConsumerRecord,
  type LocalBookingWorkflowRecord,
} from "../../../lib/localRuntimeState";

export const metadata: Metadata = {
  title: "Booking Confirmation Preview",
  description: "Persisted confirmation preview for an InkRoute booking request after validation and workflow planning.",
  robots: { index: false, follow: false },
};

type ConfirmationSearchParams = Record<string, string | string[] | undefined>;
type ConfirmationPersistence = "database" | "local-runtime" | "preview" | "not-found" | "database-unavailable";

interface ConfirmationWorkflowState {
  label: string;
  status: "observed" | "queued" | "blocked" | "pending" | "gated";
  detail: string;
}

interface ConfirmationState {
  persistence: ConfirmationPersistence;
  tenantSlug: string | null;
  bookingRequestId: string | null;
  status: string;
  createdAt: string | null;
  readinessScore: number | null;
  workflowState: ConfirmationWorkflowState[];
  boundary: string;
}

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

function normalizeLocalWorkflow(record: LocalBookingWorkflowRecord): ConfirmationWorkflowState {
  return {
    label: record.type,
    status: record.status === "queued" ? "queued" : record.status === "blocked" ? "blocked" : "pending",
    detail: `Local workflow ${record.id} is ${record.status}; provider execution remains evidence-gated.`,
  };
}

function normalizeLocalConsumer(record: LocalBookingWorkflowConsumerRecord): ConfirmationWorkflowState {
  return {
    label: `${record.type} consumer`,
    status: record.status === "succeeded" ? "observed" : record.status,
    detail: `Local ${record.scope} consumer ${record.id} recorded ${record.status} result metadata.`,
  };
}

function previewConfirmationState(): ConfirmationState {
  return {
    persistence: "preview",
    tenantSlug: null,
    bookingRequestId: null,
    status: "submitted preview",
    createdAt: null,
    readinessScore: null,
    workflowState: [
      {
        label: "reference upload",
        status: "gated",
        detail: "Reference upload handoff is rendered from route workflow contracts when a bookingRequestId is supplied.",
      },
      {
        label: "deposit",
        status: "gated",
        detail: "Stripe checkout stays credential-gated until sandbox evidence exists.",
      },
      {
        label: "notification",
        status: "gated",
        detail: "Notification queue state is read from persisted booking workflow data when available.",
      },
      {
        label: "calendar",
        status: "gated",
        detail: "Calendar holds stay provider-token gated until availability and token proof exists.",
      },
    ],
    boundary: "No tenantSlug and bookingRequestId were supplied, so this page shows the static provider-boundary preview only.",
  };
}

async function loadDatabaseConfirmationState(tenantSlug: string, bookingRequestId: string): Promise<ConfirmationState | null> {
  try {
    const runtime = prisma as unknown as {
      tenant?: {
        findUnique(options: { where: { slug: string }; select: { id: true } }): Promise<{ id: string } | null>;
      };
      bookingRequest?: {
        findFirst(options: unknown): Promise<{
          id: string;
          tenantId: string;
          status: string;
          readinessScore: number;
          createdAt: Date;
          stateEvents?: { type: string; note: string | null; createdAt: Date }[];
          _count?: {
            referenceImages: number;
            deposits: number;
            notifications: number;
          };
          appointment?: { id: string; status: string } | null;
        } | null>;
      };
    };

    const tenant = await runtime.tenant?.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (!tenant?.id || !runtime.bookingRequest) return null;

    const booking = await runtime.bookingRequest.findFirst({
      where: { id: bookingRequestId, tenantId: tenant.id },
      select: {
        id: true,
        tenantId: true,
        status: true,
        readinessScore: true,
        createdAt: true,
        stateEvents: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { type: true, note: true, createdAt: true },
        },
        appointment: { select: { id: true, status: true } },
        _count: {
          select: {
            referenceImages: true,
            deposits: true,
            notifications: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        persistence: "not-found",
        tenantSlug,
        bookingRequestId,
        status: "not found",
        createdAt: null,
        readinessScore: null,
        workflowState: [],
        boundary: "No tenant-scoped booking request matched this confirmation link.",
      };
    }

    return {
      persistence: "database",
      tenantSlug,
      bookingRequestId: booking.id,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      readinessScore: booking.readinessScore,
      workflowState: [
        {
          label: "reference upload",
          status: booking._count?.referenceImages ? "observed" : "pending",
          detail: `${booking._count?.referenceImages ?? 0} reference image record(s) are linked to this booking request.`,
        },
        {
          label: "deposit",
          status: booking._count?.deposits ? "observed" : "blocked",
          detail: `${booking._count?.deposits ?? 0} deposit record(s) are linked; live Stripe checkout remains sandbox-gated.`,
        },
        {
          label: "notification",
          status: booking._count?.notifications ? "observed" : "queued",
          detail: `${booking._count?.notifications ?? 0} notification record(s) are linked to this booking request.`,
        },
        {
          label: "calendar",
          status: booking.appointment ? "observed" : "blocked",
          detail: booking.appointment
            ? `Appointment ${booking.appointment.id} is ${booking.appointment.status}.`
            : "No appointment is linked yet; calendar provider execution remains gated.",
        },
        ...(booking.stateEvents ?? []).map((event): ConfirmationWorkflowState => ({
          label: `state event: ${event.type}`,
          status: "observed",
          detail: event.note ?? `Recorded at ${event.createdAt.toISOString()}.`,
        })),
      ],
      boundary: "Confirmation state was read from tenant-scoped database records without invoking provider workers.",
    };
  } catch {
    return {
      persistence: "database-unavailable",
      tenantSlug,
      bookingRequestId,
      status: "database unavailable",
      createdAt: null,
      readinessScore: null,
      workflowState: [],
      boundary: "Database confirmation lookup was unavailable; production keeps local fallback disabled and requires seeded DB/runtime proof.",
    };
  }
}

function loadLocalConfirmationState(tenantSlug: string, bookingRequestId: string): ConfirmationState | null {
  if (process.env.NODE_ENV === "production") return null;
  const tenant = resolveTenant(tenantSlug);
  if (!tenant) return null;
  const booking = getBookingRequest(tenantSlug, bookingRequestId);
  if (!booking) return null;
  const workflows = getBookingPostPersistWorkflows(tenantSlug, bookingRequestId);
  const consumers = getBookingPostPersistWorkflowConsumers(tenantSlug, bookingRequestId);

  return {
    persistence: "local-runtime",
    tenantSlug,
    bookingRequestId,
    status: booking.request.status,
    createdAt: booking.request.createdAt,
    readinessScore: booking.readinessScore,
    workflowState: [...workflows.map(normalizeLocalWorkflow), ...consumers.map(normalizeLocalConsumer)],
    boundary: "Confirmation state was read from local runtime state; production local fallback remains disabled.",
  };
}

async function loadConfirmationState(searchParams: ConfirmationSearchParams): Promise<ConfirmationState> {
  const tenantSlug = firstSearchParam(searchParams.tenantSlug) ?? firstSearchParam(searchParams.tenant);
  const bookingRequestId = firstSearchParam(searchParams.bookingRequestId) ?? firstSearchParam(searchParams.requestId);
  if (!tenantSlug || !bookingRequestId) return previewConfirmationState();

  const database = await loadDatabaseConfirmationState(tenantSlug, bookingRequestId);
  if (database && database.persistence !== "database-unavailable") return database;

  const local = loadLocalConfirmationState(tenantSlug, bookingRequestId);
  return local ?? database ?? {
    persistence: "not-found",
    tenantSlug,
    bookingRequestId,
    status: "not found",
    createdAt: null,
    readinessScore: null,
    workflowState: [],
    boundary: "No tenant-scoped confirmation state is available for this request.",
  };
}

export default async function BookingConfirmationPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<ConfirmationSearchParams> | ConfirmationSearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const confirmation = await loadConfirmationState(resolvedSearchParams);
  const nextCity = demoTravelStops.find((stop) => stop.bookingStatus === "open") ?? { city: "Seattle", region: "WA" };

  return (
    <main>
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Confirmation preview</p>
          <h1>Your request preview is ready for artist review.</h1>
          <p>This page now reads persisted workflow state when a tenant-scoped booking request identifier is supplied; provider follow-up evidence remains runtime-gated.</p>
        </div>
      </section>
      <section className="section compact">
        <div className="container confirmation-grid">
          <article className="panel-card confirmation-card">
            <p className="eyebrow">Request status</p>
            <h2>{confirmation.status}</h2>
            <p>Confirmed submissions surface a booking request identifier from the public booking API when persistence succeeds; persisted workflow reads, local fallback boundaries, and provider follow-up evidence remain runtime-gated.</p>
            <dl className="booking-summary-list">
              <div><dt>Persistence source</dt><dd>{confirmation.persistence}</dd></div>
              <div><dt>Booking request identifier</dt><dd>{confirmation.bookingRequestId ?? "Awaiting persisted request ID"}</dd></div>
              <div><dt>Submitted at</dt><dd>{confirmation.createdAt ?? "Generated after persistence"}</dd></div>
              <div><dt>Readiness score</dt><dd>{confirmation.readinessScore ?? "Calculated after persisted request lookup"}</dd></div>
              <div><dt>Example city</dt><dd>{nextCity.city}, {nextCity.region}</dd></div>
              <div><dt>Artist action</dt><dd>Review request, then accept, decline, or ask for more info</dd></div>
              <div><dt>Deposit action</dt><dd>Policy engine and deposit-session boundaries are wired; live Stripe checkout remains credential-gated. <a className="text-link" href="/booking/deposit-preview">View deposit preview</a></dd></div>
              <div><dt>Calendar action</dt><dd>Provider calendar execution remains evidence-gated after appointment creation and conflict-policy checks pass.</dd></div>
            </dl>
            <div className="stack">
              <p className="eyebrow">Persisted workflow state</p>
              {confirmation.workflowState.length > 0 ? confirmation.workflowState.map((workflow) => (
                <div className="confirmation-boundary" key={`${workflow.label}-${workflow.status}`}>
                  <strong>{workflow.label}</strong>
                  <span>{workflow.status}</span>
                  <p>{workflow.detail}</p>
                </div>
              )) : (
                <div className="confirmation-boundary">
                  <strong>workflow state</strong>
                  <span>pending</span>
                  <p>{confirmation.boundary}</p>
                </div>
              )}
            </div>
          </article>
          <aside className="panel-card confirmation-card">
            <p className="eyebrow">Not live yet</p>
            <h2>Provider boundaries</h2>
            <p>{confirmation.boundary}</p>
            <div className="stack">
              {bookingIntegrationBoundaries.map((boundary) => (
                <div className="confirmation-boundary" key={boundary.label}>
                  <strong>{boundary.label}</strong>
                  <span>{boundary.status}</span>
                  <p>{boundary.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
