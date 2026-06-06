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
