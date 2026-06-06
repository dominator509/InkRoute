import { z } from "zod";
import { cuidLikeSchema, slugSchema } from "./common";
import { consentSignatureStatusSchema, formStatusSchema, intakeQuestionTypeSchema, medicalAcknowledgmentStatusSchema } from "./enums";

export const intakeFormInputSchema = z.object({
  key: slugSchema,
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  status: formStatusSchema.default("draft"),
  version: z.number().int().positive().default(1),
});

export const intakeQuestionInputSchema = z.object({
  formId: cuidLikeSchema,
  key: slugSchema,
  label: z.string().min(2).max(240),
  helpText: z.string().max(1000).optional(),
  type: intakeQuestionTypeSchema,
  isRequired: z.boolean().default(false),
  options: z.array(z.object({ label: z.string().min(1).max(120), value: z.string().min(1).max(120) })).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const intakeResponseInputSchema = z.object({
  formId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  clientId: cuidLikeSchema,
  answers: z.record(z.unknown()),
});

export const consentFormInputSchema = z.object({
  key: slugSchema,
  title: z.string().min(2).max(180),
  body: z.string().min(20).max(50_000),
  status: formStatusSchema.default("draft"),
  version: z.number().int().positive().default(1),
  requiresMedicalAcknowledgment: z.boolean().default(true),
});

export const consentSignatureInputSchema = z.object({
  consentFormId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  clientId: cuidLikeSchema,
  signatureFileAssetId: cuidLikeSchema.optional(),
  status: consentSignatureStatusSchema.default("pending"),
  signerName: z.string().min(2).max(160),
  signerEmail: z.string().email(),
  ipAddressHash: z.string().max(160).optional(),
  userAgent: z.string().max(500).optional(),
});

export const medicalSafetyAcknowledgmentInputSchema = z.object({
  clientId: cuidLikeSchema,
  bookingRequestId: cuidLikeSchema.optional(),
  consentSignatureId: cuidLikeSchema.optional(),
  status: medicalAcknowledgmentStatusSchema.default("pending"),
  acknowledgments: z.record(z.unknown()),
  flaggedReasons: z.array(z.string().min(2).max(200)).default([]),
});

export type IntakeFormInput = z.infer<typeof intakeFormInputSchema>;
export type IntakeQuestionInput = z.infer<typeof intakeQuestionInputSchema>;
export type IntakeResponseInput = z.infer<typeof intakeResponseInputSchema>;
export type ConsentFormInput = z.infer<typeof consentFormInputSchema>;
export type ConsentSignatureInput = z.infer<typeof consentSignatureInputSchema>;
export type MedicalSafetyAcknowledgmentInput = z.infer<typeof medicalSafetyAcknowledgmentInputSchema>;
