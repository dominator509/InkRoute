import { z } from "zod";
import { cuidLikeSchema } from "./common";

const sourceSchema = z.enum(["web", "dashboard", "mobile", "api", "worker", "webhook"]);
const runtimeSchema = z.enum(["browser", "server", "edge", "react-native", "node-worker", "provider-webhook"]);
const environmentSchema = z.enum(["development", "preview", "production", "test"]);

export const errorReportInputSchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  source: sourceSchema.default("web"),
  runtime: runtimeSchema.default("server"),
  environment: environmentSchema.default("production"),
  message: z.string().min(3).max(5000),
  stack: z.string().max(20_000).optional(),
  route: z.string().max(1024).optional(),
  release: z.string().max(240).optional(),
  userAgent: z.string().max(500).optional(),
  statusCode: z.number().int().nonnegative().max(599).optional(),
  handled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.record(z.string()).optional(),
});

export type ErrorReportInput = z.infer<typeof errorReportInputSchema>;

export const errorReportFilterSchema = z.object({
  tenantId: cuidLikeSchema.optional(),
  status: z.enum(["open", "triaged", "in_progress", "resolved", "ignored"]).optional(),
  source: sourceSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
