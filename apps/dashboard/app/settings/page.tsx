import { rolePermissions } from "@inkroute/auth";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { StatusPill } from "../../components/StatusPill";
import { dashboardFeatureFlags, dashboardShellContext } from "../../lib/demo";

export default function SettingsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Tenant settings"
        title="Workspace settings"
        description="Tenant profile, roles, permissions, policies, feature flags, and provider credentials. This is read-only static demo content."
      />

      <section className="grid two">
        <article className="card detail-card">
          <h2>Tenant</h2>
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{dashboardShellContext.tenant.name}</dd></div>
            <div><dt>Slug</dt><dd>{dashboardShellContext.tenant.slug}</dd></div>
            <div><dt>Plan</dt><dd>{dashboardShellContext.tenant.plan}</dd></div>
            <div><dt>Status</dt><dd>{dashboardShellContext.tenant.status}</dd></div>
          </dl>
        </article>
        <article className="card detail-card">
          <h2>Owner permissions preview</h2>
          <div className="permission-grid">
            {rolePermissions.owner.map((permission) => <code key={permission}>{permission}</code>)}
          </div>
        </article>
      </section>

      <section className="card spacious">
        <h2>Feature flag defaults</h2>
        <div className="grid two">
          {dashboardFeatureFlags.map((flag) => (
            <div className="list-row" key={flag.key}>
              <div><strong>{flag.key.replace(/_/g, " ")}</strong><span>{flag.description}</span></div>
              <StatusPill label={flag.enabled ? "enabled" : "disabled"} tone={flag.enabled ? "success" : "neutral"} />
            </div>
          ))}
        </div>
      </section>

      <DisabledActionPanel
        title="Settings actions"
        description="Saving settings requires authenticated owner/studio manager roles, tenant-scoped APIs, provider secret handling, audit logs, and validation."
        actions={["Invite member", "Create custom role", "Connect provider", "Save policies"]}
      />
    </main>
  );
}
