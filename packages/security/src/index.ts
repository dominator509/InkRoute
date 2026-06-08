import type { Permission, Role } from "@inkroute/types";

export type SecurityStatus = "implemented" | "scaffolded" | "credential_gated" | "legal_review_required" | "deployment_gated" | "blocked";
export type DataSensitivity = "public" | "internal" | "pii" | "sensitive" | "medical" | "payment" | "secret";
export type RedactionMode = "none" | "mask" | "hash_required" | "omit" | "encrypt_required";
export type UploadAssetKind = "portfolio_public" | "reference_private" | "consent_signature" | "healed_follow_up" | "document_private";
export type PrivacyRequestType = "access" | "export" | "rectification" | "deletion" | "restriction";
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

export interface LegalDocumentPlaceholder {
  slug: string;
  title: string;
  status: SecurityStatus;
  audience: "client" | "artist" | "admin" | "all";
  summary: string;
  mustBeReviewedByAttorney: boolean;
  blockedProductionActions: string[];
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
