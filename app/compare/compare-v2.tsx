import "./compare-v2.css";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { score } from "../../db/data";
import { niche, productHref, catalogPath, hasYears, scoreLabel } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { amazonButton } from "../../lib/amazon-offer";
import { websiteButton } from "../../lib/product-links";
import { productSignals } from "../signals";
import { matchContext } from "../match-context";
import { homePayload } from "../home-payload";
import { SITE_FIT } from "../../lib/fit-config";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { plain } from "../../lib/quick-take";
import { pageContent } from "../../lib/racket-page";
import { comparePairs, pairHref } from "../../lib/compare-pairs";
import { photoOf } from "../rankings/rankings-v2";
import type { Trait } from "../../lib/trait-score";
import { CompareAdd } from "./compare-add";
import { CompareMatch, MatchPct } from "./compare-match";
import type { Data } from "./view";
import { isV2 } from "../../lib/niche";
import { attrProfileFor } from "../../lib/attr-profile";

/** The v2 compare page: v2 sites with the match engine, two or three products (?look=classic keeps the older page). */
export const compareV2For = (count: number, look?: string) => isV2 && !!niche.fit?.engine && !attrProfileFor(niche) && count >= 2 && look !== "classic";

// Compare in design v2 (owner 2026-11-16, Claude Design mock https://claude.ai/artifact/J46o6jD2ehiKVdJE7PeaHv), for two or
// three products on the v2 sites with the match engine (padel, pickleball). Both addresses use it (/compare?ids=… and the
// curated /compare/a-vs-b pages). Every value is the product page's own: the Player score, the trait dots (lib/trait-score
// via the match context), the review counts and the specs. "Pick it if you…" names the traits where a product's dots are
// furthest ahead of the others, in the site's own words (fit-config ifYou), so the line never disagrees with the bars. A row's
// "▲ best" needs a clear lead (no tie) and enough reports behind it. No price row: we hold no reliable prices.

const DOTS = SITE_FIT.traits.filter(t => !t.hidden);
const IF_YOU = DOTS.map(t => t.ifYou ?? `care about ${t.noun}`);
const w = niche.words;
const hrefFor = (slugs: string[]) => slugs.length ? `/compare?ids=${slugs.map(encodeURIComponent).join(",")}` : "/compare";

