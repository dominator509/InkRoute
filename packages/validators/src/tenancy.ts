import { z } from "zod";
import { slugSchema } from "./common";
import { memberStatusSchema, roleSchema, tenantPlanSchema, tenantStatusSchema } from "./enums";

export const tenantInputSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema,
  plan: tenantPlanSchema.default("solo"),
  status: tenantStatusSchema.default("trial"),
  publicSiteName: z.string().max(160).optional(),
  primaryLocale: z.string().min(2).max(16).default("en-US"),
  defaultTimezone: z.string().min(3).max(80).default("America/Los_Angeles"),
});

export const tenantMemberInputSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
  customRoleId: z.string().min(1).optional(),
  status: memberStatusSchema.default("active"),
});

export const customRoleInputSchema = z.object({
  key: slugSchema,
  label: z.string().min(2).max(80),
  permissions: z.array(z.string().min(3).max(80)).min(1),
  description: z.string().max(500).optional(),
});

export type TenantInput = z.infer<typeof tenantInputSchema>;
export type TenantMemberInput = z.infer<typeof tenantMemberInputSchema>;
export type CustomRoleInput = z.infer<typeof customRoleInputSchema>;
