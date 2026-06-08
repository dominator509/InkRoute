import type { BodyPlacement, BookingEventType, BookingStatus, TattooStyle, TravelBookingStatus } from "@inkroute/types";

export type BookingFlowStepId = "city" | "concept" | "client" | "policies" | "confirmation";

export interface BookingFlowStep {
  id: BookingFlowStepId;
  title: string;
  eyebrow: string;
  summary: string;
  requiredFields: readonly string[];
}

export const bookingFlowSteps: readonly BookingFlowStep[] = [
  {
    id: "city",
    eyebrow: "Step 1",
    title: "City, date, and appointment context",
    summary: "Match the request to a travel stop, guest spot, or waitlist before the artist reviews it.",
    requiredFields: ["preferredCitySlug", "preferredDateWindow"],
  },
  {
    id: "concept",
    eyebrow: "Step 2",
    title: "Tattoo concept and references",
    summary: "Capture style, body placement, size, budget, and reference direction in one structured brief.",
    requiredFields: ["style", "placement", "sizeEstimate", "budgetRange", "ideaSummary"],
  },
  {
    id: "client",
    eyebrow: "Step 3",
    title: "Client details and safety notes",
    summary: "Collect contact details and optional sensitive notes that must stay private after persistence is implemented.",
    requiredFields: ["clientName", "clientEmail"],
  },
  {
    id: "policies",
    eyebrow: "Step 4",
    title: "Policies, deposit boundary, and consent acknowledgements",
    summary: "Make cancellation, deposit, age, and consent boundaries explicit before submission.",
    requiredFields: ["policyAccepted", "ageAcknowledged", "privacyAcknowledged"],
  },
  {
    id: "confirmation",
    eyebrow: "Step 5",
    title: "Confirmation preview",
    summary: "Show the client what would be sent once API persistence, uploads, notifications, and deposits are wired.",
    requiredFields: [],
  },
] as const;

export interface BookingDraftReferenceImage {
  localId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadStatus: "local_only" | "pending_signed_upload" | "uploaded" | "failed";
}

export interface BookingDraft {
  preferredCitySlug: string;
  preferredDateWindow: string;
  locationPreference: string;
  style: TattooStyle | "";
  placement: BodyPlacement | "";
  sizeEstimate: string;
  budgetRange: string;
  ideaSummary: string;
  referenceImages: BookingDraftReferenceImage[];
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  medicalNotes: string;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  policyAccepted: boolean;
  ageAcknowledged: boolean;
  privacyAcknowledged: boolean;
  depositBoundaryAcknowledged: boolean;
  portfolioAttributionId?: string;
}

export const emptyBookingDraft: BookingDraft = {
  preferredCitySlug: "",
  preferredDateWindow: "",
  locationPreference: "",
  style: "",
  placement: "",
  sizeEstimate: "",
  budgetRange: "",
  ideaSummary: "",
  referenceImages: [],
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  medicalNotes: "",
  marketingOptIn: false,
  smsOptIn: false,
  policyAccepted: false,
  ageAcknowledged: false,
  privacyAcknowledged: false,
  depositBoundaryAcknowledged: false,
};

export interface ReadinessCheck {
  id: string;
  label: string;
  points: number;
  passed: boolean;
  message: string;
}

export interface ReadinessScoreResult {
  score: number;
  maxScore: number;
  percentage: number;
  label: "Needs essentials" | "Reviewable" | "Strong request" | "Artist-ready";
  checks: ReadinessCheck[];
}

