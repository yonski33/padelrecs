import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    // Everything public is crawlable; admin, sign-in and API endpoints are not pages.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
