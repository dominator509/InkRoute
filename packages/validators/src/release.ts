import { z } from "zod";
import { cuidLikeSchema } from "./common";

const releaseChannelSchema = z.enum(["development", "preview", "staging", "production", "mobile-preview", "mobile-production"]);
const releaseChannelFromDbSchema = z.enum([
  "development",
  "preview",
  "production",
  "mobile_preview",
  "mobile_production",
]);
const releaseSurfaceSchema = z.enum(["web", "dashboard", "mobile", "database", "worker", "provider"]);
const featureFlagScopeSchema = z.enum(["global", "tenant", "user"]);
const deploymentEnvironmentSchema = z.enum(["local", "preview", "staging", "production"]);
const deploymentOperationSchema = z.enum(["readiness-review", "request-release-plan", "request-rollback-plan", "request-production-approval"]);

const normalizeReleaseChannel = (value: string) => {
  if (value === "mobile_preview") return "mobile-preview";
  if (value === "mobile_production") return "mobile-production";
  return value;
};

export const releaseCreateInputSchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  version: z.string().min(1).max(120).trim(),
  channel: z.preprocess((value) => normalizeReleaseChannel(String(value)), releaseChannelSchema),
  commitSha: z.string().min(4).max(80).trim().optional(),
  notes: z.string().min(1).max(6_000).trim().default("Manual release update from dashboard."),
  migrationVersion: z.string().max(120).trim().optional(),
  mobileRuntimeVersion: z.string().max(120).trim().optional(),
  surfaces: z.array(releaseSurfaceSchema).min(1).max(6).optional(),
  createdBy: z.string().max(120).trim().default("dashboard-user"),
});

export type ReleaseCreateInput = z.infer<typeof releaseCreateInputSchema>;

export const releaseTenantQuerySchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  tenantSlug: z.string().min(2).max(120).trim().optional(),
});

export const featureFlagPatchInputSchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  tenantSlug: z.string().min(2).max(120).trim().optional(),
  key: z.string().min(2).max(160).trim(),
  enabled: z.boolean(),
  description: z.string().max(240).trim().optional(),
  scope: featureFlagScopeSchema.optional().default("tenant"),
  rules: z.record(z.unknown()).optional(),
});

export type FeatureFlagPatchInput = z.infer<typeof featureFlagPatchInputSchema>;

export const deploymentReadinessMutationSchema = z.object({
  operation: deploymentOperationSchema.default("readiness-review"),
  targetEnvironment: deploymentEnvironmentSchema.default("production"),
  requestId: z.string().max(160).trim().optional(),
  reason: z.string().min(3).max(2000).trim().optional(),
  blockerIds: z.array(z.string().min(2).max(120).trim()).max(32).optional(),
});

export type DeploymentReadinessMutationInput = z.infer<typeof deploymentReadinessMutationSchema>;

export const dbReleaseChannelSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    if (value === "mobile-preview") return "mobile_preview";
    if (value === "mobile-production") return "mobile_production";
    return value;
  },
  releaseChannelFromDbSchema,
);
