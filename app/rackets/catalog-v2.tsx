import "./catalog-v2.css";
import Link from "next/link";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { matchingRackets } from "../../lib/racket-search";
import { score, type Catalog } from "../../db/data";
import { styleLean, ARM_BAR, SUITS_OK } from "../../lib/fit-verdict";
import { gramsOf, weightOf, WEIGHTS, FEELS } from "../../lib/fine-tune";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { matchContext } from "../match-context";
import { rowOfFamily } from "../../lib/compare-pairs";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";

// The catalogue in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/Jv7VD7a2asnf83YuKDfxaw), PadelRecs
// only: filters on the left (play style, level, shape, year, arm-friendly, and "more filters" for weight, feel and a bigger
// sweet spot, like the home's fine-tune), the list as card rows ranked by Player score. Everything is in the URL, so every view
// is a server-rendered, shareable page; a group's counts are what you'd get by picking that option.
const PAGE = 20;
const STYLES = ["control", "balance", "power"] as const, LEVELS = ["beginner", "intermediate", "advanced"] as const, SHAPES = ["round", "teardrop", "hybrid", "diamond"] as const;
const SORTS = [["score", "player score"], ["reviews", "most reviewed"], ["newest", "newest"]] as const;
type F = { style?: string; level?: string; shape?: string; year?: string; arm?: string; weight?: string; feel?: string; sweet?: string; sort?: string; show?: string; more?: string; q?: string; older?: string };
const KEYS = ["style", "level", "shape", "year", "weight", "feel"] as const;

const shapeWord = (s: string | null | undefined) => { const x = (s ?? "").toLowerCase(); return /diamond/.test(x) ? "diamond" : /round/.test(x) ? "round" : /tear|drop/.test(x) ? "teardrop" : x ? "hybrid" : null; };

