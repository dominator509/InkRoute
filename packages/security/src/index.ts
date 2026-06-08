import type { Permission, Role } from "@inkroute/types";

export type SecurityStatus = "implemented" | "scaffolded" | "credential_gated" | "legal_review_required" | "deployment_gated" | "blocked";
export type DataSensitivity = "public" | "internal" | "pii" | "sensitive" | "medical" | "payment" | "secret";
export type RedactionMode = "none" | "mask" | "hash_required" | "omit" | "encrypt_required";
export type UploadAssetKind = "portfolio_public" | "reference_private" | "consent_signature" | "healed_follow_up" | "document_private";
export type PrivacyRequestType = "access" | "export" | "rectification" | "deletion" | "restriction";
export type PrivacyDataCategory =
  | "client_profile"
  | "medical_note"
  | "reference_file"
  | "consent_signature"
  | "message"
  | "payment_record"
  | "audit_log"
  | "error_report";
export type RetentionAction = "export" | "delete" | "anonymize" | "retain_legal_hold" | "restrict_processing";
export type SecurityControlArea =
  | "authentication"
  | "authorization"
  | "tenant_isolation"
  | "uploads"
  | "payments"
  | "notifications"
  | "observability"
  | "release_controls"
  | "privacy"
  | "legal";

export interface SensitiveFieldPolicy {
  field: string;
  sensitivity: DataSensitivity;
  redactionMode: RedactionMode;
  storageRequirement: string;
  logPolicy: string;
  gapIds: string[];
}

export interface SecurityControl {
  id: string;
  area: SecurityControlArea;
  label: string;
  status: SecurityStatus;
  blocksProduction: boolean;
  currentImplementation: string;
  nextAction: string;
  gapIds: string[];
}

export interface UploadValidationInput {
  kind: UploadAssetKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  declaredByAuthenticatedUser: boolean;
}

export interface UploadValidationResult {
  accepted: boolean;
  normalizedExtension: string;
  maxSizeBytes: number;
  storageVisibility: "public_derivative" | "tenant_private" | "client_private" | "system_private";
  reasons: string[];
  requiredProductionControls: string[];
}

export interface SignedUploadIntentInput extends UploadValidationInput {
  tenantId: string;
  subjectId: string;
  requestedByUserId?: string;
  bookingRequestId?: string;
  expiresInSeconds?: number;
}

export interface SignedUploadIntentPlan {
  accepted: boolean;
  status: "provider_gated" | "rejected";
  tenantId: string;
  subjectId: string;
  kind: UploadAssetKind;
  objectKey: string | null;
  storageVisibility: UploadValidationResult["storageVisibility"];
  expiresInSeconds: number;
  validation: UploadValidationResult;
  signedUploadUrlRequired: boolean;
  publicReadAllowed: boolean;
  requiredWrites: Array<"FileAsset" | "AuditLog" | "BookingReferenceImage">;
  requiredControls: string[];
}

export type MalwareScanVerdict = "not_run" | "clean" | "suspicious" | "malware";
export type UploadScanStatus = "approved" | "quarantined" | "rejected";

export interface UploadScanPipelineInput extends UploadValidationInput {
  fileSignatureHex: string;
  malwareVerdict: MalwareScanVerdict;
  exifMetadataPresent: boolean;
  normalizedDerivativeGenerated: boolean;
  scanProviderConfigured: boolean;
}

export interface UploadScanPipelinePlan {
  status: UploadScanStatus;
  validation: UploadValidationResult;
  detectedMimeType: string | null;
  signatureMatches: boolean;
  quarantineRequired: boolean;
  metadataStrippingRequired: boolean;
  publicDerivativeAllowed: boolean;
  scanStatusPersistence: {
    required: true;
    fields: readonly string[];
  };
  requiredControls: readonly string[];
  reasons: readonly string[];
}

export type StorageAccessOperation = "upload" | "download";
export type StorageAccessStatus = "signed_url_ready" | "rejected" | "revoked" | "expired" | "provider_gated";

export interface PrivateStorageAccessInput {
  kind: UploadAssetKind;
  operation: StorageAccessOperation;
  tenantId: string;
  subjectId: string;
  requestedByUserId?: string;
  objectKey?: string;
  storageVisibility: UploadValidationResult["storageVisibility"];
  expiresInSeconds: number;
  now: string;
  expiresAt?: string;
  revokedAt?: string;
  scanApproved: boolean;
  providerConfigured: boolean;
  publicDerivativeObjectKey?: string;
}

export interface PrivateStorageAccessPlan {
  status: StorageAccessStatus;
  operation: StorageAccessOperation;
  tenantId: string;
  subjectId: string;
  objectKey: string | null;
  bucketAcl: "private" | "public-read-derivatives-only";
  signedUrlRequired: boolean;
  publicReadAllowed: boolean;
  expiresInSeconds: number;
  requiredWrites: Array<"FileAsset" | "AuditLog" | "SignedUrlGrant">;
  requiredControls: readonly string[];
  reasons: readonly string[];
}

export interface RateLimitRule {
  id: string;
  routePattern: string;
  windowSeconds: number;
  maxRequests: number;
  keyStrategy: "ip" | "ip_tenant" | "user_tenant" | "provider_signature";
  status: SecurityStatus;
  gapIds: string[];
}

export interface RateLimitEvaluationInput {
  ruleId: string;
  observedRequests: number;
  windowSeconds: number;
}

export interface RateLimitEvaluationResult {
  allowed: boolean;
  remaining: number;
  status: "allow" | "throttle" | "rule_not_found";
  warning: string;
}

export type EncryptionReadinessStatus = "ready" | "not_configured" | "invalid_key" | "unsupported_environment";
export type EncryptionAttemptStatus = "stored" | "redacted";
export type EncryptionRotationState = "unconfigured" | "single_primary_only" | "single_secondary_only" | "dual_key_rotation_ready";

export interface EncryptionRuntimeContext {
  status: EncryptionReadinessStatus;
  keyVersion: string;
  ready: boolean;
  reason: string;
}

export interface EncryptionDecryptionProof {
  ok: boolean;
  reason?: string;
}

export interface EncryptionAttempt {
  status: EncryptionAttemptStatus;
  encryptedValue: string | null;
  keyVersion: string;
  reason?: string;
}

interface EncryptionEnvelope {
  alg: "AES-256-GCM";
  keyVersion: string;
  iv: string;
  data: string;
}

const ENCRYPTION_PREFIX = "ENC1:";

type LoadedEncryptionKey = {
  key: CryptoKey;
  keyId: string;
  source: "primary" | "secondary";
};

let cachedEncryptionKeys: LoadedEncryptionKey[] | null = null;
let encryptionCacheVersion = 1;

export type EncryptionPersistScope = "database" | "local-fallback";

export interface EncryptionPolicyInput {
  operation: string;
  scope: EncryptionPersistScope;
  requiredFields?: string[];
}

export interface EncryptionPolicyResult {
  operation: string;
  scope: EncryptionPersistScope;
  requiredFields: string[];
  status: "allow" | "warn" | "deny";
  canPersist: boolean;
  reason: string;
  readiness: EncryptionRuntimeContext;
  rotation: {
    configuredKeyIds: string[];
    activeKeyId: string | null;
    hasPrimary: boolean;
    hasSecondary: boolean;
    cacheVersion: number;
    rotationState?: EncryptionRotationState;
    rotationAction?: string;
  };
}

function normalizeBase64(input: string): string {
  return input.replace(/[\n\r\s]/g, "").replace(/-/g, "+").replace(/_/g, "/");
}

function decodeBase64ToBytes(input: string): Uint8Array | null {
  const base64 = normalizeBase64(input);
  if (!base64) return null;

  const remainder = base64.length % 4;
  const normalized = remainder === 0 ? base64 : remainder === 2 ? `${base64}==` : remainder === 3 ? `${base64}=` : "";
  if (!normalized) return null;

  try {
    if (typeof atob === "function") {
      const decoded = atob(normalized);
      const bytes = new Uint8Array(decoded.length);
      for (let index = 0; index < decoded.length; index += 1) {
        bytes[index] = decoded.charCodeAt(index);
      }
      return bytes;
    }

    if (typeof Buffer !== "undefined") {
      const decoded = Buffer.from(normalized, "base64");
      return new Uint8Array(decoded);
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeHexToBytes(input: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]+$/.test(input) || input.length % 2 !== 0) return null;
  const bytes = new Uint8Array(input.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    const chunk = input.slice(index * 2, index * 2 + 2);
    const value = Number.parseInt(chunk, 16);
    if (Number.isNaN(value)) return null;
    bytes[index] = value;
  }
  return bytes;
}

function normalizeKeyMaterial(raw: string): Uint8Array | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) return normalizeHexToBytes(trimmed);
  if (trimmed.length >= 32) {
    const base64Bytes = decodeBase64ToBytes(trimmed);
    if (base64Bytes && base64Bytes.length >= 16) {
      return base64Bytes.slice(0, 32);
    }
  }

  const encoder = new TextEncoder();
  return encoder.encode(trimmed);
}

async function ensureKeyLength(rawKey: string): Promise<Uint8Array | null> {
  const decoded = normalizeKeyMaterial(rawKey);
  if (!decoded) return null;
  if (decoded.length === 32) return decoded;
  if (decoded.length > 32) return decoded.slice(0, 32);

  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    const normalized = new Uint8Array(32);
    normalized.set(decoded);
    return normalized;
  }

  try {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", decoded as BufferSource);
    return new Uint8Array(digest);
  } catch {
    const normalized = new Uint8Array(32);
    normalized.set(decoded);
    return normalized;
  }
}

function isCryptoUnavailable(): boolean {
  return typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle;
}

