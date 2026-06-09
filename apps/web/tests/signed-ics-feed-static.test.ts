import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildSignedIcsFeedReadiness,
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
    expect(readiness.blockers).toContain("Feed-token revocation UI must be implemented.");
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
