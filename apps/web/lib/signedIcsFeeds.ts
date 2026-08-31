import {
  buildSignedIcsFeedRuntimeReadinessPlan,
  buildSignedIcsFeedTokenHash,
  evaluateSignedIcsFeedAccess,
  type SignedIcsFeedAccessDecision,
  type SignedIcsFeedRuntimeReadinessPlan,
  type SignedIcsFeedTokenRecord,
} from "@inkroute/calendar";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { createHash } from "node:crypto";

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

export interface PersistedSignedIcsFeedTokenRow {
  readonly tenantSlug: string;
  readonly artistSlug: string;
  readonly tokenHash: string;
  readonly expiresAt: Date | string;
  readonly revokedAt: Date | string | null;
}

export interface SignedIcsFeedPrismaClient {
  readonly signedIcsFeedToken: {
    create(input: {
      readonly data: {
        readonly tenantSlug: string;
        readonly artistSlug: string;
        readonly tokenHash: string;
        readonly expiresAt: Date;
        readonly createdBy: string;
        readonly rotatedFromTokenHash?: string;
      };
    }): Promise<PersistedSignedIcsFeedTokenRow>;
    findFirst(input: {
      readonly where: { readonly tenantSlug: string; readonly artistSlug: string; readonly tokenHash: string };
    }): Promise<PersistedSignedIcsFeedTokenRow | null>;
    update(input: {
      readonly where: { readonly tenantSlug_artistSlug_tokenHash: { readonly tenantSlug: string; readonly artistSlug: string; readonly tokenHash: string } };
      readonly data: { readonly revokedAt: Date; readonly revokedBy: string };
    }): Promise<PersistedSignedIcsFeedTokenRow>;
    updateMany(input: {
      readonly where: { readonly tenantSlug: string; readonly artistSlug: string; readonly tokenHash: string; readonly revokedAt: null };
      readonly data: { readonly revokedAt: Date; readonly revokedBy: string };
    }): Promise<unknown>;
  };
  readonly signedIcsFeedAccessLog: {
    create(input: {
      readonly data: {
        readonly tenantSlug: string;
        readonly artistSlug: string;
        readonly tokenHash: string | null;
        readonly status: SignedIcsFeedAccessDecision["status"];
        readonly allowed: boolean;
        readonly userAgent: string | null;
        readonly ipHash: string | null;
        readonly occurredAt: Date;
      };
    }): Promise<unknown>;
  };
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
    revocationUiImplemented: true,
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
  return `ics_feed:${createHash("sha256").update(JSON.stringify([input.tenantSlug, input.artistSlug, input.tokenHash])).digest("hex")}`;
}

function signedIcsFeedTokenRecordFromRow(row: PersistedSignedIcsFeedTokenRow): SignedIcsFeedTokenRecord {
  return {
    tenantSlug: row.tenantSlug,
    artistSlug: row.artistSlug,
    tokenHash: row.tokenHash,
    expiresAt: new Date(row.expiresAt).toISOString(),
    ...(row.revokedAt ? { revokedAt: new Date(row.revokedAt).toISOString() } : {}),
  };
}

export function createPrismaSignedIcsFeedRepository(client: SignedIcsFeedPrismaClient): SignedIcsFeedRepository {
  return {
    async createToken(input) {
      const row = await client.signedIcsFeedToken.create({
        data: {
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.tokenHash,
          expiresAt: new Date(input.expiresAt),
          createdBy: input.createdBy,
        },
      });
      return signedIcsFeedTokenRecordFromRow(row);
    },
    async rotateToken(input) {
      await client.signedIcsFeedToken.updateMany({
        where: {
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.previousTokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date(), revokedBy: input.createdBy },
      });
      const row = await client.signedIcsFeedToken.create({
        data: {
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.tokenHash,
          expiresAt: new Date(input.expiresAt),
          createdBy: input.createdBy,
          rotatedFromTokenHash: input.previousTokenHash,
        },
      });
      return signedIcsFeedTokenRecordFromRow(row);
    },
    async revokeToken(input) {
      const row = await client.signedIcsFeedToken.update({
        where: {
          tenantSlug_artistSlug_tokenHash: {
            tenantSlug: input.tenantSlug,
            artistSlug: input.artistSlug,
            tokenHash: input.tokenHash,
          },
        },
        data: { revokedAt: new Date(input.revokedAt), revokedBy: input.actorId },
      });
      return signedIcsFeedTokenRecordFromRow(row);
    },
    async findTokenRecord(input) {
      const row = await client.signedIcsFeedToken.findFirst({
        where: {
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.tokenHash,
        },
      });
      return row ? signedIcsFeedTokenRecordFromRow(row) : null;
    },
    async persistAccessLog(input) {
      await client.signedIcsFeedAccessLog.create({
        data: {
          tenantSlug: input.tenantSlug,
          artistSlug: input.artistSlug,
          tokenHash: input.tokenHash,
          status: input.status,
          allowed: input.allowed,
          userAgent: input.userAgent,
          ipHash: input.ipHash,
          occurredAt: new Date(input.occurredAt),
        },
      });
    },
  };
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
    ...(durableRecord
      ? { record: durableRecord }
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