function getConfiguredPrimaryKey(): string {
  return process.env.SECURITY_ENCRYPTION_PRIMARY_KEY || process.env.SECURITY_ENCRYPTION_SECONDARY_KEY || "";
}

function getConfiguredEncryptionKeyEntries() {
  const primary = process.env.SECURITY_ENCRYPTION_PRIMARY_KEY?.trim();
  const secondary = process.env.SECURITY_ENCRYPTION_SECONDARY_KEY?.trim();
  const primaryKeyId = process.env.SECURITY_ENCRYPTION_KEY_ID?.trim() || "primary";
  const secondaryKeyId = process.env.SECURITY_ENCRYPTION_SECONDARY_KEY_ID?.trim() || "secondary";

  const entries: { keyId: string; raw: string; source: LoadedEncryptionKey["source"] }[] = [];
  if (primary) {
    entries.push({ keyId: primaryKeyId, raw: primary, source: "primary" });
  }
  if (secondary) {
    const resolvedSecondaryKeyId = secondaryKeyId === primaryKeyId ? `${secondaryKeyId}-secondary` : secondaryKeyId;
    entries.push({ keyId: resolvedSecondaryKeyId, raw: secondary, source: "secondary" });
  }
  return entries;
}

async function loadEncryptionKeys(): Promise<LoadedEncryptionKey[] | null> {
  if (cachedEncryptionKeys) return cachedEncryptionKeys;
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) return null;

  const configuredKeys = getConfiguredEncryptionKeyEntries();
  if (configuredKeys.length === 0) return null;

  const importedKeys: LoadedEncryptionKey[] = [];
  for (const candidate of configuredKeys) {
    const keyBytes = await ensureKeyLength(candidate.raw);
    if (!keyBytes) continue;

    try {
      const imported = await globalThis.crypto.subtle.importKey(
        "raw",
        keyBytes as BufferSource,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      importedKeys.push({ key: imported, keyId: candidate.keyId, source: candidate.source });
    } catch {
      continue;
    }
  }

  if (!importedKeys.length) {
    return null;
  }

  cachedEncryptionKeys = importedKeys;
  return importedKeys;
}

async function loadEncryptionKey(): Promise<LoadedEncryptionKey | null> {
  const keys = await loadEncryptionKeys();
  return keys?.[0] ?? null;
}

function pickDecryptionOrder(keys: LoadedEncryptionKey[], keyVersion?: string) {
  if (!keyVersion) return keys;
  const preferred = keys.find((entry) => entry.keyId === keyVersion);
  if (!preferred) return keys;
  return [preferred, ...keys.filter((entry) => entry.keyId !== keyVersion)];
}

function isKeyConfigured(): boolean {
  return getConfiguredEncryptionKeyEntries().length > 0;
}

export async function inspectConfiguredEncryptionKeys() {
  const configured = getConfiguredEncryptionKeyEntries();
  const imported = await loadEncryptionKeys();
  return {
    hasPrimary: configured.some((entry) => entry.source === "primary"),
    hasSecondary: configured.some((entry) => entry.source === "secondary"),
    activeKeyId: imported?.[0]?.keyId ?? null,
    ready: Boolean(imported?.length),
    cacheVersion: encryptionCacheVersion,
    totalConfigured: configured.length,
    configuredIds: configured.map((entry) => entry.keyId),
  };
}

function buildEncryptionRotationMetadata(
  keyMeta: Awaited<ReturnType<typeof inspectConfiguredEncryptionKeys>>,
  readiness: EncryptionRuntimeContext,
) {
  if (!keyMeta.ready) {
    return {
      rotationState: "unconfigured" as EncryptionRotationState,
      rotationAction: readiness.reason,
    };
  }
  if (keyMeta.hasPrimary && keyMeta.hasSecondary) {
    return {
      rotationState: "dual_key_rotation_ready" as EncryptionRotationState,
      rotationAction: "Dual-key policy is configured; rotate secondary into primary on cadence and retire old key IDs only after cutover.",
    };
  }
  if (keyMeta.hasPrimary) {
    return {
      rotationState: "single_primary_only" as EncryptionRotationState,
      rotationAction: "Add SECURITY_ENCRYPTION_SECONDARY_KEY for explicit rotation and key retirement.",
    };
  }
  return {
    rotationState: "single_secondary_only" as EncryptionRotationState,
    rotationAction: "Primary key is missing; secondary key is active and should be paired with a documented primary rotation path.",
  };
}

export function getEncryptionCacheVersion(): number {
  return encryptionCacheVersion;
}

export function invalidateEncryptionCache(): number {
  cachedEncryptionKeys = null;
  encryptionCacheVersion += 1;
  return encryptionCacheVersion;
}

export async function evaluateEncryptionPolicy(input: EncryptionPolicyInput): Promise<EncryptionPolicyResult> {
  const requiredFields = (input.requiredFields ?? []).filter(Boolean);
  const readiness = await getEncryptionReadiness();
  const keyMeta = await inspectConfiguredEncryptionKeys();
  const requiresEncryption = requiredFields.length > 0;
  const rotationMetadata = buildEncryptionRotationMetadata(keyMeta, readiness);

  if (requiresEncryption && input.scope === "database" && !readiness.ready) {
    return {
      operation: input.operation,
      scope: input.scope,
      requiredFields,
      status: "deny",
      canPersist: false,
      reason: "Encryption readiness is required for sensitive DB fields.",
      readiness,
      rotation: {
        configuredKeyIds: keyMeta.configuredIds,
        activeKeyId: keyMeta.activeKeyId,
        hasPrimary: keyMeta.hasPrimary,
        hasSecondary: keyMeta.hasSecondary,
        cacheVersion: keyMeta.cacheVersion,
        rotationState: rotationMetadata.rotationState,
        rotationAction: rotationMetadata.rotationAction,
      },
    };
  }

  if (!readiness.ready && requiresEncryption) {
    return {
      operation: input.operation,
      scope: input.scope,
      requiredFields,
      status: "warn",
      canPersist: true,
      reason: "Sensitive fields are not encrypted on local fallback without a ready key.",
      readiness,
      rotation: {
        configuredKeyIds: keyMeta.configuredIds,
        activeKeyId: keyMeta.activeKeyId,
        hasPrimary: keyMeta.hasPrimary,
        hasSecondary: keyMeta.hasSecondary,
        cacheVersion: keyMeta.cacheVersion,
        rotationState: rotationMetadata.rotationState,
        rotationAction: rotationMetadata.rotationAction,
      },
    };
  }

  return {
    operation: input.operation,
    scope: input.scope,
    requiredFields,
    status: readiness.ready ? "allow" : "warn",
    canPersist: true,
    reason: readiness.ready ? "Encryption is ready for sensitive persistence." : "Encryption is optional for this fallback scope.",
    readiness,
    rotation: {
      configuredKeyIds: keyMeta.configuredIds,
      activeKeyId: keyMeta.activeKeyId,
      hasPrimary: keyMeta.hasPrimary,
      hasSecondary: keyMeta.hasSecondary,
      cacheVersion: keyMeta.cacheVersion,
      rotationState: rotationMetadata.rotationState,
      rotationAction: rotationMetadata.rotationAction,
    },
  };
}

function toBase64(bytes: Uint8Array): string {
  let value = "";
  for (let index = 0; index < bytes.length; index += 1) {
    value += String.fromCharCode(bytes[index] ?? 0);
  }
  if (typeof btoa === "function") return btoa(value);
  if (typeof Buffer === "undefined") return "";
  return Buffer.from(value, "binary").toString("base64");
}

function fromBase64(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const decoded = atob(base64);
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index += 1) {
      bytes[index] = decoded.charCodeAt(index);
    }
    return bytes;
  }

  if (typeof Buffer !== "undefined") {
    const decoded = Buffer.from(base64, "base64");
    return new Uint8Array(decoded);
  }
  return new Uint8Array(0);
}

export async function getEncryptionReadiness(): Promise<EncryptionRuntimeContext> {
  const keyId = process.env.SECURITY_ENCRYPTION_KEY_ID ?? "primary";
  const config = isKeyConfigured();
  if (!config) {
    return {
      status: "not_configured",
      keyVersion: keyId,
      ready: false,
      reason: "No SECURITY_ENCRYPTION_* key is configured.",
    };
  }

  if (isCryptoUnavailable()) {
    return {
      status: "unsupported_environment",
      keyVersion: keyId,
      ready: false,
      reason: "Web Crypto API is not available in this execution environment.",
    };
  }

  const loaded = await loadEncryptionKey();
  if (!loaded) {
    return {
      status: "invalid_key",
      keyVersion: keyId,
      ready: false,
      reason: "Encryption key material is present but could not be imported.",
    };
  }

  return {
    status: "ready",
    keyVersion: loaded.keyId,
    ready: true,
    reason: loaded.source === "secondary" ? "Primary key unavailable; secondary key is active." : "Encryption key is configured.",
  };
}

