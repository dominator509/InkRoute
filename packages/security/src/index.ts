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

export interface PrivateStorageRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  storageProviderConfigured: boolean;
  storageEnvVarsConfigured: boolean;
  privateBucketAclVerified: boolean;
  serverOwnedObjectKeysEnforced: boolean;
  signedUploadUrlsImplemented: boolean;
  signedDownloadUrlsImplemented: boolean;
  fileAssetPersistenceConfigured: boolean;
  signedUrlGrantPersistenceConfigured: boolean;
  signedUrlRevocationPersistenceConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  scanApprovalGateEnforced: boolean;
  publicDerivativeSeparationEnforced: boolean;
  privateOriginalPublicReadDenied: boolean;
  approvedDerivativePublicReadVerified: boolean;
  tenantScopedAccessIntegrationTestsPassed: boolean;
  providerSandboxIntegrationTestsPassed: boolean;
}

export interface PrivateStorageRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export type FileAssetPersistenceStatus = "ready" | "blocked";
export type FileAssetAccessLevel = "public_derivative" | "tenant_member" | "client_private" | "system_only";

export interface FileAssetPersistencePlanInput {
  kind: UploadAssetKind;
  tenantId: string;
  subjectId: string;
  objectKey: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageVisibility: UploadValidationResult["storageVisibility"];
  scanStatus: UploadScanStatus | "pending";
  publicDerivativeObjectKey?: string;
  providerConfigured: boolean;
  auditLogConfigured: boolean;
  fileAssetStoreConfigured: boolean;
}

export interface FileAssetPersistencePlan {
  status: FileAssetPersistenceStatus;
  tenantId: string;
  subjectId: string;
  kind: UploadAssetKind;
  objectKey: string | null;
  accessLevel: FileAssetAccessLevel;
  publicReadAllowed: boolean;
  requiredWrites: Array<"FileAsset" | "AuditLog" | "BookingReferenceImage" | "ConsentArtifact">;
  requiredFields: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
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

export type BotChallengeAction = "allow" | "challenge" | "throttle" | "provider_bypass";
export type AbuseSignal = "high_request_count" | "missing_user_agent" | "suspicious_path" | "provider_signature_valid" | "provider_signature_missing" | "known_test_fixture";

export interface AbuseControlInput {
  ruleId: string;
  routePath: string;
  tenantId?: string;
  ipHash?: string;
  userId?: string;
  userAgent?: string;
  observedRequests: number;
  windowSeconds: number;
  providerWebhook: boolean;
  providerSignatureValid?: boolean;
  redisConfigured: boolean;
  botChallengeConfigured: boolean;
  alertingConfigured: boolean;
}

export interface AbuseControlPlan {
  status: "ready" | "blocked";
  action: BotChallengeAction;
  rateLimit: RateLimitEvaluationResult;
  key: string;
  signals: readonly AbuseSignal[];
  retryAfterSeconds?: number;
  providerBypassAllowed: boolean;
  privacySafeLog: {
    routePath: string;
    tenantId: string;
    ipHash: string;
    userId?: string;
    signals: readonly AbuseSignal[];
    action: BotChallengeAction;
  };
  blockers: readonly string[];
  alert: {
    shouldAlert: boolean;
    reason: string;
  };
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

export interface PrivacyRetentionRuntimeReadinessInput {
  packageScripts: readonly string[];
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  attorneyApprovalRecorded: boolean;
  privacyCaseStoreConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  identityVerificationWorkerConfigured: boolean;
  exportWorkerConfigured: boolean;
  deleteAnonymizeWorkerConfigured: boolean;
  storageDeletionConfigured: boolean;
  retentionScheduleApproved: boolean;
  prismaExecutionVerified: boolean;
  objectStorageExecutionVerified: boolean;
  legalHoldWorkflowConfigured: boolean;
  backupRestorePolicyDocumented: boolean;
  restoreTombstoneReplayVerified: boolean;
  tenantIsolationVerified: boolean;
  notificationCopyApproved: boolean;
  dryRunEvidenceCollected: boolean;
}

export interface PrivacyRequestRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  publicRouteTestsPassed: boolean;
  dashboardRouteTestsPassed: boolean;
  privacyCasePersistenceConfigured: boolean;
  identityProofingConfigured: boolean;
  tenantRelationshipProofingConfigured: boolean;
  requesterMismatchDenied: boolean;
  exportWorkerConfigured: boolean;
  deleteAnonymizeRectifyWorkersConfigured: boolean;
  storageExportDeleteConfigured: boolean;
  thirdPartyRedactionConfigured: boolean;
  legalHoldHandlingConfigured: boolean;
  notificationProviderConfigured: boolean;
  notificationTemplatesApproved: boolean;
  auditLogPersistenceConfigured: boolean;
  statusTransitionPersistenceConfigured: boolean;
  tenantIsolationIntegrationTestsPassed: boolean;
  postgresStorageIntegrationTestsPassed: boolean;
}

export interface PrivacyRequestRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface RetentionEnforcementRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  attorneyRetentionScheduleApproved: boolean;
  scheduledWorkerConfigured: boolean;
  workerIdempotencyConfigured: boolean;
  postgresRetentionExecutionVerified: boolean;
  objectStorageRetentionExecutionVerified: boolean;
  exportArtifactGenerationVerified: boolean;
  deletionTombstonePersistenceConfigured: boolean;
  anonymizationTombstonePersistenceConfigured: boolean;
  restoreTombstoneReplayVerified: boolean;
  backupRetentionPolicyDocumented: boolean;
  legalHoldEnforcementVerified: boolean;
  auditLogPersistenceConfigured: boolean;
  tenantIsolationIntegrationTestsPassed: boolean;
  dryRunToExecutionReconciliationVerified: boolean;
  destructiveActionRollbackDocumented: boolean;
}

export interface RetentionEnforcementRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface PrivacyRetentionRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
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

export interface LegalDocumentProductionReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  attorneyApprovalsRecorded: boolean;
  allRequiredTopicsApproved: boolean;
  jurisdictionPoliciesApproved: boolean;
  reviewedPublicPageCopyCommitted: boolean;
  placeholderCopyRemoved: boolean;
  noindexRemovedAfterApproval: boolean;
  consentVersionPersistenceConfigured: boolean;
  studioPolicyVersionPersistenceConfigured: boolean;
  acceptanceAuditPersistenceConfigured: boolean;
  dashboardAcceptanceUiWired: boolean;
  publicPageRouteSmokePassed: boolean;
  consentAcceptanceRouteTestsPassed: boolean;
  rollbackPlanDocumented: boolean;
}

export interface LegalDocumentProductionReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface PaymentPolicyLegalReviewRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  webTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  attorneyApprovalRecorded: boolean;
  taxAccountingApprovalRecorded: boolean;
  reviewedPaymentCopyCommitted: boolean;
  reviewedCancellationCopyCommitted: boolean;
  reviewedNoShowCopyCommitted: boolean;
  reviewedRefundCopyCommitted: boolean;
  reviewedSmsConsentCopyCommitted: boolean;
  reviewedReceiptCopyCommitted: boolean;
  reviewedTaxDisclosureCopyCommitted: boolean;
  termsPrivacyConsentUpdated: boolean;
  placeholdersRemovedFromPaymentFlows: boolean;
  acceptanceAuditConfigured: boolean;
  policyVersioningConfigured: boolean;
  e2eApprovedLanguageVerified: boolean;
  rollbackCopyPlanDocumented: boolean;
}

export interface PaymentPolicyLegalReviewRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface AbuseControlRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  distributedLimiterConfigured: boolean;
  limiterEnvVarsConfigured: boolean;
  edgeOrMiddlewareWired: boolean;
  routeFamilyPoliciesApplied: boolean;
  tenantSafeKeysVerified: boolean;
  botChallengeProviderConfigured: boolean;
  botChallengeRouteTestsPassed: boolean;
  providerWebhookSignatureBypassVerified: boolean;
  invalidWebhookSignatureChallengeVerified: boolean;
  privacySafeAbuseLogPersistenceConfigured: boolean;
  abuseLogRedactionVerified: boolean;
  alertDeliveryConfigured: boolean;
  throttlingAlertSmokePassed: boolean;
  failClosedBehaviorVerified: boolean;
  publicRouteIntegrationTestsPassed: boolean;
}

