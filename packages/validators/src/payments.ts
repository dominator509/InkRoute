import { z } from "zod";
import { cuidLikeSchema, currencySchema, isoDateTimeSchema, moneyCentsSchema } from "./common";
import { paymentProviderSchema, paymentStatusSchema, refundStatusSchema } from "./enums";

export const appointmentPaymentTypeSchema = z.enum(["consultation", "flash", "custom", "large_scale", "touch_up", "guest_spot"]);
export const travelRiskTierSchema = z.enum(["local", "standard_travel", "high_demand_guest_spot"]);

export const depositInputSchema = z.object({
  bookingRequestId: cuidLikeSchema,
  appointmentId: cuidLikeSchema.optional(),
  amountCents: moneyCentsSchema,
  currency: currencySchema.default("usd"),
  status: paymentStatusSchema.default("pending"),
  dueAt: isoDateTimeSchema.optional(),
  policySnapshot: z.record(z.unknown()).optional(),
});

export const depositPolicyPreviewInputSchema = z.object({
  bookingRequestId: z.string().min(1).max(120),
  estimatedSessionHours: z.number().min(0.25).max(24),
  city: z.string().min(1).max(120).optional(),
  clientEmail: z.string().email().optional(),
  clientName: z.string().min(1).max(160).optional(),
  appointmentType: appointmentPaymentTypeSchema.default("custom"),
  travelRiskTier: travelRiskTierSchema.default("standard_travel"),
  cityDemandScore: z.number().int().min(0).max(5).default(2),
  clientNoShowCount: z.number().int().min(0).max(20).default(0),
  clientLateCancellationCount: z.number().int().min(0).max(20).default(0),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const paymentRecordInputSchema = z.object({
  bookingRequestId: cuidLikeSchema.optional(),
  appointmentId: cuidLikeSchema.optional(),
  depositId: cuidLikeSchema.optional(),
  provider: paymentProviderSchema.default("stripe"),
  providerPaymentId: z.string().max(240).optional(),
  providerSessionId: z.string().max(240).optional(),
  status: paymentStatusSchema.default("pending"),
  amountCents: moneyCentsSchema,
  currency: currencySchema.default("usd"),
  description: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const refundInputSchema = z.object({
  paymentId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  depositId: cuidLikeSchema.optional(),
  providerRefundId: z.string().max(240).optional(),
  status: refundStatusSchema.default("pending"),
  amountCents: moneyCentsSchema,
  currency: currencySchema.default("usd"),
  reason: z.string().max(500).optional(),
});

export const refundPolicyPreviewInputSchema = z.object({
  amountPaidCents: moneyCentsSchema,
  requestedRefundCents: moneyCentsSchema.optional(),
  cancellationRequestedAt: isoDateTimeSchema,
  appointmentStartsAt: isoDateTimeSchema,
  nonRefundableWindowHours: z.number().int().min(0).max(720).optional(),
  clientNoShowCount: z.number().int().min(0).max(20).optional(),
  artistCancelled: z.boolean().optional(),
  forceMajeure: z.boolean().optional(),
  policyAllowsManualReview: z.boolean().optional(),
});

export const noShowPolicyPreviewInputSchema = z.object({
  depositAmountCents: moneyCentsSchema,
  appointmentStartsAt: isoDateTimeSchema,
  markedAt: isoDateTimeSchema,
  clientArrivedMinutesLate: z.number().int().min(0).max(600).optional(),
  clientContactedArtist: z.boolean().optional(),
  artistWaivedFee: z.boolean().optional(),
  emergencyClaimed: z.boolean().optional(),
});

export const stripeWebhookPreviewInputSchema = z.object({
  eventType: z.string().min(1).max(160),
});

export type DepositInput = z.infer<typeof depositInputSchema>;
export type DepositPolicyPreviewInput = z.infer<typeof depositPolicyPreviewInputSchema>;
export type PaymentRecordInput = z.infer<typeof paymentRecordInputSchema>;
export type RefundInput = z.infer<typeof refundInputSchema>;
export type RefundPolicyPreviewInput = z.infer<typeof refundPolicyPreviewInputSchema>;
export type NoShowPolicyPreviewInput = z.infer<typeof noShowPolicyPreviewInputSchema>;
export type StripeWebhookPreviewInput = z.infer<typeof stripeWebhookPreviewInputSchema>;