export async function encryptTextField(value?: string | null): Promise<EncryptionAttempt> {
  if (!value) {
    return {
      status: "redacted",
      encryptedValue: null,
      keyVersion: process.env.SECURITY_ENCRYPTION_KEY_ID ?? "primary",
      reason: "No input value provided.",
    };
  }

  const readiness = await getEncryptionReadiness();
  if (!readiness.ready) {
    return {
      status: "redacted",
      encryptedValue: null,
      keyVersion: readiness.keyVersion,
      reason: readiness.reason,
    };
  }

  const keyMaterial = await loadEncryptionKey();
  if (!keyMaterial) {
    return {
      status: "redacted",
      encryptedValue: null,
      keyVersion: readiness.keyVersion,
      reason: "Encryption key material was not available at runtime.",
    };
  }

  try {
    const iv = new Uint8Array(12);
    globalThis.crypto.getRandomValues(iv);
    const encoded = new TextEncoder().encode(value);
    const encrypted = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, keyMaterial.key, encoded as BufferSource));
    const envelope: EncryptionEnvelope = {
      alg: "AES-256-GCM",
      keyVersion: keyMaterial.keyId,
      iv: toBase64(iv),
      data: toBase64(encrypted),
    };
    return {
      status: "stored",
      encryptedValue: `${ENCRYPTION_PREFIX}${JSON.stringify(envelope)}`,
      keyVersion: keyMaterial.keyId,
    };
  } catch {
    return {
      status: "redacted",
      encryptedValue: null,
      keyVersion: keyMaterial.keyId,
      reason: "Failed to encrypt at runtime.",
    };
  }
}

