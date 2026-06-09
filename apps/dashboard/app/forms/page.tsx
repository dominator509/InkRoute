import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { DisabledActionPanel } from "../../components/DisabledActionPanel";
import { StatusPill } from "../../components/StatusPill";

const forms = [
  { name: "Custom tattoo request intake", type: "intake", status: "published", questions: 12, sensitive: "medical notes optional" },
  { name: "Travel guest spot consent", type: "consent", status: "draft", questions: 6, sensitive: "signature required" },
  { name: "Healed photo follow-up", type: "aftercare", status: "draft", questions: 4, sensitive: "private upload planned" },
];

export default function FormsPage() {
  return (
    <main>
      <DashboardPageHeader
        eyebrow="Intake and consent"
        title="Form builder"
        description="Manage tattoo-specific intake forms, consent forms, medical/safety acknowledgements, and healed-photo follow-ups. Tenant-scoped redacted form read APIs now expose metadata while keeping raw answers, signatures, and medical payloads private."
      />

      <section className="grid three">
        {forms.map((form) => (
          <article className="card" key={form.name}>
            <div className="section-heading-row">
              <h2>{form.name}</h2>
              <StatusPill label={form.status} tone={form.status === "published" ? "success" : "warning"} />
            </div>
            <dl className="detail-list single">
              <div><dt>Type</dt><dd>{form.type}</dd></div>
              <div><dt>Questions</dt><dd>{form.questions}</dd></div>
              <div><dt>Sensitive data</dt><dd>{form.sensitive}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <DisabledActionPanel
        title="Form actions"
        description="GET /api/forms and GET /api/forms/[formId] now provide RBAC-gated, audited, no-store reads. Form editing, signature requests, private upload retention, and attorney-reviewed copy remain gated before production."
        actions={["Create intake form", "Publish consent form", "Send signature request", "Archive form version"]}
      />
    </main>
  );
}
