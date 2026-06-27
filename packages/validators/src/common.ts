import { z } from "zod";

export const cuidLikeSchema = z.string().min(1).max(128);
export const slugSchema = z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const isoDateTimeSchema = z.string().datetime();
export const currencySchema = z.string().length(3).transform((value) => value.toLowerCase());
export const moneyCentsSchema = z.number().int().nonnegative().max(5_000_000);
export const timezoneSchema = z.string().min(3).max(80);
export const optionalUrlSchema = z.string().url().optional();

export const dateRangeSchema = z.object({
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
}).refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

export const utmSchema = z.object({
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
});

export const publicReadQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const dashboardMetricsQuerySchema = z.object({
  tenantId: cuidLikeSchema.optional(),
}).strict();

export const dashboardTenantQuerySchema = z.object({
  tenantId: cuidLikeSchema.optional(),
}).strict();

export const dashboardListQuerySchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export type PublicReadQuery = z.infer<typeof publicReadQuerySchema>;
export type DashboardMetricsQuery = z.infer<typeof dashboardMetricsQuerySchema>;
export type DashboardTenantQuery = z.infer<typeof dashboardTenantQuerySchema>;
export type DashboardListQuery = z.infer<typeof dashboardListQuerySchema>;
