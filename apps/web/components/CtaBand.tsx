interface CtaBandProps {
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function CtaBand({
  eyebrow = "Ready when the idea is real",
  title = "Send a clear request before the travel week fills.",
  body = "The booking flow is currently a static Phase 3 demo. In later phases it will persist requests, handle private references, and hand off to deposits.",
}: CtaBandProps) {
  return (
    <section className="section compact">
      <div className="container">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
          <div className="cta-actions">
            <a className="button" href="/booking">Start a request</a>
            <a className="button secondary" href="/travel">View travel dates</a>
          </div>
        </div>
      </div>
    </section>
  );
}
