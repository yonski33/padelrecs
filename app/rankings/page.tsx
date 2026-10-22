// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { listTitle, RANKINGS_PATH } from "../../lib/top-lists";
import { rankedLists, listHref, longDate, currentYear } from "./lists";

const w = niche.words, people = niche.people;
// "Padel racket" → "Padel Racket".
const category = niche.seo.productCategory.replace(/\b\w/g, c => c.toUpperCase());
const heading = `Top 10 ${category} Lists`;

export async function generateMetadata(): Promise<Metadata> {
  if (!niche.topLists?.length) return { robots: { index: false } };
  const { lists } = await rankedLists();
  const title = `${heading} ${currentYear()}, Ranked by Real ${people.One} Reviews`;
  const description = `${lists.map(l => l.list.label).join(", ")}: ${w.many} ranked by what ${people.many} actually say, from published first-hand reviews. Updated as new reviews come in.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: RANKINGS_PATH }, openGraph: { title, description, url: RANKINGS_PATH, type: "website" } };
}

export default async function TopListsIndex() {
  if (!niche.topLists?.length) notFound();
  const { lists } = await rankedLists();
  const updated = lists.reduce((a, l) => l.updated > a ? l.updated : a, "");
  return <main className="top-page">
    <div className="page-title">
      <h1>{heading}</h1>
      <p>{`${w.Many} ranked by what ${people.many} say about them in published reviews. No sponsored placements; every number is counted from reviews you can read.`}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time></p>}
    </div>
    <div className="top-index">
      {lists.map(({ list, entries, reviews }) => <a key={list.slug} className="top-card" href={listHref(list.slug)}>
        <span className="eyebrow">{list.label}</span>
        <h2>{listTitle(list, currentYear(), reviews, people.One)}</h2>
        <p>{list.intro}</p>
        {entries.length > 0
          ? <ol>{entries.slice(0, 3).map(e => <li key={e.product.id}>{e.product.name}</li>)}</ol>
          : <p className="muted">{`Not enough reviews to rank any ${w.many} yet.`}</p>}
        <span className="top-card-more">{entries.length ? `See all ${entries.length} →` : "See the list →"}</span>
      </a>)}
    </div>
  </main>;
}