export interface AbuseControlRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface SecurityAutomatedCoverageReadinessInput {
  packageScripts: readonly string[];
  securityPackageTestsPassed: boolean;
  securityPackageTypecheckPassed: boolean;
  routeVitestSuitePassed: boolean;
  middlewareRuntimeSuitePassed: boolean;
  middlewareStaticSuitePassed: boolean;
  webE2eSecuritySuitePassed: boolean;
  dashboardE2eSecuritySuitePassed: boolean;
  fullUnitSuitePassed: boolean;
  ciSecurityChecksPassed: boolean;
  testManifestIncludesSecuritySuites: boolean;
  dbBackedTenantIsolationTestsPassed: boolean;
  storageProviderNegativeTestsPassed: boolean;
  privacyWorkflowIntegrationTestsPassed: boolean;
  authenticatedRoleBoundaryTestsPassed: boolean;
  coverageArtifactsCollected: boolean;
  failureModeFixturesDocumented: boolean;
}

export interface SecurityAutomatedCoverageReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface SecurityAppRuntimeVerificationInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  webTypecheckPassed: boolean;
  webBuildPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  mobileTypecheckPassed: boolean;
  nextConfigStaticTestsPassed: boolean;
  mobileSecurityStaticTestsPassed: boolean;
  webSecurityRoutesSmokePassed: boolean;
  dashboardSecurityRoutesSmokePassed: boolean;
  webMiddlewareRuntimeSmokePassed: boolean;
  dashboardMiddlewareRuntimeSmokePassed: boolean;
  mobileSystemStatusScreenSmokePassed: boolean;
  browserRuntimeSmokePassed: boolean;
  deviceRuntimeSmokePassed: boolean;
  ciRuntimeEvidenceCollected: boolean;
}

export interface SecurityAppRuntimeVerificationPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface SecurityHeaderDraft {
  name: string;
  value: string;
  status: SecurityStatus;
  rationale: string;
}

export interface SecurityMiddlewareRuntimeReadinessInput {
  packageScripts: readonly string[];
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  webMiddlewareWired: boolean;
  dashboardMiddlewareWired: boolean;
  webHeaderBrowserSmokePassed: boolean;
  dashboardHeaderBrowserSmokePassed: boolean;
  productionHstsDeploymentVerified: boolean;
  previewLocalHstsSuppressionVerified: boolean;
  cspProviderConnectSourcesVerified: boolean;
  cspFrameBaseFormInvariantsVerified: boolean;
  csrfCookieMutationAttackTestsPassed: boolean;
  csrfValidTokenAllowTestsPassed: boolean;
  sameSiteCookieBehaviorVerified: boolean;
  csrfSessionBindingVerified: boolean;
  providerWebhookCsrfBypassReviewed: boolean;
  routeRuntimeIntegrationTestsPassed: boolean;
}

export interface SecurityMiddlewareRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface SecurityRuntimeEnforcementInput {
  environment: "development" | "preview" | "production";
  httpsEnabled: boolean;
  appSurface: "web" | "dashboard";
  extraConnectSources?: readonly string[];
  cookieAuthenticatedMutation: boolean;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  csrfTokenPresent: boolean;
  csrfTokenValid: boolean;
  sameSiteCookie: "lax" | "strict" | "none" | "missing";
}

