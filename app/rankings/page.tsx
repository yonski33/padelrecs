// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { RANKINGS_PATH } from "../../lib/top-lists";
import { ProductIcon } from "../icons";
import { rankedLists, listHref, longDate, currentYear, modelName } from "./lists";

const w = niche.words, people = niche.people;
// "Padel racket" → "Padel Racket".
const category = niche.seo.productCategory.replace(/\b\w/g, c => c.toUpperCase());
const heading = `${category} Rankings`;

export async function generateMetadata(): Promise<Metadata> {
  if (!niche.topLists?.length) return { robots: { index: false } };
  const lists = (await rankedLists()).lists.filter(l => l.entries.length);
  const title = `${heading} ${currentYear()}, Based on Real ${people.One} Reviews`;
  const description = `${lists.map(l => l.list.label).join(", ")}: ${w.many} ranked by what ${people.many} actually say, from published first-hand reviews. Updated as new reviews come in.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: RANKINGS_PATH }, openGraph: { title, description, url: RANKINGS_PATH, type: "website" } };
}

export default async function TopListsIndex() {
  if (!niche.topLists?.length) notFound();
  const { data, lists: all } = await rankedLists();
  const lists = all.filter(l => l.entries.length);
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  // With the review count, so a #2 with a higher share but fewer reviews still reads as fairly placed.
  const share = (e: { positiveShare: number; reviews: number }) => `${Math.round(e.positiveShare * 100)}% positive · ${e.reviews} reviews`;
  const updated = lists.reduce((a, l) => l.updated > a ? l.updated : a, "");
  return <main className="top-page">
    <div className="page-title">
      <h1>{heading}</h1>
      <p>{`${w.Many} ranked by what ${people.many} say about them in published reviews. No sponsored placements; every number is counted from reviews you can read.`}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time></p>}
    </div>
    {!lists.length && <p className="empty-feed">{`No list has enough reviews to rank any ${w.many} yet. They fill in as reviews are published.`}</p>}
    <div className="top-index">
      {/* A short card: the list's name, the winner up front, two runners-up. The long SEO title stays on the list page. */}
      {lists.map(({ list, entries, reviews }) => {
        const [lead, ...rest] = entries, brand = brandOf(lead.product.brandId);
        return <a key={list.slug} className="top-card" href={listHref(list.slug)}>
          <div>
            <h2>{list.label}</h2>
            <p className="top-card-meta">{`${reviews} reviews · ${entries.length} ranked`}</p>
          </div>
          <div className="top-card-lead">
            <span className="top-card-rank" aria-label="Rank 1">1</span>
            <span className="thumb" aria-hidden="true"><ProductIcon shape={lead.product.shape} brand={brand}/></span>
            <span className="top-card-name">{brand && <span className="brand">{brand}</span>}<b>{modelName(lead.product.name, brand)}</b><span className="top-card-share">{share(lead)}</span></span>
          </div>
          {rest.length > 0 && <ol className="top-card-rest" start={2}>
            {rest.slice(0, 2).map(e => <li key={e.product.id}><span>{e.product.name}</span><span className="top-card-share">{share(e)}</span></li>)}
          </ol>}
          <span className="top-card-more">{`See the ranking${entries.length > 3 ? ` (${entries.length})` : ""} →`}</span>
        </a>;
      })}
    </div>
  </main>;
}
