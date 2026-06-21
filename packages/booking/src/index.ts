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

export type BookingPostSubmitWorkflowType = "reference-upload" | "deposit-handoff" | "notification-bootstrap" | "calendar-hold";
export type BookingPostSubmitWorkflowStatus = "ready" | "blocked_missing_data" | "provider_gated";

export interface BookingPostSubmitWorkflow {
  type: BookingPostSubmitWorkflowType;
  status: BookingPostSubmitWorkflowStatus;
  required: boolean;
  tenantId: string;
  bookingRequestId: string;
  reason: string;
  providerBoundary?: "storage" | "stripe" | "notification" | "calendar";
  payload: Record<string, string | number | boolean | null>;
}

export interface BookingPostSubmitPlanInput {
  tenantId: string;
  bookingRequestId: string;
  draft: BookingDraft;
  submittedAt: string;
}

export interface BookingPostSubmitPlan {
  status: "ready" | "blocked";
  canPersistWorkflowRecords: boolean;
  workflows: BookingPostSubmitWorkflow[];
  blockers: string[];
}

function hasReferenceImages(draft: BookingDraft): boolean {
  return draft.referenceImages.length > 0;
}

function hasSchedulingContext(draft: BookingDraft): boolean {
  return hasText(draft.preferredCitySlug, 2) && hasText(draft.preferredDateWindow, 4);
}

export function buildBookingPostSubmitPlan(input: BookingPostSubmitPlanInput): BookingPostSubmitPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before post-submit workflows can be recorded.");
  if (!input.bookingRequestId.trim()) blockers.push("Booking request id is required before post-submit workflows can be recorded.");
  if (!hasEmailShape(input.draft.clientEmail)) blockers.push("A valid client email is required for notification bootstrap.");

  const basePayload = {
    tenantId: input.tenantId,
    bookingRequestId: input.bookingRequestId,
    submittedAt: input.submittedAt,
  };

  const workflows: BookingPostSubmitWorkflow[] = [
    {
      type: "reference-upload",
      status: hasReferenceImages(input.draft) ? "provider_gated" : "blocked_missing_data",
      required: hasReferenceImages(input.draft),
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
      providerBoundary: "storage",
      reason: hasReferenceImages(input.draft)
        ? "Reference metadata exists and needs signed private upload intents after booking persistence."
        : "No reference image metadata was included in the booking draft.",
      payload: {
        ...basePayload,
        referenceCount: input.draft.referenceImages.length,
        signedUploadRequired: hasReferenceImages(input.draft),
      },
    },
    {
      type: "deposit-handoff",
      status: input.draft.depositBoundaryAcknowledged ? "provider_gated" : "blocked_missing_data",
      required: input.draft.depositBoundaryAcknowledged,
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
      providerBoundary: "stripe",
      reason: input.draft.depositBoundaryAcknowledged
        ? "Client acknowledged the deposit boundary; accepted bookings can create a Stripe handoff later."
        : "Deposit boundary was not acknowledged.",
      payload: {
        ...basePayload,
        policyAcknowledged: input.draft.policyAccepted,
        depositBoundaryAcknowledged: input.draft.depositBoundaryAcknowledged,
      },
    },
    {
      type: "notification-bootstrap",
      status: hasEmailShape(input.draft.clientEmail) ? "provider_gated" : "blocked_missing_data",
      required: true,
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
      providerBoundary: "notification",
      reason: hasEmailShape(input.draft.clientEmail)
        ? "Client contact is valid and a message thread plus confirmation notification should be queued."
        : "Client email is invalid, so notification bootstrap cannot run safely.",
      payload: {
        ...basePayload,
        clientEmailPresent: hasEmailShape(input.draft.clientEmail),
        smsOptIn: input.draft.smsOptIn,
        marketingOptIn: input.draft.marketingOptIn,
      },
    },
    {
      type: "calendar-hold",
      status: hasSchedulingContext(input.draft) ? "provider_gated" : "blocked_missing_data",
      required: hasSchedulingContext(input.draft),
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
      providerBoundary: "calendar",
      reason: hasSchedulingContext(input.draft)
        ? "City and date context exist for a tentative calendar hold after artist acceptance."
        : "Preferred city/date context is incomplete.",
      payload: {
        ...basePayload,
        preferredCitySlug: input.draft.preferredCitySlug || null,
        preferredDateWindow: input.draft.preferredDateWindow || null,
      },
    },
  ];

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    canPersistWorkflowRecords: blockers.length === 0,
    workflows,
    blockers,
  };
}

export type BookingProviderFailureAction =
  | "mark_workflow_failed"
  | "write_audit_log"
  | "revoke_signed_upload_intent"
  | "void_deposit_session"
  | "retry_notification"
  | "cancel_calendar_hold"
  | "queue_operator_review";

export interface BookingProviderFailurePlanInput {
  tenantId: string;
  bookingRequestId: string;
  failedWorkflow: BookingPostSubmitWorkflowType;
  failedAt: string;
  provider: "storage" | "stripe" | "notification" | "calendar";
  providerErrorCode?: string;
  retryable: boolean;
}

export interface BookingProviderFailurePlan {
  status: "ready" | "blocked";
  failedWorkflow: BookingPostSubmitWorkflowType;
  canRetry: boolean;
  requiresAudit: boolean;
  rollbackRequired: boolean;
  actions: BookingProviderFailureAction[];
  auditPayload: Record<string, string | boolean | null>;
  operatorMessage: string;
  blockers: string[];
}

