import { NextResponse } from "next/server";
import {
  createReleaseCandidate,
  createRollbackPlan,
  defaultFeatureFlags,
  demoReleaseCandidate,
  evaluateFeatureFlags,
} from "@inkroute/releases";
import { inkrouteDemoTenant } from "@inkroute/config";

export async function GET() {
  const flags = evaluateFeatureFlags(defaultFeatureFlags, {
    tenantId: inkrouteDemoTenant.id,
    role: "owner",
    environment: "preview",
    stableIdentifier: `${inkrouteDemoTenant.id}:owner`,
  });

  return NextResponse.json({
    status: "scaffolded",
    release: demoReleaseCandidate,
    rollback: createRollbackPlan(demoReleaseCandidate, "0.11.0-phase11"),
    flags,
    boundary: "Read-only demo release control plane. Production requires auth, RBAC, ReleaseRecord persistence, audit logs, CI/CD integration, and deployment secrets.",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const version = typeof input.version === "string" ? input.version : "0.12.0-draft";
  const commitSha = typeof input.commitSha === "string" ? input.commitSha : "unverified-sha";
  const candidate = createReleaseCandidate({
    version,
    channel: "preview",
    surfaces: ["web", "dashboard"],
    commitSha,
    releaseNotes: ["Draft release submitted to scaffolded boundary"],
    gates: [
      {
        id: "runtime-boundary",
        label: "Runtime boundary",
        status: "block",
        blocksProduction: true,
        evidence: "Route is scaffolded and does not persist ReleaseRecord or trigger CI/CD.",
        nextAction: "Wire authenticated dashboard action to Prisma, GitHub Actions, Vercel, and audit logs.",
      },
    ],
    createdBy: "dashboard-scaffold",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    error: "RELEASE_PERSISTENCE_NOT_IMPLEMENTED",
    message: "Release draft was evaluated but not persisted or deployed.",
    candidate,
  }, { status: 501 });
}
