"use client";

import { useState } from "react";
import { createClientRequestKey } from "../lib/clientRequestKeys";

type SeoPublicationState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "blocked"; message: string };

export function SeoPublicationActionPanel() {
  const [state, setState] = useState<SeoPublicationState>({
    status: "idle",
    message: "Creates a tenant-scoped SEO publication plan without claiming Search Console or revalidation worker proof.",
  });

  async function handleCreateCityDraft() {
    setState({ status: "submitting", message: "Submitting SEO city-page draft through the dashboard publication route..." });

    try {
      const response = await fetch("/api/seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": createClientRequestKey("dashboard-seo-city-draft"),
        },
        body: JSON.stringify({
          action: "create",
          model: "SeoCityPage",
          slug: "demo-city-seo-draft",
          city: "Portland",
          region: "Oregon",
          country: "US",
          title: "Portland tattoo artist booking draft",
          metaDescription: "Draft city SEO page prepared for editorial and provider-backed publication review.",
          status: "draft",
          heroCopy: "Draft city landing page copy pending editorial, legal, and runtime publication evidence.",
          relatedFaqIds: [],
          relatedReviewIds: [],
          relatedImageIds: [],
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        persistence?: string;
        error?: { message?: string };
      };

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            payload.error?.message ??
            "SEO publication is blocked until DB-backed actor resolution, idempotency, associations, and revalidation evidence are ready.",
        });
        return;
      }

      setState({
        status: "success",
        message: `SEO city draft accepted as ${payload.persistence ?? "planned"}; Search Console submission, persisted revalidation jobs, and browser flow evidence remain gated.`,
      });
    } catch {
      setState({
        status: "blocked",
        message: "SEO publication could not reach the dashboard API; retry after the local dashboard route is available.",
      });
    }
  }

  return (
    <section className="card action-panel">
      <div>
        <p className="eyebrow">SEO publishing actions</p>
        <h2>Create city SEO draft</h2>
        <p>
          SEO reads and writes are tenant-scoped through dashboard APIs. This action exercises the publication planner while
          keeping Search Console credentials, sitemap submission, revalidation workers, and browser proof evidence-gated.
        </p>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={handleCreateCityDraft} disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Creating SEO draft..." : "Create city SEO draft"}
        </button>
      </div>
      <p className={`form-boundary-note ${state.status === "success" ? "success" : state.status === "blocked" ? "danger" : ""}`}>
        {state.message}
      </p>
    </section>
  );
}
