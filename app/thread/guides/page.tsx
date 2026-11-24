// PadelRecs Guides v3 (owner design 2026-11-21): the guides index at /guides, padel only (lib/thread/look.ts threadPath).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../shell";
import { GuidesIndexV3 } from "../guide-v3";
import { JsonLd, crumbs } from "../seo";
import { niche } from "../../../lib/niche";

export const revalidate = 21600;
const TITLE = "Guides", DESCRIPTION = "Plain guides to picking and using a padel racket, built from what players report.";
export const metadata: Metadata = { title: { absolute: `Padel racket guides | ${niche.site.name}` }, description: DESCRIPTION, alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides", type: "website" } };

export default function ThreadGuides() {
  if (niche.id !== "padel") notFound();
  return <Shell active="guides">
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [crumbs([{ name: "Home", path: "/" }, { name: TITLE, path: "/guides" }])] }}/>
    <GuidesIndexV3/>
  </Shell>;
}
