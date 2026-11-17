import { withoutYear } from "../../lib/brand-name";
import { specNumber } from "../../lib/spec-number";
import "./compare-v2.css";
import { qtFontVars } from "../qt-fonts";
import { score } from "../../db/data";
import { V2Footer } from "../v2-footer";
import { niche, productHref, catalogPath, hasYears, scoreLabel } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { amazonButton } from "../../lib/amazon-offer";
import { websiteButton } from "../../lib/product-links";
import { productSignals } from "../signals";
import { matchContext } from "../match-context";
import { homePayload } from "../home-payload";
import { SITE_FIT } from "../../lib/fit-config";
import { plain } from "../../lib/quick-take";
import { pageContent } from "../../lib/racket-page";
import { skinPage } from "../../lib/skin-page";
import { comparePairs, pairHref } from "../../lib/compare-pairs";
import { photoOf } from "../rankings/rankings-v2";
import type { Trait } from "../../lib/trait-score";
import { CompareAdd } from "./compare-add";
import { CompareVerdict, ChangeLink, type CProduct } from "./compare-verdict";
import { catchShort, leads, MAX_LINE, type VTrait } from "../../lib/compare-verdict";
import type { Data } from "./view";
import { isV2 } from "../../lib/niche";
import { attrProfileFor } from "../../lib/attr-profile";
import { refName, repeatsTrait, specValue } from "../../lib/compare-names";

/** The compare page (owner 2026-11-17, "Compare v3" mock): every kept site, two or three products (?look=classic keeps the
 *  older page). */
export const compareV2For = (count: number, look?: string) => count >= 2 && look !== "classic";
// One page for every site: the verdict, the cards, why yes / why not, where they differ and the specs (app/compare/
// compare-verdict.tsx). Every value is the product page's own: the Player score, the trait dots and the content lines.

const DOTS = SITE_FIT.traits.filter(t => !t.hidden);
const TRAITS: VTrait[] = DOTS.map(t => ({ label: t.label, diff: t.diff ?? `more ${t.label.toLowerCase()}`, ifYou: t.ifYou ?? `care about ${t.noun}` }));
const w = niche.words;
/** The card's name: no brand, no year ("Metalbone CTRL 3.5"). */
const shortName = (name: string, brand?: string) => { const n = withoutYear(name);
  return brand && n.toLowerCase().startsWith(`${brand.toLowerCase()} `) ? n.slice(brand.length + 1) : n; };
const hrefFor = (slugs: string[]) => slugs.length ? `/compare?ids=${slugs.map(encodeURIComponent).join(",")}` : "/compare";