export function buildBookingProviderFailurePlan(input: BookingProviderFailurePlanInput): BookingProviderFailurePlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before provider failure handling.");
  if (!input.bookingRequestId.trim()) blockers.push("Booking request id is required before provider failure handling.");

  const rollbackActions: Record<BookingPostSubmitWorkflowType, BookingProviderFailureAction[]> = {
    "reference-upload": ["mark_workflow_failed", "write_audit_log", "revoke_signed_upload_intent", "queue_operator_review"],
    "deposit-handoff": ["mark_workflow_failed", "write_audit_log", "void_deposit_session", "queue_operator_review"],
    "notification-bootstrap": input.retryable
      ? ["mark_workflow_failed", "write_audit_log", "retry_notification"]
      : ["mark_workflow_failed", "write_audit_log", "queue_operator_review"],
    "calendar-hold": ["mark_workflow_failed", "write_audit_log", "cancel_calendar_hold", "queue_operator_review"],
  };

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    failedWorkflow: input.failedWorkflow,
    canRetry: input.retryable && input.failedWorkflow === "notification-bootstrap",
    requiresAudit: true,
    rollbackRequired: input.failedWorkflow !== "notification-bootstrap" || !input.retryable,
    actions: rollbackActions[input.failedWorkflow],
    auditPayload: {
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
      failedWorkflow: input.failedWorkflow,
      provider: input.provider,
      providerErrorCode: input.providerErrorCode ?? null,
      failedAt: input.failedAt,
      retryable: input.retryable,
    },
    operatorMessage:
      blockers.length > 0
        ? "Provider failure handling is blocked until tenant and booking scope are available."
        : `Handle ${input.failedWorkflow} failure through audit-first rollback before exposing a client-facing status change.`,
    blockers,
  };
}

export type DashboardMutationAction =
  | BookingLifecycleAction
  | "create_reference_upload_intent"
  | "create_deposit_session"
  | "send_client_notification"
  | "create_calendar_hold"
  | "publish_travel_stop"
  | "publish_portfolio_item"
  | "toggle_feature_flag"
  | "rollback_release"
  | "update_settings";

export type DashboardMutationProviderBoundary =
  | "database"
  | "storage"
  | "stripe"
  | "notification"
  | "calendar"
  | "release"
  | "settings";

export type DashboardMutationWriteModel =
  | "BookingRequest"
  | "BookingStateEvent"
  | "AuditLog"
  | "FileAsset"
  | "Payment"
  | "NotificationDelivery"
  | "CalendarEvent"
  | "TravelStop"
  | "PortfolioItem"
  | "FeatureFlag"
  | "ReleaseRecord"
  | "TenantSettings";

export interface DashboardMutationPlanInput {
  tenantId: string;
  actorId?: string;
  actorType?: "owner" | "artist" | "assistant" | "studio_manager" | "system";
  bookingRequestId?: string;
  currentStatus?: BookingStatus;
  action: DashboardMutationAction;
  occurredAt: string;
  idempotencyKey?: string;
}

export interface DashboardMutationPlan {
  status: "ready" | "blocked" | "invalid_transition";
  action: DashboardMutationAction;
  tenantId: string;
  providerBoundary: DashboardMutationProviderBoundary;
  requiresAudit: boolean;
  requiresIdempotency: boolean;
  canCommit: boolean;
  writes: DashboardMutationWriteModel[];
  auditAction: string;
  idempotencyKey: string | null;
  blockers: string[];
}

export interface DashboardMutationRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingTestsPassed: boolean;
  bookingTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  actionsWithServerRoutes: readonly DashboardMutationAction[];
  actionsWithRouteTests: readonly DashboardMutationAction[];
  prismaTransactionsConfigured: boolean;
  tenantIsolationTestsPassed: boolean;
  rbacDenialTestsPassed: boolean;
  idempotencyStoreConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  providerRollbackTestsPassed: boolean;
  disabledPlaceholdersRemoved: boolean;
  userFeedbackStatesCovered: boolean;
}

export const dashboardMutationRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test -- dashboard-mutations",
] as const;

export interface DashboardMutationRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingServerRoutes: readonly DashboardMutationAction[];
  missingRouteTests: readonly DashboardMutationAction[];
  requiredCommands: typeof dashboardMutationRuntimeRequiredCommands;
  requiredEvidence: readonly DashboardMutationRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const dashboardMutationRuntimeRequiredEvidence = [
      "server route/action and route-test matrix for every dashboard mutation action",
      "transaction, idempotency, and AuditLog persistence evidence for dashboard writes",
      "tenant isolation and RBAC denial test output for dashboard mutations",
      "provider rollback/retry test output for Stripe, storage, notifications, calendar, and release actions",
] as const;

export type DashboardMutationRuntimeRequiredEvidence = (typeof dashboardMutationRuntimeRequiredEvidence)[number];

export interface DomainEventAuditReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingPackageTestsPassed: boolean;
  bookingPackageTypecheckPassed: boolean;
  paymentPackageTestsPassed: boolean;
  bookingTransitionPlansCovered: boolean;
  paymentLifecyclePlansCovered: boolean;
  prismaTransactionServicesConfigured: boolean;
  tenantScopedRepositoriesConfigured: boolean;
  idempotencyStoreConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  bookingStateEventPersistenceConfigured: boolean;
  paymentAuditLogPersistenceConfigured: boolean;
  rollbackFailurePlansConfigured: boolean;
  databaseIntegrationTestsPassed: boolean;
}

export const domainEventAuditReadinessRequiredControls = [
      "Execute BookingRequest, BookingStateEvent, AuditLog, Payment, Deposit, Refund, PaymentAuditLog, and IdempotencyKey writes inside tenant-scoped transactions.",
      "Reject lifecycle mutations before persistence when tenant scope, actor, idempotency key, current status, provider id, or amount is invalid.",
      "Persist audit/event rows for both success and failure paths before returning a client-visible state change.",
      "Use idempotency keys for dashboard actions, provider webhooks, payment lifecycle updates, and rollback attempts.",
      "Make invalid state transitions impossible through the service layer, not just through UI disabled states.",
      "Attach provider failure rollback records before retrying or surfacing deposit/calendar/upload/notification failures.",
] as const;

export const domainEventAuditReadinessRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments test",
      "booking/payment lifecycle Prisma transaction integration tests",
      "idempotency replay integration tests",
      "provider failure rollback integration tests",
] as const;

