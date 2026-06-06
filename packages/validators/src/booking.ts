import { z } from "zod";
import { cuidLikeSchema, isoDateTimeSchema, moneyCentsSchema, utmSchema } from "./common";
import { bodyPlacementSchema, bookingStatusSchema, tattooStyleSchema } from "./enums";

export const bookingRequestInputSchema = utmSchema.extend({
  artistId: cuidLikeSchema,
  clientId: cuidLikeSchema.optional(),
  travelCityId: cuidLikeSchema.optional(),
  clientName: z.string().min(2).max(120),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(7).max(30).optional(),
  preferredCity: z.string().min(2).max(120),
  preferredDate: isoDateTimeSchema.optional(),
  style: tattooStyleSchema,
  placement: bodyPlacementSchema,
  sizeEstimate: z.string().min(2).max(80),
  budgetMin: moneyCentsSchema.optional(),
  budgetMax: moneyCentsSchema.optional(),
  ideaSummary: z.string().min(20).max(3000),
  medicalNotes: z.string().max(2000).optional(),
  policyAccepted: z.literal(true),
  portfolioAttributionId: cuidLikeSchema.optional(),
}).refine((value) => value.budgetMax === undefined || value.budgetMin === undefined || value.budgetMax >= value.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const bookingStatusUpdateSchema = z.object({
  status: bookingStatusSchema,
  note: z.string().max(2000).optional(),
  assignedToUserId: cuidLikeSchema.optional(),
});

export const appointmentInputSchema = z.object({
  artistId: cuidLikeSchema,
  clientId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  travelCityId: cuidLikeSchema.optional(),
  studioId: cuidLikeSchema.optional(),
  title: z.string().min(2).max(180),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  timezone: z.string().min(3).max(80),
  locationLabel: z.string().max(180).optional(),
  depositRequiredCents: moneyCentsSchema.optional(),
  internalNotes: z.string().max(4000).optional(),
  clientPrepNotes: z.string().max(4000).optional(),
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

export type BookingRequestInput = z.infer<typeof bookingRequestInputSchema>;
export type BookingStatusUpdate = z.infer<typeof bookingStatusUpdateSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