export async function CompareV2({ data, products }: { data: Data; products: Data["rackets"] }) {
  // SkinRecs and SimRacingRecs rank by attributes (lib/attr-profile), not the match context: their products come without
  // trait dots or a quick match, and the verdict compares on the player score, the content lines and the specs.
  const engine = !!niche.fit?.engine && !attrProfileFor(niche);
  const [sigs, ctx, payload] = await Promise.all([productSignals(), matchContext().catch(() => null), engine ? homePayload() : null]);
  const brandOf = (r: Data["rackets"][number]) => data.brands.find(b => b.id === r.brandId)?.name;
  const slugs = products.map(r => r.slug);
  const specDefs = [...niche.specs.map(spec => ({ label: spec.label.toLowerCase(), get: (r: Data["rackets"][number]) => r[spec.column] as string | null })),
    ...(hasYears ? [{ label: "year", get: (r: Data["rackets"][number]) => String(r.year) }] : [])].filter(row => products.some(r => row.get(r)));
  const base = await Promise.all(products.map(async r => {
    const brand = brandOf(r), name = displayName(r.name, brand);
    const amazon = await amazonButton({ name: r.name, brand }), site = amazon ? null : websiteButton(r);
    const take = ctx?.takes.get(r.id), page = pageContent(r.slug) ?? skinPage(r.slug), sc = ctx?.traits(r.id).scores;
    const catchLine = take?.catch ? plain(take.catch) : page?.no[0] ? plain(page.no[0].t) : null;
    return { r, name, page, catchLine, dots: DOTS.map(t => sc?.[t.key as Trait]?.dots ?? 0),
      shop: amazon ? { url: amazon.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null };
  }));
  // "Why yes, why not": what sets each one apart (the traits where it leads every other one shown), then its own best point
  // from its page; the "!" is its own catch. Expert voice, ≤ 105 characters, never a count.
  // Named, not "the other one" (owner 2026-11-17): "Longer than the Wraith", "Easier on the arm than the Jelly Bean 2 and the
  // Envy"; "than both others" only when the names would push the line past 105 characters.
  // Two that share a name once the year is gone (Vertex 05 Geo 2026 vs 2027) keep their years (audit 2026-11-17, #7).
  const plainShort = base.map(b => shortName(b.name, brandOf(b.r)));
  const shorts = plainShort.map((n, i) => plainShort.filter(x => x.toLowerCase() === n.toLowerCase()).length > 1 ? `${n} ${base[i].r.year}` : n);
  const named = base.map((b, i) => ({ brand: brandOf(b.r) ?? "", model: shorts[i] }));
  const othersOf = (i: number) => named.map((_, j) => j).filter(j => j !== i).map(j => `the ${refName(j, named)}`).join(" and ");
  const short = (t: string | null | undefined) => t && t.length <= MAX_LINE ? t : null;
  const cprods: CProduct[] = base.map((b, i) => {
    const vp = { id: b.r.id, short: shorts[i],
      signal: sigs.get(b.r.id)?.signal ?? null, judged: score(data, b.r.id).judged, dots: b.dots, catchShort: catchShort(b.catchLine) };
    const lead = leads(base.map(x => ({ ...vp, dots: x.dots })), i).slice(0, 2).map(k => { const d = `${TRAITS[k].diff[0].toUpperCase()}${TRAITS[k].diff.slice(1)} than `, line = `${d}${othersOf(i)}.`;
      return line.length <= MAX_LINE ? line : `${d}${base.length === 2 ? "the other one" : "both others"}.`; });
    // Its own best point, unless it makes the same point as a comparison line above (owner 2026-11-17: "Quicker than …" and
    // "Fast handling at the net" are one point).
    const leadKeys = leads(base.map(x => ({ ...vp, dots: x.dots })), i).slice(0, 2).map(k => DOTS[k].key);
    const own = b.page?.yes.map(y => short(plain(y.t))).find((t): t is string => !!t && !repeatsTrait(t, leadKeys, Object.fromEntries(DOTS.map(d => [d.key, d.label]))));
    return { ...vp, name: b.name, slug: b.r.slug, href: productHref(b.r), pic: photoOf(b.r), shop: b.shop,
      yes: [...lead, ...(own && lead.length < 2 ? [own] : [])].slice(0, 2), no: short(b.catchLine), specs: specDefs.map(d => { const v = d.get(b.r); return v ? specValue(specNumber(String(v))) : null; }) };
  });
  const { partners } = comparePairs(data);
  const more = products.flatMap(r => (partners.get(r.id) ?? []).filter(x => !(products.length === 2 && products.includes(x))).map(x => ({ r, x })))
    .filter((v, i, all) => all.findIndex(o => pairHref(o.r.slug, o.x.slug) === pairHref(v.r.slug, v.x.slug)) === i).slice(0, 6);
  const nameOf = (r: Data["rackets"][number]) => displayName(r.name, brandOf(r));
  const n = products.length, count = n === 2 ? "two" : "three";
  const anyAffiliate = cprods.some(c => c.shop?.rel.startsWith("sponsored"));
  // Removing one of two goes back to the catalogue's compare mode; of three, to the other two.
  const removeHref = Object.fromEntries(products.map(r => [r.id, n > 2 ? hrefFor(slugs.filter(s => s !== r.slug)) : `${catalogPath}?compare=1`]));

  return <><main className={`cx ${qtFontVars}`}>
    <div className="cx-wrap">
      <div className="cx-crumbs"><a href={`${catalogPath}?compare=1`}>{w.many}</a> / compare</div>
      <h1 className="cx-h1">{`Compare ${count} ${w.many}`}</h1>
      <CompareVerdict products={cprods} traits={TRAITS} items={engine && payload ? payload.items : null} specLabels={specDefs.map(d => d.label)}
        scoreWord={scoreLabel.toLowerCase()} removeHref={removeHref}/>
      <div className="cx-after"><ChangeLink href={`${catalogPath}?compare=1`} label={`← change ${w.many}`} picks={cprods.map(c => ({ id: c.id, slug: c.slug, name: c.name, pic: c.pic }))}/>
        <span>{`based on reviews from ${niche.people.many}, YouTube and forums`}</span></div>
      {n < 3 && <section className="cx-add"><b>{`Add a third ${w.one}`}</b><CompareAdd slugs={slugs} label={`Search ${w.many}`}/></section>}
      {more.length > 0 && <section className="cx-more"><h2>More comparisons</h2><ul>{more.map(({ r, x }) => <li key={pairHref(r.slug, x.slug)}><a href={pairHref(r.slug, x.slug)}>{nameOf(r)} <i>vs</i> {nameOf(x)}</a></li>)}</ul></section>}
      {anyAffiliate && <p className="cx-aff">* some links are affiliate links; they never change a score.</p>}
    </div>
  </main>{isV2 && <V2Footer/>}</>;
}
