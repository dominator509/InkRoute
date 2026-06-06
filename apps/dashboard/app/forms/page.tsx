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
        description="Manage tattoo-specific intake forms, consent forms, medical/safety acknowledgements, and healed-photo follow-ups. Legal review is still required."
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
        description="Form editing must support versioning, required-field validation, private storage, consent signature retention, audit logging, and attorney-reviewed copy before production."
        actions={["Create intake form", "Publish consent form", "Send signature request", "Archive form version"]}
      />
    </main>
  );
}
