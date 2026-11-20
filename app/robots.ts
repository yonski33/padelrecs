import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    // Everything public is crawlable; sign-in and API endpoints are not pages. The admin area is deliberately not listed
    // (that would advertise its address); its pages answer with noindex instead (proxy.ts, page metadata).
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
      // Meta's AI training crawler: it sends no visitors, and its nonstop crawl tripped Vercel's automatic challenge on
      // DiscGolfRecs (owner 2026-11-20). Search engines and AI assistants (ChatGPT search, Perplexity) stay allowed.
      { userAgent: "meta-externalagent", disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
