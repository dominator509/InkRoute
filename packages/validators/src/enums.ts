import { z } from "zod";

export const tenantPlanSchema = z.enum(["solo", "nomad", "studio", "growth", "enterprise"]);
export const tenantStatusSchema = z.enum(["trial", "active", "past_due", "suspended", "archived"]);
export const roleSchema = z.enum(["owner", "artist", "assistant", "studio_manager", "admin"]);
export const memberStatusSchema = z.enum(["invited", "active", "suspended", "removed"]);

export const tattooStyleSchema = z.enum([
  "blackwork",
  "fine_line",
  "traditional",
  "neo_traditional",
  "realism",
  "ornamental",
  "japanese",
  "lettering",
  "flash",
  "custom",
]);

export const bodyPlacementSchema = z.enum([
  "arm",
  "forearm",
  "upper_arm",
  "leg",
  "calf",
  "thigh",
  "back",
  "chest",
  "ribs",
  "neck",
  "hand",
  "foot",
  "shoulder",
  "sternum",
  "stomach",
  "head",
  "other",
]);

export const freshnessLabelSchema = z.enum(["fresh", "healed", "in_progress"]);
export const bookingStatusSchema = z.enum([
  "draft",
  "submitted",
  "needs_info",
  "accepted",
  "declined",
  "deposit_pending",
  "deposit_paid",
  "scheduled",
  "reschedule_requested",
  "cancelled",
  "completed",
  "no_show",
  "archived",
]);
export const appointmentStatusSchema = z.enum(["tentative", "confirmed", "reschedule_requested", "rescheduled", "cancelled", "completed", "no_show"]);
export const paymentStatusSchema = z.enum(["not_required", "pending", "paid", "failed", "refunded", "partially_refunded", "disputed"]);
export const refundStatusSchema = z.enum(["pending", "succeeded", "failed", "cancelled"]);
export const paymentProviderSchema = z.enum(["stripe", "manual", "other"]);
export const travelBookingStatusSchema = z.enum(["open", "waitlist", "closed"]);
export const availabilityKindSchema = z.enum(["booking", "consultation", "flash", "admin_hold", "blackout"]);
export const availabilityStatusSchema = z.enum(["open", "waitlist", "full", "hidden"]);
export const fileAssetKindSchema = z.enum(["portfolio_original", "portfolio_derivative", "reference_image", "consent_signature", "healed_follow_up", "document", "other"]);
export const fileVisibilitySchema = z.enum(["public", "tenant_private", "client_private", "system_private"]);
export const intakeQuestionTypeSchema = z.enum(["short_text", "long_text", "single_select", "multi_select", "number", "date", "file_upload", "acknowledgement"]);
export const formStatusSchema = z.enum(["draft", "published", "archived"]);
export const consentSignatureStatusSchema = z.enum(["pending", "signed", "revoked", "expired"]);
export const medicalAcknowledgmentStatusSchema = z.enum(["not_required", "pending", "completed", "flagged_for_review"]);
export const messageChannelSchema = z.enum(["in_app", "email", "sms", "system"]);
export const messageDirectionSchema = z.enum(["inbound", "outbound", "internal", "system"]);
export const messageStatusSchema = z.enum(["draft", "queued", "sent", "delivered", "failed", "read"]);
export const notificationChannelSchema = z.enum(["in_app", "email", "sms", "push"]);
export const notificationStatusSchema = z.enum(["pending", "queued", "sent", "delivered", "failed", "cancelled"]);
export const reviewStatusSchema = z.enum(["submitted", "approved", "rejected", "hidden"]);
export const seoPageStatusSchema = z.enum(["draft", "published", "noindex", "archived"]);
export const errorSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const releaseChannelSchema = z.enum(["development", "preview", "production", "mobile_preview", "mobile_production"]);
export const featureFlagScopeSchema = z.enum(["global", "tenant", "user"]);
