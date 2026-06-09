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
        description="Tenant profile, roles, permissions, policies, feature flags, and provider boundaries. Tenant-scoped redacted settings read API now exists; saves and provider secrets remain gated."
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

      <section className="dashboard-grid two">
        <div className="card">
          <p className="eyebrow">Notification preferences</p>
          <h2>Tenant channel controls</h2>
          <div className="stacked-list">
            <div className="stacked-item">
              <strong>Preference center and unsubscribe APIs</strong>
              <span>Client routes expose hashed-token, expiry, email unsubscribe, SMS STOP/START, and List-Unsubscribe plans.</span>
              <StatusPill label="GAP-067 wired" tone="warning" />
            </div>
            <div className="stacked-item">
              <strong>Tenant notification settings</strong>
              <span>Tenant setting changes require legal-approved copy, audit logs, idempotency, and durable TenantNotificationSetting persistence.</span>
              <StatusPill label="repository gated" tone="danger" />
            </div>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Suppression before send</p>
          <h2>Email unsubscribe and SMS STOP</h2>
          <p>Provider send plans now have explicit destination suppression gates; production still needs durable preference, suppression, token, audit, and idempotency stores before enabling live mutations.</p>
        </div>
      </section>

      <DisabledActionPanel
        title="Settings actions"
        description="Settings reads now use a credential-safe tenant API with AuditLog rows. Saving settings still requires mutation APIs, provider secret handling, audit logs, and validation."
        actions={["Invite member", "Create custom role", "Connect provider", "Save policies"]}
      />
    </main>
  );
}

