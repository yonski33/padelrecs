// Per request like the other public pages, cached at Vercel's edge for a minute (next.config.ts headers).
import { isLight } from "../../lib/look";
import { lightFont } from "../light-font";
import { productPhoto } from "../visual";
import { siteOgImages } from "../site-og";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { finderPool, withRankings } from "../../lib/finder";
import { topLists } from "../rankings/lists";
import { MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE } from "../../lib/top-lists";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { productSignals } from "../signals";
import { displayName } from "../../lib/brand-name";
import { photoHidden, shopPhoto } from "../../lib/shop-photos";
import { amazonButton, amazonLinksOn } from "../../lib/amazon-offer";
import { websiteButton } from "../../lib/product-links";
import { FinderFlow, type FinderCard } from "./finder-flow";

const finder = niche.finder, w = niche.words, people = niche.people;

export function generateMetadata(): Metadata {
  if (!finder) return { robots: { index: false } };
  // The menu label ("Find Your Racket", "Find Your Headphones") names the products better than words.One on sites whose word is "product".
  const title = `${finder.title}: ${finder.navLabel} From Real ${people.One} Reviews`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description: finder.description, alternates: { canonical: "/finder" }, openGraph: { title, description: finder.description, url: "/finder", type: "website", images: siteOgImages } };
}

export default async function FinderPage({ searchParams }: { searchParams: Promise<{ look?: string }> }) {
  if (!finder) notFound();
  const [data, f] = await Promise.all([catalog(), searchParams]);
  // The light direction, the default since 2026-11-12 (?look=classic shows the old page) (owner, 2026-11-12): same quiz, the light look.
  const light = isLight(f.look);
  const good = niche.tags.filter(t => t.tone === "pos").map(t => t.label), bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const pool = withRankings(finderPool(finder, data, good), finder, topLists, data, niche.tags);
  if (!pool.length) notFound();
  const byId = new Map(data.listed.map(p => [p.id, p]));
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const affiliate = amazonLinksOn(), sigs = await productSignals();
  const cards: FinderCard[] = await Promise.all(pool.map(async entry => {
    const p = byId.get(entry.id)!, brand = brandOf(p.brandId);
    const amazon = affiliate ? await amazonButton({ name: p.name, brand: brand || undefined }) : null;
    const site = websiteButton({ websiteUrl: p.websiteUrl ?? null, affiliateUrl: p.affiliateUrl ?? null });
    return { ...entry, name: displayName(p.name, brand), brand, href: productHref(p), line: shortLine(p) ?? listLine(p), signal: sigs.get(p.id)?.signal ?? null, category: p.shape ?? null, own: shopPhoto(p) ?? (light ? productPhoto(p)?.src : null) ?? null,
      amazonUrl: amazon?.url ?? null, amazonImage: amazon?.image && !photoHidden(p) ? amazon.image : null,
      siteUrl: site?.url ?? null, siteLabel: site?.label ?? null, siteAffiliate: !!site?.affiliate };
  }));
  const reviews = pool.reduce((a, p) => a + p.reviews, 0);
  return <main className={`top-page finder-page${light ? ` lt-page lf ${lightFont.className}` : ""}`}>
    <div className="page-title">
      {light && <p className="lf-kicker">{`Matched against ${reviews.toLocaleString("en-US")} real ${people.one} reviews`}</p>}
      <h1>{finder.heading}</h1>
      <p>{finder.intro}</p>
    </div>
    <FinderFlow cards={cards} negativeTags={bad}/>
    <section className="top-method" id="how-it-works">
      <h2>How the matching works</h2>
      <ul>
        <li>{`Your answers are matched against ${reviews.toLocaleString("en-US")} published reviews of ${pool.length} ${w.many}. A ${w.one} scores higher the more of its reviews describe what you asked for, compared with how many it has in total.`}</li>
        <li>{`Only ${w.many} with at least ${Math.max(MIN_LIST_REVIEWS, finder.minReviews ?? MIN_LIST_REVIEWS)} reviews, at least ${Math.round((finder.minPositive ?? MIN_POSITIVE_SHARE) * 100)}% of them positive (mixed counting as half), can be suggested${finder.maxAgeYears === undefined ? "" : finder.maxAgeYears === 0 ? `, from this year's models` : `, from the last ${finder.maxAgeYears + 1} model years`}.`}</li>
        {finder.questions.some(q => q.options.some(o => o.list)) && <li>{`Some answers sort ${w.many} into groups using our rankings: pick one and only ${w.many} on that ranking are suggested, in its order, even if that means fewer results.`}</li>}
        {finder.notes?.map(n => <li key={n}>{n}</li>)}
        <li>{`These are matches from what ${people.many} report, not personal advice. There are no sponsored placements${affiliate ? ", and affiliate links never change the results" : ""}.`}</li>
      </ul>
    </section>
  </main>;
}
