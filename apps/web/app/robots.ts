import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/private", "/api/private", "/api/dashboard", "/dashboard", "/booking/confirmation"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