const hasText = (value: string, minLength: number) => value.trim().length >= minLength;
const hasEmailShape = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function calculateTattooReadinessScore(draft: BookingDraft): ReadinessScoreResult {
  const checks: ReadinessCheck[] = [
    {
      id: "city",
      label: "Travel city selected",
      points: 12,
      passed: hasText(draft.preferredCitySlug, 2),
      message: "Choose a travel stop, guest spot, or waitlist city.",
    },
    {
      id: "date-window",
      label: "Preferred date window described",
      points: 8,
      passed: hasText(draft.preferredDateWindow, 4),
      message: "Add a date range or timing notes for the artist.",
    },
    {
      id: "style",
      label: "Style direction selected",
      points: 12,
      passed: draft.style !== "",
      message: "Select the closest tattoo style or service direction.",
    },
    {
      id: "placement",
      label: "Body placement selected",
      points: 10,
      passed: draft.placement !== "",
      message: "Pick the body placement so sizing and composition can be reviewed.",
    },
    {
      id: "size",
      label: "Approximate size added",
      points: 8,
      passed: hasText(draft.sizeEstimate, 3),
      message: "Estimate palm-sized, half sleeve, 4 inches, full back, or similar.",
    },
    {
      id: "budget",
      label: "Budget range selected",
      points: 8,
      passed: hasText(draft.budgetRange, 3),
      message: "Add a budget range so deposit/session expectations can be matched.",
    },
    {
      id: "idea",
      label: "Concept summary is reviewable",
      points: 18,
      passed: hasText(draft.ideaSummary, 40),
      message: "Describe concept, mood, constraints, references, and what should be avoided.",
    },
    {
      id: "references",
      label: "Reference direction included",
      points: 6,
      passed: draft.referenceImages.length > 0 || draft.ideaSummary.toLowerCase().includes("reference"),
      message: "Attach reference metadata or describe reference direction. Upload is not live yet.",
    },
    {
      id: "client",
      label: "Client contact is reachable",
      points: 10,
      passed: hasText(draft.clientName, 2) && hasEmailShape(draft.clientEmail),
      message: "Add a name and valid email for follow-up.",
    },
    {
      id: "policy",
      label: "Required acknowledgements accepted",
      points: 8,
      passed: draft.policyAccepted && draft.ageAcknowledged && draft.privacyAcknowledged && draft.depositBoundaryAcknowledged,
      message: "Accept policy, age, privacy, and deposit boundary acknowledgements.",
    },
  ];

  const maxScore = checks.reduce((sum, check) => sum + check.points, 0);
  const score = checks.filter((check) => check.passed).reduce((sum, check) => sum + check.points, 0);
  const percentage = Math.round((score / maxScore) * 100);
  const label = percentage >= 90 ? "Artist-ready" : percentage >= 72 ? "Strong request" : percentage >= 48 ? "Reviewable" : "Needs essentials";

  return { score, maxScore, percentage, label, checks };
}

export type BookingLifecycleAction =
  | "submit"
  | "request_more_info"
  | "accept"
  | "decline"
  | "request_deposit"
  | "record_deposit_paid"
  | "schedule"
  | "request_reschedule"
  | "cancel"
  | "complete"
  | "mark_no_show"
  | "archive";

export interface BookingLifecycleTransition {
  from: BookingStatus;
  action: BookingLifecycleAction;
  to: BookingStatus;
  eventType: BookingEventType;
  actor: "client" | "artist" | "system" | "admin";
  requiresAudit: boolean;
}

export const bookingLifecycleTransitions: readonly BookingLifecycleTransition[] = [
  { from: "draft", action: "submit", to: "submitted", eventType: "submitted", actor: "client", requiresAudit: true },
  { from: "submitted", action: "request_more_info", to: "needs_info", eventType: "needs_info", actor: "artist", requiresAudit: true },
  { from: "needs_info", action: "submit", to: "submitted", eventType: "submitted", actor: "client", requiresAudit: true },
  { from: "submitted", action: "accept", to: "accepted", eventType: "accepted", actor: "artist", requiresAudit: true },
  { from: "submitted", action: "decline", to: "declined", eventType: "declined", actor: "artist", requiresAudit: true },
  { from: "accepted", action: "request_deposit", to: "deposit_pending", eventType: "deposit_requested", actor: "artist", requiresAudit: true },
  { from: "deposit_pending", action: "record_deposit_paid", to: "deposit_paid", eventType: "deposit_paid", actor: "system", requiresAudit: true },
  { from: "deposit_paid", action: "schedule", to: "scheduled", eventType: "scheduled", actor: "artist", requiresAudit: true },
  { from: "scheduled", action: "request_reschedule", to: "reschedule_requested", eventType: "reschedule_requested", actor: "client", requiresAudit: true },
  { from: "reschedule_requested", action: "schedule", to: "scheduled", eventType: "rescheduled", actor: "artist", requiresAudit: true },
  { from: "scheduled", action: "cancel", to: "cancelled", eventType: "cancelled", actor: "client", requiresAudit: true },
  { from: "scheduled", action: "complete", to: "completed", eventType: "completed", actor: "artist", requiresAudit: true },
  { from: "scheduled", action: "mark_no_show", to: "no_show", eventType: "no_show", actor: "artist", requiresAudit: true },
  { from: "completed", action: "archive", to: "archived", eventType: "note_added", actor: "admin", requiresAudit: true },
  { from: "declined", action: "archive", to: "archived", eventType: "note_added", actor: "admin", requiresAudit: true },
  { from: "cancelled", action: "archive", to: "archived", eventType: "note_added", actor: "admin", requiresAudit: true },
  { from: "no_show", action: "archive", to: "archived", eventType: "note_added", actor: "admin", requiresAudit: true },
] as const;

