import {
  buildSignedIcsFeedRuntimeReadinessPlan,
  buildSignedIcsFeedTokenHash,
  evaluateSignedIcsFeedAccess,
  type SignedIcsFeedAccessDecision,
  type SignedIcsFeedRuntimeReadinessPlan,
  type SignedIcsFeedTokenRecord,
} from "@inkroute/calendar";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";

export interface SignedIcsFeedTokenCreateInput {
  tenantSlug: string;
  artistSlug: string;
  token: string;
  expiresAt: string;
  createdBy: string;
}

export interface SignedIcsFeedTokenMutationResult {
  tokenHash: string;
  tenantSlug: string;
  artistSlug: string;
  expiresAt: string;
  auditAction: "created" | "rotated" | "revoked";
}

export interface SignedIcsFeedAccessLogInput {
  tenantSlug: string;
  artistSlug: string;
  tokenHash: string | null;
  status: SignedIcsFeedAccessDecision["status"];
  allowed: boolean;
  userAgent: string | null;
  ipHash: string | null;
  occurredAt: string;
}

export interface SignedIcsFeedRepository {
  createToken(input: SignedIcsFeedTokenCreateInput & { tokenHash: string }): Promise<SignedIcsFeedTokenRecord>;
  rotateToken(input: SignedIcsFeedTokenCreateInput & { previousTokenHash: string; tokenHash: string }): Promise<SignedIcsFeedTokenRecord>;
  revokeToken(input: { tenantSlug: string; artistSlug: string; tokenHash: string; revokedAt: string; actorId: string }): Promise<SignedIcsFeedTokenRecord>;
  findTokenRecord(input: { tenantSlug: string; artistSlug: string; tokenHash: string }): Promise<SignedIcsFeedTokenRecord | null>;
  persistAccessLog(input: SignedIcsFeedAccessLogInput): Promise<void>;
}

export interface SignedIcsFeedAccessEvaluation {
  decision: SignedIcsFeedAccessDecision;
  tokenHash: string | null;
}

export interface SignedIcsFeedContract {
  demoTokenRecord: SignedIcsFeedTokenRecord;
  readiness: SignedIcsFeedRuntimeReadinessPlan;
  requiredRepositoryMethods: readonly (keyof SignedIcsFeedRepository)[];
}

export interface InMemorySignedIcsFeedRepositoryState {
  readonly tokenRecords: Map<string, SignedIcsFeedTokenRecord>;
  readonly accessLogs: SignedIcsFeedAccessLogInput[];
}

export const localDemoFeedToken = "inkroute-demo-travel-feed-token";

