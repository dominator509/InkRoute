import type { MetadataRoute } from "next";
import { buildSitemapPlan } from "@inkroute/seo";
import { allPublicSeoRoutes } from "../lib/seoEngine";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const plan = buildSitemapPlan({ baseUrl, routes: allPublicSeoRoutes });

  return plan.entries.map((entry) => ({
    url: entry.url,
    lastModified: new Date(entry.lastModified),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
