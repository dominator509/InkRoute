import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildSignedIcsFeedReadiness,
  createInMemorySignedIcsFeedRepository,
  createPrismaSignedIcsFeedRepository,
  evaluateSignedIcsFeedRequest,
  localDemoFeedToken,
  planSignedIcsFeedTokenCreation,
  planSignedIcsFeedTokenRevocation,
  signedIcsFeedContract,
} from "../lib/signedIcsFeeds";

const repoRoot = resolve(__dirname, "../../..");

describe("signed ICS feed web contract", () => {
  it("plans hashed token creation and revocation without storing raw tokens", () => {
    const creation = planSignedIcsFeedTokenCreation({
      tenantSlug: "demo",
      artistSlug: "artist",
      token: "raw-token-value",
      expiresAt: "2026-07-01T00:00:00.000Z",
      createdBy: "operator",
    });
    const revocation = planSignedIcsFeedTokenRevocation({
      tenantSlug: creation.tenantSlug,
      artistSlug: creation.artistSlug,
      tokenHash: creation.tokenHash,
      revokedAt: "2026-06-09T00:00:00.000Z",
    });

    expect(creation.tokenHash).toMatch(/^draft_hash_/);
    expect(creation.tokenHash).not.toContain("raw-token-value");
    expect(revocation.auditAction).toBe("revoked");
  });

  it("keeps repository methods explicit for create, rotate, revoke, lookup, and access logging", () => {
    expect(signedIcsFeedContract.requiredRepositoryMethods).toEqual([
      "createToken",
      "rotateToken",
      "revokeToken",
      "findTokenRecord",
      "persistAccessLog",
    ]);
  });

  it("executes a local signed-feed repository contract for hash-only storage, rotation, revocation, scope, and access logs", async () => {
    const repository = createInMemorySignedIcsFeedRepository();
    const creation = planSignedIcsFeedTokenCreation({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      token: "raw-token-one",
      expiresAt: "2026-07-01T00:00:00.000Z",
      createdBy: "operator-a",
    });

    await repository.createToken({
      tenantSlug: creation.tenantSlug,
      artistSlug: creation.artistSlug,
      token: "raw-token-one",
      tokenHash: creation.tokenHash,
      expiresAt: creation.expiresAt,
      createdBy: "operator-a",
    });

    expect([...repository.state.tokenRecords.keys()].join(" ")).not.toContain("raw-token-one");

    const allowed = await evaluateSignedIcsFeedRequest({
      token: "raw-token-one",
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      now: "2026-06-09T00:00:00.000Z",
      repository,
      userAgent: "calendar-client",
      ipHash: "ip_hash",
    });

    expect(allowed.decision.allowed).toBe(true);
    expect(repository.state.accessLogs).toHaveLength(1);
    expect(repository.state.accessLogs[0]).toMatchObject({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      allowed: true,
      userAgent: "calendar-client",
    });

    const scopedDeny = await evaluateSignedIcsFeedRequest({
      token: "raw-token-one",
      tenantSlug: "tenant-b",
      artistSlug: "artist-a",
      now: "2026-06-09T00:00:00.000Z",
      repository,
    });

    expect(scopedDeny.decision.allowed).toBe(false);

    const rotation = planSignedIcsFeedTokenCreation({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      token: "raw-token-two",
      expiresAt: "2026-08-01T00:00:00.000Z",
      createdBy: "operator-a",
    });

    await repository.rotateToken({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      token: "raw-token-two",
      previousTokenHash: creation.tokenHash,
      tokenHash: rotation.tokenHash,
      expiresAt: rotation.expiresAt,
      createdBy: "operator-a",
    });

    expect(await repository.findTokenRecord({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      tokenHash: creation.tokenHash,
    })).toBeNull();

    const rotated = await evaluateSignedIcsFeedRequest({
      token: "raw-token-two",
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      now: "2026-06-09T00:00:00.000Z",
      repository,
    });

    expect(rotated.decision.allowed).toBe(true);

    await repository.revokeToken({
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      tokenHash: rotation.tokenHash,
      revokedAt: "2026-06-10T00:00:00.000Z",
      actorId: "operator-a",
    });

    const revoked = await evaluateSignedIcsFeedRequest({
      token: "raw-token-two",
      tenantSlug: "tenant-a",
      artistSlug: "artist-a",
      now: "2026-06-11T00:00:00.000Z",
      repository,
    });

    expect(revoked.decision.allowed).toBe(false);
  });

  it("maps the Prisma signed-feed repository to hash-only token storage and access logs", async () => {
    const tokenRows: {
      tenantSlug: string;
      artistSlug: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
    }[] = [];
    const accessLogs: unknown[] = [];
    const repository = createPrismaSignedIcsFeedRepository({
      signedIcsFeedToken: {
        create: async ({ data }) => {
          const row = { ...data, revokedAt: null };
          tokenRows.push(row);
          return row;
        },
        findFirst: async ({ where }) =>
          tokenRows.find((row) =>
            row.tenantSlug === where.tenantSlug &&
            row.artistSlug === where.artistSlug &&
            row.tokenHash === where.tokenHash
          ) ?? null,
        update: async ({ where, data }) => {
          const row = tokenRows.find((candidate) =>
            candidate.tenantSlug === where.tenantSlug_artistSlug_tokenHash.tenantSlug &&
            candidate.artistSlug === where.tenantSlug_artistSlug_tokenHash.artistSlug &&
            candidate.tokenHash === where.tenantSlug_artistSlug_tokenHash.tokenHash
          );
          if (!row) throw new Error("token row missing");
          row.revokedAt = data.revokedAt;
          return row;
        },
        updateMany: async ({ where, data }) => {
          for (const row of tokenRows) {
            if (
              row.tenantSlug === where.tenantSlug &&
              row.artistSlug === where.artistSlug &&
              row.tokenHash === where.tokenHash &&
              row.revokedAt === where.revokedAt
            ) {
              row.revokedAt = data.revokedAt;
            }
          }
          return { count: 1 };
        },
      },
      signedIcsFeedAccessLog: {
        create: async ({ data }) => {
          accessLogs.push(data);
          return data;
        },
      },
    });
    const creation = planSignedIcsFeedTokenCreation({
      tenantSlug: "tenant-db",
      artistSlug: "artist-db",
      token: "raw-token-db",
      expiresAt: "2026-07-01T00:00:00.000Z",
      createdBy: "operator-db",
    });

    await repository.createToken({ ...creation, token: "raw-token-db", createdBy: "operator-db" });

    expect(JSON.stringify(tokenRows)).not.toContain("raw-token-db");

    const allowed = await evaluateSignedIcsFeedRequest({
      token: "raw-token-db",
      tenantSlug: "tenant-db",
      artistSlug: "artist-db",
      now: "2026-06-09T00:00:00.000Z",
      repository,
      userAgent: "calendar-client",
      ipHash: "ip_hash",
    });

    expect(allowed.decision.allowed).toBe(true);
    expect(accessLogs).toEqual([
      expect.objectContaining({
        tenantSlug: "tenant-db",
        artistSlug: "artist-db",
        allowed: true,
        userAgent: "calendar-client",
      }),
    ]);
  });

  it("accepts the local demo token through the shared evaluator while durable storage is wired later", async () => {
    const result = await evaluateSignedIcsFeedRequest({
      token: localDemoFeedToken,
      tenantSlug: signedIcsFeedContract.demoTokenRecord.tenantSlug,
      artistSlug: signedIcsFeedContract.demoTokenRecord.artistSlug,
      now: "2026-06-09T00:00:00.000Z",
    });

    expect(result.decision.allowed).toBe(true);
    expect(result.decision.cacheControl).toContain("private");
    expect(result.tokenHash).toBe(signedIcsFeedContract.demoTokenRecord.tokenHash);
  });

  it("keeps launch readiness blocked on route tests, revocation UI, and calendar-client import proof", () => {
    const readiness = buildSignedIcsFeedReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("@inkroute/calendar signed ICS tests must pass.");
    expect(readiness.blockers).toContain("Feed-token revocation UI/API proof must be captured before signed ICS feed readiness.");
    expect(readiness.blockers).not.toContain("Feed-token revocation UI must be implemented.");
    expect(readiness.blockers).toContain("Route tests must reject revoked tokens loaded from durable storage.");
    expect(readiness.blockers).toContain("Apple Calendar import smoke test must pass.");
  });

  it("routes travel ICS access through the signed feed service contract", () => {
    const routeSource = readFileSync(
      resolve(repoRoot, "apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("evaluateSignedIcsFeedRequest");
    expect(routeSource).toContain("X-InkRoute-Feed-Access-Logged");
    expect(routeSource).toContain("private");
  });
});