export const localDemoFeedTokenRecord: SignedIcsFeedTokenRecord = {
  tokenHash: buildSignedIcsFeedTokenHash(localDemoFeedToken),
  tenantSlug: inkrouteDemoTenant.slug,
  artistSlug: inkrouteDemoArtist.slug,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

export function buildSignedIcsFeedReadiness(): SignedIcsFeedRuntimeReadinessPlan {
  return buildSignedIcsFeedRuntimeReadinessPlan({
    packageScripts: {
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    calendarTestsPassed: false,
    calendarTypecheckPassed: false,
    webRouteTestsPassed: false,
    webTypecheckPassed: false,
    tokenCreationImplemented: true,
    hashedTokenPersistenceConfigured: true,
    expiryRotationPersistenceConfigured: true,
    revocationUiImplemented: false,
    revocationApiImplemented: true,
    revokedTokenRouteRejectionTested: false,
    tenantArtistScopeEnforced: true,
    durableAccessLogPersistenceConfigured: true,
    privateCacheHeadersVerified: true,
    appleCalendarImportTested: false,
    googleCalendarImportTested: false,
    outlookCalendarImportTested: false,
  });
}

export function buildSignedIcsFeedContract(): SignedIcsFeedContract {
  return {
    demoTokenRecord: localDemoFeedTokenRecord,
    readiness: buildSignedIcsFeedReadiness(),
    requiredRepositoryMethods: [
      "createToken",
      "rotateToken",
      "revokeToken",
      "findTokenRecord",
      "persistAccessLog",
    ],
  };
}

export function planSignedIcsFeedTokenCreation(input: SignedIcsFeedTokenCreateInput): SignedIcsFeedTokenMutationResult {
  return {
    tokenHash: buildSignedIcsFeedTokenHash(input.token),
    tenantSlug: input.tenantSlug,
    artistSlug: input.artistSlug,
    expiresAt: input.expiresAt,
    auditAction: "created",
  };
}

export function planSignedIcsFeedTokenRotation(input: SignedIcsFeedTokenCreateInput): SignedIcsFeedTokenMutationResult {
  return {
    ...planSignedIcsFeedTokenCreation(input),
    auditAction: "rotated",
  };
}

export function planSignedIcsFeedTokenRevocation(input: {
  tenantSlug: string;
  artistSlug: string;
  tokenHash: string;
  revokedAt: string;
}): SignedIcsFeedTokenMutationResult {
  return {
    tokenHash: input.tokenHash,
    tenantSlug: input.tenantSlug,
    artistSlug: input.artistSlug,
    expiresAt: input.revokedAt,
    auditAction: "revoked",
  };
}

function buildSignedIcsFeedRepositoryKey(input: {
  readonly tenantSlug: string;
  readonly artistSlug: string;
  readonly tokenHash: string;
}): string {
  return `${input.tenantSlug}:${input.artistSlug}:${input.tokenHash}`;
}

export function createInMemorySignedIcsFeedRepository(
  state: InMemorySignedIcsFeedRepositoryState = {
    tokenRecords: new Map(),
    accessLogs: [],
  },
): SignedIcsFeedRepository & { readonly state: InMemorySignedIcsFeedRepositoryState } {
  return {
    state,
    async createToken(input) {
      const record = {
        tokenHash: input.tokenHash,
        tenantSlug: input.tenantSlug,
        artistSlug: input.artistSlug,
        expiresAt: input.expiresAt,
      };
      state.tokenRecords.set(buildSignedIcsFeedRepositoryKey(input), record);
      return record;
    },
    async rotateToken(input) {
      state.tokenRecords.delete(
        buildSignedIcsFeedRepositoryKey({
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.previousTokenHash,
        }),
      );
      return this.createToken(input);
    },
    async revokeToken(input) {
      const key = buildSignedIcsFeedRepositoryKey(input);
      const existing = state.tokenRecords.get(key);
      const record = {
        tokenHash: input.tokenHash,
        tenantSlug: input.tenantSlug,
        artistSlug: input.artistSlug,
        expiresAt: input.revokedAt,
        revokedAt: input.revokedAt,
      };
      state.tokenRecords.set(key, record);
      return existing ? record : record;
    },
    async findTokenRecord(input) {
      return state.tokenRecords.get(buildSignedIcsFeedRepositoryKey(input)) ?? null;
    },
    async persistAccessLog(input) {
      state.accessLogs.push(input);
    },
  };
}

export async function evaluateSignedIcsFeedRequest(input: {
  token?: string;
  tenantSlug: string;
  artistSlug: string;
  now: string;
  repository?: Pick<SignedIcsFeedRepository, "findTokenRecord" | "persistAccessLog">;
  userAgent?: string | null;
  ipHash?: string | null;
}): Promise<SignedIcsFeedAccessEvaluation> {
  const tokenHash = input.token?.trim() ? buildSignedIcsFeedTokenHash(input.token) : null;
  const durableRecord = tokenHash && input.repository
    ? await input.repository.findTokenRecord({
        tenantSlug: input.tenantSlug,
        artistSlug: input.artistSlug,
        tokenHash,
      })
    : null;

  const decision = evaluateSignedIcsFeedAccess({
    ...(input.token ? { token: input.token } : {}),
    ...(durableRecord || !tokenHash
      ? { record: durableRecord ?? undefined }
      : input.tenantSlug === localDemoFeedTokenRecord.tenantSlug &&
          input.artistSlug === localDemoFeedTokenRecord.artistSlug &&
          tokenHash === localDemoFeedTokenRecord.tokenHash
        ? { record: localDemoFeedTokenRecord }
        : {}),
    tenantSlug: input.tenantSlug,
    artistSlug: input.artistSlug,
    now: input.now,
  });

  if (input.repository && decision.shouldLogAccess) {
    await input.repository.persistAccessLog({
      tenantSlug: input.tenantSlug,
      artistSlug: input.artistSlug,
      tokenHash,
      status: decision.status,
      allowed: decision.allowed,
      userAgent: input.userAgent ?? null,
      ipHash: input.ipHash ?? null,
      occurredAt: input.now,
    });
  }

  return {
    decision,
    tokenHash,
  };
}

export const signedIcsFeedContract = buildSignedIcsFeedContract();
