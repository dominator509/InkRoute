import { z } from "zod";
import { cuidLikeSchema, dateRangeSchema, slugSchema, timezoneSchema } from "./common";
import { availabilityKindSchema, availabilityStatusSchema, travelBookingStatusSchema } from "./enums";

export const travelCityInputSchema = z.object({
  slug: slugSchema,
  city: z.string().min(2).max(120),
  region: z.string().min(2).max(120),
  country: z.string().min(2).max(120),
  timezone: timezoneSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  publicSummary: z.string().max(1000).optional(),
  waitlistEnabled: z.boolean().default(true),
});

export const travelScheduleInputSchema = z.intersection(
  dateRangeSchema,
  z.object({
  artistId: cuidLikeSchema,
  travelCityId: cuidLikeSchema,
  studioId: cuidLikeSchema.optional(),
  title: z.string().min(2).max(160),
  timezone: timezoneSchema,
  bookingStatus: travelBookingStatusSchema.default("open"),
  guestSpotUrl: z.string().url().optional(),
  publicNotes: z.string().max(1000).optional(),
  internalNotes: z.string().max(2000).optional(),
  }),
);

export const availabilityWindowInputSchema = z.intersection(
  dateRangeSchema,
  z.object({
  artistId: cuidLikeSchema,
  travelCityId: cuidLikeSchema.optional(),
  travelScheduleId: cuidLikeSchema.optional(),
  kind: availabilityKindSchema.default("booking"),
  status: availabilityStatusSchema.default("open"),
  timezone: timezoneSchema,
  maxBookings: z.number().int().positive().max(40).optional(),
  bufferBeforeMinutes: z.number().int().nonnegative().max(480).default(0),
  bufferAfterMinutes: z.number().int().nonnegative().max(480).default(0),
  publicLabel: z.string().max(160).optional(),
  internalNotes: z.string().max(2000).optional(),
  }),
);

export const travelStopInputSchema = travelScheduleInputSchema;

export type TravelCityInput = z.infer<typeof travelCityInputSchema>;
export type TravelScheduleInput = z.infer<typeof travelScheduleInputSchema>;
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowInputSchema>;
export type TravelStopInput = z.infer<typeof travelStopInputSchema>;
