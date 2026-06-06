import { NextResponse } from "next/server";
import { demoFeatureFlagDecisions, demoReleaseCandidate, demoReleaseHealthChecks } from "@inkroute/releases";

export async function GET(_request: Request, context: { params: { tenantSlug: string } }) {
  return NextResponse.json({
    tenantSlug: context.params.tenantSlug,
    status: "scaffolded",
    release: {
      version: demoReleaseCandidate.version,
      channel: demoReleaseCandidate.channel,
      commitSha: demoReleaseCandidate.commitSha,
      productionBlocked: demoReleaseCandidate.productionBlocked,
    },
    healthChecks: demoReleaseHealthChecks,
    publicFeatureSnapshot: demoFeatureFlagDecisions.filter((flag) => ["nomad_mode.enabled", "booking.deposit_required"].includes(flag.key)),
    boundary: "Public release health preview only. Production must avoid exposing internal incident, deployment, or feature flag details to anonymous clients.",
  });
}
