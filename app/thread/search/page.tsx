// PadelRecs Search v3 (owner design 2026-11-21): /search, padel only (lib/thread/look.ts threadPath). The page is cached like
// the others; the search itself runs in the browser over the index built here (app/thread/search-data.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../shell";
import { SearchV3 } from "../live/search-v3";
import { searchIndex } from "../search-data";
import { niche } from "../../../lib/niche";

export const revalidate = 21600;
export const metadata: Metadata = { title: { absolute: `Search | ${niche.site.name}` }, alternates: { canonical: "/search" }, robots: { index: false, follow: true } };

export default async function ThreadSearch() {
  if (niche.id !== "padel") notFound();
  return <Shell><main className="th-main ths4"><SearchV3 index={await searchIndex()}/></main></Shell>;
}