export default async function CatalogV2({ data, f }: { data: Catalog; f: F }) {
  const ctx = await matchContext();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const sig = (id: string) => ctx.signal(id);
  // Each listed racket's filter facts, from the same data as quick match and the fit check.
  const rows = matchingRackets(data.listed, f.q || "").map(r => {
    const facts = ctx.facts(r.id), lean = styleLean(facts).lean, suits = facts.suits, fine = ctx.fineOf(r.id), sc = score(data, r.id);
    return { r, sc, lean, suits, shape: shapeWord(r.shape), year: String(r.year), arm: (facts.tags["arm-friendly"] ?? 0) >= ARM_BAR,
      weight: weightOf(gramsOf(r.weight)), feel: fine?.feel ?? null, sweet: (ctx.traits(r.id).scores?.forgiveness?.dots ?? 0) >= 4, signal: sig(r.id), n: facts.reports };
  });
  type Row = (typeof rows)[number];
  const tests: Record<(typeof KEYS)[number], (x: Row, v: string) => boolean> = {
    style: (x, v) => x.lean === v, level: (x, v) => (x.suits?.[v as (typeof LEVELS)[number]] ?? 0) >= SUITS_OK, shape: (x, v) => x.shape === v,
    year: (x, v) => x.year === v, weight: (x, v) => x.weight === v, feel: (x, v) => x.feel === v,
  };
  // One model, newest year (owner 2026-11-15, as quick match): a family's older years are hidden unless ?older=1, a search or a
  // year pick asks for them. "Newest per model", not a year cut, so a model whose newest is 2025 stays. Older pages stay live.
  // A newest year without enough reports yet hands the row to the newest year that has them, with a "new:" link (owner
  // 2026-11-15, "Yes, fall back"; the same rule as quick match).
  const reportsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
  const rowOf = (r: (typeof data.listed)[number]) => rowOfFamily(r, data.listed, x => (reportsOf.get(x.id) ?? 0) >= MIN_FIT_REPORTS);
  const newest = new Set(data.listed.filter(r => rowOf(r).shown.id === r.id).map(r => r.id));
  const allYears = f.older === "1" || !!f.q || !!f.year;
  const current = (x: Row) => allYears || newest.has(x.r.id);
  const pass = (x: Row, skip?: string) => current(x) && KEYS.every(k => k === skip || !f[k] || tests[k](x, f[k]!)) && (skip === "arm" || f.arm !== "1" || x.arm) && (skip === "sweet" || f.sweet !== "1" || x.sweet);
  const sort = SORTS.some(([k]) => k === f.sort) ? f.sort! : "score";
  const order = (a: Row, b: Row) => sort === "reviews" ? b.sc.judged - a.sc.judged : sort === "newest" ? Number(b.year) - Number(a.year) || (b.signal ?? -1) - (a.signal ?? -1) : (b.signal ?? -1) - (a.signal ?? -1) || b.sc.judged - a.sc.judged;
  const shown = rows.filter(x => pass(x)).sort((a, b) => order(a, b) || a.r.name.localeCompare(b.r.name));
  const show = Math.min(1000, Math.max(PAGE, Number(f.show) || PAGE));
  // Links keep every other choice; a picked option links to itself turned off.
  const href = (next: Partial<F>) => { const q = new URLSearchParams(Object.entries({ ...f, show: undefined, ...next }).filter(([, v]) => v) as [string, string][]); return q.size ? `/rackets?${q}` : "/rackets"; };
  const years = [...new Set(rows.map(x => x.year))].sort().reverse();
  const groups: [string, (typeof KEYS)[number], readonly string[]][] = [["Play style", "style", STYLES], ["Level", "level", LEVELS], ["Shape", "shape", SHAPES], ...(years.length > 1 ? [["Year", "year", years] as [string, "year", string[]]] : [])];
  const extra: [string, (typeof KEYS)[number], readonly string[]][] = [["Weight", "weight", WEIGHTS], ["Feel on impact", "feel", FEELS]];
  const moreOpen = f.more === "1" || !!f.weight || !!f.feel || f.sweet === "1";
  const active = [...KEYS.filter(k => f[k]).map(k => ({ label: f[k]!, href: href({ [k]: undefined }) })),
    ...(f.arm === "1" ? [{ label: "arm-friendly", href: href({ arm: undefined }) }] : []), ...(f.sweet === "1" ? [{ label: "bigger sweet spot", href: href({ sweet: undefined }) }] : [])];
  const group = ([label, key, vals]: [string, (typeof KEYS)[number], readonly string[]]) =>
    <details key={key} className="ct-g" open>
      <summary><b>{label}</b>{f[key] && <span className="ct-val">{f[key]}</span>}<i aria-hidden="true"/></summary>
      <div className="ct-opts">{vals.map(v => { const on = f[key] === v, n = rows.filter(x => pass(x, key) && tests[key](x, v)).length;
        return <Link key={v} href={href({ [key]: on ? undefined : v })} scroll={false} replace className={`ct-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`} aria-current={on ? "true" : undefined}>
          <span className="ct-dot" aria-hidden="true"/><span className="ct-ol">{v}</span><span className="ct-n">{n}</span></Link>; })}</div>
    </details>;
  const photo = (r: Row["r"]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const total = data.listed.filter(r => newest.has(r.id)).length;
  const olderN = rows.filter(x => !newest.has(x.r.id) && KEYS.every(k => !f[k] || tests[k](x, f[k]!)) && (f.arm !== "1" || x.arm) && (f.sweet !== "1" || x.sweet)).length;

  return <main className={`ct2 ${qtFontVars}`}>
    <div className="ct2-wrap">
      <section className="ct2-hero">
        <div><h1>All <span className="hl">{niche.words.many}</span></h1>
          <p>{`Every ${niche.words.one} we track. Narrow it down on the left — the list updates as you tap.`}</p></div>
        <span className="ct2-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <div className="ct2-grid">
        <aside className="ct2-side" aria-label="Filters">
          <input type="checkbox" id="ct2-ft" className="ct2-ft"/>
          <div className="ct2-sh"><label htmlFor="ct2-ft" className="ct2-badge">filters<span className="ct2-mtog" aria-hidden="true"> ▾</span></label>
            {active.length > 0 && <Link href="/rackets" scroll={false} replace className="ct2-clear">clear all</Link>}</div>
          <div className="ct2-groups">
            {groups.map(group)}
            <Link href={href({ arm: f.arm === "1" ? undefined : "1" })} scroll={false} replace className={`ct2-check${f.arm === "1" ? " on" : ""}`} aria-current={f.arm === "1" ? "true" : undefined}>
              <i aria-hidden="true">{f.arm === "1" ? "✓" : ""}</i><b>Arm-friendly only</b></Link>
            {/* More filters, like the home's fine-tune (owner 2026-11-15): weight, feel and a bigger sweet spot. */}
            <details className="ct2-more" open={moreOpen}>
              <summary><span className="c">more filters ▾</span><span className="o">fewer filters ▴</span></summary>
              {extra.map(group)}
              <Link href={href({ sweet: f.sweet === "1" ? undefined : "1", more: "1" })} scroll={false} replace className={`ct2-check${f.sweet === "1" ? " on" : ""}`} aria-current={f.sweet === "1" ? "true" : undefined}>
                <i aria-hidden="true">{f.sweet === "1" ? "✓" : ""}</i><b>Bigger sweet spot</b></Link>
            </details>
          </div>
        </aside>

        <section className="ct2-main">
          <div className="ct2-bar">
            <div className="ct2-count"><b>{active.length || f.q || f.older === "1" ? `${shown.length} ${shown.length === 1 ? niche.words.one : niche.words.many}` : `All ${total} ${niche.words.many}`}</b>
              {active.map(a => <Link key={a.label} href={a.href} scroll={false} replace className="ct2-chipx">{a.label} <i aria-hidden="true">✕</i></Link>)}</div>
            <div className="ct2-sort"><span>sort</span>{SORTS.map(([k, label]) => <Link key={k} href={href({ sort: k === "score" ? undefined : k })} scroll={false} replace className={sort === k ? "on" : undefined} aria-current={sort === k ? "true" : undefined}>{label}</Link>)}</div>
          </div>
          <ol className="ct2-list">{shown.slice(0, show).map((x, i) => {
            const r = x.r, name = displayName(r.name, brand(r.brandId)), pic = photo(r), line = shortLine(r) ?? listLine(r);
            const chips = [...(i === 0 && sort === "score" ? [{ k: "top", t: "★ top pick" }] : []), ...(x.arm ? [{ k: "arm", t: "arm-friendly" }] : [])];
            const meta = [x.lean === "balance" ? "all-round" : x.lean, x.shape, x.year].filter(Boolean) as string[];
            return <li key={r.id} className={i === 0 ? "first" : i < 3 ? "top" : undefined}><a className="ct2-row" href={productHref(r)}>
              <span className="ct2-rank">{i + 1}</span>
              <span className="ct2-pic">{pic ? <img src={pic} alt="" loading={i < 4 ? "eager" : "lazy"}/> : <span className="ct2-tile">{brand(r.brandId)}</span>}</span>
              <span className="ct2-body">
                <span className="ct2-nrow"><span className="ct2-name">{name}</span>{chips.map(c => <span key={c.k} className={`ct2-chip ${c.k}`}>{c.t}</span>)}</span>
                {line && <span className="ct2-line">{line}</span>}
                <span className="ct2-mt">{meta.map(m => <span key={m}>{m}</span>)}</span>
              </span>
              {/* The home's tight row (owner 2026-11-15, "switch /rackets to the tight list too"): reviews over a sentiment
                  bar (counts, never a %), then the Player score box. */}
              <span className="ct2-sent"><span><strong>{x.n.toLocaleString("en-US")}</strong>{` ${x.n === 1 ? "review" : "reviews"}`}</span>
                {x.sc.judged > 0 && <span className="ct2-bar6" aria-label={`${x.sc.positive} positive, ${x.sc.mixed} mixed, ${x.sc.negative} negative`}><i className="p" style={{ flex: x.sc.positive }}/><i className="m" style={{ flex: x.sc.mixed }}/><i className="n" style={{ flex: x.sc.negative }}/></span>}</span>
              <span className={`ct2-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 75 ? "mid" : ""}`} title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">
                <b>{x.signal ?? "—"}</b><small>player score</small></span>
            </a></li>; })}</ol>
          {shown.length === 0 && <div className="ct2-empty"><b>Nothing matches all of that</b><Link href="/rackets" scroll={false} replace>clear filters</Link></div>}
          {!f.q && !f.year && olderN > 0 && <Link className="ct2-older" href={href({ older: f.older === "1" ? undefined : "1" })} scroll={false} replace>{f.older === "1" ? "hide older models ▴" : `show older models (${olderN}) ▾`}</Link>}
          {shown.length > show && <Link className="ct2-load" href={href({ show: String(show + PAGE) })} scroll={false} replace>{`load ${Math.min(PAGE, shown.length - show)} more ↓`}</Link>}
        </section>
      </div>
    </div>
    <V2Footer/>
  </main>;
}
