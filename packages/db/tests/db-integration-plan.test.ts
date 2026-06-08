import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("database integration test plan", () => {
  it("keeps Prisma lifecycle commands wired for the future Postgres integration suite", () => {
    const packageJson = JSON.parse(readWorkspaceFile("packages/db/package.json")) as { scripts: Record<string, string> };
    const manifest = JSON.parse(readWorkspaceFile("testing/manifests/db-integration-test-manifest.json")) as {
      suites: Array<{ id: string; commands?: string[] }>;
    };

    expect(packageJson.scripts["db:validate"]).toContain("prisma validate");
    expect(packageJson.scripts["db:generate"]).toContain("prisma generate");
    expect(packageJson.scripts["db:migrate"]).toContain("prisma migrate dev");
    expect(packageJson.scripts["db:seed"]).toContain("tsx prisma/seed.ts");
    expect(manifest.suites.find((suite) => suite.id === "db-prisma-schema-lifecycle")?.commands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/db db:validate",
        "pnpm --filter @inkroute/db db:generate",
        "pnpm --filter @inkroute/db db:migrate",
        "pnpm --filter @inkroute/db db:seed",
      ]),
    );
  });

  it("pins tenant-scoped schema models and audit log prerequisites", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");

    for (const model of [
      "Tenant",
      "TenantMember",
      "BookingRequest",
      "Appointment",
      "Payment",
      "FileAsset",
      "MessageThread",
      "Message",
      "Notification",
      "SeoCityPage",
      "ReleaseRecord",
      "FeatureFlag",
      "AuditLog",
    ]) {
      expect(schema).toContain(`model ${model} `);
    }

    expect(schema).toContain("@@unique([tenantId, userId])");
    expect(schema).toContain("@@index([tenantId, status, createdAt])");
    expect(schema).toContain("model AuditLog");
    expect(schema).toContain("actorId");
    expect(schema).toContain("entityType");
    expect(schema).toContain("entityId");
  });

  it("keeps seed data tenant-scoped across core launch workflows", () => {
    const seed = readWorkspaceFile("packages/db/prisma/seed.ts");

    for (const requiredSeed of [
      "prisma.tenant.upsert",
      "prisma.tenantMember.upsert",
      "prisma.bookingRequest.upsert",
      "prisma.appointment.upsert",
      "prisma.payment.upsert",
      "prisma.fileAsset.upsert",
      "prisma.message.upsert",
      "prisma.notification.upsert",
      "prisma.seoCityPage.upsert",
      "prisma.featureFlag.upsert",
      "prisma.releaseRecord.upsert",
      "prisma.auditLog.create",
    ]) {
      expect(seed).toContain(requiredSeed);
    }

    expect(seed).toContain("tenantId: tenant.id");
  });
});
