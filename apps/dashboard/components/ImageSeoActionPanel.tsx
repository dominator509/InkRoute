"use client";

import { useState } from "react";

type ImageSeoState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function ImageSeoActionPanel() {
  const [state, setState] = useState<ImageSeoState>({
    status: "idle",
    message: "Plans public immutable derivatives while keeping private originals evidence-gated.",
  });

  async function handleGenerateDerivative() {
    setState({ status: "submitting", message: "Planning derivative metadata through the dashboard image SEO route..." });

    try {
      const response = await fetch("/api/portfolio/image-seo-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cdnBaseUrl: "/demo/portfolio",
          width: 1280,
          height: 1600,
          sizeBytes: 1,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        persistence?: string;
        error?: { message?: string };
        blockers?: string[];
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            payload.blockers?.[0] ??
            "Image SEO processing is blocked until storage, CDN, Lighthouse, and persistence evidence are available.",
        });
        return;
      }

      setState({
        status: "success",
        message: `Derivative draft accepted as ${payload.persistence ?? "dry-run"}; real storage transforms, CDN proof, and Lighthouse evidence remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "Image SEO processing could not reach the dashboard route; retry after the local dashboard API is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">Image workflow actions</p>
        <h2>Generate image SEO derivative draft</h2>
        <p>
          Portfolio reads redact storage keys and private asset metadata. This action exercises the tenant-scoped image SEO API
          without claiming live storage transforms, CDN headers, or Lighthouse proof.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleGenerateDerivative} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Planning derivative..." : "Generate derivative draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
