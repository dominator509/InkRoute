"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const payload = {
      message: error.message,
      stack: error.stack,
      route: typeof window !== "undefined" ? window.location.pathname : "dashboard-unknown",
      release: "phase11-dashboard-demo",
      metadata: {
        digest: error.digest,
        boundary: "apps/dashboard/app/global-error.tsx",
        privacyNote: "Do not attach client PII or medical notes to client-side reports.",
      },
    };

    void fetch("/api/error-reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="dashboard-shell error-shell">
          <section className="card hero-card">
            <p className="eyebrow">Dashboard runtime boundary</p>
            <h1>Dashboard surface crashed.</h1>
            <p>
              This fallback makes the observability gap visible. Production still needs authenticated tenant-scoped capture, Sentry, persistence,
              alerts, and redaction verification.
            </p>
            <button className="button primary" type="button" onClick={reset}>Retry dashboard</button>
          </section>
        </main>
      </body>
    </html>
  );
}
