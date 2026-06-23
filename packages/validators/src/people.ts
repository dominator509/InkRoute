import { z } from "zod";
import { optionalUrlSchema, slugSchema, timezoneSchema } from "./common";
import { tattooStyleSchema } from "./enums";

export const artistInputSchema = z.object({
  studioId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  displayName: z.string().min(2).max(120),
  slug: slugSchema,
  bio: z.string().min(20).max(4000),
  shortBio: z.string().max(240).optional(),
  homeBaseCity: z.string().max(120).optional(),
  specialties: z.array(tattooStyleSchema).min(1),
  instagramUrl: optionalUrlSchema,
  bookingEnabled: z.boolean().default(true),
});

export const studioInputSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema,
  city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  timezone: timezoneSchema.optional(),
  addressLine1: z.string().max(160).optional(),
  addressLine2: z.string().max(160).optional(),
  websiteUrl: optionalUrlSchema,
  publicNotes: z.string().max(1000).optional(),
});

export const clientInputSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(30).optional(),
  preferredName: z.string().min(2).max(120),
  legalName: z.string().max(160).optional(),
  pronouns: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  timezone: timezoneSchema.optional(),
  marketingOptIn: z.boolean().default(false),
  smsOptIn: z.boolean().default(false),
});

export const clientProfileInputSchema = z.object({
  clientId: z.string().min(1),
  birthdateEncrypted: z.string().max(2000).optional(),
  emergencyContactEncrypted: z.string().max(4000).optional(),
  medicalNotesEncrypted: z.string().max(8000).optional(),
  allergiesEncrypted: z.string().max(4000).optional(),
  skinConcernsEncrypted: z.string().max(4000).optional(),
  preferredContactMethod: z.string().max(80).optional(),
  internalNotes: z.string().max(4000).optional(),
});

export const clientPrivateNoteInputSchema = z.object({
  privateNote: z.string().trim().min(1).max(500),
}).strict();

export type ArtistInput = z.infer<typeof artistInputSchema>;
export type StudioInput = z.infer<typeof studioInputSchema>;
export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileInputSchema>;
export type ClientPrivateNoteInput = z.infer<typeof clientPrivateNoteInputSchema>;