export interface DomainEventAuditReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof domainEventAuditReadinessRequiredCommands;
  requiredControls: typeof domainEventAuditReadinessRequiredControls;
  blockers: readonly string[];
}

export interface DomainEventAuditTransactionEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingTestsPassed: boolean;
  bookingTypecheckPassed: boolean;
  paymentTestsPassed: boolean;
  paymentTypecheckPassed: boolean;
  prismaTransactionServicesImplemented: boolean;
  tenantScopedRepositoriesImplemented: boolean;
  bookingStateMutationAtomicityPassed: boolean;
  paymentStateMutationAtomicityPassed: boolean;
  bookingStateEventRowsPersisted: boolean;
  auditLogRowsPersisted: boolean;
  paymentAuditLogRowsPersisted: boolean;
  idempotencyPersistenceEnforced: boolean;
  replayedMutationReturnsOriginalResult: boolean;
  providerRollbackIntegrationPassed: boolean;
  invalidTransitionDenialPassed: boolean;
  crossTenantMutationDenialPassed: boolean;
  databaseIntegrationEvidenceCaptured: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export const domainEventAuditTransactionRequiredControls = [
      "Commit state mutation, domain event, audit row, payment audit row, and idempotency key in the same tenant-scoped transaction.",
      "Reject invalid lifecycle transitions, missing tenant scope, missing actor, and duplicate idempotency keys before side effects.",
      "Return original mutation results for idempotency replays without duplicate BookingStateEvent, AuditLog, PaymentAuditLog, or provider rollback writes.",
      "Record provider rollback/failure audit rows before retrying or exposing provider failure states.",
      "Redact client, medical, payment, provider, and private URL data from transaction evidence artifacts.",
] as const;

export const domainEventAuditTransactionRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "booking/payment lifecycle Prisma transaction integration tests",
      "booking/payment idempotency replay integration tests",
      "provider failure rollback integration tests",
      "cross-tenant lifecycle mutation denial tests",
      "GitHub Actions domain event/audit transaction evidence job",
] as const;

export const domainEventAuditTransactionRequiredEvidence = [
      "booking/payment package test and typecheck evidence",
      "Prisma transaction service and tenant-scoped repository evidence",
      "atomic booking/payment state, event, audit, and payment-audit persistence evidence",
      "idempotency persistence and replay original-result evidence",
      "provider rollback, invalid-transition denial, and cross-tenant denial evidence",
      "database integration, CI, and secret-safe artifact evidence",
] as const;

export type DomainEventAuditTransactionRequiredEvidence = (typeof domainEventAuditTransactionRequiredEvidence)[number];

export interface DomainEventAuditTransactionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof domainEventAuditTransactionRequiredCommands;
  requiredEvidence: readonly DomainEventAuditTransactionRequiredEvidence[];
  requiredControls: typeof domainEventAuditTransactionRequiredControls;
  blockers: readonly string[];
}

const dashboardProviderActions: Record<
  Exclude<DashboardMutationAction, BookingLifecycleAction>,
  {
    providerBoundary: DashboardMutationProviderBoundary;
    writes: DashboardMutationWriteModel[];
    auditAction: string;
  }
> = {
  create_reference_upload_intent: {
    providerBoundary: "storage",
    writes: ["FileAsset", "AuditLog"],
    auditAction: "dashboard.reference_upload_intent.create",
  },
  create_deposit_session: {
    providerBoundary: "stripe",
    writes: ["Payment", "AuditLog"],
    auditAction: "dashboard.deposit_session.create",
  },
  send_client_notification: {
    providerBoundary: "notification",
    writes: ["NotificationDelivery", "AuditLog"],
    auditAction: "dashboard.notification.send",
  },
  create_calendar_hold: {
    providerBoundary: "calendar",
    writes: ["CalendarEvent", "AuditLog"],
    auditAction: "dashboard.calendar_hold.create",
  },
  publish_travel_stop: {
    providerBoundary: "database",
    writes: ["TravelStop", "AuditLog"],
    auditAction: "dashboard.travel_stop.publish",
  },
  publish_portfolio_item: {
    providerBoundary: "database",
    writes: ["PortfolioItem", "AuditLog"],
    auditAction: "dashboard.portfolio_item.publish",
  },
  toggle_feature_flag: {
    providerBoundary: "release",
    writes: ["FeatureFlag", "AuditLog"],
    auditAction: "dashboard.feature_flag.toggle",
  },
  rollback_release: {
    providerBoundary: "release",
    writes: ["ReleaseRecord", "AuditLog"],
    auditAction: "dashboard.release.rollback",
  },
  update_settings: {
    providerBoundary: "settings",
    writes: ["TenantSettings", "AuditLog"],
    auditAction: "dashboard.settings.update",
  },
};

function getDashboardMutationProviderAction(
  action: DashboardMutationAction,
): (typeof dashboardProviderActions)[keyof typeof dashboardProviderActions] | null {
  return action in dashboardProviderActions
    ? dashboardProviderActions[action as keyof typeof dashboardProviderActions]
    : null;
}

