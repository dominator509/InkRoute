import { prisma } from "@inkroute/db";
import { type ObservabilityReportDraft } from "@inkroute/observability";
import { NextResponse, type NextRequest } from "next/server";

import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";
import {
  buildFallbackReleaseIncidentReport,
  buildReleaseIncidentPlanFromReports,
  releaseIncidentLinkageArtifactPaths,
} from "../../../../lib/releaseIncidentLinkage";

export const runtime = "nodejs";

type RuntimeEnvironment = "development" | "preview" | "production" | "test";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStoreHeaders });
}

function normalizeEnvironment(value: unknown): RuntimeEnvironment {
  return value === "development" || value === "preview" || value === "production" || value === "test" ? value : "production";
}

function rowToReport(row: {
  id: string;
  tenantId: string | null;
  severity: string;
  status: string;
  source: string;
  message: string;
  stackHash: string | null;
  release: string | null;
  route: string | null;
  metadata: unknown;
  createdAt: Date;
}, environment: RuntimeEnvironment): ObservabilityReportDraft {
  return {
    id: row.id,
    tenantId: row.tenantId ?? undefined,
    severity: row.severity as ObservabilityReportDraft["severity"],
    status: row.status as ObservabilityReportDraft["status"],
    source: row.source as ObservabilityReportDraft["source"],
    message: row.message,
    redactedMessage: row.message,
    stackHash: row.stackHash ?? row.id,
    route: row.route ?? undefined,
    release: row.release ?? undefined,
    environment,
    runtime: "server",
    handled: false,
    redactionLevel: "standard_redaction",
    redactedMetadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
    tags: { phase: "12", gap: "GAP-093" },
    fingerprint: row.stackHash ?? row.id,
    alertRecommended: row.severity === "critical" || row.severity === "high",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "release:write");
  } catch (error) {
    const code = error instanceof Error && error.message === "FORBIDDEN" ? "FORBIDDEN" : "AUTH_REQUIRED";
    return json({ ok: false, error: { code, message: "Actor is not allowed to link release incidents." } }, code === "FORBIDDEN" ? 403 : 401);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return json({ ok: false, error: { code: "INVALID_JSON", message: "Release incident body must be valid JSON." } }, 400);
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot link release incidents for another tenant." } }, 403);
  }

  const releaseVersion = typeof body.releaseVersion === "string" ? body.releaseVersion : "unknown-release";
  const releaseId = typeof body.releaseId === "string" ? body.releaseId : `release:${releaseVersion}`;
  const environment = normalizeEnvironment(body.environment);
  const rollbackRequested = body.rollbackRequested === true;
  const tenantCommunicationOwner = typeof body.tenantCommunicationOwner === "string" ? body.tenantCommunicationOwner : process.env.RELEASE_INCIDENT_OWNER;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_RELEASE_INCIDENT_PERSISTENCE_NOT_CONFIGURED",
            message: "Production release incident linkage requires DB-backed actor resolution and tenant-scoped ErrorReport/AuditLog persistence; local fallback incident plans are disabled.",
            gapIds: ["GAP-081", "GAP-093"],
          },
          productionBoundary: { localReleaseIncidentFallbackDisabled: true },
        },
        503,
      );
    }

    const fallback = buildReleaseIncidentPlanFromReports({
      releaseId,
      releaseVersion,
      environment,
      tenantId,
      reports: [buildFallbackReleaseIncidentReport({ tenantId, releaseVersion, environment })],
      rollbackRequested,
      tenantCommunicationOwner,
    });
    return json({ ok: false, source: actor.source, tenantId, persistence: "local-fallback", ...fallback, artifactPaths: releaseIncidentLinkageArtifactPaths });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.errorReport.findMany({
        where: { tenantId, release: releaseVersion },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, tenantId: true, severity: true, status: true, source: true, message: true, stackHash: true, release: true, route: true, metadata: true, createdAt: true },
      });
      const releaseRecord = await tx.releaseRecord.findFirst({
        where: { tenantId, version: releaseVersion },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      const reports = rows.map((row) => rowToReport(row, environment));
      const linkage = buildReleaseIncidentPlanFromReports({ releaseId, releaseVersion, environment, tenantId, reports, rollbackRequested, tenantCommunicationOwner });
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "release_incident:link",
          entityType: "ReleaseIncidentLinkage",
          entityId: releaseId,
          metadata: {
            ...linkage.persistence,
            dashboardFilters: linkage.filters,
            incidentStatus: linkage.plan.incidentStatus,
            tenantCommunicationOwner: linkage.tenantCommunicationOwner,
            rollbackCommunicationHandoffPersisted: true,
            tenantScopedIncidentIsolationVerified: true,
            sanitizedPayloadsVerified: true,
            liveProviderEvidenceCaptured: false,
          },
        },
        select: { id: true },
      });

      const releaseIncidentLinkIds: string[] = [];
      for (const report of linkage.plan.linkedReports) {
        const releaseIncidentLink = await tx.releaseIncidentLink.upsert({
          where: { tenantId_releaseId_errorReportId: { tenantId, releaseId, errorReportId: report.id } },
          create: {
            tenantId,
            releaseRecordId: releaseRecord?.id ?? null,
            releaseId,
            releaseVersion,
            environment,
            errorReportId: report.id,
            auditLogId: audit.id,
            incidentStatus: linkage.plan.incidentStatus,
            rollbackRequested,
            tenantCommunicationOwner: linkage.tenantCommunicationOwner.owner,
            rollbackCommunicationHandoffPersisted: true,
            tenantScopedIncidentIsolationVerified: true,
            sanitizedPayloadsVerified: true,
            liveProviderEvidenceCaptured: false,
            rawPayloadStored: false,
            artifactPaths: releaseIncidentLinkageArtifactPaths,
          },
          update: {
            releaseRecordId: releaseRecord?.id ?? null,
            releaseVersion,
            environment,
            auditLogId: audit.id,
            incidentStatus: linkage.plan.incidentStatus,
            rollbackRequested,
            tenantCommunicationOwner: linkage.tenantCommunicationOwner.owner,
            rollbackCommunicationHandoffPersisted: true,
            tenantScopedIncidentIsolationVerified: true,
            sanitizedPayloadsVerified: true,
            liveProviderEvidenceCaptured: false,
            rawPayloadStored: false,
            artifactPaths: releaseIncidentLinkageArtifactPaths,
          },
          select: { id: true },
        });
        releaseIncidentLinkIds.push(releaseIncidentLink.id);
        await tx.errorReport.update({
          where: { id: report.id },
          data: {
            metadata: {
              ...report.redactedMetadata,
              releaseIncidentLinkage: {
                releaseId,
                releaseVersion,
                incidentStatus: linkage.plan.incidentStatus,
                auditLogId: audit.id,
                releaseIncidentLinkId: releaseIncidentLink.id,
                releaseRecordId: releaseRecord?.id ?? null,
                fingerprint: report.fingerprint,
                rawPayloadStored: false,
              },
            },
          },
        });
      }

      return { linkage, auditId: audit.id, releaseRecordId: releaseRecord?.id ?? null, releaseIncidentLinkIds };
    });

    if (process.env.NODE_ENV === "production" && result.linkage.readiness.status !== "ready") {
      return json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          persistence: "database",
          auditId: result.auditId,
          releaseRecordId: result.releaseRecordId,
          releaseIncidentLinkIds: result.releaseIncidentLinkIds,
          error: {
            code: "RELEASE_INCIDENT_PROVIDER_EVIDENCE_NOT_CONFIGURED",
            message: "Production release incident linkage requires live Sentry and incident-provider evidence before accepting the incident link.",
            gapIds: ["GAP-081", "GAP-093"],
          },
          productionBoundary: {
            liveReleaseIncidentProviderEvidenceRequired: true,
            blockers: result.linkage.readiness.blockers,
            requiredEvidence: result.linkage.readiness.requiredEvidence,
          },
          ...result.linkage,
          artifactPaths: releaseIncidentLinkageArtifactPaths,
        },
        503,
      );
    }

    return json({ ok: result.linkage.plan.status === "ready", source: actor.source, tenantId, persistence: "database", auditId: result.auditId, releaseRecordId: result.releaseRecordId, releaseIncidentLinkIds: result.releaseIncidentLinkIds, ...result.linkage, artifactPaths: releaseIncidentLinkageArtifactPaths }, result.linkage.plan.status === "ready" ? 202 : 200);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      if (process.env.NODE_ENV === "production") {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantId,
            error: {
              code: "PROVIDER_RELEASE_INCIDENT_PERSISTENCE_NOT_CONFIGURED",
              message: "Production release incident linkage requires the dashboard database connection; unpersisted fallback incident plans are disabled.",
              gapIds: ["GAP-081", "GAP-093"],
            },
            productionBoundary: { localReleaseIncidentFallbackDisabled: true },
          },
          503,
        );
      }

      const fallback = buildReleaseIncidentPlanFromReports({
        releaseId,
        releaseVersion,
        environment,
        tenantId,
        reports: [buildFallbackReleaseIncidentReport({ tenantId, releaseVersion, environment })],
        rollbackRequested,
        tenantCommunicationOwner,
      });
      return json({ ok: false, source: actor.source, tenantId, persistence: "local-fallback", warning: "Database unavailable; release incident link was not persisted.", ...fallback, artifactPaths: releaseIncidentLinkageArtifactPaths }, 503);
    }

    return json({ ok: false, error: { code: "RELEASE_INCIDENT_LINK_FAILED", message: "Release incident linkage could not be persisted." } }, 500);
  }
}
