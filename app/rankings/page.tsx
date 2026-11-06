// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { RANKINGS_PATH, listYear } from "../../lib/top-lists";
import { ProductIcon } from "../icons";
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
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const updated = lists.reduce((a, l) => l.updated > a ? l.updated : a, "");
  return <main className="top-page">
    <div className="page-title">
      <h1>{heading}</h1>
      <p>{`${w.Many} ranked by what ${people.many} say about them in published reviews. No sponsored placements; every number is counted from reviews you can read.`}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time></p>}
    </div>
    <FinderInvite/>
    <div className="top-index">
      {/* One short row per list: its title and size, no products, so the ranking itself is what the click shows. */}
      {lists.map(({ list, entries, reviews }) => {
        const lead = entries[0];
        return <a key={list.slug} className="top-card" href={listHref(list.slug)}>
          <span className="thumb" aria-hidden="true"><ProductIcon shape={lead.product.shape} brand={brandOf(lead.product.brandId)}/></span>
          <span className="top-card-text">
            <h2>{`${list.title} ${listYear(list)}`}</h2>
            <span className="top-card-meta">{`Based on ${reviews} reviews · ${entries.length} ranked`}</span>
          </span>
          <span className="top-card-more">See the ranking <span className="arrow" aria-hidden="true">→</span></span>
        </a>;
      })}
    </div>
  </main>;
}