export function buildDashboardMutationPlan(input: DashboardMutationPlanInput): DashboardMutationPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before dashboard mutations can run.");
  if (!input.actorId?.trim()) blockers.push("Actor identity is required before dashboard mutations can run.");
  if (!input.idempotencyKey?.trim()) blockers.push("Idempotency key is required before dashboard mutations can run.");

  const providerAction = getDashboardMutationProviderAction(input.action);
  if (providerAction) {
    const bookingScopedActions: DashboardMutationAction[] = [
      "create_reference_upload_intent",
      "create_deposit_session",
      "send_client_notification",
      "create_calendar_hold",
    ];
    if (bookingScopedActions.includes(input.action) && !input.bookingRequestId?.trim()) {
      blockers.push("Booking request id is required for booking-scoped dashboard provider actions.");
    }

    return {
      status: blockers.length === 0 ? "ready" : "blocked",
      action: input.action,
      tenantId: input.tenantId,
      providerBoundary: providerAction.providerBoundary,
      requiresAudit: true,
      requiresIdempotency: true,
      canCommit: blockers.length === 0,
      writes: providerAction.writes,
      auditAction: providerAction.auditAction,
      idempotencyKey: input.idempotencyKey ?? null,
      blockers,
    };
  }

  if (!input.bookingRequestId?.trim()) blockers.push("Booking request id is required for booking lifecycle dashboard mutations.");
  if (!input.currentStatus) blockers.push("Current booking status is required for booking lifecycle dashboard mutations.");

  if (blockers.length > 0 || !input.bookingRequestId || !input.currentStatus) {
    return {
      status: "blocked",
      action: input.action,
      tenantId: input.tenantId,
      providerBoundary: "database",
      requiresAudit: true,
      requiresIdempotency: true,
      canCommit: false,
      writes: [],
      auditAction: `dashboard.booking.${input.action}`,
      idempotencyKey: input.idempotencyKey ?? null,
      blockers,
    };
  }

  const transitionActorType =
    input.actorType === "artist" || input.actorType === "system"
      ? input.actorType
      : input.actorType
        ? "admin"
        : undefined;
  const transitionPlan = createBookingTransitionPlan({
    tenantId: input.tenantId,
    bookingRequestId: input.bookingRequestId,
    from: input.currentStatus,
    action: input.action as BookingLifecycleAction,
    ...(transitionActorType ? { actorType: transitionActorType } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    occurredAt: input.occurredAt,
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  if (!transitionPlan.canCommit) {
    return {
      status: "invalid_transition",
      action: input.action,
      tenantId: input.tenantId,
      providerBoundary: "database",
      requiresAudit: true,
      requiresIdempotency: true,
      canCommit: false,
      writes: [],
      auditAction: `dashboard.booking.${input.action}`,
      idempotencyKey: input.idempotencyKey ?? null,
      blockers: ["Booking lifecycle transition is not valid from the current status."],
    };
  }

  return {
    status: "ready",
    action: input.action,
    tenantId: input.tenantId,
    providerBoundary: "database",
    requiresAudit: true,
    requiresIdempotency: true,
    canCommit: true,
    writes: transitionPlan.writes.map((write) => write.model),
    auditAction: `dashboard.booking.${input.action}`,
    idempotencyKey: input.idempotencyKey ?? null,
    blockers,
  };
}

export function buildDashboardMutationRuntimeReadinessPlan(
  input: DashboardMutationRuntimeReadinessInput,
): DashboardMutationRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const requiredActions: DashboardMutationAction[] = [
    "accept",
    "decline",
    "request_changes",
    "mark_deposit_paid",
    "confirm_appointment",
    "complete",
    "create_reference_upload_intent",
    "create_deposit_session",
    "send_client_notification",
    "create_calendar_hold",
    "publish_travel_stop",
    "publish_portfolio_item",
    "toggle_feature_flag",
    "rollback_release",
    "update_settings",
  ];
  const missingServerRoutes = requiredActions.filter((action) => !input.actionsWithServerRoutes.includes(action));
  const missingRouteTests = requiredActions.filter((action) => !input.actionsWithRouteTests.includes(action));
  const blockers: string[] = [];
  const requiredEvidence: DashboardMutationRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking tests must pass before dashboard mutation runtime readiness can close.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass before dashboard mutation runtime readiness can close.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with mutation routes/actions wired.");
  if (missingServerRoutes.length > 0) blockers.push(`Dashboard mutation server routes/actions are missing for: ${missingServerRoutes.join(", ")}.`);
  if (missingRouteTests.length > 0) blockers.push(`Dashboard mutation route/API tests are missing for: ${missingRouteTests.join(", ")}.`);
  if (!input.prismaTransactionsConfigured) blockers.push("Dashboard mutations must execute write models in Prisma transactions.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Dashboard mutation tests must reject cross-tenant writes.");
  if (!input.rbacDenialTestsPassed) blockers.push("Dashboard mutation tests must reject actors lacking required permissions.");
  if (!input.idempotencyStoreConfigured) blockers.push("Dashboard mutations must persist and enforce idempotency keys.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Dashboard mutations must persist AuditLog records for sensitive changes.");
  if (!input.providerRollbackTestsPassed) blockers.push("Provider-backed dashboard actions must prove rollback/retry behavior.");
  if (!input.disabledPlaceholdersRemoved) blockers.push("Dashboard mutation surfaces must expose gated action UI and explicit feedback states before runtime readiness.");
  if (!input.userFeedbackStatesCovered) blockers.push("Dashboard mutation UI must cover loading, success, denial, provider-failure, and retry states.");

  if (missingServerRoutes.length > 0 || missingRouteTests.length > 0) {
    requiredEvidence.push(dashboardMutationRuntimeRequiredEvidence[0]);
  }
  if (!input.prismaTransactionsConfigured || !input.auditLogPersistenceConfigured || !input.idempotencyStoreConfigured) {
    requiredEvidence.push(dashboardMutationRuntimeRequiredEvidence[1]);
  }
  if (!input.tenantIsolationTestsPassed || !input.rbacDenialTestsPassed) {
    requiredEvidence.push(dashboardMutationRuntimeRequiredEvidence[2]);
  }
  if (!input.providerRollbackTestsPassed) requiredEvidence.push(dashboardMutationRuntimeRequiredEvidence[3]);

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingServerRoutes,
    missingRouteTests,
    requiredCommands: dashboardMutationRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === dashboardMutationRuntimeRequiredEvidence.length
        ? dashboardMutationRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface BookingContactRuntimeEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingTestsPassed: boolean;
  bookingTypecheckPassed: boolean;
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  bookingRouteUsesPostSubmitPlan: boolean;
  confirmationUiUsesWorkflowState: boolean;
  contactFormPersistenceConfigured: boolean;
  databasePersistenceIntegrationPassed: boolean;
  tenantIsolationIntegrationPassed: boolean;
  referenceUploadHandoffGated: boolean;
  depositHandoffGated: boolean;
  notificationHandoffGated: boolean;
  calendarHandoffGated: boolean;
  noLivePaymentBoundaryPreserved: boolean;
  browserE2ePassed: boolean;
  apiE2ePassed: boolean;
  providerSandboxEvidenceCaptured: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export const bookingContactRuntimeRequiredControls = [
      "Persist booking/contact submissions before creating upload, deposit, notification, or calendar handoff work.",
      "Keep provider work idempotent, audit logged, tenant scoped, and retryable.",
      "Preserve no-live-payment behavior until Stripe sandbox credentials and reviewed deposit copy are configured.",
      "Render confirmation states from persisted workflow data instead of optimistic client-only state.",
      "Redact medical notes, payment data, provider tokens, private file URLs, and raw client PII from evidence artifacts.",
] as const;

export const bookingContactRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "booking/contact API E2E tests",
      "booking/contact browser E2E tests",
      "provider sandbox handoff boundary tests",
      "GitHub Actions booking/contact runtime evidence job",
] as const;

export interface BookingContactRuntimeEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof bookingContactRuntimeRequiredCommands;
  requiredControls: typeof bookingContactRuntimeRequiredControls;
  requiredEvidence: readonly BookingContactRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const bookingContactRuntimeRequiredEvidence = [
      "public route, confirmation UI, and contact persistence wiring evidence",
      "tenant-scoped booking/contact database integration evidence",
      "provider-gated upload, deposit, notification, calendar, and no-live-payment boundary evidence",
      "browser E2E, API E2E, and provider sandbox transcript evidence",
      "web typecheck/build, CI, and secret-safe artifact evidence",
] as const;

export type BookingContactRuntimeRequiredEvidence = (typeof bookingContactRuntimeRequiredEvidence)[number];

export function buildBookingContactRuntimeEvidencePlan(
  input: BookingContactRuntimeEvidenceInput,
): BookingContactRuntimeEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: BookingContactRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking tests must pass before booking/contact runtime evidence can close.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass before booking/contact runtime evidence can close.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with booking route, booking UI, confirmation UI, and contact form wiring.");
  if (!input.webBuildPassed) blockers.push("@inkroute/web build must pass with booking and contact flows.");
  if (!input.bookingRouteUsesPostSubmitPlan) blockers.push("Public booking route must use the package post-submit handoff plan after persistence.");
  if (!input.confirmationUiUsesWorkflowState) blockers.push("Booking confirmation UI must render persisted workflow state for upload, deposit, notification, and calendar handoffs.");
  if (!input.contactFormPersistenceConfigured) blockers.push("Contact form persistence must be configured for submissions and workflow reads.");
  if (!input.databasePersistenceIntegrationPassed) blockers.push("Booking/contact database persistence integration tests must pass.");
  if (!input.tenantIsolationIntegrationPassed) blockers.push("Booking/contact tenant-isolation integration tests must pass.");
  if (!input.referenceUploadHandoffGated) blockers.push("Reference upload handoff must remain provider-gated until signed URL/storage execution is configured.");
  if (!input.depositHandoffGated) blockers.push("Deposit handoff must preserve the no-live-payment boundary until Stripe test credentials and sandbox evidence exist.");
  if (!input.notificationHandoffGated) blockers.push("Notification handoff must stay queued/provider-gated until sandbox delivery evidence exists.");
  if (!input.calendarHandoffGated) blockers.push("Calendar handoff must stay tentative/provider-gated until calendar sandbox evidence exists.");
  if (!input.noLivePaymentBoundaryPreserved) blockers.push("Booking/contact runtime must preserve the no-live-payment boundary until Stripe evidence exists.");
  if (!input.browserE2ePassed) blockers.push("Booking/contact browser E2E evidence must pass.");
  if (!input.apiE2ePassed) blockers.push("Booking/contact API E2E evidence must pass.");
  if (!input.providerSandboxEvidenceCaptured) blockers.push("Provider sandbox evidence must cover storage upload, Stripe deposit, notification, and calendar handoff boundaries or execution.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for booking/contact runtime flows must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Booking/contact artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");

  if (!input.bookingRouteUsesPostSubmitPlan || !input.confirmationUiUsesWorkflowState || !input.contactFormPersistenceConfigured) {
    requiredEvidence.push(bookingContactRuntimeRequiredEvidence[0]);
  }
  if (!input.databasePersistenceIntegrationPassed || !input.tenantIsolationIntegrationPassed) {
    requiredEvidence.push(bookingContactRuntimeRequiredEvidence[1]);
  }
  if (!input.referenceUploadHandoffGated || !input.depositHandoffGated || !input.notificationHandoffGated || !input.calendarHandoffGated || !input.noLivePaymentBoundaryPreserved) {
    requiredEvidence.push(bookingContactRuntimeRequiredEvidence[2]);
  }
  if (!input.browserE2ePassed || !input.apiE2ePassed || !input.providerSandboxEvidenceCaptured) {
    requiredEvidence.push(bookingContactRuntimeRequiredEvidence[3]);
  }
  if (!input.webTypecheckPassed || !input.webBuildPassed || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(bookingContactRuntimeRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: bookingContactRuntimeRequiredCommands,
    requiredControls: bookingContactRuntimeRequiredControls,
    requiredEvidence:
      requiredEvidence.length === bookingContactRuntimeRequiredEvidence.length
        ? bookingContactRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface BookingProviderHandoffRuntimeEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingTestsPassed: boolean;
  bookingTypecheckPassed: boolean;
  paymentsTestsPassed: boolean;
  notificationsTestsPassed: boolean;
  calendarTestsPassed: boolean;
  acceptedBookingGateEnforced: boolean;
  persistedWorkerQueueConfigured: boolean;
  referenceUploadWorkerExecuted: boolean;
  stripeDepositSessionSandboxPassed: boolean;
  notificationQueueDeliverySandboxPassed: boolean;
  calendarHoldSandboxPassed: boolean;
  auditPayloadsPersisted: boolean;
  retryPolicyVerified: boolean;
  rollbackPathsVerified: boolean;
  operatorReviewQueueConfigured: boolean;
  providerIdempotencyConfigured: boolean;
  providerSandboxEvidenceCaptured: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export const bookingProviderHandoffRuntimeRequiredControls = [
      "Create Stripe deposit sessions only after accepted booking state and policy approval.",
      "Execute upload, deposit, notification, and calendar handoffs from persisted tenant-scoped workers.",
      "Persist audit payloads and idempotency keys before invoking external providers.",
      "Retry only retryable provider failures and queue non-retryable failures for operator review.",
      "Rollback or void provider artifacts before exposing failed handoff states to users.",
      "Redact provider tokens, payment data, private URLs, raw client PII, and medical notes from artifacts.",
] as const;

export const bookingProviderHandoffRuntimeRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/calendar test",
      "Stripe CLI deposit session sandbox test",
      "email/SMS/push notification sandbox delivery tests",
      "Google Calendar tentative hold sandbox test",
      "persisted provider worker execution tests",
      "provider rollback/retry integration tests",
      "GitHub Actions provider handoff evidence job",
] as const;

export interface BookingProviderHandoffRuntimeEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof bookingProviderHandoffRuntimeRequiredCommands;
  requiredControls: typeof bookingProviderHandoffRuntimeRequiredControls;
  requiredEvidence: readonly BookingProviderHandoffRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const bookingProviderHandoffRuntimeRequiredEvidence = [
      "accepted-booking gate, persisted worker queue, and provider idempotency evidence",
      "reference upload, Stripe, notification, and calendar sandbox execution evidence",
      "audit persistence, retry, rollback, and operator-review queue evidence",
      "booking, payments, notifications, and calendar package test/typecheck evidence",
      "provider sandbox, CI, and secret-safe artifact evidence",
] as const;

export type BookingProviderHandoffRuntimeRequiredEvidence = (typeof bookingProviderHandoffRuntimeRequiredEvidence)[number];

export function buildBookingProviderHandoffRuntimeEvidencePlan(
  input: BookingProviderHandoffRuntimeEvidenceInput,
): BookingProviderHandoffRuntimeEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: BookingProviderHandoffRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking tests must pass before provider handoff evidence can close.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass before provider handoff evidence can close.");
  if (!input.paymentsTestsPassed) blockers.push("@inkroute/payments tests must pass before Stripe handoff evidence can close.");
  if (!input.notificationsTestsPassed) blockers.push("@inkroute/notifications tests must pass before notification handoff evidence can close.");
  if (!input.calendarTestsPassed) blockers.push("@inkroute/calendar tests must pass before calendar handoff evidence can close.");
  if (!input.acceptedBookingGateEnforced) blockers.push("Provider handoffs must only execute after accepted booking state and policy approval.");
  if (!input.persistedWorkerQueueConfigured) blockers.push("Persisted provider worker queue must be configured before provider handoff execution can close.");
  if (!input.providerIdempotencyConfigured) blockers.push("Provider handoffs must enforce idempotency across retries, worker restarts, and webhook replays.");
  if (!input.referenceUploadWorkerExecuted) blockers.push("Reference upload worker execution evidence must be captured.");
  if (!input.stripeDepositSessionSandboxPassed) blockers.push("Stripe deposit session sandbox test must pass without live-payment mode.");
  if (!input.notificationQueueDeliverySandboxPassed) blockers.push("Notification queue delivery sandbox test must pass for email/SMS/push or documented channel subset.");
  if (!input.calendarHoldSandboxPassed) blockers.push("Calendar hold sandbox test must pass with tentative hold creation and cleanup.");
  if (!input.auditPayloadsPersisted) blockers.push("Audit payloads must persist for upload, deposit, notification, calendar, retry, rollback, and operator-review events.");
  if (!input.retryPolicyVerified) blockers.push("Retry policy must be verified for retryable provider failures.");
  if (!input.rollbackPathsVerified) blockers.push("Rollback paths must be verified for failed Stripe, calendar, upload, and notification handoffs.");
  if (!input.operatorReviewQueueConfigured) blockers.push("Operator review queue must capture provider handoff failures before manual retry or rollback.");
  if (!input.providerSandboxEvidenceCaptured) blockers.push("Provider sandbox evidence must cover storage upload, Stripe deposit, notification, and calendar handoff execution.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for booking provider handoff runtime must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Booking provider handoff artifacts must be redacted and free of secrets, provider tokens, payment data, private URLs, and raw client PII.");

  if (!input.acceptedBookingGateEnforced || !input.persistedWorkerQueueConfigured || !input.providerIdempotencyConfigured) {
    requiredEvidence.push(bookingProviderHandoffRuntimeRequiredEvidence[0]);
  }
  if (!input.referenceUploadWorkerExecuted || !input.stripeDepositSessionSandboxPassed || !input.notificationQueueDeliverySandboxPassed || !input.calendarHoldSandboxPassed) {
    requiredEvidence.push(bookingProviderHandoffRuntimeRequiredEvidence[1]);
  }
  if (!input.auditPayloadsPersisted || !input.retryPolicyVerified || !input.rollbackPathsVerified || !input.operatorReviewQueueConfigured) {
    requiredEvidence.push(bookingProviderHandoffRuntimeRequiredEvidence[2]);
  }
  if (!input.bookingTestsPassed || !input.bookingTypecheckPassed || !input.paymentsTestsPassed || !input.notificationsTestsPassed || !input.calendarTestsPassed) {
    requiredEvidence.push(bookingProviderHandoffRuntimeRequiredEvidence[3]);
  }
  if (!input.providerSandboxEvidenceCaptured || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(bookingProviderHandoffRuntimeRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: bookingProviderHandoffRuntimeRequiredCommands,
    requiredControls: bookingProviderHandoffRuntimeRequiredControls,
    requiredEvidence:
      requiredEvidence.length === bookingProviderHandoffRuntimeRequiredEvidence.length
        ? bookingProviderHandoffRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface DashboardMutationExecutionEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  bookingTestsPassed: boolean;
  bookingTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  serverActionsImplemented: readonly DashboardMutationAction[];
  apiRoutesImplemented: readonly DashboardMutationAction[];
  routeTestsPassed: readonly DashboardMutationAction[];
  prismaTransactionsPassed: boolean;
  idempotencyPersistencePassed: boolean;
  auditLogPersistencePassed: boolean;
  tenantIsolationTestsPassed: boolean;
  rbacDenialTestsPassed: boolean;
  providerRollbackTestsPassed: boolean;
  disabledPlaceholdersRemoved: boolean;
  uiFeedbackStatesPassed: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export const dashboardMutationExecutionRequiredControls = [
      "Use buildDashboardMutationPlan before every server action or API mutation side effect.",
      "Execute dashboard write models in tenant-scoped Prisma transactions.",
      "Persist idempotency keys and redacted AuditLog rows before provider side effects.",
      "Enforce RBAC and tenant scope before lifecycle, upload, payment, notification, calendar, travel, portfolio, release, or settings writes.",
      "Expose gated UI actions with explicit loading/success/denial/failure/retry states.",
      "Redact secrets, provider tokens, raw PII, medical notes, payment data, and private file URLs from artifacts.",
] as const;

export const dashboardMutationExecutionRequiredCommands = [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard mutation server-action/API route tests",
      "dashboard mutation Prisma transaction tests",
      "dashboard mutation tenant-isolation and RBAC tests",
      "provider mutation rollback/retry tests",
      "dashboard mutation UI feedback-state tests",
      "GitHub Actions dashboard mutation execution evidence job",
] as const;

export interface DashboardMutationExecutionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingServerActions: readonly DashboardMutationAction[];
  missingApiRoutes: readonly DashboardMutationAction[];
  missingRouteTests: readonly DashboardMutationAction[];
  requiredCommands: typeof dashboardMutationExecutionRequiredCommands;
  requiredControls: typeof dashboardMutationExecutionRequiredControls;
  requiredEvidence: readonly DashboardMutationExecutionRequiredEvidence[];
  blockers: readonly string[];
}

export const dashboardMutationExecutionRequiredEvidence = [
      "server action, API route, and route-test matrix for every dashboard mutation",
      "Prisma transaction, idempotency, and AuditLog persistence evidence",
      "tenant-isolation and RBAC-denial mutation test evidence",
      "provider rollback/retry evidence for storage, Stripe, notification, calendar, release, and settings actions",
      "gated mutation UI replacement plus loading/success/denial/failure/retry state evidence",
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
] as const;

export type DashboardMutationExecutionRequiredEvidence = (typeof dashboardMutationExecutionRequiredEvidence)[number];

export function buildDashboardMutationExecutionEvidencePlan(
  input: DashboardMutationExecutionEvidenceInput,
): DashboardMutationExecutionEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const requiredActions: DashboardMutationAction[] = [
    "accept",
    "decline",
    "request_changes",
    "mark_deposit_paid",
    "confirm_appointment",
    "complete",
    "create_reference_upload_intent",
    "create_deposit_session",
    "send_client_notification",
    "create_calendar_hold",
    "publish_travel_stop",
    "publish_portfolio_item",
    "toggle_feature_flag",
    "rollback_release",
    "update_settings",
  ];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const missingServerActions = requiredActions.filter((action) => !input.serverActionsImplemented.includes(action));
  const missingApiRoutes = requiredActions.filter((action) => !input.apiRoutesImplemented.includes(action));
  const missingRouteTests = requiredActions.filter((action) => !input.routeTestsPassed.includes(action));
  const blockers: string[] = [];
  const requiredEvidence: DashboardMutationExecutionRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking tests must pass before dashboard mutation execution evidence can close.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass before dashboard mutation execution evidence can close.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with mutation routes/actions wired.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with mutation routes/actions wired.");
  if (missingServerActions.length > 0) blockers.push(`Dashboard mutation server actions are missing for: ${missingServerActions.join(", ")}.`);
  if (missingApiRoutes.length > 0) blockers.push(`Dashboard mutation API routes are missing for: ${missingApiRoutes.join(", ")}.`);
  if (missingRouteTests.length > 0) blockers.push(`Dashboard mutation route/API tests are missing for: ${missingRouteTests.join(", ")}.`);
  if (!input.prismaTransactionsPassed) blockers.push("Dashboard mutations must prove tenant-scoped Prisma transaction execution.");
  if (!input.idempotencyPersistencePassed) blockers.push("Dashboard mutations must persist and enforce idempotency keys.");
  if (!input.auditLogPersistencePassed) blockers.push("Dashboard mutations must persist redacted AuditLog rows.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Dashboard mutation tests must reject cross-tenant writes.");
  if (!input.rbacDenialTestsPassed) blockers.push("Dashboard mutation tests must reject actors without required permissions.");
  if (!input.providerRollbackTestsPassed) blockers.push("Provider-backed dashboard actions must prove rollback/retry behavior.");
  if (!input.disabledPlaceholdersRemoved) blockers.push("Dashboard mutation surfaces must expose gated action UI and explicit feedback states before execution readiness.");
  if (!input.uiFeedbackStatesPassed) blockers.push("Dashboard mutation UI must cover loading, success, denial, provider-failure, and retry states.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for dashboard mutation execution must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Dashboard mutation artifacts must be redacted and free of secrets, raw PII, medical notes, payment data, and private file URLs.");

  if (missingServerActions.length > 0 || missingApiRoutes.length > 0 || missingRouteTests.length > 0) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[0]);
  }
  if (!input.prismaTransactionsPassed || !input.idempotencyPersistencePassed || !input.auditLogPersistencePassed) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[1]);
  }
  if (!input.tenantIsolationTestsPassed || !input.rbacDenialTestsPassed) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[2]);
  }
  if (!input.providerRollbackTestsPassed) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[3]);
  }
  if (!input.disabledPlaceholdersRemoved || !input.uiFeedbackStatesPassed) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[4]);
  }
  if (!input.dashboardTypecheckPassed || !input.dashboardBuildPassed || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(dashboardMutationExecutionRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingServerActions,
    missingApiRoutes,
    missingRouteTests,
    requiredCommands: dashboardMutationExecutionRequiredCommands,
    requiredControls: dashboardMutationExecutionRequiredControls,
    requiredEvidence:
      requiredEvidence.length === dashboardMutationExecutionRequiredEvidence.length
        ? dashboardMutationExecutionRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export function buildDomainEventAuditReadinessPlan(input: DomainEventAuditReadinessInput): DomainEventAuditReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingPackageTypecheckPassed) blockers.push("Booking package typecheck must pass in an installed workspace.");
  if (!input.paymentPackageTestsPassed) blockers.push("Payment package lifecycle/audit tests must pass.");
  if (!input.bookingTransitionPlansCovered) blockers.push("Booking transitions must produce BookingRequest, BookingStateEvent, and AuditLog write plans.");
  if (!input.paymentLifecyclePlansCovered) blockers.push("Payment lifecycle transitions must produce Payment/Deposit/Refund, BookingStateEvent when applicable, PaymentAuditLog, and IdempotencyKey write plans.");
  if (!input.prismaTransactionServicesConfigured) blockers.push("Prisma service layer must execute state changes and event/audit writes in one transaction.");
  if (!input.tenantScopedRepositoriesConfigured) blockers.push("Tenant-scoped repositories must enforce tenantId on every lifecycle read/write.");
  if (!input.idempotencyStoreConfigured) blockers.push("Idempotency store must persist replay keys for lifecycle and provider actions.");
  if (!input.databaseIntegrationTestsPassed) blockers.push("Database integration tests must prove state mutation, event row, audit row, idempotency, and rollback behavior atomically.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: domainEventAuditReadinessRequiredCommands,
    requiredControls: domainEventAuditReadinessRequiredControls,
    blockers,
  };
}

