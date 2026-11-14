export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { catalog, score } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { lightFont } from "../light-font";
import RateGrid from "./rate-grid";

// "Rate what you've played" (2026-11-14 pivot): one page to rate every product you've used, most-discussed first.
const SHOWN = 80;

export const metadata: Metadata = {
  title: { absolute: `Rate the ${niche.words.many} you've used | ${niche.site.name}` },
  description: `Positive, mixed or negative: one tap for every ${niche.words.one} you've used. Takes about 30 seconds and helps ${niche.people.many} like you choose.`,
  alternates: { canonical: "/rate" },
};

export default async function Rate() {
  const data = await catalog();
  const ranked = data.rackets.map(r => ({ r, n: score(data, r.id).judged })).sort((a, b) => b.n - a.n || a.r.name.localeCompare(b.r.name)).slice(0, SHOWN);
  const items = ranked.map(({ r }) => {
    const brand = data.brands.find(b => b.id === r.brandId)?.name ?? "";
    return { id: r.id, name: displayName(r.name, brand), brand, href: productHref(r) };
  });
  const brands = [...new Set(items.map(i => i.brand).filter(Boolean))].sort((a, b) => items.filter(i => i.brand === b).length - items.filter(i => i.brand === a).length || a.localeCompare(b));
  const p = niche.profile;
  return <main className={`lt-page rate-page ${lightFont.className}`}>
    <h1>{`Rate the ${niche.words.many} you've used`}</h1>
    <p className="rate-sub">{`One tap for every ${niche.words.one} you've used: positive, mixed or negative. No account, about 30 seconds, and it shows ${niche.people.many} like you what works.`}</p>
    <RateGrid items={items} brands={brands} plural={niche.words.many} people={niche.people}
      levels={p.playerLevel.options.map(o => o.value)} styles={p.playingStyle.options.map(o => o.value)} sides={p.playingSide.options.map(o => o.value)}/>
  </main>;
}
