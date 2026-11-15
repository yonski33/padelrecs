import "../rackets/catalog-v2.css";
import "./skin-v2.css";
import Link from "next/link";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { matchingRackets } from "../../lib/racket-search";
import { listShopLink } from "../../lib/amazon-offer";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { skinContext } from "./context";
import { fitWord, reasonOf } from "./rank";
import type { AttrChoice } from "../../lib/attr-score";

// The SkinRecs catalogue in design v2 (owner 2026-11-15, same layout as padel's app/rackets/catalog-v2.tsx): filters on the
// left from the match engine's scores — "good for <skin type>" means people with that skin type rate it well (suits score 65+
// from enough of them), not that the maker says so — plus finish, texture and fragrance-free. Picking a skin type or a
// concern ranks by match %. Everything in the URL. Used for /products, each type page and each brand page.
const PAGE = 20, GOOD = 65;
const GROUPS = [["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["sensitive", "Sensitive"], ["acne", "Acne-prone"]] as const;
type F = { skin?: string; sens?: string; acne?: string; finish?: string; texture?: string; ff?: string; type?: string; sort?: string; show?: string; q?: string };
const KEYS = ["type", "skin", "finish", "texture"] as const;
const SORTS = [["score", "user score"], ["reviews", "most reviewed"]] as const;

export default async function CatalogSkin({ f, base, fixedType, brand: only, title, intro }: { f: F; base: string; fixedType?: string; brand?: { id: string; name: string; slug: string }; title?: string; intro?: string }) {
  const ctx = await skinContext(), { data } = ctx;
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const typeOf = (slug?: string) => niche.typePages?.find(t => t.slug === slug);
  const pool = matchingRackets(data.listed, f.q || "").filter(r => (!fixedType || r.shape === fixedType) && (!only || r.brandId === only.id));
  const rows = pool.map(r => {
    const a = ctx.attrs.get(r.id)!, c = ctx.counts.get(r.id)!;
    const good = (k: string) => (a.scores[`suits_${k}`]?.score ?? 0) >= GOOD;
    const fin = a.scores.finish?.score ?? null, tex = a.scores.texture?.score ?? null;
    return { r, a, c, signal: ctx.signal(r.id), good, finish: fin === null ? null : fin <= 40 ? "matte" : fin >= 60 ? "dewy" : null, texture: tex === null ? null : tex <= 40 ? "light" : tex >= 60 ? "rich" : null,
      ff: a.facts.fragrance_free === "free", type: niche.typePages?.find(t => t.shape === r.shape)?.slug ?? null };
  });
  type Row = (typeof rows)[number];
  const tests: Record<(typeof KEYS)[number], (x: Row, v: string) => boolean> = {
    type: (x, v) => x.type === v, skin: (x, v) => x.good(v), finish: (x, v) => x.finish === v, texture: (x, v) => x.texture === v };
  const pass = (x: Row, skip?: string) => KEYS.every(k => k === skip || !f[k] || tests[k](x, f[k]!)) && (skip === "sens" || f.sens !== "1" || x.good("sensitive"))
    && (skip === "acne" || f.acne !== "1" || x.good("acne")) && (skip === "ff" || f.ff !== "1" || x.ff);
  const choice: AttrChoice = { type: null, skin: f.skin && f.skin !== "sensitive" && f.skin !== "acne" ? f.skin : null,
    concerns: [...(f.sens === "1" || f.skin === "sensitive" ? ["sensitive"] : []), ...(f.acne === "1" || f.skin === "acne" ? ["acne"] : [])], finish: f.finish === "matte" || f.finish === "dewy" ? f.finish : null, ff: false };
  const matching = !!(choice.skin || choice.concerns.length);
  const sort = SORTS.some(([k]) => k === f.sort) ? f.sort! : "score";
  const shown = rows.filter(x => pass(x)).map(x => ({ ...x, m: matching ? ctx.match(x.r.id, choice) : null }))
    .sort((a, b) => (matching && sort === "score" ? (b.m?.pct ?? -1) - (a.m?.pct ?? -1) : 0) || (sort === "reviews" ? b.c.n - a.c.n : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.r.name.localeCompare(b.r.name));
  const show = Math.min(1000, Math.max(PAGE, Number(f.show) || PAGE));
  const href = (next: Partial<F>) => { const q = new URLSearchParams(Object.entries({ ...f, show: undefined, ...next }).filter(([, v]) => v) as [string, string][]); return q.size ? `${base}?${q}` : base; };
  const groupDefs: [string, (typeof KEYS)[number], readonly (readonly [string, string])[]][] = [
    ...(fixedType ? [] : [["Type", "type", (niche.typePages ?? []).map(t => [t.slug, t.label.toLowerCase()] as const)] as [string, "type", (readonly [string, string])[]]]),
    ["Good for", "skin", GROUPS.filter(([k]) => k !== "sensitive" && k !== "acne").map(([k, l]) => [k, `${l.toLowerCase()} skin`] as const)],
    ["Finish", "finish", [["matte", "matte"], ["dewy", "dewy"]]],
    ["Texture", "texture", [["light", "light"], ["rich", "rich"]]],
  ];
  const active = [...KEYS.filter(k => f[k]).map(k => ({ label: k === "skin" ? `good for ${f[k]} skin` : k === "type" ? typeOf(f[k])?.label.toLowerCase() ?? f[k]! : `${f[k]} ${k}`, href: href({ [k]: undefined }) })),
    ...(f.sens === "1" ? [{ label: "good for sensitive skin", href: href({ sens: undefined }) }] : []), ...(f.acne === "1" ? [{ label: "good for acne-prone skin", href: href({ acne: undefined }) }] : []),
    ...(f.ff === "1" ? [{ label: "fragrance-free", href: href({ ff: undefined }) }] : [])];
  const group = ([label, key, vals]: (typeof groupDefs)[number]) =>
    <details key={key} className="ct-g" open>
      <summary><b>{label}</b>{f[key] && <span className="ct-val">{vals.find(v => v[0] === f[key])?.[1]}</span>}<i aria-hidden="true"/></summary>
      <div className="ct-opts">{vals.map(([v, l]) => { const on = f[key] === v, n = rows.filter(x => pass(x, key) && tests[key](x, v)).length;
        return <Link key={v} href={href({ [key]: on ? undefined : v })} scroll={false} replace className={`ct-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`} aria-current={on ? "true" : undefined}>
          <span className="ct-dot" aria-hidden="true"/><span className="ct-ol">{l}</span><span className="ct-n">{n}</span></Link>; })}</div>
    </details>;
  const checkLink = (key: "sens" | "acne" | "ff", label: string, test: (x: Row) => boolean) => { const on = f[key] === "1", n = rows.filter(x => pass(x, key) && test(x)).length;
    return <Link href={href({ [key]: on ? undefined : "1" })} scroll={false} replace className={`ct2-check${on ? " on" : ""}`} aria-current={on ? "true" : undefined}>
      <i aria-hidden="true">{on ? "✓" : ""}</i><b>{label}</b><span className="ct-n">{n}</span></Link>; };
  const photo = (r: Row["r"]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const heading = title ?? (only ? only.name : "All");
  return <main className={`ct2 sk2 ${qtFontVars}`}>
    <div className="ct2-wrap">
      <section className="ct2-hero">
        <div>{only && <p className="ct2-crumbs"><a href="/">home</a> / <a href="/brands">brands</a> / {only.name.toLowerCase()}</p>}
          <h1>{fixedType ? heading : <>{`${heading} `}<span className="hl">{niche.words.many}</span></>}</h1>
          <p>{intro ?? "Narrow it down on the left. “Good for” comes from what people with that skin type said, not from the label."}</p></div>
        <span className="ct2-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <div className="ct2-grid">
        <aside className="ct2-side" aria-label="Filters">
          <input type="checkbox" id="ct2-ft" className="ct2-ft"/>
          <div className="ct2-sh"><label htmlFor="ct2-ft" className="ct2-badge">filters<span className="ct2-mtog" aria-hidden="true"> ▾</span></label>
            {active.length > 0 && <Link href={base} scroll={false} replace className="ct2-clear">clear all</Link>}</div>
          <div className="ct2-groups">
            {groupDefs.slice(0, fixedType ? 1 : 2).map(group)}
            {checkLink("sens", "Good for sensitive skin", x => x.good("sensitive"))}
            {checkLink("acne", "Good for acne-prone skin", x => x.good("acne"))}
            {groupDefs.slice(fixedType ? 1 : 2).map(group)}
            {checkLink("ff", "Fragrance-free", x => x.ff)}
          </div>
        </aside>
        <section className="ct2-main">
          <div className="ct2-bar">
            <div className="ct2-count"><b>{`${shown.length} ${shown.length === 1 ? niche.words.one : niche.words.many}`}</b>
              {active.map(a => <Link key={a.label} href={a.href} scroll={false} replace className="ct2-chipx">{a.label} <i aria-hidden="true">✕</i></Link>)}</div>
            <div className="ct2-sort"><span>sort</span>{SORTS.map(([k, label]) => <Link key={k} href={href({ sort: k === "score" ? undefined : k })} scroll={false} replace className={sort === k ? "on" : undefined} aria-current={sort === k ? "true" : undefined}>{k === "score" && matching ? "best match" : label}</Link>)}</div>
          </div>
          <ol className="ct2-list">{shown.slice(0, show).map((x, i) => {
            const r = x.r, name = displayName(r.name, brand(r.brandId)), pic = photo(r), line = shortLine(r) ?? listLine(r), shop = listShopLink(r);
            const meta = [fixedType ? null : r.shape?.toLowerCase(), x.texture ? `${x.texture} texture` : null, x.finish ? `${x.finish} finish` : null, x.ff ? "fragrance-free" : null].filter((m): m is string => !!m);
            const goodFor = GROUPS.filter(([k]) => x.good(k)).map(([, l]) => l.toLowerCase());
            const pct = x.m?.pct ?? null, fit = x.m ? fitWord(pct) : null;
            return <li key={r.id} className={i === 0 ? "first" : i < 3 ? "top" : undefined}><div className="ct2-row">
              <span className="ct2-rank">{i + 1}</span>
              <span className="ct2-pic">{pic ? <img src={pic} alt="" width={408} height={620} decoding="async" loading={i < 4 ? "eager" : "lazy"}/> : <span className="ct2-tile">{brand(r.brandId)}</span>}</span>
              <span className="ct2-body">
                <span className="ct2-nrow"><a className="ct2-name" href={productHref(r)}>{name}</a>{goodFor.length > 0 && <span className="ct2-chip arm">{`good for ${goodFor.join(", ")}`}</span>}</span>
                {fit ? <span className="ct2-line"><b>{fit}</b>{x.m && reasonOf(ctx, x.m) ? ` · ${reasonOf(ctx, x.m)}` : ""}</span> : line && <span className="ct2-line">{line}</span>}
                <span className="ct2-mt">{meta.map(m => <span key={m}>{m}</span>)}{shop && <a className="ct2-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a>}</span>
              </span>
              <span className="ct2-sent"><span><strong>{x.c.n.toLocaleString("en-US")}</strong>{` ${x.c.n === 1 ? "review" : "reviews"}`}</span>
                {x.c.positive + x.c.mixed + x.c.negative > 0 && <span className="ct2-bar6" aria-label={`${x.c.positive} positive, ${x.c.mixed} mixed, ${x.c.negative} negative`}><i className="p" style={{ flex: x.c.positive }}/><i className="m" style={{ flex: x.c.mixed }}/><i className="n" style={{ flex: x.c.negative }}/></span>}</span>
              {matching ? <span className={`ct2-sc ${pct === null ? "none" : pct >= 80 ? "hi" : pct >= 60 ? "mid" : ""}`} title="How well it fits your skin, from what people with your skin type said.">
                  <b>{pct === null ? "—" : `${pct}%`}</b><small>{pct === null ? "too few reports" : "match"}</small></span>
                : <span className={`ct2-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 75 ? "mid" : ""}`} title="User score: not a % of happy users. It blends how much people like it with how many have weighed in.">
                  <b>{x.signal ?? "—"}</b><small>user score</small></span>}
            </div></li>; })}</ol>
          {shown.length === 0 && <div className="ct2-empty"><b>Nothing matches all of that</b><Link href={base} scroll={false} replace>clear filters</Link></div>}
          {shown.length > show && <Link className="ct2-load" href={href({ show: String(show + PAGE) })} scroll={false} replace>{`load ${Math.min(PAGE, shown.length - show)} more ↓`}</Link>}
        </section>
      </div>
    </div>
    <V2Footer/>
  </main>;
}