export function getAvailableBookingActions(status: BookingStatus): BookingLifecycleTransition[] {
  return bookingLifecycleTransitions.filter((transition) => transition.from === status);
}

export function transitionBookingStatus(status: BookingStatus, action: BookingLifecycleAction): BookingStatus {
  const transition = bookingLifecycleTransitions.find((item) => item.from === status && item.action === action);
  if (!transition) {
    return status;
  }
  return transition.to;
}

export type BookingTransitionPlanStatus = "ready" | "invalid_transition" | "missing_actor" | "missing_tenant";

export interface BookingTransitionPlanInput {
  tenantId: string;
  bookingRequestId: string;
  from: BookingStatus;
  action: BookingLifecycleAction;
  actorId?: string;
  actorType?: "client" | "artist" | "system" | "admin";
  occurredAt: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface BookingTransitionWritePlan {
  operation: "updateBookingRequest" | "insertBookingStateEvent" | "insertAuditLog";
  model: "BookingRequest" | "BookingStateEvent" | "AuditLog";
  tenantId: string;
  bookingRequestId: string;
  payload: Record<string, string | boolean | null>;
}

export interface BookingTransitionPlan {
  status: BookingTransitionPlanStatus;
  canCommit: boolean;
  reason: string;
  transition?: BookingLifecycleTransition;
  writes: BookingTransitionWritePlan[];
  requiresAtomicTransaction: boolean;
}

export function createBookingTransitionPlan(input: BookingTransitionPlanInput): BookingTransitionPlan {
  if (!input.tenantId.trim()) {
    return {
      status: "missing_tenant",
      canCommit: false,
      reason: "Tenant scope is required before a booking transition can be persisted.",
      writes: [],
      requiresAtomicTransaction: true,
    };
  }

  if (!input.actorId?.trim()) {
    return {
      status: "missing_actor",
      canCommit: false,
      reason: "Actor identity is required for BookingStateEvent and AuditLog writes.",
      writes: [],
      requiresAtomicTransaction: true,
    };
  }

  const transition = bookingLifecycleTransitions.find((item) => item.from === input.from && item.action === input.action);
  if (!transition) {
    return {
      status: "invalid_transition",
      canCommit: false,
      reason: `Cannot apply booking action ${input.action} from status ${input.from}.`,
      writes: [],
      requiresAtomicTransaction: true,
    };
  }

  const actorType = input.actorType ?? transition.actor;
  const sharedPayload = {
    tenantId: input.tenantId,
    bookingRequestId: input.bookingRequestId,
    actorId: input.actorId,
    actorType,
    occurredAt: input.occurredAt,
    idempotencyKey: input.idempotencyKey ?? null,
  };

  return {
    status: "ready",
    canCommit: true,
    reason: "Booking transition is valid and requires booking, state-event, and audit-log writes in one transaction.",
    transition,
    requiresAtomicTransaction: true,
    writes: [
      {
        operation: "updateBookingRequest",
        model: "BookingRequest",
        tenantId: input.tenantId,
        bookingRequestId: input.bookingRequestId,
        payload: {
          status: transition.to,
          updatedAt: input.occurredAt,
        },
      },
      {
        operation: "insertBookingStateEvent",
        model: "BookingStateEvent",
        tenantId: input.tenantId,
        bookingRequestId: input.bookingRequestId,
        payload: {
          ...sharedPayload,
          eventType: transition.eventType,
          fromStatus: input.from,
          toStatus: transition.to,
          reason: input.reason ?? null,
        },
      },
      {
        operation: "insertAuditLog",
        model: "AuditLog",
        tenantId: input.tenantId,
        bookingRequestId: input.bookingRequestId,
        payload: {
          ...sharedPayload,
          action: `booking.${input.action}`,
          entityType: "BookingRequest",
          entityId: input.bookingRequestId,
          requiresAudit: transition.requiresAudit,
        },
      },
    ],
  };
}

export function getTravelBookingCta(status: TravelBookingStatus): string {
  if (status === "open") return "Request this city";
  if (status === "waitlist") return "Join the waitlist";
  return "View travel notes";
}