export interface SecurityRuntimeEnforcementPlan {
  status: "ready" | "blocked";
  headers: readonly SecurityHeaderDraft[];
  missingHeaders: readonly string[];
  csrf: {
    required: boolean;
    allowed: boolean;
    reason: string;
  };
  hstsEnabled: boolean;
  blockers: readonly string[];
  testExpectations: readonly string[];
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
  { id: "public-privacy-request", routePattern: "/api/public/:tenantSlug/privacy-requests", windowSeconds: 3600, maxRequests: 6, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-098", "GAP-101"] },
  { id: "public-message", routePattern: "/api/public/:tenantSlug/messages", windowSeconds: 3600, maxRequests: 10, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-064", "GAP-068"] },
  { id: "fallback-error-report", routePattern: "/api/public/:tenantSlug/error-reports", windowSeconds: 900, maxRequests: 20, keyStrategy: "ip_tenant", status: "scaffolded", gapIds: ["GAP-081", "GAP-101"] },
  { id: "provider-webhook", routePattern: "/api/webhooks/:provider", windowSeconds: 60, maxRequests: 1000, keyStrategy: "provider_signature", status: "scaffolded", gapIds: ["GAP-061", "GAP-079", "GAP-101"] },
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

export function buildLegalDocumentProductionReadinessPlan(
  input: LegalDocumentProductionReadinessInput,
): LegalDocumentProductionReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking legal documents production-ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking legal documents production-ready.");
  if (!input.attorneyApprovalsRecorded) blockers.push("Qualified attorney approval metadata must be recorded for every production legal document.");
  if (!input.allRequiredTopicsApproved) blockers.push("Every required legal review topic must have reviewer, approval date, jurisdiction, and version metadata.");
  if (!input.jurisdictionPoliciesApproved) blockers.push("Jurisdiction-specific studio policies must be approved before production publication.");
  if (!input.reviewedPublicPageCopyCommitted) blockers.push("Reviewed privacy, terms, consent, safety, SMS, aftercare, deposit, tax, liability, and SaaS copy must be committed.");
  if (!input.placeholderCopyRemoved) blockers.push("Placeholder and non-attorney-reviewed copy must be removed from public pages before launch.");
  if (!input.noindexRemovedAfterApproval) blockers.push("Noindex must stay in place until attorney approval and reviewed copy are committed, then removal must be verified.");
  if (!input.consentVersionPersistenceConfigured) blockers.push("Consent document version persistence must be configured for each accepted consent surface.");
  if (!input.studioPolicyVersionPersistenceConfigured) blockers.push("Studio policy version persistence must be configured for jurisdiction-specific policies.");
  if (!input.acceptanceAuditPersistenceConfigured) blockers.push("Acceptance audit persistence must record user, tenant, document, version, IP hash, user agent, timestamp, and source surface.");
  if (!input.dashboardAcceptanceUiWired) blockers.push("Dashboard acceptance UI must require current legal document and studio policy versions.");
  if (!input.publicPageRouteSmokePassed) blockers.push("Public legal page route smoke tests must prove reviewed copy and approved indexing state.");
  if (!input.consentAcceptanceRouteTestsPassed) blockers.push("Consent acceptance route tests must prove versioned persistence and audit-log writes.");
  if (!input.rollbackPlanDocumented) blockers.push("Rollback plan must document how to restore prior approved legal copy and acceptance versions.");

  if (!input.attorneyApprovalsRecorded || !input.allRequiredTopicsApproved || !input.jurisdictionPoliciesApproved) {
    requiredEvidence.push("attorney approval records for all required legal topics and jurisdiction policies");
  }
  if (!input.reviewedPublicPageCopyCommitted || !input.placeholderCopyRemoved || !input.noindexRemovedAfterApproval || !input.publicPageRouteSmokePassed) {
    requiredEvidence.push("reviewed public legal pages with placeholder removal and approved indexing smoke evidence");
  }
  if (!input.consentVersionPersistenceConfigured || !input.studioPolicyVersionPersistenceConfigured || !input.acceptanceAuditPersistenceConfigured || !input.consentAcceptanceRouteTestsPassed) {
    requiredEvidence.push("versioned consent/studio policy persistence plus acceptance audit route tests");
  }
  if (!input.dashboardAcceptanceUiWired || !input.rollbackPlanDocumented) {
    requiredEvidence.push("dashboard acceptance UI proof and legal-copy rollback plan");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/web/tests/legal-pages-route.test.ts apps/web/tests/consent-acceptance-route.test.ts",
      "node scripts/legal/verify-approved-legal-pages.mjs",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildPaymentPolicyLegalReviewRuntimeReadinessPlan(
  input: PaymentPolicyLegalReviewRuntimeReadinessInput,
): PaymentPolicyLegalReviewRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/security package script is missing ${script}.`);
  if (!input.securityTestsPassed) blockers.push("@inkroute/security legal review tests must pass.");
  if (!input.securityTypecheckPassed) blockers.push("@inkroute/security typecheck must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with approved public legal/payment copy.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with approved payment operations copy.");
  if (!input.attorneyApprovalRecorded) blockers.push("Attorney approval must be recorded for payment, cancellation, no-show, refund, SMS, receipt, and liability language.");
  if (!input.taxAccountingApprovalRecorded) blockers.push("Tax/accounting approval must be recorded for receipt and accounting export language.");
  if (!input.reviewedPaymentCopyCommitted) blockers.push("Reviewed deposit/payment copy must be committed.");
  if (!input.reviewedCancellationCopyCommitted) blockers.push("Reviewed cancellation copy must be committed.");
  if (!input.reviewedNoShowCopyCommitted) blockers.push("Reviewed no-show copy must be committed.");
  if (!input.reviewedRefundCopyCommitted) blockers.push("Reviewed refund copy must be committed.");
  if (!input.reviewedSmsConsentCopyCommitted) blockers.push("Reviewed SMS consent, STOP, HELP, and quiet-hours copy must be committed.");
  if (!input.reviewedReceiptCopyCommitted) blockers.push("Reviewed receipt copy must be committed.");
  if (!input.reviewedTaxDisclosureCopyCommitted) blockers.push("Reviewed tax/accounting disclosure copy must be committed.");
  if (!input.termsPrivacyConsentUpdated) blockers.push("Terms, privacy, consent, and studio policy documents must be updated with reviewed payment policy language.");
  if (!input.placeholdersRemovedFromPaymentFlows) blockers.push("Demo/planning placeholders must be removed from payment-facing flows before launch.");
  if (!input.acceptanceAuditConfigured) blockers.push("Versioned acceptance audit must record legal document versions accepted by clients/users.");
  if (!input.policyVersioningConfigured) blockers.push("Payment policy versions must be attached to bookings, deposits, receipts, and exports.");
  if (!input.e2eApprovedLanguageVerified) blockers.push("E2E flows must verify approved payment/refund/no-show/SMS/receipt/tax language is displayed.");
  if (!input.rollbackCopyPlanDocumented) blockers.push("Rollback plan for correcting approved policy copy must be documented.");

  if (!input.attorneyApprovalRecorded || !input.taxAccountingApprovalRecorded) {
    requiredEvidence.push("signed attorney and tax/accounting approval records for payment policy language");
  }
  if (
    !input.reviewedPaymentCopyCommitted ||
    !input.reviewedCancellationCopyCommitted ||
    !input.reviewedNoShowCopyCommitted ||
    !input.reviewedRefundCopyCommitted ||
    !input.reviewedSmsConsentCopyCommitted ||
    !input.reviewedReceiptCopyCommitted ||
    !input.reviewedTaxDisclosureCopyCommitted
  ) {
    requiredEvidence.push("committed reviewed copy for deposits, cancellation, no-show, refund, SMS, receipts, and tax disclosures");
  }
  if (!input.termsPrivacyConsentUpdated || !input.acceptanceAuditConfigured || !input.policyVersioningConfigured) {
    requiredEvidence.push("versioned Terms/Privacy/Consent/studio policy updates plus acceptance audit evidence");
  }
  if (!input.placeholdersRemovedFromPaymentFlows || !input.e2eApprovedLanguageVerified) {
    requiredEvidence.push("E2E screenshots or test output proving approved copy appears in booking, dashboard payment, receipt, and SMS flows");
  }
  if (!input.rollbackCopyPlanDocumented) requiredEvidence.push("documented policy-copy correction and rollback plan");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/dashboard typecheck",
      "payment policy approved-copy E2E sweep",
      "legal/tax approval packet review",
    ],
    requiredEvidence,
    blockers,
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

export function buildPrivateStorageRuntimeReadinessPlan(
  input: PrivateStorageRuntimeReadinessInput,
): PrivateStorageRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking private storage ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking private storage ready.");
  if (!input.storageProviderConfigured) blockers.push("S3 or Supabase private object storage provider must be configured.");
  if (!input.storageEnvVarsConfigured) blockers.push("Private storage bucket, region, endpoint, and signing environment variables must be configured.");
  if (!input.privateBucketAclVerified) blockers.push("Private bucket ACLs must deny public reads for original reference, consent, healed-photo, and document assets.");
  if (!input.serverOwnedObjectKeysEnforced) blockers.push("Upload and download flows must use server-owned tenant/asset/subject object keys.");
  if (!input.signedUploadUrlsImplemented) blockers.push("Provider signed upload URLs must be implemented with operation, object key, content type, and expiry scope.");
  if (!input.signedDownloadUrlsImplemented) blockers.push("Provider signed download URLs must be implemented with scan, expiry, revocation, and tenant checks.");
  if (!input.fileAssetPersistenceConfigured) blockers.push("FileAsset persistence must record object key, owner, scan status, derivative key, ACL, and retention metadata.");
  if (!input.signedUrlGrantPersistenceConfigured) blockers.push("SignedUrlGrant persistence must record issuer, recipient, object key, scope, expiry, and use status.");
  if (!input.signedUrlRevocationPersistenceConfigured) blockers.push("Signed URL revocation persistence must be checked before every private download grant.");
  if (!input.auditLogPersistenceConfigured) blockers.push("AuditLog persistence must cover signed URL creation, download, revocation, and derivative publication.");
  if (!input.scanApprovalGateEnforced) blockers.push("Private downloads and public derivative publication must require approved scan status.");
  if (!input.publicDerivativeSeparationEnforced) blockers.push("Public portfolio reads must use separate scanned derivative object keys, never originals.");
  if (!input.privateOriginalPublicReadDenied) blockers.push("Integration tests must prove private originals cannot be read publicly.");
  if (!input.approvedDerivativePublicReadVerified) blockers.push("Integration tests must prove approved public derivatives can be read without exposing originals.");
  if (!input.tenantScopedAccessIntegrationTestsPassed) blockers.push("Tenant-scoped storage access integration tests must deny cross-tenant object keys and grants.");
  if (!input.providerSandboxIntegrationTestsPassed) blockers.push("Storage provider sandbox or emulator tests must exercise signed upload, signed download, ACL denial, and revocation.");

  if (!input.storageProviderConfigured || !input.storageEnvVarsConfigured || !input.privateBucketAclVerified) {
    requiredEvidence.push("configured S3/Supabase private bucket, signing environment, and ACL denial transcript");
  }
  if (!input.signedUploadUrlsImplemented || !input.signedDownloadUrlsImplemented || !input.serverOwnedObjectKeysEnforced) {
    requiredEvidence.push("provider signed upload/download URL implementation smoke with server-owned object keys");
  }
  if (!input.fileAssetPersistenceConfigured || !input.signedUrlGrantPersistenceConfigured || !input.signedUrlRevocationPersistenceConfigured || !input.auditLogPersistenceConfigured) {
    requiredEvidence.push("persisted FileAsset, SignedUrlGrant, revocation, and AuditLog rows for signed storage flows");
  }
  if (!input.scanApprovalGateEnforced || !input.publicDerivativeSeparationEnforced) {
    requiredEvidence.push("scan-approved private download and separate public derivative publication proof");
  }
  if (!input.privateOriginalPublicReadDenied || !input.approvedDerivativePublicReadVerified || !input.tenantScopedAccessIntegrationTestsPassed || !input.providerSandboxIntegrationTestsPassed) {
    requiredEvidence.push("private/public object access integration tests against provider sandbox or emulator");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
      "node scripts/storage/verify-private-bucket-acl.mjs",
      "node scripts/storage/verify-signed-url-grants.mjs",
    ],
    requiredEvidence,
    blockers,
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
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, redactUnknownValue(key, value)]));
}

function redactUnknownValue(fieldName: string, value: unknown): unknown {
  const redacted = redactValue(fieldName, value);
  if (redacted !== value) return redacted;

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknownValue(fieldName, item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, redactUnknownValue(key, nested)]));
  }

  return value;
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

function normalizeAbuseKeyPart(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export function buildAbuseControlPlan(input: AbuseControlInput): AbuseControlPlan {
  const rule = rateLimitRules.find((candidate) => candidate.id === input.ruleId);
  const rateLimit = evaluateRateLimitDraft({
    ruleId: input.ruleId,
    observedRequests: input.observedRequests,
    windowSeconds: input.windowSeconds,
  });
  const signals: AbuseSignal[] = [];
  const blockers: string[] = [];
  const tenantId = normalizeAbuseKeyPart(input.tenantId, "tenant_unknown");
  const ipHash = normalizeAbuseKeyPart(input.ipHash, "ip_unavailable");

  if (!input.redisConfigured) blockers.push("Distributed Redis/edge rate limiter must be configured before production abuse controls are ready.");
  if (!input.botChallengeConfigured) blockers.push("Bot challenge provider or proof-of-work strategy must be configured for suspicious public traffic.");
  if (!input.alertingConfigured) blockers.push("Abuse alerting must be configured before throttling incidents can page or notify operators.");
  if (!input.userAgent?.trim()) signals.push("missing_user_agent");
  if (input.routePath.includes("..") || input.routePath.includes("%2e") || input.routePath.includes("<script")) signals.push("suspicious_path");
  if (rateLimit.status === "throttle") signals.push("high_request_count");
  if (input.providerWebhook && input.providerSignatureValid) signals.push("provider_signature_valid");
  if (input.providerWebhook && !input.providerSignatureValid) signals.push("provider_signature_missing");
  if (ipHash.includes("test") || input.userAgent?.toLowerCase().includes("vitest")) signals.push("known_test_fixture");

  const providerBypassAllowed = Boolean(input.providerWebhook && input.providerSignatureValid && rule?.keyStrategy === "provider_signature");
  const action: BotChallengeAction = providerBypassAllowed
    ? "provider_bypass"
    : rateLimit.status === "throttle"
      ? "throttle"
      : signals.includes("missing_user_agent") || signals.includes("suspicious_path") || signals.includes("provider_signature_missing")
        ? "challenge"
        : "allow";
  const shouldAlert = action === "throttle" || signals.includes("provider_signature_missing") || signals.includes("suspicious_path");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action,
    rateLimit,
    key: `${input.ruleId}:${tenantId}:${rule?.keyStrategy === "user_tenant" ? normalizeAbuseKeyPart(input.userId, "user_unknown") : ipHash}`,
    signals,
    ...(action === "throttle" ? { retryAfterSeconds: rule?.windowSeconds ?? input.windowSeconds } : {}),
    providerBypassAllowed,
    privacySafeLog: {
      routePath: input.routePath,
      tenantId,
      ipHash,
      ...(input.userId ? { userId: input.userId } : {}),
      signals,
      action,
    },
    blockers,
    alert: {
      shouldAlert,
      reason: shouldAlert ? "Abuse control detected throttling, suspicious path, or invalid provider signature." : "No abuse alert required for this request.",
    },
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

export function buildPrivacyRetentionRuntimeReadinessPlan(input: PrivacyRetentionRuntimeReadinessInput): PrivacyRetentionRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.packageTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking privacy retention ready.");
  if (!input.packageTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking privacy retention ready.");
  if (!input.attorneyApprovalRecorded) blockers.push("Attorney approval must be recorded for retention, deletion, anonymization, legal hold, and user notification workflows.");
  if (!input.privacyCaseStoreConfigured) blockers.push("Privacy request case records must be persisted before intake can be production-ready.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Privacy case, export, deletion, anonymization, legal hold, and notification audit events must be persisted.");
  if (!input.identityVerificationWorkerConfigured) blockers.push("Identity verification worker must gate privacy request execution.");
  if (!input.exportWorkerConfigured) blockers.push("Export worker must be configured for client profile, medical note, file, message, payment, and error report data.");
  if (!input.deleteAnonymizeWorkerConfigured) blockers.push("Deletion/anonymization worker must be configured for Prisma-owned privacy data.");
  if (!input.storageDeletionConfigured) blockers.push("Object storage deletion must be configured for private reference, consent, document, and follow-up files.");
  if (!input.retentionScheduleApproved) blockers.push("Attorney-approved retention schedule must be available to workers.");
  if (!input.prismaExecutionVerified) blockers.push("Prisma export/delete/anonymization execution must be verified against privacy fixtures.");
  if (!input.objectStorageExecutionVerified) blockers.push("Object storage export/delete execution must be verified against private file fixtures.");
  if (!input.legalHoldWorkflowConfigured) blockers.push("Legal hold workflow must prevent destructive actions for protected consent, payment, and audit categories.");
  if (!input.backupRestorePolicyDocumented) blockers.push("Backup and restore implications must be documented before destructive privacy enforcement.");
  if (!input.restoreTombstoneReplayVerified) blockers.push("Restore jobs must replay deletion/anonymization tombstones before restored data becomes queryable.");
  if (!input.tenantIsolationVerified) blockers.push("Privacy workers must verify tenant isolation for cross-tenant export/delete attempts.");
  if (!input.notificationCopyApproved) blockers.push("Attorney-reviewed privacy request notification copy must be approved before production sends.");
  if (!input.dryRunEvidenceCollected) blockers.push("Dry-run evidence must include case records, worker outputs, audit rows, storage actions, and backup/restore reconciliation.");

  if (!input.attorneyApprovalRecorded || !input.retentionScheduleApproved) {
    requiredEvidence.push("attorney-approved privacy retention and deletion schedule");
  }
  if (!input.privacyCaseStoreConfigured || !input.auditLogPersistenceConfigured) {
    requiredEvidence.push("persisted PrivacyCase and AuditLog records for intake, identity, worker execution, notification, and closure");
  }
  if (!input.prismaExecutionVerified || !input.objectStorageExecutionVerified || !input.storageDeletionConfigured) {
    requiredEvidence.push("Prisma and object-storage export/delete/anonymization dry-run output");
  }
  if (!input.backupRestorePolicyDocumented || !input.restoreTombstoneReplayVerified) {
    requiredEvidence.push("backup/restore tombstone replay policy and drill evidence");
  }
  if (!input.tenantIsolationVerified) {
    requiredEvidence.push("cross-tenant privacy worker denial tests");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/security test -- privacy-workers",
      "node scripts/privacy/run-retention-dry-run.mjs",
      "node scripts/privacy/verify-backup-restore-tombstones.mjs",
    ],
    requiredEvidence,
    blockers,
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

export function buildPrivacyRequestRuntimeReadinessPlan(
  input: PrivacyRequestRuntimeReadinessInput,
): PrivacyRequestRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking privacy requests ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking privacy requests ready.");
  if (!input.publicRouteTestsPassed) blockers.push("Public privacy request route tests must pass for structured errors, tenant lookup, and demo persistence.");
  if (!input.dashboardRouteTestsPassed) blockers.push("Dashboard privacy request route tests must pass for tenant scope, role denial, redaction, and persistence.");
  if (!input.privacyCasePersistenceConfigured) blockers.push("PrivacyRequest case persistence must store requester, tenant, type, status, identity proof, due dates, and fulfillment metadata.");
  if (!input.identityProofingConfigured) blockers.push("Identity verification must gate export, delete, anonymize, and rectification execution.");
  if (!input.tenantRelationshipProofingConfigured) blockers.push("Tenant/member relationship proofing must bind requester claims to the tenant data being exported or deleted.");
  if (!input.requesterMismatchDenied) blockers.push("Requester identity and tenant mismatch denial tests must pass before production execution.");
  if (!input.exportWorkerConfigured) blockers.push("Export worker must assemble tenant-scoped profile, booking, consent, file, message, payment, and audit-safe artifacts.");
  if (!input.deleteAnonymizeRectifyWorkersConfigured) blockers.push("Delete, anonymize, and rectification workers must be configured for Postgres-owned privacy data.");
  if (!input.storageExportDeleteConfigured) blockers.push("Storage export/delete workflow must handle private reference, consent, healed-photo, document, and public derivative objects.");
  if (!input.thirdPartyRedactionConfigured) blockers.push("Exports must redact third-party artist/client/payment/provider data before delivery.");
  if (!input.legalHoldHandlingConfigured) blockers.push("Legal hold handling must retain protected consent, payment, tax, and audit data while explaining partial denial.");
  if (!input.notificationProviderConfigured) blockers.push("Notification provider must send intake, verification, status, fulfillment, and denial updates.");
  if (!input.notificationTemplatesApproved) blockers.push("Attorney-approved privacy request notification templates must be versioned before production sends.");
  if (!input.auditLogPersistenceConfigured) blockers.push("AuditLog persistence must cover intake, identity proofing, worker execution, export delivery, deletion/anonymization, legal hold, and closure.");
  if (!input.statusTransitionPersistenceConfigured) blockers.push("PrivacyRequest status transitions must be persisted for intake, verification, processing, review, completed, denied, and legal-hold states.");
  if (!input.tenantIsolationIntegrationTestsPassed) blockers.push("Tenant-isolation integration tests must deny cross-tenant privacy exports and deletions.");
  if (!input.postgresStorageIntegrationTestsPassed) blockers.push("Postgres and object-storage integration tests must prove export/delete/anonymize execution and audit persistence.");

  if (!input.privacyCasePersistenceConfigured || !input.statusTransitionPersistenceConfigured || !input.auditLogPersistenceConfigured) {
    requiredEvidence.push("persisted PrivacyRequest status transitions and AuditLog records");
  }
  if (!input.identityProofingConfigured || !input.tenantRelationshipProofingConfigured || !input.requesterMismatchDenied || !input.tenantIsolationIntegrationTestsPassed) {
    requiredEvidence.push("identity, tenant relationship, requester mismatch, and cross-tenant denial proof");
  }
  if (!input.exportWorkerConfigured || !input.deleteAnonymizeRectifyWorkersConfigured || !input.storageExportDeleteConfigured || !input.postgresStorageIntegrationTestsPassed) {
    requiredEvidence.push("Postgres and object-storage export/delete/anonymize worker integration output");
  }
  if (!input.thirdPartyRedactionConfigured || !input.legalHoldHandlingConfigured) {
    requiredEvidence.push("third-party redaction and legal-retention hold execution evidence");
  }
  if (!input.notificationProviderConfigured || !input.notificationTemplatesApproved) {
    requiredEvidence.push("approved notification templates and provider delivery transcript");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/privacy-requests-dashboard-route.test.ts",
      "node scripts/privacy/verify-privacy-request-workers.mjs",
      "node scripts/privacy/verify-privacy-request-notifications.mjs",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildRetentionEnforcementRuntimeReadinessPlan(
  input: RetentionEnforcementRuntimeReadinessInput,
): RetentionEnforcementRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking retention enforcement ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking retention enforcement ready.");
  if (!input.attorneyRetentionScheduleApproved) blockers.push("Attorney-approved retention, deletion, anonymization, export, and legal-hold schedule must be recorded.");
  if (!input.scheduledWorkerConfigured) blockers.push("Scheduled retention worker must execute due DB and storage actions on an approved cadence.");
  if (!input.workerIdempotencyConfigured) blockers.push("Retention workers must be idempotent across retries, partial failures, and duplicate schedule ticks.");
  if (!input.postgresRetentionExecutionVerified) blockers.push("Postgres retention execution must be verified for delete, anonymize, retain, export, and legal-hold actions.");
  if (!input.objectStorageRetentionExecutionVerified) blockers.push("Object-storage retention execution must be verified for private files, consent signatures, documents, and derivatives.");
  if (!input.exportArtifactGenerationVerified) blockers.push("Export artifact generation must be verified for client, booking, consent, file, message, payment, audit-safe, and error-report data.");
  if (!input.deletionTombstonePersistenceConfigured) blockers.push("Deletion tombstones must persist tenant, record, category, action, reason, timestamp, and worker run identifiers.");
  if (!input.anonymizationTombstonePersistenceConfigured) blockers.push("Anonymization tombstones must persist field/category redaction evidence and worker run identifiers.");
  if (!input.restoreTombstoneReplayVerified) blockers.push("Restore jobs must replay deletion and anonymization tombstones before restored data becomes queryable.");
  if (!input.backupRetentionPolicyDocumented) blockers.push("Backup retention policy must document tombstone replay, restore limits, and legal-hold exceptions.");
  if (!input.legalHoldEnforcementVerified) blockers.push("Legal hold enforcement must retain protected consent, payment, tax, and audit records while blocking destructive actions.");
  if (!input.auditLogPersistenceConfigured) blockers.push("AuditLog persistence must cover dry-run decisions, execution attempts, tombstones, exports, holds, restores, and failures.");
  if (!input.tenantIsolationIntegrationTestsPassed) blockers.push("Tenant-isolation integration tests must deny cross-tenant retention, export, deletion, and restore actions.");
  if (!input.dryRunToExecutionReconciliationVerified) blockers.push("Dry-run decisions must reconcile to executed DB/storage actions, tombstones, audit rows, and skipped legal holds.");
  if (!input.destructiveActionRollbackDocumented) blockers.push("Rollback and incident response notes must exist for failed or accidental destructive retention actions.");

  if (!input.attorneyRetentionScheduleApproved || !input.legalHoldEnforcementVerified) {
    requiredEvidence.push("attorney-approved retention schedule and legal-hold enforcement transcript");
  }
  if (!input.scheduledWorkerConfigured || !input.workerIdempotencyConfigured || !input.dryRunToExecutionReconciliationVerified) {
    requiredEvidence.push("scheduled idempotent worker run with dry-run-to-execution reconciliation");
  }
  if (!input.postgresRetentionExecutionVerified || !input.objectStorageRetentionExecutionVerified || !input.exportArtifactGenerationVerified) {
    requiredEvidence.push("Postgres, object-storage, and export artifact retention execution output");
  }
  if (!input.deletionTombstonePersistenceConfigured || !input.anonymizationTombstonePersistenceConfigured || !input.restoreTombstoneReplayVerified || !input.backupRetentionPolicyDocumented) {
    requiredEvidence.push("deletion/anonymization tombstone persistence plus backup restore replay drill");
  }
  if (!input.auditLogPersistenceConfigured || !input.tenantIsolationIntegrationTestsPassed || !input.destructiveActionRollbackDocumented) {
    requiredEvidence.push("audit persistence, tenant-isolation tests, and destructive-action rollback documentation");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "node scripts/privacy/run-retention-dry-run.mjs",
      "node scripts/privacy/execute-retention-workers.mjs",
      "node scripts/privacy/verify-backup-restore-tombstones.mjs",
    ],
    requiredEvidence,
    blockers,
  };
}

export interface DashboardPrivacyRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  securityTestsPassed: boolean;
  securityTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  surfacesUsingProjection: readonly DashboardPrivacySurface[];
  surfacesWithRouteTests: readonly DashboardPrivacySurface[];
  legalReviewApproved: boolean;
  persistedPrivacyWorkflowsConfigured: boolean;
  exportWorkflowTested: boolean;
  deletionWorkflowTested: boolean;
  privateFileStorageDeletionTested: boolean;
  auditLogPersistenceConfigured: boolean;
  logAndErrorRedactionVerified: boolean;
  consentLanguageApproved: boolean;
  medicalLanguageApproved: boolean;
  paymentLanguageApproved: boolean;
  smsLanguageApproved: boolean;
}

export interface DashboardPrivacyRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingProjectionSurfaces: readonly DashboardPrivacySurface[];
  missingRouteTestSurfaces: readonly DashboardPrivacySurface[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
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

export function buildDashboardPrivacyRuntimeReadinessPlan(
  input: DashboardPrivacyRuntimeReadinessInput,
): DashboardPrivacyRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const requiredSurfaces: DashboardPrivacySurface[] = [
    "client_profile",
    "booking_request",
    "consent_form",
    "payment",
    "message",
    "file_asset",
  ];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const missingProjectionSurfaces = requiredSurfaces.filter((surface) => !input.surfacesUsingProjection.includes(surface));
  const missingRouteTestSurfaces = requiredSurfaces.filter((surface) => !input.surfacesWithRouteTests.includes(surface));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/security package script is missing ${script}.`);
  if (!input.securityTestsPassed) blockers.push("@inkroute/security dashboard privacy tests must pass.");
  if (!input.securityTypecheckPassed) blockers.push("@inkroute/security typecheck must pass in an installed workspace.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with privacy projections wired.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with privacy projections wired.");
  if (missingProjectionSurfaces.length > 0) blockers.push(`Dashboard privacy projection is not wired for surfaces: ${missingProjectionSurfaces.join(", ")}.`);
  if (missingRouteTestSurfaces.length > 0) blockers.push(`Route/API privacy tests are missing for surfaces: ${missingRouteTestSurfaces.join(", ")}.`);
  if (!input.legalReviewApproved) blockers.push("Attorney/product privacy review must approve dashboard consent, medical, payment, file, and SMS language.");
  if (!input.persistedPrivacyWorkflowsConfigured) blockers.push("Persisted privacy workflows must back export/delete/retention actions for dashboard data.");
  if (!input.exportWorkflowTested) blockers.push("Export workflow tests must run against persisted tenant dashboard data.");
  if (!input.deletionWorkflowTested) blockers.push("Deletion/anonymization workflow tests must run against persisted tenant dashboard data.");
  if (!input.privateFileStorageDeletionTested) blockers.push("Private file storage deletion tests must cover consent, reference, document, and message attachments.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Dashboard privacy projections and workflows must persist AuditLog records for sensitive access/actions.");
  if (!input.logAndErrorRedactionVerified) blockers.push("Dashboard logs and error reports must be verified to redact PII, medical notes, payment identifiers, file keys, and message bodies.");
  if (!input.consentLanguageApproved) blockers.push("Consent-signature dashboard language requires legal approval.");
  if (!input.medicalLanguageApproved) blockers.push("Medical-note dashboard language requires legal approval.");
  if (!input.paymentLanguageApproved) blockers.push("Payment/deposit dashboard language requires legal approval.");
  if (!input.smsLanguageApproved) blockers.push("SMS/message dashboard language requires legal approval.");

  if (missingProjectionSurfaces.length > 0 || missingRouteTestSurfaces.length > 0) {
    requiredEvidence.push("dashboard route/API privacy projection matrix for client, booking, consent, payment, message, and file surfaces");
  }
  if (!input.legalReviewApproved || !input.consentLanguageApproved || !input.medicalLanguageApproved || !input.paymentLanguageApproved || !input.smsLanguageApproved) {
    requiredEvidence.push("attorney/product approval record for dashboard privacy, consent, medical, deposit, and SMS copy");
  }
  if (!input.persistedPrivacyWorkflowsConfigured || !input.exportWorkflowTested || !input.deletionWorkflowTested) {
    requiredEvidence.push("persisted export/delete/anonymization workflow test output for tenant dashboard data");
  }
  if (!input.privateFileStorageDeletionTested) requiredEvidence.push("private file storage deletion test output");
  if (!input.auditLogPersistenceConfigured || !input.logAndErrorRedactionVerified) {
    requiredEvidence.push("AuditLog persistence and sanitized log/error evidence for dashboard privacy actions");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingProjectionSurfaces,
    missingRouteTestSurfaces,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test -- dashboard-privacy",
      "pnpm --filter @inkroute/security test -- privacy",
    ],
    requiredEvidence,
    blockers,
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

export function buildAbuseControlRuntimeReadinessPlan(
  input: AbuseControlRuntimeReadinessInput,
): AbuseControlRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking abuse controls ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking abuse controls ready.");
  if (!input.distributedLimiterConfigured) blockers.push("Distributed Redis/Upstash or edge rate limiter must be configured for production routes.");
  if (!input.limiterEnvVarsConfigured) blockers.push("Limiter provider URL, token, namespace, and route-policy environment variables must be configured.");
  if (!input.edgeOrMiddlewareWired) blockers.push("Web/dashboard edge middleware or route middleware must enforce abuse controls before handlers run.");
  if (!input.routeFamilyPoliciesApplied) blockers.push("Public booking, upload, privacy, message, error-report, and provider webhook route-family policies must be applied.");
  if (!input.tenantSafeKeysVerified) blockers.push("Rate-limit keys must hash IP/user identifiers and include tenant/route family without storing raw PII.");
  if (!input.botChallengeProviderConfigured) blockers.push("Bot challenge provider or challenge strategy must be configured for suspicious public traffic.");
  if (!input.botChallengeRouteTestsPassed) blockers.push("Route tests must prove suspicious public requests receive challenge responses before handler execution.");
  if (!input.providerWebhookSignatureBypassVerified) blockers.push("Signed provider webhooks must bypass public bot challenges while retaining signature and replay validation.");
  if (!input.invalidWebhookSignatureChallengeVerified) blockers.push("Invalid provider webhook signatures must be challenged or rejected and counted for abuse alerting.");
  if (!input.privacySafeAbuseLogPersistenceConfigured) blockers.push("Privacy-safe AbuseEvent persistence must record hashed actor keys, tenant, route family, action, and reason.");
  if (!input.abuseLogRedactionVerified) blockers.push("Abuse logs must prove raw IPs, tokens, payloads, signatures, and message bodies are redacted.");
  if (!input.alertDeliveryConfigured) blockers.push("Alert delivery must be configured for throttling spikes, invalid signatures, limiter failures, and challenge surges.");
  if (!input.throttlingAlertSmokePassed) blockers.push("Alert smoke tests must prove throttling and invalid-signature events reach the configured alert channel.");
  if (!input.failClosedBehaviorVerified) blockers.push("Limiter/provider failure behavior must fail closed for public mutation routes and fail safe for signed provider callbacks.");
  if (!input.publicRouteIntegrationTestsPassed) blockers.push("Public route integration tests must prove limiter decisions across booking, upload, privacy, message, and fallback error-report routes.");

  if (!input.distributedLimiterConfigured || !input.limiterEnvVarsConfigured || !input.edgeOrMiddlewareWired || !input.routeFamilyPoliciesApplied) {
    requiredEvidence.push("live distributed limiter configuration and middleware route-family enforcement proof");
  }
  if (!input.tenantSafeKeysVerified || !input.privacySafeAbuseLogPersistenceConfigured || !input.abuseLogRedactionVerified) {
    requiredEvidence.push("privacy-safe hashed abuse keys and redacted AbuseEvent persistence evidence");
  }
  if (!input.botChallengeProviderConfigured || !input.botChallengeRouteTestsPassed) {
    requiredEvidence.push("bot challenge provider configuration and suspicious-route challenge tests");
  }
  if (!input.providerWebhookSignatureBypassVerified || !input.invalidWebhookSignatureChallengeVerified || !input.failClosedBehaviorVerified) {
    requiredEvidence.push("provider webhook bypass, invalid signature challenge, replay validation, and fail-closed behavior tests");
  }
  if (!input.alertDeliveryConfigured || !input.throttlingAlertSmokePassed || !input.publicRouteIntegrationTestsPassed) {
    requiredEvidence.push("abuse alert delivery smoke and public-route limiter integration tests");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/privacy-requests-public-route.test.ts",
      "node scripts/security/verify-abuse-rate-limits.mjs",
      "node scripts/security/verify-abuse-alerts.mjs",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildSecurityMiddlewareRuntimeReadinessPlan(
  input: SecurityMiddlewareRuntimeReadinessInput,
): SecurityMiddlewareRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("Run and pass @inkroute/security tests before marking security middleware ready.");
  if (!input.securityTypecheckPassed) blockers.push("Run and pass @inkroute/security typecheck before marking security middleware ready.");
  if (!input.webMiddlewareWired) blockers.push("Web app middleware or config must apply shared security headers and CSRF enforcement to runtime routes.");
  if (!input.dashboardMiddlewareWired) blockers.push("Dashboard middleware or config must apply shared security headers and CSRF enforcement to runtime routes.");
  if (!input.webHeaderBrowserSmokePassed) blockers.push("Browser smoke tests must prove web pages emit CSP, nosniff, referrer, permissions policy, and production-gated HSTS headers.");
  if (!input.dashboardHeaderBrowserSmokePassed) blockers.push("Browser smoke tests must prove dashboard pages emit CSP, nosniff, referrer, permissions policy, and production-gated HSTS headers.");
  if (!input.productionHstsDeploymentVerified) blockers.push("Production HTTPS deployment must verify HSTS is enabled only where preload policy is safe.");
  if (!input.previewLocalHstsSuppressionVerified) blockers.push("Preview and local environments must prove HSTS suppression to avoid poisoning local development or previews.");
  if (!input.cspProviderConnectSourcesVerified) blockers.push("CSP connect-src must be verified against live Sentry, Stripe, storage, analytics, and API providers.");
  if (!input.cspFrameBaseFormInvariantsVerified) blockers.push("CSP frame-ancestors, base-uri, and form-action invariants must be tested against runtime responses.");
  if (!input.csrfCookieMutationAttackTestsPassed) blockers.push("Cookie-authenticated POST/PATCH/DELETE attack simulations must be rejected without valid CSRF tokens.");
  if (!input.csrfValidTokenAllowTestsPassed) blockers.push("Valid CSRF token and session-bound mutation tests must pass for legitimate dashboard/web flows.");
  if (!input.sameSiteCookieBehaviorVerified) blockers.push("Session cookies must be verified as SameSite lax/strict with secure production behavior.");
  if (!input.csrfSessionBindingVerified) blockers.push("CSRF tokens must be bound to the active session or request context before mutation allowance.");
  if (!input.providerWebhookCsrfBypassReviewed) blockers.push("Provider webhook CSRF bypass rules must be reviewed so signed callbacks bypass CSRF without weakening public mutations.");
  if (!input.routeRuntimeIntegrationTestsPassed) blockers.push("Runtime route integration tests must cover web/dashboard middleware headers and CSRF decisions.");

  if (!input.webMiddlewareWired || !input.dashboardMiddlewareWired || !input.routeRuntimeIntegrationTestsPassed) {
    requiredEvidence.push("web/dashboard middleware wiring plus runtime route integration tests");
  }
  if (!input.webHeaderBrowserSmokePassed || !input.dashboardHeaderBrowserSmokePassed || !input.productionHstsDeploymentVerified || !input.previewLocalHstsSuppressionVerified) {
    requiredEvidence.push("browser header smoke tests with production HSTS and preview/local HSTS suppression proof");
  }
  if (!input.cspProviderConnectSourcesVerified || !input.cspFrameBaseFormInvariantsVerified) {
    requiredEvidence.push("runtime CSP provider connect-src and frame/base/form invariant verification");
  }
  if (!input.csrfCookieMutationAttackTestsPassed || !input.csrfValidTokenAllowTestsPassed || !input.sameSiteCookieBehaviorVerified || !input.csrfSessionBindingVerified || !input.providerWebhookCsrfBypassReviewed) {
    requiredEvidence.push("CSRF attack/allow simulations, SameSite session behavior, token binding, and signed webhook bypass review");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/security-runtime-middleware.test.ts apps/web/tests/security-runtime-middleware-static.test.ts apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
      "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
      "node scripts/security/verify-runtime-security-headers.mjs",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildSecurityAutomatedCoverageReadinessPlan(
  input: SecurityAutomatedCoverageReadinessInput,
): SecurityAutomatedCoverageReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityPackageTestsPassed) blockers.push("@inkroute/security package tests must execute and pass with upload, privacy, abuse, header, CSRF, and readiness coverage.");
  if (!input.securityPackageTypecheckPassed) blockers.push("@inkroute/security typecheck must execute and pass.");
  if (!input.routeVitestSuitePassed) blockers.push("Security route Vitest suite must pass for secure uploads, privacy requests, dashboard privacy, and trust-status tenant/role denial.");
  if (!input.middlewareRuntimeSuitePassed) blockers.push("Runtime middleware Vitest suite must pass for web/dashboard CSRF block/allow and shared headers.");
  if (!input.middlewareStaticSuitePassed) blockers.push("Static middleware and Next config suites must prove web/dashboard wiring and security package transpilation.");
  if (!input.webE2eSecuritySuitePassed) blockers.push("Web Playwright security smoke must pass for headers and cookie-authenticated CSRF rejection.");
  if (!input.dashboardE2eSecuritySuitePassed) blockers.push("Dashboard Playwright security smoke must pass for headers and cookie-authenticated CSRF rejection.");
  if (!input.fullUnitSuitePassed) blockers.push("Full unit test command must pass after security route/runtime suites are added.");
  if (!input.ciSecurityChecksPassed) blockers.push("CI security and quality checks must pass with security suites included in manifests.");
  if (!input.testManifestIncludesSecuritySuites) blockers.push("Unit/E2E/security manifests must include the route, middleware, static, and E2E security suites.");
  if (!input.dbBackedTenantIsolationTestsPassed) blockers.push("DB-backed authenticated tenant-isolation tests must pass for privacy, trust, upload, and dashboard boundaries.");
  if (!input.storageProviderNegativeTestsPassed) blockers.push("Storage provider or emulator negative tests must pass for unsafe upload, private original public denial, signed URL revocation, and derivative exposure.");
  if (!input.privacyWorkflowIntegrationTestsPassed) blockers.push("Privacy workflow integration tests must pass with real auth/Postgres/storage or emulator-backed fixtures.");
  if (!input.authenticatedRoleBoundaryTestsPassed) blockers.push("Authenticated role-boundary tests must pass for owner, manager, artist, assistant, and cross-tenant denial cases.");
  if (!input.coverageArtifactsCollected) blockers.push("Coverage, Playwright, CI, and provider/emulator artifacts must be collected for audit handoff.");
  if (!input.failureModeFixturesDocumented) blockers.push("Security failure-mode fixtures must document upload, privacy, trust, middleware, CSRF, and provider-backed negative cases.");

  if (!input.securityPackageTestsPassed || !input.securityPackageTypecheckPassed || !input.fullUnitSuitePassed || !input.ciSecurityChecksPassed) {
    requiredEvidence.push("executed package typecheck/tests, full unit suite, and CI security check transcript");
  }
  if (!input.routeVitestSuitePassed || !input.middlewareRuntimeSuitePassed || !input.middlewareStaticSuitePassed || !input.testManifestIncludesSecuritySuites) {
    requiredEvidence.push("route, runtime middleware, static wiring, and manifest verification test output");
  }
  if (!input.webE2eSecuritySuitePassed || !input.dashboardE2eSecuritySuitePassed) {
    requiredEvidence.push("web and dashboard Playwright security smoke artifacts");
  }
  if (!input.dbBackedTenantIsolationTestsPassed || !input.authenticatedRoleBoundaryTestsPassed || !input.privacyWorkflowIntegrationTestsPassed) {
    requiredEvidence.push("authenticated DB-backed tenant isolation, role-boundary, and privacy workflow integration output");
  }
  if (!input.storageProviderNegativeTestsPassed || !input.coverageArtifactsCollected || !input.failureModeFixturesDocumented) {
    requiredEvidence.push("storage provider negative-test artifacts, coverage bundle, and documented security failure fixtures");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/privacy-requests-dashboard-route.test.ts apps/web/tests/dashboard-trust-status-route.test.ts apps/web/tests/security-runtime-middleware.test.ts apps/web/tests/security-runtime-middleware-static.test.ts apps/web/tests/dashboard-security-runtime-middleware-static.test.ts packages/security/tests/upload-policy.test.ts",
      "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
      "pnpm test:unit",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildSecurityAppRuntimeVerificationPlan(
  input: SecurityAppRuntimeVerificationInput,
): SecurityAppRuntimeVerificationPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (missingScripts.length > 0) blockers.push(`Missing @inkroute/security package script(s): ${missingScripts.join(", ")}.`);
  if (!input.securityTestsPassed) blockers.push("@inkroute/security tests must pass before app runtime verification can close.");
  if (!input.securityTypecheckPassed) blockers.push("@inkroute/security typecheck must pass before app runtime verification can close.");
  if (!input.webTypecheckPassed) blockers.push("Web app typecheck must pass with Phase 13 security imports, routes, pages, and middleware.");
  if (!input.webBuildPassed) blockers.push("Web app build must pass under real Next dependencies with security pages, public routes, and middleware.");
  if (!input.dashboardTypecheckPassed) blockers.push("Dashboard app typecheck must pass with Phase 13 security API routes, trust page, and middleware.");
  if (!input.dashboardBuildPassed) blockers.push("Dashboard app build must pass under real Next dependencies with security pages, API routes, and middleware.");
  if (!input.mobileTypecheckPassed) blockers.push("Mobile app typecheck must pass with SystemStatus security, tenant-isolation, privacy, and upload preview surfaces.");
  if (!input.nextConfigStaticTestsPassed) blockers.push("Next config static tests must prove web/dashboard transpile @inkroute/security and preserve runtime security imports.");
  if (!input.mobileSecurityStaticTestsPassed) blockers.push("Mobile security static tests must prove SystemStatus security posture and upload/privacy preview wiring.");
  if (!input.webSecurityRoutesSmokePassed) blockers.push("Web route smoke tests must exercise trust, privacy, legal, consent, and secure-upload surfaces.");
  if (!input.dashboardSecurityRoutesSmokePassed) blockers.push("Dashboard route smoke tests must exercise trust-status and privacy request security APIs.");
  if (!input.webMiddlewareRuntimeSmokePassed) blockers.push("Web middleware runtime smoke must prove shared security headers and CSRF rejection execute at app boundary.");
  if (!input.dashboardMiddlewareRuntimeSmokePassed) blockers.push("Dashboard middleware runtime smoke must prove shared security headers and CSRF rejection execute at app boundary.");
  if (!input.mobileSystemStatusScreenSmokePassed) blockers.push("Mobile SystemStatus screen smoke must prove security posture, privacy, tenant isolation, and upload preview render under app dependencies.");
  if (!input.browserRuntimeSmokePassed) blockers.push("Browser runtime smoke must prove web/dashboard Phase 13 surfaces load with headers and without integration errors.");
  if (!input.deviceRuntimeSmokePassed) blockers.push("Device or emulator smoke must prove mobile Phase 13 security surfaces load without dependency/runtime errors.");
  if (!input.ciRuntimeEvidenceCollected) blockers.push("CI/runtime artifact evidence must be collected for web, dashboard, mobile, route, middleware, browser, and device smoke commands.");

  if (!input.webTypecheckPassed || !input.webBuildPassed || !input.dashboardTypecheckPassed || !input.dashboardBuildPassed || !input.mobileTypecheckPassed) {
    requiredEvidence.push("web/dashboard/mobile typecheck and build command output");
  }
  if (!input.nextConfigStaticTestsPassed || !input.mobileSecurityStaticTestsPassed) {
    requiredEvidence.push("Next config and mobile security static test output");
  }
  if (!input.webSecurityRoutesSmokePassed || !input.dashboardSecurityRoutesSmokePassed || !input.webMiddlewareRuntimeSmokePassed || !input.dashboardMiddlewareRuntimeSmokePassed) {
    requiredEvidence.push("web/dashboard route and middleware runtime smoke transcripts");
  }
  if (!input.mobileSystemStatusScreenSmokePassed || !input.browserRuntimeSmokePassed || !input.deviceRuntimeSmokePassed || !input.ciRuntimeEvidenceCollected) {
    requiredEvidence.push("browser, mobile device/emulator, and CI runtime artifact bundle");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "pnpm vitest run apps/web/tests/security-next-config-static.test.ts apps/mobile/tests/mobile-security-static.test.ts",
      "pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
    ],
    requiredEvidence,
    blockers,
  };
}

export function buildSecurityRuntimeEnforcementPlan(input: SecurityRuntimeEnforcementInput): SecurityRuntimeEnforcementPlan {
  const headers = buildSecurityHeaderPlan([...(input.extraConnectSources ?? [])]);
  const headerNames = new Set(headers.map((header) => header.name.toLowerCase()));
  const requiredHeaders = ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"];
  const missingHeaders = requiredHeaders.filter((header) => !headerNames.has(header.toLowerCase()));
  const mutating = input.method !== "GET";
  const csrfRequired = input.cookieAuthenticatedMutation && mutating;
  const csrfAllowed = !csrfRequired || (input.csrfTokenPresent && input.csrfTokenValid && (input.sameSiteCookie === "lax" || input.sameSiteCookie === "strict"));
  const hstsEnabled = input.environment === "production" && input.httpsEnabled;
  const blockers: string[] = [];

  if (missingHeaders.length > 0) blockers.push(`Missing security headers: ${missingHeaders.join(", ")}.`);
  if (input.environment === "production" && !input.httpsEnabled) blockers.push("Production HSTS requires HTTPS to be confirmed before enabling preload policy.");
  if (csrfRequired && !csrfAllowed) blockers.push("Cookie-authenticated mutations require a valid CSRF token and SameSite lax/strict cookie policy.");
  if (input.sameSiteCookie === "none" && input.cookieAuthenticatedMutation) blockers.push("Cookie-authenticated mutation cookies must not use SameSite=None without a separate explicit review.");

  const csp = headers.find((header) => header.name === "Content-Security-Policy")?.value ?? "";
  if (!csp.includes("frame-ancestors 'none'")) blockers.push("CSP must deny framing with frame-ancestors 'none'.");
  if (!csp.includes("base-uri 'self'")) blockers.push("CSP must restrict base-uri to self.");
  if (!csp.includes("form-action 'self'")) blockers.push("CSP must restrict form-action to self until provider redirects are explicitly reviewed.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    headers: hstsEnabled ? headers : headers.filter((header) => header.name !== "Strict-Transport-Security"),
    missingHeaders,
    csrf: {
      required: csrfRequired,
      allowed: csrfAllowed,
      reason: csrfRequired
        ? csrfAllowed
          ? "Mutating cookie-authenticated request has a valid CSRF/session binding."
          : "Mutating cookie-authenticated request is missing valid CSRF/session binding."
        : "CSRF is not required for this non-mutating or non-cookie-authenticated request.",
    },
    hstsEnabled,
    blockers,
    testExpectations: [
      "Security headers include CSP, nosniff, referrer policy, permissions policy, and production-only HSTS.",
      "CSP denies framing and constrains base-uri/form-action before adding provider exceptions.",
      "Cookie-authenticated POST/PATCH/DELETE requests fail without valid CSRF token and SameSite lax/strict cookies.",
      "Provider connect-src additions are explicit and test-covered.",
    ],
  };
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

function fileAssetAccessLevel(visibility: UploadValidationResult["storageVisibility"]): FileAssetAccessLevel {
  if (visibility === "public_derivative") return "public_derivative";
  if (visibility === "client_private") return "client_private";
  if (visibility === "system_private") return "system_only";
  return "tenant_member";
}

export function buildFileAssetPersistencePlan(input: FileAssetPersistencePlanInput): FileAssetPersistencePlan {
  const blockers: string[] = [];
  const requiredWrites: FileAssetPersistencePlan["requiredWrites"] = ["FileAsset", "AuditLog"];
  const accessLevel = fileAssetAccessLevel(input.storageVisibility);
  const publicReadAllowed = input.storageVisibility === "public_derivative" && input.scanStatus === "approved" && Boolean(input.publicDerivativeObjectKey);

  if (input.kind === "reference_private") requiredWrites.push("BookingReferenceImage");
  if (input.kind === "consent_signature") requiredWrites.push("ConsentArtifact");
  if (!input.tenantId.trim()) blockers.push("Missing tenant scope for file asset persistence.");
  if (!input.subjectId.trim()) blockers.push("Missing subject id for file asset persistence.");
  if (!input.objectKey?.trim()) blockers.push("Missing private storage object key.");
  if (!input.providerConfigured) blockers.push("Object storage provider must be configured before FileAsset persistence is production-ready.");
  if (!input.fileAssetStoreConfigured) blockers.push("Tenant-scoped FileAsset store must be configured before upload metadata can persist.");
  if (!input.auditLogConfigured) blockers.push("AuditLog persistence must be configured for upload intent, scan, access, and deletion events.");
  if (input.scanStatus !== "approved") blockers.push("FileAsset cannot be exposed or finalized before upload scan approval.");
  if (input.storageVisibility === "public_derivative" && !input.publicDerivativeObjectKey) {
    blockers.push("Public portfolio assets require a separate scanned derivative object key.");
  }
  if (input.storageVisibility !== "public_derivative" && input.publicDerivativeObjectKey) {
    blockers.push("Private file kinds must not declare public derivative object keys.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    tenantId: input.tenantId,
    subjectId: input.subjectId,
    kind: input.kind,
    objectKey: input.objectKey,
    accessLevel,
    publicReadAllowed,
    requiredWrites,
    requiredFields: [
      "tenantId",
      "kind",
      "objectKey",
      "originalFilename",
      "mimeType",
      "sizeBytes",
      "storageVisibility",
      "scanStatus",
      "createdByUserId",
      "retentionCategory",
    ],
    requiredControls: [
      "Persist FileAsset metadata in the same tenant scope as the booking, consent, message, or portfolio owner.",
      "Keep original objects private; expose only approved public derivatives for portfolio assets.",
      "Require malware scan approval and metadata stripping before any read grant or derivative publication.",
      "Write AuditLog rows for upload intent creation, scan verdicts, signed URL grants, revocations, and deletion.",
      "Apply privacy retention rules to private reference, consent, document, and healed follow-up files.",
    ],
    blockers,
  };
}

export function buildTrustCenterChecklist(): SecurityControl[] {
  return phase13SecurityControls;
}
