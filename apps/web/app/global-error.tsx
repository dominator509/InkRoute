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
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      release: "phase11-demo",
      metadata: {
        digest: error.digest,
        boundary: "apps/web/app/global-error.tsx",
      },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    void fetch("/api/public/inkroute-demo/error-reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="page-shell error-shell">
          <section className="hero-panel">
            <p className="eyebrow">Runtime boundary</p>
            <h1>Something broke in the booking experience.</h1>
            <p>
              A redacted Phase 11 error-report draft was attempted, but persistence, Sentry, alerting, and issue automation remain disabled until the
              observability gaps are resolved.
            </p>
            <button className="button primary" type="button" onClick={reset}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
