export type EntityId = string;
export type ISODateString = string;
export type CurrencyCode = string;

export type TenantPlan = "solo" | "nomad" | "studio" | "growth" | "enterprise";
export type TenantStatus = "trial" | "active" | "past_due" | "suspended" | "archived";
export type Role = "owner" | "artist" | "assistant" | "studio_manager" | "admin";
export type MemberStatus = "invited" | "active" | "suspended" | "removed";

export type Permission =
  | "tenant:read"
  | "tenant:write"
  | "booking:read"
  | "booking:write"
  | "client:read"
  | "client:write"
  | "form:read"
  | "form:write"
  | "message:read"
  | "message:write"
  | "notification:read"
  | "notification:write"
  | "portfolio:read"
  | "portfolio:write"
  | "travel:read"
  | "travel:write"
  | "calendar:read"
  | "calendar:write"
  | "payment:read"
  | "payment:write"
  | "review:read"
  | "review:write"
  | "seo:read"
  | "seo:write"
  | "analytics:read"
  | "error:read"
  | "error:write"
  | "release:read"
  | "release:write"
  | "settings:write";

export type BookingStatus =
  | "draft"
  | "submitted"
  | "needs_info"
  | "accepted"
  | "declined"
  | "deposit_pending"
  | "deposit_paid"
  | "scheduled"
  | "reschedule_requested"
  | "cancelled"
  | "completed"
  | "no_show"
  | "archived";

export type BookingEventType =
  | "submitted"
  | "note_added"
  | "assigned"
  | "needs_info"
  | "accepted"
  | "declined"
  | "deposit_requested"
  | "deposit_paid"
  | "scheduled"
  | "reschedule_requested"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export type AppointmentStatus = "tentative" | "confirmed" | "reschedule_requested" | "rescheduled" | "cancelled" | "completed" | "no_show";
export type PaymentStatus = "not_required" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "disputed";
export type RefundStatus = "pending" | "succeeded" | "failed" | "cancelled";
export type PaymentProvider = "stripe" | "manual" | "other";
export type TravelBookingStatus = "open" | "waitlist" | "closed";
export type AvailabilityKind = "booking" | "consultation" | "flash" | "admin_hold" | "blackout";
export type AvailabilityStatus = "open" | "waitlist" | "full" | "hidden";
export type FreshnessLabel = "fresh" | "healed" | "in_progress";

export type BodyPlacement =
  | "arm"
  | "forearm"
  | "upper_arm"
  | "leg"
  | "calf"
  | "thigh"
  | "back"
  | "chest"
  | "ribs"
  | "neck"
  | "hand"
  | "foot"
  | "shoulder"
  | "sternum"
  | "stomach"
  | "head"
  | "other";

export type TattooStyle =
  | "blackwork"
  | "fine_line"
  | "traditional"
  | "neo_traditional"
  | "realism"
  | "ornamental"
  | "japanese"
  | "lettering"
  | "flash"
  | "custom";

export type FileAssetKind = "portfolio_original" | "portfolio_derivative" | "reference_image" | "consent_signature" | "healed_follow_up" | "document" | "other";
export type FileVisibility = "public" | "tenant_private" | "client_private" | "system_private";
export type IntakeQuestionType = "short_text" | "long_text" | "single_select" | "multi_select" | "number" | "date" | "file_upload" | "acknowledgement";
export type FormStatus = "draft" | "published" | "archived";
export type ConsentSignatureStatus = "pending" | "signed" | "revoked" | "expired";
export type MedicalAcknowledgmentStatus = "not_required" | "pending" | "completed" | "flagged_for_review";
export type MessageChannel = "in_app" | "email" | "sms" | "system";
export type MessageDirection = "inbound" | "outbound" | "internal" | "system";
export type MessageStatus = "draft" | "queued" | "sent" | "delivered" | "failed" | "read";
export type NotificationChannel = "in_app" | "email" | "sms" | "push";
export type NotificationStatus = "pending" | "queued" | "sent" | "delivered" | "failed" | "cancelled";
export type ReviewStatus = "submitted" | "approved" | "rejected" | "hidden";
export type SeoPageStatus = "draft" | "published" | "noindex" | "archived";
export type ErrorSeverity = "low" | "medium" | "high" | "critical";
export type ErrorReportStatus = "open" | "triaged" | "in_progress" | "resolved" | "ignored";
export type ReleaseChannel = "development" | "preview" | "production" | "mobile_preview" | "mobile_production";
export type FeatureFlagScope = "global" | "tenant" | "user";

export interface Tenant {
  id: EntityId;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  publicSiteName?: string;
  defaultTimezone?: string;
}

export interface TenantMember {
  id: EntityId;
  tenantId: EntityId;
  userId: EntityId;
  role: Role;
  status: MemberStatus;
  customRoleId?: EntityId;
}

