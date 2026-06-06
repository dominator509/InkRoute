interface CtaBandProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  body?: string;
  label?: string;
  href?: string;
}

export function CtaBand({
  eyebrow = "Ready when the idea is real",
  title = "Send a clear request before the travel week fills.",
  description,
  body,
  label = "Start a request",
  href = "/booking",
}: CtaBandProps) {
  const resolvedBody = body ?? description ??
    "The booking flow is currently a static Phase 3 demo. In later phases it will persist requests, handle private references, and hand off to deposits.";
  return (
    <section className="section compact">
      <div className="container">
        <div className="cta-band">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{resolvedBody}</p>
          </div>
          <div className="cta-actions">
            <a className="button" href={href}>{label}</a>
            <a className="button secondary" href="/travel">View travel dates</a>
          </div>
        </div>
      </div>
    </section>
  );
}
