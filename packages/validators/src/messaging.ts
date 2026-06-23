import { z } from "zod";
import { cuidLikeSchema, isoDateTimeSchema } from "./common";
import { messageChannelSchema, messageDirectionSchema, messageStatusSchema, notificationChannelSchema, notificationStatusSchema } from "./enums";

export const notificationTemplateKeySchema = z.enum([
  "booking_request_received",
  "booking_request_needs_info",
  "booking_request_accepted",
  "booking_request_declined",
  "deposit_request",
  "deposit_paid_receipt",
  "deposit_failed",
  "appointment_confirmed",
  "appointment_prep_72h",
  "appointment_prep_24h",
  "reschedule_notice",
  "cancellation_notice",
  "aftercare_day_0",
  "aftercare_day_2",
  "aftercare_day_7",
  "aftercare_day_14",
  "healed_photo_request_30d",
  "healed_photo_request_90d",
  "city_waitlist_opening",
  "flash_drop_announcement",
  "review_request",
]);

export const messageThreadInputSchema = z.object({
  clientId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  appointmentId: cuidLikeSchema.optional(),
  subject: z.string().min(2).max(180),
  isArchived: z.boolean().default(false),
});

export const messageInputSchema = z.object({
  threadId: cuidLikeSchema,
  senderUserId: cuidLikeSchema.optional(),
  senderClientId: cuidLikeSchema.optional(),
  channel: messageChannelSchema.default("in_app"),
  direction: messageDirectionSchema.default("outbound"),
  status: messageStatusSchema.default("draft"),
  body: z.string().min(1).max(10_000),
  providerMessageId: z.string().max(240).optional(),
});

export const publicMessageInputSchema = z.object({
  subject: z.string().min(2).max(180),
  body: z.string().min(1).max(10_000),
  bookingRequestId: cuidLikeSchema.optional(),
});

export const publicContactInputSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(240),
  subject: z.string().max(180).optional(),
  message: z.string().min(10).max(4000),
});

export const notificationInputSchema = z.object({
  userId: cuidLikeSchema.optional(),
  clientId: cuidLikeSchema.optional(),
  bookingRequestId: cuidLikeSchema.optional(),
  appointmentId: cuidLikeSchema.optional(),
  type: notificationTemplateKeySchema,
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(4000),
  status: notificationStatusSchema.default("pending"),
  scheduledFor: isoDateTimeSchema.optional(),
});

export const notificationDeliveryInputSchema = z.object({
  notificationId: cuidLikeSchema,
  channel: notificationChannelSchema,
  status: notificationStatusSchema.default("queued"),
  destinationHash: z.string().max(160).optional(),
  provider: z.string().max(80).optional(),
  providerMessageId: z.string().max(240).optional(),
});

export const notificationConsentInputSchema = z.object({
  clientId: cuidLikeSchema.optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(32).optional(),
  pushToken: z.string().min(8).max(300).optional(),
  inAppUserId: z.string().min(2).max(160).optional(),
  emailOptIn: z.boolean().default(false),
  smsOptIn: z.boolean().default(false),
  pushOptIn: z.boolean().default(false),
  marketingOptIn: z.boolean().default(false),
  transactionalAllowed: z.boolean().default(true),
  unsubscribedAt: isoDateTimeSchema.optional(),
  smsStoppedAt: isoDateTimeSchema.optional(),
  pushDisabledAt: isoDateTimeSchema.optional(),
});

export const notificationPreviewInputSchema = z.object({
  templateKey: notificationTemplateKeySchema,
  channels: z.array(notificationChannelSchema).min(1).max(4).optional(),
  artistName: z.string().min(1).max(120),
  clientName: z.string().min(1).max(120),
  city: z.string().max(120).optional(),
  appointmentDate: z.string().max(120).optional(),
  depositUrl: z.string().url().optional(),
  aftercareUrl: z.string().url().optional(),
  bookingUrl: z.string().url().optional(),
  healedPhotoUploadUrl: z.string().url().optional(),
  unsubscribeUrl: z.string().url().optional(),
  consent: notificationConsentInputSchema,
});

export const providerWebhookPreviewInputSchema = z.object({
  provider: z.enum(["resend", "twilio", "expo"]),
  eventType: z.string().min(1).max(160),
  inboundBody: z.string().max(2000).optional(),
});

export type MessageThreadInput = z.infer<typeof messageThreadInputSchema>;
export type MessageInput = z.infer<typeof messageInputSchema>;
export type PublicMessageInput = z.infer<typeof publicMessageInputSchema>;
export type PublicContactInput = z.infer<typeof publicContactInputSchema>;
export type NotificationInput = z.infer<typeof notificationInputSchema>;
export type NotificationDeliveryInput = z.infer<typeof notificationDeliveryInputSchema>;
export type NotificationConsentInput = z.infer<typeof notificationConsentInputSchema>;
export type NotificationPreviewInput = z.infer<typeof notificationPreviewInputSchema>;
export type ProviderWebhookPreviewInput = z.infer<typeof providerWebhookPreviewInputSchema>;