export async function CompareV2({ data, products }: { data: Data; products: Data["rackets"] }) {
  const [sigs, ctx, payload] = await Promise.all([productSignals(), matchContext(), homePayload()]);
  const brandOf = (r: Data["rackets"][number]) => data.brands.find(b => b.id === r.brandId)?.name;
  const slugs = products.map(r => r.slug);
  const cols = await Promise.all(products.map(async r => {
    const brand = brandOf(r), s = score(data, r.id), name = displayName(r.name, brand);
    const amazon = await amazonButton({ name: r.name, brand }), site = amazon ? null : websiteButton(r);
    const sc = ctx.traits(r.id).scores, reports = ctx.facts(r.id).reports;
    const take = ctx.takes.get(r.id), page = pageContent(r.slug);
    return { r, name, short: name.replace(/\s\d{4}$/, ""), href: productHref(r), pic: photoOf(r), s, reports, signal: sigs.get(r.id)?.signal ?? null,
      dots: DOTS.map(t => sc?.[t.key as Trait]?.dots ?? 0),
      catchLine: take?.catch ? plain(take.catch) : page?.no[0] ? plain(page.no[0].t) : null,
      shop: amazon ? { url: amazon.url, rel: "sponsored nofollow noopener" } : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null };
  }));
  // "Pick it if you…": the trait(s) where this one's dots lead every other column most.
  const pickFor = (i: number) => {
    const me = cols[i].dots, gaps = me.map((v, k) => ({ k, g: v ? v - Math.max(...cols.filter((_, j) => j !== i).map(c => c.dots[k] || 0)) : 0 })).filter(x => x.g > 0).sort((a, b) => b.g - a.g || a.k - b.k);
    return gaps.slice(0, 2).map(x => IF_YOU[x.k]);
  };
  // "▲ best" in a trait row: a single leader with enough reports.
  const bestIn = (k: number) => { const vals = cols.map(c => c.dots[k] || 0), top = Math.max(...vals);
    return top && vals.filter(v => v === top).length === 1 ? (cols[vals.indexOf(top)].reports >= MIN_FIT_REPORTS ? vals.indexOf(top) : -1) : -1; };
  const topSignal = Math.max(...cols.map(c => c.signal ?? -1)), topRated = cols.filter(c => c.signal === topSignal).length === 1 ? topSignal : null;
  const specRows = [...niche.specs.map(spec => ({ label: spec.label.toLowerCase(), get: (r: Data["rackets"][number]) => r[spec.column] as string | null })),
    ...(hasYears ? [{ label: "year", get: (r: Data["rackets"][number]) => String(r.year) }] : [])].filter(row => cols.some(c => row.get(c.r)));
  const { partners } = comparePairs(data);
  const more = products.flatMap(r => (partners.get(r.id) ?? []).filter(x => !(products.length === 2 && products.includes(x))).map(x => ({ r, x })))
    .filter((v, i, all) => all.findIndex(o => pairHref(o.r.slug, o.x.slug) === pairHref(v.r.slug, v.x.slug)) === i).slice(0, 6);
  const nameOf = (r: Data["rackets"][number]) => displayName(r.name, brandOf(r));
  const n = cols.length, count = n === 2 ? "two" : "three";
  const items = payload.items;
  const st = { "--n": n } as React.CSSProperties;
  const cell = (k: string, inner: React.ReactNode, cls = "") => <div key={k} className={`cv-c ${cls}`}>{inner}</div>;
  const anyAffiliate = cols.some(c => c.shop?.rel.startsWith("sponsored"));

  return <><main className={`cv ${qtFontVars}`}>
    <div className="cv-wrap">
      <div className="cv-crumbs"><a href={catalogPath}>{w.many}</a> / compare</div>
      <h1>Compare <span className="hl">{`${count} ${w.many}`}</span></h1>
      <p className="cv-sub">{`Side by side, from ${niche.people.one} reviews. The best in each row is marked.`}</p>
      <CompareMatch items={items}>
        <div className="cv-scroll"><div className="cv-t" style={st}>
          <div className="cv-r cv-strip"><div className="cv-l">comparing</div>{cols.map(c => cell(c.r.id, <>{c.pic && <img src={c.pic} alt=""/>}<b>{c.short}</b></>))}</div>
          <div className="cv-r cv-heads"><div className="cv-l"/>{cols.map(c => cell(c.r.id, <>
            <a className="cv-x" href={hrefFor(slugs.filter(s => s !== c.r.slug))} aria-label={`Remove ${c.name}`}>×</a>
            <a className="cv-pic" href={c.href}>{c.pic ? <img src={c.pic} alt="" loading="eager"/> : <span>{brandOf(c.r)}</span>}</a>
            <a className="cv-name" href={c.href}>{c.name}</a>
            {topRated !== null && c.signal === topRated && <span className="cv-top">{`★ top rated by ${niche.people.many}`}</span>}
            <span className="cv-sc" title={`${scoreLabel}: not a % of happy ${niche.people.many}. It blends how much ${niche.people.many} like it with how many have weighed in.`}><b>{c.signal ?? "–"}</b><small>{scoreLabel.toLowerCase()}</small></span>
            <MatchPct id={c.r.id}/>
            {c.shop && <a className="cv-buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
          </>))}</div>
          <div className="cv-r"><div className="cv-l"><b>Pick it if you…</b></div>{cols.map((c, i) => { const p = pickFor(i);
            return cell(c.r.id, p.length ? <span className="cv-mk">{p.join(" and ")}</span> : <span className="cv-none">plays close to the others</span>); })}</div>
          <div className="cv-r"><div className="cv-l"><b>The catch</b></div>{cols.map(c => cell(c.r.id, c.catchLine ? <span className="cv-catch">{c.catchLine}</span> : <span className="cv-none">—</span>))}</div>
          <div className="cv-r cv-g"><div className="cv-gl">{`how it plays · from ${niche.people.one} reviews`}</div></div>
          {DOTS.map((t, k) => { const b = bestIn(k);
            return <div key={t.key} className="cv-r cv-tr"><div className="cv-l"><b>{t.label}</b></div>{cols.map((c, i) => cell(c.r.id, <>
              {c.dots[k] ? <span className="cv-segs" role="img" aria-label={`${c.dots[k]} of 5`}>{[1, 2, 3, 4, 5].map(x => <i key={x} className={x <= c.dots[k] ? `on t${c.dots[k]}` : undefined}/>)}</span> : <span className="cv-none">too few reports</span>}
              {b === i && <small className="cv-best">▲ best</small>}</>, b === i ? "best" : ""))}</div>; })}
          <div className="cv-r"><div className="cv-l"><b>{`What ${niche.people.many} say`}</b></div>{cols.map(c => cell(c.r.id, <>
            {c.s.judged > 0 && <span className="cv-bar" role="img" aria-label={`${c.s.positive} positive, ${c.s.mixed} mixed, ${c.s.negative} negative`}><i className="p" style={{ flex: c.s.positive }}/><i className="m" style={{ flex: c.s.mixed }}/><i className="n" style={{ flex: c.s.negative }}/></span>}
            <a className="cv-n" href={`${c.href}#reviews`}>{`${(c.s.count + c.s.web).toLocaleString("en-US")} reviews`}</a></>))}</div>
          {specRows.length > 0 && <><div className="cv-r cv-g"><div className="cv-gl">specs</div></div>
            {specRows.map(row => <div key={row.label} className="cv-r cv-sp"><div className="cv-l">{row.label}</div>{cols.map(c => cell(c.r.id, row.get(c.r) || <span className="cv-none">not listed</span>))}</div>)}</>}
          <div className="cv-r cv-foot"><div className="cv-l"/>{cols.map(c => cell(c.r.id, <>
            {c.shop && <a className="cv-buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
            <a className="cv-full" href={c.href}>full review →</a></>))}</div>
        </div></div>
      </CompareMatch>
      <div className="cv-after"><a href={`${catalogPath}?compare=1`}>{`← change ${w.many}`}</a><span>scores come from player reviews, not from us or brands</span></div>
      {n < 3 && <section className="cv-add"><b>{`Add a third ${w.one}`}</b><CompareAdd slugs={slugs} label={`Search ${w.many}`}/></section>}
      {more.length > 0 && <section className="cv-more"><h2>More comparisons</h2><ul>{more.map(({ r, x }) => <li key={pairHref(r.slug, x.slug)}><a href={pairHref(r.slug, x.slug)}>{nameOf(r)} <i>vs</i> {nameOf(x)}</a></li>)}</ul></section>}
      {anyAffiliate && <p className="cv-aff">* some links are affiliate links; they never change a score.</p>}
    </div>
  </main><V2Footer/></>;
}
