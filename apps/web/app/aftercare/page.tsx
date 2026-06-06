import type { Metadata } from "next";
import { aftercareSteps } from "@inkroute/config";
import { CtaBand } from "../../components/CtaBand";
import { SectionIntro } from "../../components/SectionIntro";

export const metadata: Metadata = {
  title: "Aftercare",
  description: "Demo tattoo aftercare education page for InkRoute Suite, with legal and medical review still required before production use.",
};

const warnings = [
  "This page is educational demo content, not medical advice.",
  "Final artist instructions and jurisdiction-specific language need legal/medical review.",
  "The future app should send aftercare messages tied to appointment date, service type, and artist settings.",
];

export default function AftercarePage() {
  return (
    <main>
      <section className="page-hero centered">
        <div className="container narrow">
          <p className="eyebrow">Aftercare automation preview</p>
          <h1>Clear healing instructions are part of the client experience.</h1>
          <p>InkRoute Suite should help artists send prep, aftercare, and healed-photo follow-up messages without exposing medical details or relying on scattered DMs.</p>
        </div>
      </section>
      <section className="section compact">
        <div className="container grid two align-start">
          <SectionIntro eyebrow="Demo guidance" title="Simple, readable, mobile-first aftercare content." />
          <ol className="check-list numbered">
            {aftercareSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      </section>
      <section className="section compact">
        <div className="container grid three">
          {warnings.map((warning) => (
            <article className="warning-card" key={warning}>
              <p>{warning}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="Have a healed photo? Future automation can request and organize it." />
    </main>
  );
}