export function buildDomainEventAuditTransactionEvidencePlan(
  input: DomainEventAuditTransactionEvidenceInput,
): DomainEventAuditTransactionEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DomainEventAuditTransactionRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking tests must pass before transaction evidence is ready.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass before transaction evidence is ready.");
  if (!input.paymentTestsPassed) blockers.push("@inkroute/payments tests must pass before transaction evidence is ready.");
  if (!input.paymentTypecheckPassed) blockers.push("@inkroute/payments typecheck must pass before transaction evidence is ready.");
  if (!input.prismaTransactionServicesImplemented) blockers.push("Booking/payment lifecycle services must execute writes inside Prisma transactions.");
  if (!input.tenantScopedRepositoriesImplemented) blockers.push("Booking/payment repositories must enforce tenant scope on reads and writes.");
  if (!input.bookingStateMutationAtomicityPassed) blockers.push("Booking state mutation atomicity tests must pass.");
  if (!input.paymentStateMutationAtomicityPassed) blockers.push("Payment/deposit/refund state mutation atomicity tests must pass.");
  if (!input.bookingStateEventRowsPersisted) blockers.push("BookingStateEvent rows must persist for booking lifecycle changes.");
  if (!input.auditLogRowsPersisted) blockers.push("AuditLog rows must persist for booking/dashboard lifecycle decisions.");
  if (!input.paymentAuditLogRowsPersisted) blockers.push("PaymentAuditLog rows must persist for payment/deposit/refund lifecycle decisions.");
  if (!input.idempotencyPersistenceEnforced) blockers.push("Idempotency keys must persist and block duplicate lifecycle mutations.");
  if (!input.replayedMutationReturnsOriginalResult) blockers.push("Replayed lifecycle mutations must return the original committed result without duplicate writes.");
  if (!input.providerRollbackIntegrationPassed) blockers.push("Provider rollback integration tests must pass for deposit, upload, notification, calendar, and release failures.");
  if (!input.invalidTransitionDenialPassed) blockers.push("Invalid booking/payment transitions must be denied before transaction writes.");
  if (!input.crossTenantMutationDenialPassed) blockers.push("Cross-tenant lifecycle mutation denial tests must pass.");
  if (!input.databaseIntegrationEvidenceCaptured) blockers.push("Database transaction evidence must be captured.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for domain event/audit transactions must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Domain event/audit artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.bookingTestsPassed || !input.bookingTypecheckPassed || !input.paymentTestsPassed || !input.paymentTypecheckPassed) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[0]);
  }
  if (!input.prismaTransactionServicesImplemented || !input.tenantScopedRepositoriesImplemented) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[1]);
  }
  if (!input.bookingStateMutationAtomicityPassed || !input.paymentStateMutationAtomicityPassed || !input.bookingStateEventRowsPersisted || !input.auditLogRowsPersisted || !input.paymentAuditLogRowsPersisted) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[2]);
  }
  if (!input.idempotencyPersistenceEnforced || !input.replayedMutationReturnsOriginalResult) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[3]);
  }
  if (!input.providerRollbackIntegrationPassed || !input.invalidTransitionDenialPassed || !input.crossTenantMutationDenialPassed) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[4]);
  }
  if (!input.databaseIntegrationEvidenceCaptured || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(domainEventAuditTransactionRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: domainEventAuditTransactionRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === domainEventAuditTransactionRequiredEvidence.length
        ? domainEventAuditTransactionRequiredEvidence
        : requiredEvidence,
    requiredControls: domainEventAuditTransactionRequiredControls,
    blockers,
  };
}

export function getTravelBookingCta(status: TravelBookingStatus): string {
  if (status === "open") return "Request this city";
  if (status === "waitlist") return "Join the waitlist";
  return "View travel notes";
}
