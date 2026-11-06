// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { finderPool } from "../../lib/finder";
import { MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE } from "../../lib/top-lists";
import { listLine } from "../../lib/list-lines";
import { displayName } from "../../lib/brand-name";
import { photoHidden, shopPhoto } from "../../lib/shop-photos";
import { amazonButton, amazonLinksOn } from "../../lib/amazon-offer";
import { websiteButton } from "../../lib/product-links";
import { FinderFlow, type FinderCard } from "./finder-flow";

const finder = niche.finder, w = niche.words, people = niche.people;

export function generateMetadata(): Metadata {
  if (!finder) return { robots: { index: false } };
  const title = `${finder.title}: Find Your ${w.One} From Real ${people.One} Reviews`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description: finder.description, alternates: { canonical: "/finder" }, openGraph: { title, description: finder.description, url: "/finder", type: "website" } };
}

export default async function FinderPage() {
  if (!finder) notFound();
  const data = await catalog();
  const good = niche.tags.filter(t => t.tone === "pos").map(t => t.label), bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const pool = finderPool(finder, data, good);
  if (!pool.length) notFound();
  const byId = new Map(data.listed.map(p => [p.id, p]));
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const affiliate = amazonLinksOn();
  const cards: FinderCard[] = await Promise.all(pool.map(async entry => {
    const p = byId.get(entry.id)!, brand = brandOf(p.brandId);
    const amazon = affiliate ? await amazonButton({ name: p.name, brand: brand || undefined }) : null;
    const site = websiteButton({ websiteUrl: p.websiteUrl ?? null, affiliateUrl: p.affiliateUrl ?? null });
    return { ...entry, name: displayName(p.name, brand), brand, href: productHref(p), line: listLine(p), own: shopPhoto(p) ?? null,
      amazonUrl: amazon?.url ?? null, amazonImage: amazon?.image && !photoHidden(p) ? amazon.image : null,
      siteUrl: site?.url ?? null, siteLabel: site?.label ?? null, siteAffiliate: !!site?.affiliate };
  }));
  const reviews = pool.reduce((a, p) => a + p.reviews, 0);
  return <main className="top-page finder-page">
    <div className="page-title">
      <h1>{finder.heading}</h1>
      <p>{finder.intro}</p>
    </div>
    <FinderFlow cards={cards} negativeTags={bad}/>
    <section className="top-method" id="how-it-works">
      <h2>How the matching works</h2>
      <ul>
        <li>{`Your answers are matched against ${reviews.toLocaleString("en-US")} published reviews of ${pool.length} ${w.many}. A ${w.one} scores higher the more of its reviews describe what you asked for, compared with how many it has in total.`}</li>
        <li>{`Only ${w.many} with at least ${Math.max(MIN_LIST_REVIEWS, finder.minReviews ?? MIN_LIST_REVIEWS)} reviews, at least ${Math.round((finder.minPositive ?? MIN_POSITIVE_SHARE) * 100)}% of them positive (mixed counting as half), can be suggested${finder.maxAgeYears === undefined ? "" : finder.maxAgeYears === 0 ? `, from this year's models` : `, from the last ${finder.maxAgeYears + 1} model years`}.`}</li>
        {finder.notes?.map(n => <li key={n}>{n}</li>)}
        <li>{`These are matches from what ${people.many} report, not personal advice. There are no sponsored placements${affiliate ? ", and affiliate links never change the results" : ""}.`}</li>
      </ul>
    </section>
  </main>;
}
