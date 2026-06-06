import { z } from "zod";
import { cuidLikeSchema, slugSchema } from "./common";
import { reviewStatusSchema, seoPageStatusSchema } from "./enums";

export const reviewInputSchema = z.object({
  artistId: cuidLikeSchema.optional(),
  clientId: cuidLikeSchema.optional(),
  bookingRequestId: cuidLikeSchema.optional(),
  status: reviewStatusSchema.default("submitted"),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(160).optional(),
  body: z.string().min(10).max(4000),
  publicDisplayName: z.string().max(120).optional(),
  source: z.string().max(80).default("manual"),
});

export const seoCityPageInputSchema = z.object({
  travelCityId: cuidLikeSchema.optional(),
  slug: slugSchema,
  city: z.string().min(2).max(120),
  region: z.string().min(2).max(120),
  country: z.string().min(2).max(120),
  title: z.string().min(10).max(70),
  metaDescription: z.string().min(50).max(160),
  canonicalPath: z.string().startsWith("/"),
  status: seoPageStatusSchema.default("draft"),
  heroCopy: z.string().max(2000).optional(),
  faq: z.array(z.object({ question: z.string().min(3).max(180), answer: z.string().min(3).max(800) })).optional(),
});

export const seoStylePageInputSchema = z.object({
  tattooStyleId: cuidLikeSchema.optional(),
  slug: slugSchema,
  styleName: z.string().min(2).max(120),
  title: z.string().min(10).max(70),
  metaDescription: z.string().min(50).max(160),
  canonicalPath: z.string().startsWith("/"),
  status: seoPageStatusSchema.default("draft"),
  bodyCopy: z.string().max(5000).optional(),
  faq: z.array(z.object({ question: z.string().min(3).max(180), answer: z.string().min(3).max(800) })).optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type SeoCityPageInput = z.infer<typeof seoCityPageInputSchema>;
export type SeoStylePageInput = z.infer<typeof seoStylePageInputSchema>;