export async function decryptTextField(value?: string | null): Promise<string | null> {
  if (!value || !value.startsWith(ENCRYPTION_PREFIX)) return null;
  const payload = value.slice(ENCRYPTION_PREFIX.length);
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) return null;
  const keyMaterials = await loadEncryptionKeys();
  if (!keyMaterials || keyMaterials.length === 0) return null;
  try {
    const envelope = JSON.parse(payload) as EncryptionEnvelope;
    if (envelope.alg !== "AES-256-GCM") return null;
    const iv = fromBase64(envelope.iv) as unknown as BufferSource;
    const data = fromBase64(envelope.data) as unknown as BufferSource;

    const orderedKeys = pickDecryptionOrder(keyMaterials, envelope.keyVersion);
    for (const keyMaterial of orderedKeys) {
      try {
        const plain = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyMaterial.key, data);
        return new TextDecoder().decode(plain);
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyEncryptionRoundTrip(plainText: string | undefined, encryptedValue: string | null): Promise<EncryptionDecryptionProof> {
  if (!plainText) {
    return { ok: true };
  }

  if (!encryptedValue) {
    return { ok: false, reason: "No encrypted value was supplied for verification." };
  }

  const decrypted = await decryptTextField(encryptedValue);
  if (decrypted === null) {
    return { ok: false, reason: "Cannot decrypt with currently configured key set." };
  }
  if (decrypted !== plainText) {
    return { ok: false, reason: "Decrypted value mismatch indicates non-deterministic or truncated encryption storage." };
  }

  return { ok: true };
}

export async function encryptProviderTokenField(value?: string | null): Promise<EncryptionAttempt> {
  return encryptTextField(value);
}

export async function decryptProviderTokenField(value?: string | null): Promise<string | null> {
  return decryptTextField(value);
}

export async function evaluateProviderTokenEncryptionPolicy(scope: EncryptionPersistScope): Promise<EncryptionPolicyResult> {
  return evaluateEncryptionPolicy({
    operation: "provider-token-storage",
    scope,
    requiredFields: ["encryptedAccessToken", "encryptedRefreshToken"],
  });
}

export interface CsrfControlPlan {
  id: string;
  routeFamily: string;
  appliesWhen: string;
  tokenPattern: "framework_action" | "signed_double_submit" | "provider_signature" | "not_required_public_read";
  sameSiteRequirement: "lax" | "strict" | "none_with_secure" | "not_cookie_based";
  status: SecurityStatus;
  gapIds: string[];
}

export interface TenantIsolationFixture {
  id: string;
  description: string;
  actorTenantId: string;
  targetTenantId: string;
  role: Role;
  permission: Permission;
  expectedDecision: "allow" | "deny";
  reason: string;
}

export interface PrivacyRequestDraft {
  id: string;
  type: PrivacyRequestType;
  status: SecurityStatus;
  identityVerificationRequired: boolean;
  affectedAreas: string[];
  deadlinePolicy: string;
  productionBlockers: string[];
}

export interface RetentionPolicyRule {
  category: PrivacyDataCategory;
  models: string[];
  sensitivity: DataSensitivity;
  defaultRetentionDays: number | "indefinite";
  exportable: boolean;
  deletable: boolean;
  anonymizeOnDeletion: boolean;
  legalHoldRequired: boolean;
  auditRequired: boolean;
  rationale: string;
}

export interface PrivacyLifecyclePlanInput {
  requestType: PrivacyRequestType;
  categories: PrivacyDataCategory[];
  requesterVerified: boolean;
  legalReviewApproved?: boolean;
}

export interface PrivacyLifecycleStep {
  category: PrivacyDataCategory;
  models: string[];
  action: RetentionAction;
  blocked: boolean;
  reason: string;
  auditRequired: boolean;
}

export interface PrivacyLifecyclePlan {
  status: "ready" | "blocked_identity" | "blocked_legal_review" | "unsupported_category";
  canExecute: boolean;
  requestType: PrivacyRequestType;
  steps: PrivacyLifecycleStep[];
  requiredAudits: string[];
  productionBlockers: string[];
}

export interface PrivacyCaseWorkflowInput {
  requestType: PrivacyRequestType;
  categories: PrivacyDataCategory[];
  requesterVerified: boolean;
  tenantMembershipVerified: boolean;
  caseStoreConfigured: boolean;
  exportWorkerConfigured: boolean;
  deletionWorkerConfigured: boolean;
  notificationProviderConfigured: boolean;
  auditLogConfigured: boolean;
  legalReviewApproved?: boolean;
}

export interface PrivacyCaseWorkflowPlan {
  status: "ready" | "blocked";
  caseStatus: "intake_received" | "awaiting_identity_verification" | "awaiting_worker_configuration" | "ready_for_execution";
  lifecycle: PrivacyLifecyclePlan;
  blockers: readonly string[];
  requiredCaseFields: readonly string[];
  requiredWorkers: readonly string[];
  notificationSteps: readonly string[];
  auditEvents: readonly string[];
}

export type RetentionEnforcementAction = RetentionAction | "retain_until_due";

export interface RetentionCandidateRecord {
  id: string;
  category: PrivacyDataCategory;
  ageDays: number;
  legalHoldActive?: boolean;
}

export interface RetentionEnforcementDryRunInput {
  records: readonly RetentionCandidateRecord[];
  legalReviewApproved: boolean;
  databaseWorkerConfigured: boolean;
  storageWorkerConfigured: boolean;
  auditLogConfigured: boolean;
  backupPolicyDocumented: boolean;
  restorePolicyDocumented: boolean;
}

export interface RetentionEnforcementStep {
  recordId: string;
  category: PrivacyDataCategory;
  models: readonly string[];
  action: RetentionEnforcementAction;
  due: boolean;
  blocked: boolean;
  auditRequired: boolean;
  reason: string;
}

export interface RetentionEnforcementDryRun {
  status: "ready" | "blocked";
  canExecute: boolean;
  steps: readonly RetentionEnforcementStep[];
  blockers: readonly string[];
  requiredWorkers: readonly string[];
  requiredAuditEvents: readonly string[];
  backupRestorePolicy: {
    backupPolicyDocumented: boolean;
    restorePolicyDocumented: boolean;
    implication: string;
  };
}

export interface LegalDocumentPlaceholder {
  slug: string;
  title: string;
  status: SecurityStatus;
  audience: "client" | "artist" | "admin" | "all";
  summary: string;
  mustBeReviewedByAttorney: boolean;
  blockedProductionActions: string[];
}

export type LegalReviewTopic =
  | "privacy_policy"
  | "terms_of_service"
  | "tattoo_consent"
  | "medical_safety_acknowledgment"
  | "sms_opt_in_stop_help"
  | "aftercare"
  | "deposits_no_shows_refunds"
  | "taxes"
  | "liability"
  | "saas_terms"
  | "jurisdiction_studio_policy";

export interface LegalReviewApprovalRecord {
  topic: LegalReviewTopic;
  approved: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  documentVersion?: string;
}

export interface LegalReviewPacketInput {
  approvals: readonly LegalReviewApprovalRecord[];
  jurisdiction: string;
  studioPolicyVersion?: string;
  consentVersion?: string;
  acceptanceAuditConfigured: boolean;
  noindexProtectionEnabled: boolean;
}

export interface LegalReviewPacketPlan {
  status: "approved" | "blocked";
  jurisdiction: string;
  requiredTopics: readonly LegalReviewTopic[];
  missingTopics: readonly LegalReviewTopic[];
  approvedVersions: Record<string, string>;
  productionBlockedActions: readonly string[];
  pageProtections: {
    noindexRequired: boolean;
    placeholdersMustRemain: boolean;
  };
  acceptanceAudit: {
    configured: boolean;
    requiredFields: readonly string[];
    consentVersion?: string;
  };
  reviewChecklist: readonly string[];
}

export interface SecurityHeaderDraft {
  name: string;
  value: string;
  status: SecurityStatus;
  rationale: string;
}

export const sensitiveFieldPolicies: SensitiveFieldPolicy[] = [
  {
    field: "email",
    sensitivity: "pii",
    redactionMode: "mask",
    storageRequirement: "Store tenant-scoped; never expose across tenant boundaries.",
    logPolicy: "Mask local-part and domain in logs and error reports.",
    gapIds: ["GAP-095", "GAP-098"],
  },
  {
    field: "phone",
    sensitivity: "pii",
    redactionMode: "mask",
    storageRequirement: "Store only when needed for consented SMS or client contact.",
    logPolicy: "Mask all but final two digits; avoid raw SMS destinations in delivery logs.",
    gapIds: ["GAP-062", "GAP-067", "GAP-095"],
  },
  {
    field: "medicalNotesEncrypted",
    sensitivity: "medical",
    redactionMode: "encrypt_required",
    storageRequirement: "Application-level encryption and key rotation are required before persistence.",
    logPolicy: "Never log medical notes, safety details, allergies, skin concerns, or raw intake answers.",
    gapIds: ["GAP-021", "GAP-095", "GAP-100"],
  },
  {
    field: "consentSignature",
    sensitivity: "sensitive",
    redactionMode: "encrypt_required",
    storageRequirement: "Store signatures as private file assets with audit trail and revocation/expiry state.",
    logPolicy: "Never log private signature URLs or binary metadata beyond asset id and status.",
    gapIds: ["GAP-013", "GAP-097", "GAP-100"],
  },
  {
    field: "referenceImageUrl",
    sensitivity: "sensitive",
    redactionMode: "omit",
    storageRequirement: "Private signed object storage only; portfolio derivatives are separate public assets.",
    logPolicy: "Do not log signed URLs, storage keys, or image metadata beyond redacted asset references.",
    gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
  },
  {
    field: "stripePaymentIntentId",
    sensitivity: "payment",
    redactionMode: "mask",
    storageRequirement: "Store provider IDs and audit status only; never store card data.",
    logPolicy: "Mask provider identifiers and never log raw webhook payloads until signature verification is complete.",
    gapIds: ["GAP-049", "GAP-050", "GAP-051", "GAP-052"],
  },
  {
    field: "encryptedRefreshToken",
    sensitivity: "secret",
    redactionMode: "encrypt_required",
    storageRequirement: "Encrypt provider refresh tokens with managed keys and rotation plan.",
    logPolicy: "Never log tokens, OAuth codes, Authorization headers, cookies, or provider signatures.",
    gapIds: ["GAP-021", "GAP-057", "GAP-095", "GAP-101"],
  },
];

export const phase13SecurityControls: SecurityControl[] = [
  {
    id: "SEC-AUTH-001",
    area: "authentication",
    label: "Dashboard and mobile authenticated sessions",
    status: "blocked",
    blocksProduction: true,
    currentImplementation: "Static demo owner context only; no real session provider is wired.",
    nextAction: "Implement Auth.js/Supabase/Auth0-style session provider, secure cookies, mobile token exchange, and logout/revocation.",
    gapIds: ["GAP-003", "GAP-036", "GAP-042", "GAP-095"],
  },
  {
    id: "SEC-AUTHZ-001",
    area: "authorization",
    label: "Tenant-scoped RBAC middleware",
    status: "scaffolded",
    blocksProduction: true,
    currentImplementation: "RBAC permission matrix exists; app route guards and data loader enforcement are not wired.",
    nextAction: "Create shared server guard for tenant membership, role permissions, field-level access, and audit outcomes.",
    gapIds: ["GAP-003", "GAP-022", "GAP-036", "GAP-095"],
  },
  {
    id: "SEC-UPLOAD-001",
    area: "uploads",
    label: "Secure private upload pipeline",
    status: "scaffolded",
    blocksProduction: true,
    currentImplementation: "Upload validation policy is defined, but signed uploads, scanning, private buckets, and derivative pipeline are not live.",
    nextAction: "Wire S3/Supabase signed uploads, MIME/signature checks, metadata stripping, malware scanning, private ACLs, and audit logs.",
    gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
  },
  {
    id: "SEC-PRIVACY-001",
    area: "privacy",
    label: "Privacy request and retention workflow",
    status: "scaffolded",
    blocksProduction: true,
    currentImplementation: "Privacy request drafts and placeholder policy pages exist only as non-binding demo content.",
    nextAction: "Implement verified identity workflow, export/delete jobs, retention policies, audit logs, and attorney-reviewed privacy language.",
    gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
  },
  {
    id: "SEC-LEGAL-001",
    area: "legal",
    label: "Attorney-reviewed consent, medical, and policy language",
    status: "legal_review_required",
    blocksProduction: true,
    currentImplementation: "Placeholder legal documents exist for planning only and are not legal advice.",
    nextAction: "Send consent, medical acknowledgment, deposit/no-show, privacy, terms, SMS, and aftercare text to qualified counsel.",
    gapIds: ["GAP-013", "GAP-053", "GAP-100"],
  },
  {
    id: "SEC-RATE-001",
    area: "tenant_isolation",
    label: "Public abuse controls and rate limiting",
    status: "scaffolded",
    blocksProduction: true,
    currentImplementation: "Static rate-limit policies exist, but no Redis/Upstash/edge limiter is connected.",
    nextAction: "Apply route-level rate limits to booking, contact, upload, error report, message, and privacy request endpoints.",
    gapIds: ["GAP-031", "GAP-061", "GAP-079", "GAP-095", "GAP-101"],
  },
];

export const uploadPolicies: Record<UploadAssetKind, { allowedExtensions: string[]; allowedMimeTypes: string[]; maxSizeBytes: number; visibility: UploadValidationResult["storageVisibility"] }> = {
  portfolio_public: {
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 12 * 1024 * 1024,
    visibility: "public_derivative",
  },
  reference_private: {
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "heic"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    maxSizeBytes: 15 * 1024 * 1024,
    visibility: "client_private",
  },
  consent_signature: {
    allowedExtensions: ["png", "jpg", "jpeg", "webp"],
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024,
    visibility: "system_private",
  },
  healed_follow_up: {
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "heic"],
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    maxSizeBytes: 15 * 1024 * 1024,
    visibility: "client_private",
  },
  document_private: {
    allowedExtensions: ["pdf"],
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 8 * 1024 * 1024,
    visibility: "tenant_private",
  },
};

export const rateLimitRules: RateLimitRule[] = [
  { id: "public-booking-submit", routePattern: "/api/public/:tenantSlug/booking-requests", windowSeconds: 3600, maxRequests: 8, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-032", "GAP-095"] },
  { id: "public-upload-intent", routePattern: "/api/public/:tenantSlug/secure-upload-intents", windowSeconds: 3600, maxRequests: 20, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-096", "GAP-097"] },
  { id: "public-message", routePattern: "/api/public/:tenantSlug/messages", windowSeconds: 3600, maxRequests: 10, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-064", "GAP-068"] },
  { id: "fallback-error-report", routePattern: "/api/public/:tenantSlug/error-reports", windowSeconds: 900, maxRequests: 20, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-081", "GAP-101"] },
  { id: "dashboard-mutation", routePattern: "/api/**", windowSeconds: 60, maxRequests: 120, keyStrategy: "user_tenant", status: "scaffolded", gapIds: ["GAP-036", "GAP-088", "GAP-095"] },
];

export const csrfControlPlans: CsrfControlPlan[] = [
  {
    id: "csrf-dashboard-actions",
    routeFamily: "Dashboard cookie-authenticated mutations",
    appliesWhen: "POST/PATCH/DELETE routes use browser cookies or server actions.",
    tokenPattern: "framework_action",
    sameSiteRequirement: "lax",
    status: "scaffolded",
    gapIds: ["GAP-095", "GAP-102"],
  },
  {
    id: "csrf-public-forms",
    routeFamily: "Public booking/contact/privacy forms",
    appliesWhen: "Public forms become persistent and set client cookies or challenge state.",
    tokenPattern: "signed_double_submit",
    sameSiteRequirement: "lax",
    status: "scaffolded",
    gapIds: ["GAP-031", "GAP-095", "GAP-101"],
  },
  {
    id: "csrf-provider-webhooks",
    routeFamily: "Stripe/Sentry/email/SMS provider callbacks",
    appliesWhen: "Provider callbacks are received server-to-server.",
    tokenPattern: "provider_signature",
    sameSiteRequirement: "not_cookie_based",
    status: "credential_gated",
    gapIds: ["GAP-050", "GAP-066", "GAP-082"],
  },
];

export const legalDocumentPlaceholders: LegalDocumentPlaceholder[] = [
  {
    slug: "privacy",
    title: "Privacy Policy Placeholder",
    status: "legal_review_required",
    audience: "all",
    summary: "Explains planned handling for booking requests, client profiles, reference images, consent records, payments, messages, notifications, analytics, and error reports.",
    mustBeReviewedByAttorney: true,
    blockedProductionActions: ["Persisting real client PII", "Sending marketing SMS/email", "Accepting consent signatures", "Publishing privacy policy as final"],
  },
  {
    slug: "terms",
    title: "Terms of Service Placeholder",
    status: "legal_review_required",
    audience: "all",
    summary: "Defines SaaS/client booking boundaries, account use, deposits, cancellation rules, intellectual-property expectations, and liability limits once reviewed.",
    mustBeReviewedByAttorney: true,
    blockedProductionActions: ["Charging deposits", "Opening SaaS signups", "Using final no-show language", "Launching production booking"],
  },
  {
    slug: "consent-medical-disclaimer",
    title: "Consent and Medical Disclaimer Placeholder",
    status: "legal_review_required",
    audience: "client",
    summary: "Clarifies that tattoo consent, medical/safety acknowledgments, aftercare, and artist policies must be jurisdiction-specific and attorney-reviewed.",
    mustBeReviewedByAttorney: true,
    blockedProductionActions: ["Collecting consent signatures", "Automating medical-adjacent intake", "Automating aftercare as final advice"],
  },
  {
    slug: "sms-consent",
    title: "SMS Consent Placeholder",
    status: "legal_review_required",
    audience: "client",
    summary: "Documents opt-in, STOP/HELP, quiet hours, transactional versus marketing routing, and delivery-log retention requirements.",
    mustBeReviewedByAttorney: true,
    blockedProductionActions: ["Sending SMS", "Enrolling city waitlists", "Sending flash-drop campaigns"],
  },
];

export const requiredLegalReviewTopics: readonly LegalReviewTopic[] = [
  "privacy_policy",
  "terms_of_service",
  "tattoo_consent",
  "medical_safety_acknowledgment",
  "sms_opt_in_stop_help",
  "aftercare",
  "deposits_no_shows_refunds",
  "taxes",
  "liability",
  "saas_terms",
  "jurisdiction_studio_policy",
];

export function buildLegalReviewPacketPlan(input: LegalReviewPacketInput): LegalReviewPacketPlan {
  const approvalsByTopic = new Map(input.approvals.map((approval) => [approval.topic, approval]));
  const missingTopics = requiredLegalReviewTopics.filter((topic) => {
    const approval = approvalsByTopic.get(topic);
    return !approval?.approved || !approval.reviewedBy?.trim() || !approval.reviewedAt?.trim() || !approval.documentVersion?.trim();
  });
  const approvedVersions = Object.fromEntries(
    input.approvals
      .filter((approval) => approval.approved && approval.documentVersion)
      .map((approval) => [approval.topic, approval.documentVersion as string]),
  );
  const blockers: string[] = [];
  if (missingTopics.length > 0) blockers.push("Attorney approval is missing for one or more required legal topics.");
  if (!input.studioPolicyVersion?.trim()) blockers.push("Jurisdiction-specific studio policy version is required.");
  if (!input.consentVersion?.trim()) blockers.push("Versioned consent document is required before collecting consent signatures.");
  if (!input.acceptanceAuditConfigured) blockers.push("Consent/terms/privacy acceptance audit tracking is not configured.");

  return {
    status: blockers.length === 0 ? "approved" : "blocked",
    jurisdiction: input.jurisdiction,
    requiredTopics: requiredLegalReviewTopics,
    missingTopics,
    approvedVersions,
    productionBlockedActions:
      blockers.length === 0
        ? []
        : [
            "Remove noindex protections from legal pages",
            "Collect consent signatures",
            "Send SMS or marketing messages",
            "Charge deposits or enforce no-show/refund policies",
            "Launch SaaS signups or production booking flows",
          ],
    pageProtections: {
      noindexRequired: blockers.length > 0,
      placeholdersMustRemain: blockers.length > 0 || input.noindexProtectionEnabled,
    },
    acceptanceAudit: {
      configured: input.acceptanceAuditConfigured,
      requiredFields: ["tenantId", "clientId", "documentSlug", "documentVersion", "acceptedAt", "ipHash", "userAgentHash", "source"],
      ...(input.consentVersion ? { consentVersion: input.consentVersion } : {}),
    },
    reviewChecklist: [
      "Privacy policy covers live data flows, vendors, retention, exports/deletion, and jurisdiction-specific rights.",
      "Terms cover SaaS usage, artist/studio responsibilities, deposits, no-shows, refunds, taxes, liability, and disputes.",
      "Consent and medical/safety language is jurisdiction-specific and does not overstate medical advice.",
      "SMS language includes opt-in, STOP, HELP, quiet hours, marketing/transactional boundaries, and retention.",
      "Noindex protections stay enabled until all required topics are approved and versioned acceptance/audit tracking is live.",
    ],
  };
}

export const retentionPolicyRules: RetentionPolicyRule[] = [
  {
    category: "client_profile",
    models: ["Client", "IntakeResponse"],
    sensitivity: "pii",
    defaultRetentionDays: 2555,
    exportable: true,
    deletable: true,
    anonymizeOnDeletion: true,
    legalHoldRequired: false,
    auditRequired: true,
    rationale: "Client contact and intake details are exportable and can be anonymized/deleted when no legal hold applies.",
  },
  {
    category: "medical_note",
    models: ["BookingRequest.medicalNotesEncrypted", "IntakeResponse.medicalAnswers"],
    sensitivity: "medical",
    defaultRetentionDays: 2555,
    exportable: true,
    deletable: true,
    anonymizeOnDeletion: true,
    legalHoldRequired: false,
    auditRequired: true,
    rationale: "Medical/safety notes require encryption, export redaction review, and deletion/anonymization support.",
  },
  {
    category: "reference_file",
    models: ["FileAsset", "BookingReferenceImage"],
    sensitivity: "sensitive",
    defaultRetentionDays: 1095,
    exportable: true,
    deletable: true,
    anonymizeOnDeletion: false,
    legalHoldRequired: false,
    auditRequired: true,
    rationale: "Private reference files should be removable from object storage while preserving an audit tombstone.",
  },
  {
    category: "consent_signature",
    models: ["ConsentSignature", "ConsentFormVersion"],
    sensitivity: "sensitive",
    defaultRetentionDays: "indefinite",
    exportable: true,
    deletable: false,
    anonymizeOnDeletion: false,
    legalHoldRequired: true,
    auditRequired: true,
    rationale: "Consent records may need long-term legal retention and should not be hard-deleted without counsel-approved policy.",
  },
  {
    category: "message",
    models: ["MessageThread", "Message"],
    sensitivity: "pii",
    defaultRetentionDays: 1095,
    exportable: true,
    deletable: true,
    anonymizeOnDeletion: true,
    legalHoldRequired: false,
    auditRequired: true,
    rationale: "Client messages can contain PII and third-party data, so exports require redaction review and deletions need audit trails.",
  },
  {
    category: "payment_record",
    models: ["Deposit", "PaymentRecord", "Refund", "PaymentAuditLog"],
    sensitivity: "payment",
    defaultRetentionDays: 2555,
    exportable: true,
    deletable: false,
    anonymizeOnDeletion: true,
    legalHoldRequired: true,
    auditRequired: true,
    rationale: "Payment records are exportable but normally retained for accounting, tax, dispute, and fraud obligations.",
  },
  {
    category: "audit_log",
    models: ["AuditLog", "BookingStateEvent", "PaymentAuditLog"],
    sensitivity: "internal",
    defaultRetentionDays: "indefinite",
    exportable: false,
    deletable: false,
    anonymizeOnDeletion: true,
    legalHoldRequired: true,
    auditRequired: true,
    rationale: "Audit logs prove system integrity and should be retained or anonymized only through a controlled legal process.",
  },
  {
    category: "error_report",
    models: ["ErrorReport"],
    sensitivity: "sensitive",
    defaultRetentionDays: 365,
    exportable: true,
    deletable: true,
    anonymizeOnDeletion: true,
    legalHoldRequired: false,
    auditRequired: true,
    rationale: "Sanitized error reports may still contain user context and should be exported/deleted under privacy workflows.",
  },
];

export const securityHeaderDrafts: SecurityHeaderDraft[] = [
  { name: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'", status: "scaffolded", rationale: "Starting policy must be adjusted when Stripe Checkout, Sentry, analytics, storage/CDN, and image providers are wired." },
  { name: "X-Content-Type-Options", value: "nosniff", status: "scaffolded", rationale: "Helps prevent MIME confusion around public pages and asset responses." },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin", status: "scaffolded", rationale: "Limits leakage of booking and city/style paths to third parties while preserving useful origin attribution." },
  { name: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()", status: "scaffolded", rationale: "Default deny for browser capabilities until a surface explicitly needs them." },
  { name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload", status: "deployment_gated", rationale: "Only enable after HTTPS is confirmed on production domains and subdomains." },
];

export function getFileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastSegment = trimmed.split(/[\\/]/).pop() ?? "";
  const parts = lastSegment.split(".");
  return parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
}

export function hasSuspiciousFilename(filename: string): boolean {
  const normalized = filename.trim().toLowerCase();
  return normalized.includes("..") || normalized.includes("%00") || normalized.startsWith(".") || /[<>:"|?*]/.test(normalized);
}

export function validateUploadDraft(input: UploadValidationInput): UploadValidationResult {
  const policy = uploadPolicies[input.kind];
  const extension = getFileExtension(input.filename);
  const reasons: string[] = [];

  if (!input.declaredByAuthenticatedUser && input.kind !== "reference_private") {
    reasons.push("Authenticated user context is required for this upload kind.");
  }
  if (!policy.allowedExtensions.includes(extension)) {
    reasons.push(`Extension .${extension || "unknown"} is not in the allowlist for ${input.kind}.`);
  }
  if (!policy.allowedMimeTypes.includes(input.mimeType.toLowerCase())) {
    reasons.push(`MIME type ${input.mimeType || "unknown"} is not in the allowlist for ${input.kind}.`);
  }
  if (input.sizeBytes <= 0) {
    reasons.push("File size must be greater than zero bytes.");
  }
  if (input.sizeBytes > policy.maxSizeBytes) {
    reasons.push(`File exceeds max size of ${policy.maxSizeBytes} bytes.`);
  }
  if (hasSuspiciousFilename(input.filename)) {
    reasons.push("Filename contains path traversal, hidden-file, null-byte, or restricted-character risk.");
  }

  return {
    accepted: reasons.length === 0,
    normalizedExtension: extension,
    maxSizeBytes: policy.maxSizeBytes,
    storageVisibility: policy.visibility,
    reasons,
    requiredProductionControls: [
      "Generate server-side object keys; never trust client filenames.",
      "Verify file signature/magic bytes in addition to extension and MIME type.",
      "Strip EXIF/GPS metadata and create safe derivatives for public portfolio use.",
      "Run malware scanning or quarantine workflow before durable use.",
      "Store private reference and consent assets behind signed, revocable URLs.",
      "Persist tenant-scoped FileAsset and AuditLog records after upload completion.",
    ],
  };
}

function sanitizeObjectKeySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

export function buildSignedUploadIntentPlan(input: SignedUploadIntentInput): SignedUploadIntentPlan {
  const validation = validateUploadDraft(input);
  const expiresInSeconds = Math.min(Math.max(input.expiresInSeconds ?? 900, 60), 3600);
  const extension = validation.normalizedExtension || "bin";
  const tenantSegment = sanitizeObjectKeySegment(input.tenantId);
  const subjectSegment = sanitizeObjectKeySegment(input.subjectId);
  const bookingSegment = input.bookingRequestId ? sanitizeObjectKeySegment(input.bookingRequestId) : "unassigned";
  const kindSegment = sanitizeObjectKeySegment(input.kind);
  const visibilityPrefix = validation.storageVisibility === "public_derivative" ? "public" : "private";
  const objectKey = validation.accepted
    ? `${visibilityPrefix}/${tenantSegment}/${kindSegment}/${bookingSegment}/${subjectSegment}.${extension}`
    : null;

  return {
    accepted: validation.accepted,
    status: validation.accepted ? "provider_gated" : "rejected",
    tenantId: input.tenantId,
    subjectId: input.subjectId,
    kind: input.kind,
    objectKey,
    storageVisibility: validation.storageVisibility,
    expiresInSeconds,
    validation,
    signedUploadUrlRequired: validation.accepted,
    publicReadAllowed: validation.storageVisibility === "public_derivative",
    requiredWrites: input.kind === "reference_private" ? ["FileAsset", "BookingReferenceImage", "AuditLog"] : ["FileAsset", "AuditLog"],
    requiredControls: [
      ...validation.requiredProductionControls,
      "Signed upload URLs must expire and be scoped to a single object key, content type, and max byte size.",
      "Private upload objects must not be readable through public URLs before or after scan completion.",
      "Reference images must be associated to the booking request before artist review.",
    ],
  };
}

const magicByteSignatures: Array<{ mimeType: string; signatures: readonly string[] }> = [
  { mimeType: "image/jpeg", signatures: ["ffd8ff"] },
  { mimeType: "image/png", signatures: ["89504e470d0a1a0a"] },
  { mimeType: "image/webp", signatures: ["52494646"] },
  { mimeType: "image/heic", signatures: ["000000186674797068656963", "0000001c6674797068656963", "000000206674797068656963"] },
  { mimeType: "application/pdf", signatures: ["25504446"] },
];

function normalizeSignatureHex(value: string): string {
  return value.toLowerCase().replace(/[^a-f0-9]/g, "");
}

export function detectMimeTypeFromSignature(fileSignatureHex: string): string | null {
  const normalized = normalizeSignatureHex(fileSignatureHex);
  if (!normalized) return null;
  const match = magicByteSignatures.find((candidate) => candidate.signatures.some((signature) => normalized.startsWith(signature)));
  return match?.mimeType ?? null;
}

export function buildUploadScanPipelinePlan(input: UploadScanPipelineInput): UploadScanPipelinePlan {
  const validation = validateUploadDraft(input);
  const detectedMimeType = detectMimeTypeFromSignature(input.fileSignatureHex);
  const signatureMatches = Boolean(detectedMimeType && detectedMimeType === input.mimeType.toLowerCase());
  const metadataStrippingRequired = input.exifMetadataPresent || input.kind === "portfolio_public" || input.kind === "healed_follow_up";
  const reasons = [...validation.reasons];

  if (!detectedMimeType) {
    reasons.push("File signature is missing or not recognized.");
  } else if (!signatureMatches) {
    reasons.push(`File signature detected ${detectedMimeType}, which does not match declared MIME ${input.mimeType}.`);
  }

  if (!input.scanProviderConfigured) {
    reasons.push("Malware scanning provider is not configured.");
  }
  if (input.malwareVerdict === "not_run") {
    reasons.push("Malware scan has not run.");
  }
  if (input.malwareVerdict === "suspicious" || input.malwareVerdict === "malware") {
    reasons.push(`Malware scan verdict is ${input.malwareVerdict}.`);
  }
  if (metadataStrippingRequired && !input.normalizedDerivativeGenerated) {
    reasons.push("Safe normalized derivative is required before this asset can be approved.");
  }

  const quarantineRequired =
    validation.accepted &&
    (!signatureMatches ||
      !input.scanProviderConfigured ||
      input.malwareVerdict === "not_run" ||
      input.malwareVerdict === "suspicious" ||
      metadataStrippingRequired && !input.normalizedDerivativeGenerated);
  const rejected = !validation.accepted || input.malwareVerdict === "malware";
  const status: UploadScanStatus = rejected ? "rejected" : quarantineRequired ? "quarantined" : "approved";

  return {
    status,
    validation,
    detectedMimeType,
    signatureMatches,
    quarantineRequired: status === "quarantined",
    metadataStrippingRequired,
    publicDerivativeAllowed: status === "approved" && validation.storageVisibility === "public_derivative" && input.normalizedDerivativeGenerated,
    scanStatusPersistence: {
      required: true,
      fields: ["tenantId", "fileAssetId", "scanStatus", "detectedMimeType", "malwareVerdict", "metadataStrippedAt", "derivativeObjectKey", "quarantinedAt"],
    },
    requiredControls: [
      "Verify magic bytes server-side after upload completion.",
      "Quarantine objects until malware scan returns clean.",
      "Strip EXIF/GPS metadata and normalize image derivatives before public exposure.",
      "Persist scan status and detected MIME type on the tenant-scoped FileAsset record.",
      "Write AuditLog entries for approval, quarantine, rejection, and derivative publication.",
      "Never expose original private uploads publicly; publish only safe derivatives when allowed.",
    ],
    reasons,
  };
}

function isExpired(now: string, expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= new Date(now).getTime();
}

export function buildPrivateStorageAccessPlan(input: PrivateStorageAccessInput): PrivateStorageAccessPlan {
  const reasons: string[] = [];
  const privateVisibility = input.storageVisibility !== "public_derivative";
  const signedUrlRequired = privateVisibility || input.operation === "upload";
  const expiresInSeconds = Math.min(Math.max(input.expiresInSeconds, 60), 3600);

  if (!input.providerConfigured) {
    reasons.push("Storage provider is not configured.");
  }
  if (!input.objectKey?.trim()) {
    reasons.push("Server-owned object key is required.");
  }
  if (input.revokedAt) {
    reasons.push("Signed URL grant has been revoked.");
  }
  if (isExpired(input.now, input.expiresAt)) {
    reasons.push("Signed URL grant is expired.");
  }
  if (input.operation === "download" && privateVisibility && !input.scanApproved) {
    reasons.push("Private downloads require approved scan status.");
  }
  if (input.storageVisibility === "public_derivative" && !input.publicDerivativeObjectKey?.trim()) {
    reasons.push("Public portfolio access must use a separate safe derivative object key.");
  }

  const status: StorageAccessStatus = input.revokedAt
    ? "revoked"
    : isExpired(input.now, input.expiresAt)
      ? "expired"
      : reasons.some((reason) => reason !== "Storage provider is not configured.")
        ? "rejected"
        : input.providerConfigured
          ? "signed_url_ready"
          : "provider_gated";

  return {
    status,
    operation: input.operation,
    tenantId: input.tenantId,
    subjectId: input.subjectId,
    objectKey: input.objectKey?.trim() || null,
    bucketAcl: input.storageVisibility === "public_derivative" ? "public-read-derivatives-only" : "private",
    signedUrlRequired,
    publicReadAllowed: input.storageVisibility === "public_derivative" && status === "signed_url_ready",
    expiresInSeconds,
    requiredWrites: ["FileAsset", "AuditLog", "SignedUrlGrant"],
    requiredControls: [
      "Generate object keys server-side from tenant, asset kind, and subject identifiers.",
      "Use private bucket ACLs for original reference, consent, healed-photo, and document assets.",
      "Issue signed URLs scoped to one object key, content type, operation, and expiry window.",
      "Check revocation and expiry before every private download grant.",
      "Require approved scan status before private download and before public derivative publication.",
      "Publish public portfolio access only through separate derivative object keys.",
      "Write AuditLog entries for signed URL creation, download, revocation, and public derivative publication.",
    ],
    reasons,
  };
}

export function classifyFieldSensitivity(fieldName: string): DataSensitivity {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes("token") || normalized.includes("secret") || normalized.includes("password") || normalized.includes("authorization") || normalized.includes("cookie")) return "secret";
  if (normalized.includes("medical") || normalized.includes("allerg") || normalized.includes("skin") || normalized.includes("birthdate")) return "medical";
  if (normalized.includes("payment") || normalized.includes("stripe") || normalized.includes("refund") || normalized.includes("receipt")) return "payment";
  if (normalized.includes("email") || normalized.includes("phone") || normalized.includes("name") || normalized.includes("address")) return "pii";
  if (normalized.includes("signature") || normalized.includes("reference") || normalized.includes("image") || normalized.includes("message")) return "sensitive";
  return "internal";
}

export function maskEmail(value: string): string {
  const [local = "", domain = ""] = value.split("@");
  if (!domain) return "[masked-email]";
  return `${local.slice(0, 2)}***@${domain.charAt(0)}***`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "[masked-phone]";
  return `***-***-${digits.slice(-4)}`;
}

export function redactValue(fieldName: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const sensitivity = classifyFieldSensitivity(fieldName);
  if (sensitivity === "secret") return "[redacted-secret]";
  if (sensitivity === "medical") return "[redacted-medical]";
  if (sensitivity === "payment") return "[redacted-payment]";
  if (sensitivity === "sensitive") return "[redacted-sensitive]";
  if (typeof value === "string" && fieldName.toLowerCase().includes("email")) return maskEmail(value);
  if (typeof value === "string" && fieldName.toLowerCase().includes("phone")) return maskPhone(value);
  if (sensitivity === "pii") return "[redacted-pii]";
  return value;
}

export function redactRecord<T extends Record<string, unknown>>(record: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, redactValue(key, value)]));
}

export function evaluateRateLimitDraft(input: RateLimitEvaluationInput): RateLimitEvaluationResult {
  const rule = rateLimitRules.find((candidate) => candidate.id === input.ruleId);
  if (!rule) {
    return { allowed: false, remaining: 0, status: "rule_not_found", warning: "No scaffolded rate-limit rule matched this route." };
  }
  const sameWindow = input.windowSeconds === rule.windowSeconds;
  const remaining = Math.max(rule.maxRequests - input.observedRequests, 0);
  const allowed = sameWindow && input.observedRequests <= rule.maxRequests;
  return {
    allowed,
    remaining,
    status: allowed ? "allow" : "throttle",
    warning: sameWindow ? "Scaffolded evaluation only; production requires distributed counters." : "Observed window does not match configured rule window.",
  };
}

export function buildTenantIsolationFixtures(): TenantIsolationFixture[] {
  return [
    {
      id: "tenant-isolation-owner-own-tenant",
      description: "Owner can read clients in their own tenant.",
      actorTenantId: "tenant_demo_nomad",
      targetTenantId: "tenant_demo_nomad",
      role: "owner",
      permission: "client:read",
      expectedDecision: "allow",
      reason: "Tenant ids match and owner role has client:read.",
    },
    {
      id: "tenant-isolation-owner-other-tenant",
      description: "Owner cannot read clients from a different tenant.",
      actorTenantId: "tenant_demo_nomad",
      targetTenantId: "tenant_other_studio",
      role: "owner",
      permission: "client:read",
      expectedDecision: "deny",
      reason: "Role permissions are insufficient without matching tenant membership.",
    },
    {
      id: "tenant-isolation-assistant-payment-write",
      description: "Assistant cannot write payment/refund records even inside their own tenant.",
      actorTenantId: "tenant_demo_nomad",
      targetTenantId: "tenant_demo_nomad",
      role: "assistant",
      permission: "payment:write",
      expectedDecision: "deny",
      reason: "Assistant role lacks payment:write and production must audit denied attempts.",
    },
    {
      id: "tenant-isolation-admin-observe-only",
      description: "SaaS admin preview role is read-heavy and must not mutate studio settings by default.",
      actorTenantId: "platform_admin",
      targetTenantId: "tenant_demo_nomad",
      role: "admin",
      permission: "settings:write",
      expectedDecision: "deny",
      reason: "Platform admin mutation model needs explicit break-glass policy and audit trail.",
    },
  ];
}

export function buildPrivacyRequestDraft(type: PrivacyRequestType): PrivacyRequestDraft {
  const baseAreas = ["clients", "client profiles", "messages", "booking requests", "reference images", "consent records", "payments", "notifications", "audit logs"];
  const productionBlockers = [
    "Verify requester identity and tenant/client relationship.",
    "Separate legally retained audit/payment/consent records from deletable client profile data.",
    "Redact third-party information from exports.",
    "Write tenant-scoped audit log for each privacy request action.",
    "Attorney review required before publishing final workflow or deadlines.",
  ];

  return {
    id: `privacy-${type}-draft`,
    type,
    status: "legal_review_required",
    identityVerificationRequired: true,
    affectedAreas: type === "deletion" ? baseAreas.filter((area) => area !== "payments" && area !== "audit logs") : baseAreas,
    deadlinePolicy: "Placeholder only; actual response deadlines depend on jurisdiction and attorney-reviewed policy.",
    productionBlockers,
  };
}

function getRetentionRule(category: PrivacyDataCategory): RetentionPolicyRule | undefined {
  return retentionPolicyRules.find((rule) => rule.category === category);
}

function choosePrivacyAction(requestType: PrivacyRequestType, rule: RetentionPolicyRule): RetentionAction {
  if (requestType === "access" || requestType === "export") return "export";
  if (requestType === "restriction") return "restrict_processing";
  if (requestType === "rectification") return rule.deletable ? "anonymize" : "retain_legal_hold";
  if (rule.legalHoldRequired || !rule.deletable) return rule.anonymizeOnDeletion ? "anonymize" : "retain_legal_hold";
  return rule.anonymizeOnDeletion ? "anonymize" : "delete";
}

export function buildPrivacyLifecyclePlan(input: PrivacyLifecyclePlanInput): PrivacyLifecyclePlan {
  const draft = buildPrivacyRequestDraft(input.requestType);
  const productionBlockers = [...draft.productionBlockers];
  if (!input.requesterVerified) {
    return {
      status: "blocked_identity",
      canExecute: false,
      requestType: input.requestType,
      steps: [],
      requiredAudits: [],
      productionBlockers: ["Requester identity must be verified before privacy lifecycle actions.", ...productionBlockers],
    };
  }

  if (!input.legalReviewApproved) {
    productionBlockers.push("Attorney-approved retention schedule is required before executing production export/delete workers.");
  }

  const steps: PrivacyLifecycleStep[] = [];
  const requiredAudits: string[] = [];
  let hasUnsupportedCategory = false;

  for (const category of input.categories) {
    const rule = getRetentionRule(category);
    if (!rule) {
      hasUnsupportedCategory = true;
      steps.push({
        category,
        models: [],
        action: "retain_legal_hold",
        blocked: true,
        reason: "No retention policy rule exists for this category.",
        auditRequired: true,
      });
      continue;
    }

    const action = choosePrivacyAction(input.requestType, rule);
    const exportBlocked = (input.requestType === "access" || input.requestType === "export") && !rule.exportable;
    const deletionBlocked = input.requestType === "deletion" && rule.legalHoldRequired && !input.legalReviewApproved;
    const blocked = exportBlocked || deletionBlocked;

    if (rule.auditRequired) {
      requiredAudits.push(`${input.requestType}:${category}:${action}`);
    }

    steps.push({
      category,
      models: rule.models,
      action,
      blocked,
      reason: blocked
        ? `${category} requires legal-hold review or is not exportable for ${input.requestType} requests.`
        : rule.rationale,
      auditRequired: rule.auditRequired,
    });
  }

  const blockedSteps = steps.some((step) => step.blocked);
  return {
    status: hasUnsupportedCategory ? "unsupported_category" : !input.legalReviewApproved && blockedSteps ? "blocked_legal_review" : "ready",
    canExecute: !hasUnsupportedCategory && !blockedSteps && Boolean(input.legalReviewApproved),
    requestType: input.requestType,
    steps,
    requiredAudits,
    productionBlockers,
  };
}

export function buildPrivacyCaseWorkflowPlan(input: PrivacyCaseWorkflowInput): PrivacyCaseWorkflowPlan {
  const lifecycle = buildPrivacyLifecyclePlan({
    requestType: input.requestType,
    categories: input.categories,
    requesterVerified: input.requesterVerified && input.tenantMembershipVerified,
    ...(input.legalReviewApproved !== undefined ? { legalReviewApproved: input.legalReviewApproved } : {}),
  });
  const blockers: string[] = [];

  if (!input.requesterVerified) blockers.push("Requester identity must be verified before privacy case execution.");
  if (!input.tenantMembershipVerified) blockers.push("Tenant/client relationship must be verified before privacy case execution.");
  if (!input.caseStoreConfigured) blockers.push("Tenant-scoped privacy case store must be configured before production intake.");
  if ((input.requestType === "access" || input.requestType === "export") && !input.exportWorkerConfigured) blockers.push("Export worker must be configured before access/export requests can execute.");
  if ((input.requestType === "deletion" || input.requestType === "rectification" || input.requestType === "restriction") && !input.deletionWorkerConfigured) blockers.push("Deletion/rectification/restriction worker must be configured before mutation requests can execute.");
  if (!input.notificationProviderConfigured) blockers.push("Notification provider must be configured for receipt, identity, completion, and denial updates.");
  if (!input.auditLogConfigured) blockers.push("Audit logging must be configured for every privacy case state transition.");
  blockers.push(...lifecycle.productionBlockers.filter((blocker) => blocker.includes("Attorney-approved") || blocker.startsWith("Requester identity")));

  const uniqueBlockers = [...new Set(blockers)];
  const caseStatus =
    !input.requesterVerified || !input.tenantMembershipVerified
      ? "awaiting_identity_verification"
      : uniqueBlockers.length > 0
        ? "awaiting_worker_configuration"
        : "ready_for_execution";

  return {
    status: uniqueBlockers.length === 0 && lifecycle.canExecute ? "ready" : "blocked",
    caseStatus,
    lifecycle,
    blockers: uniqueBlockers,
    requiredCaseFields: [
      "tenantId",
      "requesterEmailHash",
      "requestType",
      "identityVerificationStatus",
      "caseStatus",
      "deadlineAt",
      "legalHoldStatus",
      "assignedOwnerId",
      "completedAt",
    ],
    requiredWorkers: ["identity-verification", "privacy-export", "privacy-delete-or-anonymize", "privacy-notification", "audit-log"],
    notificationSteps: [
      "Send receipt without exposing sensitive request details.",
      "Request identity verification before export/delete execution.",
      "Notify completion, denial, or legal-hold delay with attorney-reviewed copy.",
    ],
    auditEvents: ["privacy.intake", "privacy.identity_verified", "privacy.worker_started", "privacy.worker_completed", "privacy.notification_sent", "privacy.case_closed"],
  };
}

export function buildRetentionEnforcementDryRun(input: RetentionEnforcementDryRunInput): RetentionEnforcementDryRun {
  const blockers: string[] = [];
  if (!input.legalReviewApproved) blockers.push("Attorney-approved retention schedule is required before automated retention enforcement.");
  if (!input.databaseWorkerConfigured) blockers.push("Database retention worker must be configured before deleting/anonymizing records.");
  if (!input.storageWorkerConfigured) blockers.push("Storage retention worker must be configured before deleting private files.");
  if (!input.auditLogConfigured) blockers.push("Audit logging must be configured before retention actions execute.");
  if (!input.backupPolicyDocumented) blockers.push("Backup retention implications must be documented before destructive enforcement.");
  if (!input.restorePolicyDocumented) blockers.push("Restore policy must document how deleted/anonymized records remain deleted after backup restore.");

  const steps: RetentionEnforcementStep[] = input.records.map((record) => {
    const rule = getRetentionRule(record.category);
    if (!rule) {
      return {
        recordId: record.id,
        category: record.category,
        models: [],
        action: "retain_legal_hold",
        due: false,
        blocked: true,
        auditRequired: true,
        reason: "No retention rule exists for this category.",
      };
    }

    const retentionDue = rule.defaultRetentionDays !== "indefinite" && record.ageDays >= rule.defaultRetentionDays;
    const legalHold = Boolean(record.legalHoldActive || rule.legalHoldRequired);
    const action: RetentionEnforcementAction = legalHold
      ? "retain_legal_hold"
      : !retentionDue
        ? "retain_until_due"
        : rule.deletable
          ? rule.anonymizeOnDeletion
            ? "anonymize"
            : "delete"
          : rule.anonymizeOnDeletion
            ? "anonymize"
            : "retain_legal_hold";
    const blocked = action !== "retain_until_due" && action !== "retain_legal_hold" && blockers.length > 0;

    return {
      recordId: record.id,
      category: record.category,
      models: rule.models,
      action,
      due: retentionDue,
      blocked,
      auditRequired: rule.auditRequired || action !== "retain_until_due",
      reason: legalHold
        ? rule.rationale
        : !retentionDue
          ? `${record.category} is ${record.ageDays} day(s) old and is not past the ${rule.defaultRetentionDays} day retention window.`
          : rule.rationale,
    };
  });

  const executableSteps = steps.filter((step) => step.due && step.action !== "retain_legal_hold" && step.action !== "retain_until_due");
  const blockedSteps = steps.some((step) => step.blocked);

  return {
    status: blockers.length === 0 && !blockedSteps ? "ready" : "blocked",
    canExecute: blockers.length === 0 && !blockedSteps,
    steps,
    blockers,
    requiredWorkers: ["database-retention", "storage-retention", "privacy-export", "audit-log", "backup-restore-reconciliation"],
    requiredAuditEvents: executableSteps.map((step) => `retention:${step.category}:${step.action}:${step.recordId}`),
    backupRestorePolicy: {
      backupPolicyDocumented: input.backupPolicyDocumented,
      restorePolicyDocumented: input.restorePolicyDocumented,
      implication: "Backups must preserve legal holds and restore jobs must replay deletion/anonymization tombstones before restored data becomes queryable.",
    },
  };
}

export type DashboardPrivacyRole = "owner" | "artist" | "assistant" | "studio_manager" | "admin";

export type DashboardPrivacySurface =
  | "client_profile"
  | "booking_request"
  | "consent_form"
  | "payment"
  | "message"
  | "file_asset";

export type DashboardPrivacyDecision = "allow" | "redact" | "deny";

export interface DashboardPrivacyPolicyInput {
  role: DashboardPrivacyRole;
  surface: DashboardPrivacySurface;
  fieldName: string;
  value: unknown;
  tenantScoped: boolean;
  requesterVerified?: boolean;
}

export interface DashboardPrivacyFieldDecision {
  decision: DashboardPrivacyDecision;
  fieldName: string;
  surface: DashboardPrivacySurface;
  value: unknown;
  auditRequired: boolean;
  retentionWorkflowRequired: boolean;
  reason: string;
}

export interface DashboardPrivacyProjectionInput<TRecord extends Record<string, unknown>> {
  role: DashboardPrivacyRole;
  surface: DashboardPrivacySurface;
  tenantScoped: boolean;
  requesterVerified?: boolean;
  record: TRecord;
}

export interface DashboardPrivacyProjection {
  surface: DashboardPrivacySurface;
  role: DashboardPrivacyRole;
  tenantScoped: boolean;
  fields: Record<string, unknown>;
  redactedFields: string[];
  deniedFields: string[];
  auditRequired: boolean;
  retentionWorkflowRequired: boolean;
}

const dashboardSensitiveFields = new Set([
  "clientEmail",
  "clientPhone",
  "email",
  "phone",
  "medicalNotes",
  "medicalNotesEncrypted",
  "consentSignatureUrl",
  "consentSignatureHash",
  "stripePaymentIntentId",
  "stripeCustomerId",
  "paymentMethodSummary",
  "messageBody",
  "attachmentUrl",
  "objectKey",
  "signedUrl",
]);

const dashboardMedicalFields = new Set(["medicalNotes", "medicalNotesEncrypted"]);
const dashboardPaymentFields = new Set(["stripePaymentIntentId", "stripeCustomerId", "paymentMethodSummary"]);
const dashboardFileSecretFields = new Set(["objectKey", "signedUrl", "attachmentUrl"]);

function canViewSensitiveDashboardField(role: DashboardPrivacyRole, surface: DashboardPrivacySurface, fieldName: string): boolean {
  if (role === "owner" || role === "studio_manager") return true;
  if (role === "artist") return surface !== "payment" && !dashboardPaymentFields.has(fieldName);
  if (role === "assistant") return false;
  return false;
}

export function evaluateDashboardPrivacyField(input: DashboardPrivacyPolicyInput): DashboardPrivacyFieldDecision {
  const retentionWorkflowRequired = ["medicalNotes", "medicalNotesEncrypted", "consentSignatureUrl", "consentSignatureHash", "messageBody", "objectKey", "signedUrl"].includes(input.fieldName);

  if (!input.tenantScoped) {
    return {
      decision: "deny",
      fieldName: input.fieldName,
      surface: input.surface,
      value: undefined,
      auditRequired: true,
      retentionWorkflowRequired,
      reason: "Dashboard privacy access requires a matched tenant scope.",
    };
  }

  const sensitive = dashboardSensitiveFields.has(input.fieldName) || redactValue(input.fieldName, input.value) !== input.value;
  if (!sensitive) {
    return {
      decision: "allow",
      fieldName: input.fieldName,
      surface: input.surface,
      value: input.value,
      auditRequired: false,
      retentionWorkflowRequired,
      reason: "Field is not classified as sensitive for dashboard display.",
    };
  }

  if (input.role === "admin" && !input.requesterVerified) {
    return {
      decision: "redact",
      fieldName: input.fieldName,
      surface: input.surface,
      value: redactValue(input.fieldName, input.value),
      auditRequired: true,
      retentionWorkflowRequired,
      reason: "Platform admin access to tenant-sensitive fields requires verified break-glass context.",
    };
  }

  if (!canViewSensitiveDashboardField(input.role, input.surface, input.fieldName)) {
    return {
      decision: "redact",
      fieldName: input.fieldName,
      surface: input.surface,
      value: redactValue(input.fieldName, input.value),
      auditRequired: true,
      retentionWorkflowRequired,
      reason: "Role cannot view this sensitive dashboard field.",
    };
  }

  return {
    decision: "allow",
    fieldName: input.fieldName,
    surface: input.surface,
    value: input.value,
    auditRequired: true,
    retentionWorkflowRequired,
    reason: "Role is allowed to view this sensitive field inside the tenant scope.",
  };
}

export function projectDashboardPrivacyRecord<TRecord extends Record<string, unknown>>(
  input: DashboardPrivacyProjectionInput<TRecord>,
): DashboardPrivacyProjection {
  const redactedFields: string[] = [];
  const deniedFields: string[] = [];
  let auditRequired = false;
  let retentionWorkflowRequired = false;
  const fields: Record<string, unknown> = {};

  for (const [fieldName, value] of Object.entries(input.record)) {
    const decision = evaluateDashboardPrivacyField({
      role: input.role,
      surface: input.surface,
      fieldName,
      value,
      tenantScoped: input.tenantScoped,
      ...(input.requesterVerified !== undefined ? { requesterVerified: input.requesterVerified } : {}),
    });

    auditRequired = auditRequired || decision.auditRequired;
    retentionWorkflowRequired = retentionWorkflowRequired || decision.retentionWorkflowRequired;
    if (decision.decision === "deny") {
      deniedFields.push(fieldName);
      continue;
    }

    if (decision.decision === "redact") {
      redactedFields.push(fieldName);
    }
    fields[fieldName] = decision.value;
  }

  return {
    surface: input.surface,
    role: input.role,
    tenantScoped: input.tenantScoped,
    fields,
    redactedFields,
    deniedFields,
    auditRequired,
    retentionWorkflowRequired,
  };
}

export function buildSecurityHeaderPlan(extraConnectSources: string[] = []): SecurityHeaderDraft[] {
  if (extraConnectSources.length === 0) return securityHeaderDrafts;
  return securityHeaderDrafts.map((header) => {
    if (header.name !== "Content-Security-Policy") return header;
    const connectSrc = [`'self'`, ...extraConnectSources].join(" ");
    return { ...header, value: header.value.replace("connect-src 'self'", `connect-src ${connectSrc}`) };
  });
}

export function summarizeSecurityPosture(controls: SecurityControl[] = phase13SecurityControls) {
  const total = controls.length;
  const blockers = controls.filter((control) => control.blocksProduction).length;
  const implemented = controls.filter((control) => control.status === "implemented").length;
  const scaffolded = controls.filter((control) => control.status === "scaffolded").length;
  const legal = controls.filter((control) => control.status === "legal_review_required").length;
  return {
    total,
    blockers,
    implemented,
    scaffolded,
    legal,
    productionReady: blockers === 0 && legal === 0,
  };
}

export function buildTrustCenterChecklist(): SecurityControl[] {
  return phase13SecurityControls;
}