export interface ArtistProfile {
  id: EntityId;
  tenantId: EntityId;
  studioId?: EntityId;
  userId?: EntityId;
  displayName: string;
  slug: string;
  bio: string;
  shortBio?: string;
  homeBaseCity?: string;
  specialties: TattooStyle[];
  instagramUrl?: string;
  bookingEnabled?: boolean;
}

export interface Studio {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  slug: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
}

export interface Client {
  id: EntityId;
  tenantId: EntityId;
  email: string;
  phone?: string;
  preferredName: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  marketingOptIn: boolean;
  smsOptIn: boolean;
}

export interface TattooStyleRecord {
  id: EntityId;
  tenantId: EntityId;
  slug: string;
  label: string;
  description?: string;
  isActive: boolean;
}

export interface TravelCity {
  id: EntityId;
  tenantId: EntityId;
  slug: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  waitlistEnabled: boolean;
  publicSummary?: string;
}

export interface TravelSchedule {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  travelCityId: EntityId;
  studioId?: EntityId;
  title: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  bookingStatus: TravelBookingStatus;
  guestSpotUrl?: string;
  publicNotes?: string;
}

export interface TravelStop {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  city: string;
  region: string;
  country: string;
  timezone: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  studioName?: string;
  bookingStatus: TravelBookingStatus;
  publicNotes?: string;
}


export interface AvailabilityWindow {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  travelCityId?: EntityId;
  travelScheduleId?: EntityId;
  kind: AvailabilityKind;
  status: AvailabilityStatus;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  maxBookings?: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export interface PortfolioItem {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  title: string;
  slug: string;
  caption: string;
  styles: TattooStyle[];
  placement: BodyPlacement;
  freshness: FreshnessLabel;
  city?: string;
  imageUrl: string;
  altText: string;
  isFeatured: boolean;
  isPublic?: boolean;
  attributionKey?: string;
}

export interface FileAsset {
  id: EntityId;
  tenantId: EntityId;
  kind: FileAssetKind;
  visibility: FileVisibility;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl?: string;
}

export interface BookingRequest {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  clientId?: EntityId;
  travelCityId?: EntityId;
  status: BookingStatus;
  clientName: string;
  clientEmail: string;
  preferredCity: string;
  preferredDate?: ISODateString;
  style: TattooStyle;
  placement: BodyPlacement;
  sizeEstimate: string;
  budgetMin?: number;
  budgetMax?: number;
  ideaSummary: string;
  readinessScore: number;
  policyAccepted: boolean;
  portfolioAttributionId?: EntityId;
  createdAt: ISODateString;
}

export interface Appointment {
  id: EntityId;
  tenantId: EntityId;
  artistId: EntityId;
  clientId: EntityId;
  bookingRequestId?: EntityId;
  status: AppointmentStatus;
  title: string;
  startsAt: ISODateString;
  endsAt: ISODateString;
  timezone: string;
  locationLabel?: string;
}

export interface Deposit {
  id: EntityId;
  tenantId: EntityId;
  bookingRequestId: EntityId;
  appointmentId?: EntityId;
  amountCents: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  dueAt?: ISODateString;
  paidAt?: ISODateString;
}

export interface PaymentRecord {
  id: EntityId;
  tenantId: EntityId;
  bookingRequestId?: EntityId;
  appointmentId?: EntityId;
  depositId?: EntityId;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: CurrencyCode;
  providerPaymentId?: string;
  providerSessionId?: string;
}

export interface IntakeResponse {
  id: EntityId;
  tenantId: EntityId;
  formId: EntityId;
  bookingRequestId?: EntityId;
  clientId: EntityId;
  answers: Record<string, unknown>;
  submittedAt: ISODateString;
}

export interface ConsentSignature {
  id: EntityId;
  tenantId: EntityId;
  consentFormId: EntityId;
  bookingRequestId?: EntityId;
  clientId: EntityId;
  status: ConsentSignatureStatus;
  signerName: string;
  signerEmail: string;
  signedAt?: ISODateString;
}

export interface MessageThread {
  id: EntityId;
  tenantId: EntityId;
  clientId: EntityId;
  bookingRequestId?: EntityId;
  appointmentId?: EntityId;
  subject: string;
  lastMessageAt?: ISODateString;
}

export interface NotificationRecord {
  id: EntityId;
  tenantId: EntityId;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  scheduledFor?: ISODateString;
}

export interface Review {
  id: EntityId;
  tenantId: EntityId;
  artistId?: EntityId;
  status: ReviewStatus;
  rating: number;
  body: string;
  publicDisplayName?: string;
  publishedAt?: ISODateString;
}

export interface SeoCityPage {
  id: EntityId;
  tenantId: EntityId;
  slug: string;
  city: string;
  region: string;
  country: string;
  title: string;
  metaDescription: string;
  canonicalPath: string;
  status: SeoPageStatus;
}

export interface SeoStylePage {
  id: EntityId;
  tenantId: EntityId;
  slug: string;
  styleName: string;
  title: string;
  metaDescription: string;
  canonicalPath: string;
  status: SeoPageStatus;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  scope?: FeatureFlagScope;
}
