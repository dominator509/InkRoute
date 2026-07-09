import {
  buildMobileApiRequestPlan,
  buildMobileScreenSyncRequirements,
  type MobileApiDomain,
  type MobileApiMethod,
  type MobileApiRequestPlan,
} from "@inkroute/mobile-support";

export interface MobileApiSession {
  baseUrl: string;
  tenantId: string;
  accessToken: string;
  online: boolean;
}

export interface MobileApiResponseEnvelope<T> {
  ok: boolean;
  data: T | null;
  requestId: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface MobileApiClientRequest {
  domain: MobileApiDomain;
  method: MobileApiMethod;
  path: string;
  requestId: string;
  idempotencyKey?: string;
  body?: unknown;
}

export interface MobileApiSafeRequestProof {
  domain: MobileApiDomain;
  method: MobileApiMethod;
  status: MobileApiRequestPlan["status"];
  authHeaderAttached: boolean;
  tenantHeaderAttached: boolean;
  requestIdHeaderAttached: boolean;
  idempotencyHeaderAttached: boolean;
  responseProjection: {
    rawAuthorizationHeaderEchoed: false;
    rawAccessTokenEchoed: false;
    rawTenantIdEchoed: false;
    rawRequestIdEchoed: false;
    rawIdempotencyKeyEchoed: false;
    rawUrlEchoed: false;
    rawBodyEchoed: false;
  };
}

export class MobileApiClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export function redactMobileApiError(error: unknown): { code: string; message: string } {
  if (error instanceof MobileApiClientError) {
    return { code: error.code, message: error.message };
  }

  return {
    code: "MOBILE_API_ERROR",
    message: "Mobile API request failed. Sensitive response details were redacted.",
  };
}

export function buildMobileApiClientRequestPlan(
  session: MobileApiSession,
  request: MobileApiClientRequest,
): MobileApiRequestPlan {
  return buildMobileApiRequestPlan({
    baseUrl: session.baseUrl,
    tenantId: session.tenantId,
    accessToken: session.accessToken,
    requestId: request.requestId,
    domain: request.domain,
    method: request.method,
    path: request.path,
    online: session.online,
    idempotencyKey: request.idempotencyKey,
  });
}

export function buildMobileApiSafeRequestProof(plan: MobileApiRequestPlan): MobileApiSafeRequestProof {
  return {
    domain: plan.domain,
    method: plan.method,
    status: plan.status,
    authHeaderAttached: plan.headerProof.authorizationHeaderAttached,
    tenantHeaderAttached: plan.headerProof.tenantHeaderAttached,
    requestIdHeaderAttached: plan.headerProof.requestIdHeaderAttached,
    idempotencyHeaderAttached: plan.headerProof.idempotencyHeaderAttached,
    responseProjection: {
      rawAuthorizationHeaderEchoed: false,
      rawAccessTokenEchoed: false,
      rawTenantIdEchoed: false,
      rawRequestIdEchoed: false,
      rawIdempotencyKeyEchoed: false,
      rawUrlEchoed: false,
      rawBodyEchoed: false,
    },
  };
}

export function assertMobileApiEnvelope<T>(value: unknown, requestId: string): MobileApiResponseEnvelope<T> {
  if (!value || typeof value !== "object") {
    throw new MobileApiClientError("Mobile API returned a malformed response envelope.", "INVALID_ENVELOPE");
  }

  const envelope = value as Partial<MobileApiResponseEnvelope<T>>;
  if (typeof envelope.ok !== "boolean" || envelope.requestId !== requestId || !("data" in envelope)) {
    throw new MobileApiClientError("Mobile API returned a malformed response envelope.", "INVALID_ENVELOPE");
  }

  return envelope as MobileApiResponseEnvelope<T>;
}

export async function mobileApiFetch<T>(
  session: MobileApiSession,
  request: MobileApiClientRequest,
  fetcher: typeof fetch = fetch,
): Promise<MobileApiResponseEnvelope<T>> {
  const plan = buildMobileApiClientRequestPlan(session, request);
  if (plan.status !== "ready" || !plan.url) {
    throw new MobileApiClientError(plan.blockers.join(" "), plan.status);
  }

  const response = await fetcher(plan.url, {
    method: plan.method,
    headers: {
      ...plan.headers,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new MobileApiClientError("Mobile API request failed. Sensitive response details were redacted.", "HTTP_ERROR", response.status);
  }

  return assertMobileApiEnvelope<T>(await response.json(), request.requestId);
}

export const mobileScreenApiSyncMatrix = buildMobileScreenSyncRequirements();

export const mobileApiSyncPreview = {
  domains: mobileScreenApiSyncMatrix.map((requirement) => requirement.domain),
  requiredEndpointCount: mobileScreenApiSyncMatrix.reduce((total, requirement) => total + requirement.requiredEndpoints.length, 0),
  authRequired: mobileScreenApiSyncMatrix.every((requirement) => requirement.requiresAuth),
  tenantScopeRequired: mobileScreenApiSyncMatrix.every((requirement) => requirement.requiresTenantScope),
  offlineQueueDomains: mobileScreenApiSyncMatrix.filter((requirement) => requirement.supportsOfflineQueue).map((requirement) => requirement.domain),
  responseProjection: {
    rawAuthorizationHeaderEchoed: false,
    rawAccessTokenEchoed: false,
    rawTenantIdEchoed: false,
    rawRequestIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawUrlEchoed: false,
    rawBodyEchoed: false,
  },
  boundary: "Mobile screens now share a typed API-client contract; provider auth, seeded API smoke, and runtime device sync evidence remain gated.",
};
