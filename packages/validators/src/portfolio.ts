import { z } from "zod";
import { cuidLikeSchema, isoDateTimeSchema, slugSchema } from "./common";
import { bodyPlacementSchema, fileAssetKindSchema, fileVisibilitySchema, freshnessLabelSchema, tattooStyleSchema } from "./enums";

export const tattooStyleInputSchema = z.object({
  slug: slugSchema,
  label: z.string().min(2).max(80),
  description: z.string().max(1200).optional(),
  isActive: z.boolean().default(true),
});

export const portfolioItemInputSchema = z.object({
  artistId: cuidLikeSchema,
  title: z.string().min(2).max(160),
  slug: slugSchema,
  caption: z.string().min(5).max(1200),
  styles: z.array(tattooStyleSchema).min(1),
  placement: bodyPlacementSchema,
  freshness: freshnessLabelSchema,
  bodySide: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  completedAt: isoDateTimeSchema.optional(),
  sessionCount: z.number().int().positive().max(20).optional(),
  isFeatured: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  altText: z.string().min(12).max(220),
  imageUrl: z.string().min(1),
});

export const portfolioImageInputSchema = z.object({
  portfolioItemId: cuidLikeSchema,
  fileAssetId: cuidLikeSchema.optional(),
  imageUrl: z.string().min(1),
  altText: z.string().min(12).max(220),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isPrimary: z.boolean().default(false),
});

export const fileAssetInputSchema = z.object({
  uploadedByUserId: cuidLikeSchema.optional(),
  clientId: cuidLikeSchema.optional(),
  kind: fileAssetKindSchema,
  visibility: fileVisibilitySchema.default("tenant_private"),
  bucket: z.string().min(2).max(160),
  objectKey: z.string().min(2).max(500),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(160),
  sizeBytes: z.number().int().positive().max(50_000_000),
  checksumSha256: z.string().length(64).optional(),
  publicUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TattooStyleInput = z.infer<typeof tattooStyleInputSchema>;
export type PortfolioItemInput = z.infer<typeof portfolioItemInputSchema>;
export type PortfolioImageInput = z.infer<typeof portfolioImageInputSchema>;
export type FileAssetInput = z.infer<typeof fileAssetInputSchema>;
