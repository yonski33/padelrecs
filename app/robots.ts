import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    // Everything public is crawlable; sign-in and API endpoints are not pages. The admin area is deliberately not listed
    // (that would advertise its address); its pages answer with noindex instead (proxy.ts, page metadata).
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
