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

export interface DashboardMutationRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingServerRoutes: readonly DashboardMutationAction[];
  missingRouteTests: readonly DashboardMutationAction[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

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

export interface DomainEventAuditReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
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
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingTestsPassed) blockers.push("@inkroute/booking dashboard mutation tests must pass.");
  if (!input.bookingTypecheckPassed) blockers.push("@inkroute/booking typecheck must pass in an installed workspace.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with mutation routes/actions wired.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with mutation routes/actions wired.");
  if (missingServerRoutes.length > 0) blockers.push(`Dashboard mutation server routes/actions are missing for: ${missingServerRoutes.join(", ")}.`);
  if (missingRouteTests.length > 0) blockers.push(`Dashboard mutation route/API tests are missing for: ${missingRouteTests.join(", ")}.`);
  if (!input.prismaTransactionsConfigured) blockers.push("Dashboard mutations must execute write models in Prisma transactions.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Dashboard mutation tests must reject cross-tenant writes.");
  if (!input.rbacDenialTestsPassed) blockers.push("Dashboard mutation tests must reject actors lacking required permissions.");
  if (!input.idempotencyStoreConfigured) blockers.push("Dashboard mutations must persist and enforce idempotency keys.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Dashboard mutations must persist AuditLog records for sensitive changes.");
  if (!input.providerRollbackTestsPassed) blockers.push("Provider-backed dashboard actions must prove rollback/retry behavior.");
  if (!input.disabledPlaceholdersRemoved) blockers.push("Disabled dashboard action placeholders must be replaced by gated actions before runtime readiness.");
  if (!input.userFeedbackStatesCovered) blockers.push("Dashboard mutation UI must cover loading, success, denial, provider-failure, and retry states.");

  if (missingServerRoutes.length > 0 || missingRouteTests.length > 0) {
    requiredEvidence.push("server route/action and route-test matrix for every dashboard mutation action");
  }
  if (!input.prismaTransactionsConfigured || !input.auditLogPersistenceConfigured || !input.idempotencyStoreConfigured) {
    requiredEvidence.push("transaction, idempotency, and AuditLog persistence evidence for dashboard writes");
  }
  if (!input.tenantIsolationTestsPassed || !input.rbacDenialTestsPassed) {
    requiredEvidence.push("tenant isolation and RBAC denial test output for dashboard mutations");
  }
  if (!input.providerRollbackTestsPassed) requiredEvidence.push("provider rollback/retry test output for Stripe, storage, notifications, calendar, and release actions");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingServerRoutes,
    missingRouteTests,
    requiredCommands: [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test -- dashboard-mutations",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildDomainEventAuditReadinessPlan(input: DomainEventAuditReadinessInput): DomainEventAuditReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/booking package script is missing ${script}.`);
  if (!input.bookingPackageTestsPassed) blockers.push("Booking package lifecycle tests must pass.");
  if (!input.bookingPackageTypecheckPassed) blockers.push("Booking package typecheck must pass in an installed workspace.");
  if (!input.paymentPackageTestsPassed) blockers.push("Payment package lifecycle/audit tests must pass.");
  if (!input.bookingTransitionPlansCovered) blockers.push("Booking transitions must produce BookingRequest, BookingStateEvent, and AuditLog write plans.");
  if (!input.paymentLifecyclePlansCovered) blockers.push("Payment lifecycle transitions must produce Payment/Deposit/Refund, BookingStateEvent when applicable, PaymentAuditLog, and IdempotencyKey write plans.");
  if (!input.prismaTransactionServicesConfigured) blockers.push("Prisma service layer must execute state changes and event/audit writes in one transaction.");
  if (!input.tenantScopedRepositoriesConfigured) blockers.push("Tenant-scoped repositories must enforce tenantId on every lifecycle read/write.");
  if (!input.idempotencyStoreConfigured) blockers.push("Idempotency store must reject replayed booking/payment lifecycle mutations.");
  if (!input.auditLogPersistenceConfigured) blockers.push("AuditLog persistence must cover every sensitive booking/dashboard lifecycle mutation.");
  if (!input.bookingStateEventPersistenceConfigured) blockers.push("BookingStateEvent persistence must be required for every booking status change.");
  if (!input.paymentAuditLogPersistenceConfigured) blockers.push("PaymentAuditLog persistence must be required for every payment/deposit/refund lifecycle change.");
  if (!input.rollbackFailurePlansConfigured) blockers.push("Provider failure rollback plans must be wired for deposit, upload, notification, calendar, and release actions.");
  if (!input.databaseIntegrationTestsPassed) blockers.push("Database integration tests must prove state mutation, event row, audit row, idempotency, and rollback behavior atomically.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments test",
      "booking/payment lifecycle Prisma transaction integration tests",
      "idempotency replay integration tests",
      "provider failure rollback integration tests",
    ],
    requiredControls: [
      "Execute BookingRequest, BookingStateEvent, AuditLog, Payment, Deposit, Refund, PaymentAuditLog, and IdempotencyKey writes inside tenant-scoped transactions.",
      "Reject lifecycle mutations before persistence when tenant scope, actor, idempotency key, current status, provider id, or amount is invalid.",
      "Persist audit/event rows for both success and failure paths before returning a client-visible state change.",
      "Use idempotency keys for dashboard actions, provider webhooks, payment lifecycle updates, and rollback attempts.",
      "Make invalid state transitions impossible through the service layer, not just through UI disabled states.",
      "Attach provider failure rollback records before retrying or surfacing deposit/calendar/upload/notification failures.",
    ],
    blockers,
  };
}

export function getTravelBookingCta(status: TravelBookingStatus): string {
  if (status === "open") return "Request this city";
  if (status === "waitlist") return "Join the waitlist";
  return "View travel notes";
}
