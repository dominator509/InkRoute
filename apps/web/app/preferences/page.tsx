import { preferenceCenterContract } from "../../lib/preferenceCenter";

export default function PreferencesPage() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px", fontFamily: "Georgia, serif" }}>
      <p style={{ letterSpacing: "0.18em", textTransform: "uppercase", color: "#78716c" }}>GAP-067</p>
      <h1 style={{ fontSize: 44, margin: "8px 0" }}>Notification preferences</h1>
      <p style={{ color: "#57534e", fontSize: 18 }}>
        Manage email, SMS, push, marketing, and transactional notification choices. This page exposes the signed-token, unsubscribe, STOP/START, List-Unsubscribe, tenant-settings, audit, and legal-copy readiness contract while durable preference repositories are wired.
      </p>
      <section style={{ display: "grid", gap: 16, marginTop: 32 }}>
        {[preferenceCenterContract.updateEmailPlan, preferenceCenterContract.unsubscribeEmailPlan, preferenceCenterContract.smsStopPlan, preferenceCenterContract.smsStartPlan, preferenceCenterContract.tenantSettingsPlan].map((plan) => (
          <article key={plan.action} style={{ border: "1px solid #d6d3d1", borderRadius: 18, padding: 20, background: "#fffaf0" }}>
            <h2 style={{ margin: 0 }}>{plan.action.replace(/_/g, " ")}</h2>
            <p>Status: {plan.status}</p>
            <p>Writes: {plan.writes.map((write) => write.model).join(", ")}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
