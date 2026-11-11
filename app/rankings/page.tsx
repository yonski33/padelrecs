// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { RANKINGS_PATH, listYear } from "../../lib/top-lists";
import { BrowseTile } from "../visual";
import { rankedLists, listHref, longDate, currentYear } from "./lists";
import { FinderInvite } from "../finder/invite";

const w = niche.words, people = niche.people;
// "Padel racket" → "Padel Racket".
const category = niche.seo.productCategory.replace(/\b\w/g, c => c.toUpperCase());
const heading = `${category} Rankings`;

export async function generateMetadata(): Promise<Metadata> {
  const { lists } = await rankedLists();
  if (!lists.length) return { robots: { index: false } };
  const title = `${heading} ${currentYear()}, Based on Real ${people.One} Reviews`;
  const description = `${lists.map(l => l.list.label).join(", ")}: ${w.many} ranked by what ${people.many} actually say, from published first-hand reviews. Updated as new reviews come in.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: RANKINGS_PATH }, openGraph: { title, description, url: RANKINGS_PATH, type: "website" } };
}

export default async function TopListsIndex() {
  const { data, lists } = await rankedLists();
  if (!lists.length) notFound();
  const updated = lists.reduce((a, l) => l.updated > a ? l.updated : a, "");
  return <main className="top-page v2 rankings-index">
    <div className="page-hero">
      <h1>{heading}</h1>
      <p>{`${w.Many} ranked by what ${people.many} say about them in published reviews. No sponsored placements; every number is counted from reviews you can read.`}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time></p>}
    </div>
    {/* Each ranking as a big image tile with its top three (2026-11 redesign); the click opens the full list. */}
    <div className="btile-row index-tiles">{lists.map(({ list, entries }) => {
      const products = entries.slice(0, 3).map(e => data.rackets.find(r => r.id === e.product.id)).filter((r): r is NonNullable<typeof r> => !!r);
      return products.length ? <BrowseTile key={list.slug} data={data} tile={{ key: list.slug, href: listHref(list.slug), label: list.label, note: `${list.title} ${listYear(list)} · ${entries.length} ranked`, products }}/> : null;
    })}</div>
    <FinderInvite/>
  </main>;
}
