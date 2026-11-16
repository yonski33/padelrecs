import "./skin-product.css";
import "./catalog-beauty.css";
import Link from "next/link";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { matchingRackets } from "../../lib/racket-search";
import { listShopLink } from "../../lib/amazon-offer";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { V2Footer } from "../v2-footer";
import { skinContext } from "./context";
import { fitWord, reasonOf } from "./rank";
import { FEW_VOICES, type AttrChoice } from "../../lib/attr-score";

// The SkinRecs catalogue in the owner's beauty design (Claude Design "SkinRecs products", 2026-11-16; before: padel's layout): filters on the
// left from the match engine's scores — "good for <skin type>" means people with that skin type rate it well (suits score 65+
// from enough of them), not that the maker says so — plus finish, texture and fragrance-free. Picking a skin type or a
// concern ranks by match %. Everything in the URL. Used for /products, each type page and each brand page.
const PAGE = 20, GOOD = 65;
const GROUPS = [["dry", "Dry"], ["oily", "Oily"], ["combination", "Combination"], ["sensitive", "Sensitive"], ["acne", "Acne-prone"]] as const;
type F = { skin?: string; sens?: string; acne?: string; finish?: string; texture?: string; price?: string; ff?: string; type?: string; sort?: string; show?: string; q?: string };
const KEYS = ["type", "skin", "finish", "texture", "price"] as const;
const SORTS = [["score", "top rated"], ["reviews", "most reviewed"], ["price", "lowest price"]] as const;
const PRICES = [["$", "$ · budget"], ["$$", "$$ · mid"], ["$$$", "$$$ · splurge"]] as const;

export default async function CatalogSkin({ f, base, fixedType, brand: only, title, intro }: { f: F; base: string; fixedType?: string; brand?: { id: string; name: string; slug: string }; title?: string; intro?: string }) {
  const ctx = await skinContext(), { data } = ctx;
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const typeOf = (slug?: string) => niche.typePages?.find(t => t.slug === slug);
  const pool = matchingRackets(data.listed, f.q || "").filter(r => (!fixedType || r.shape === fixedType) && (!only || r.brandId === only.id));
  const rows = pool.map(r => {
    const a = ctx.attrs.get(r.id)!, c = ctx.counts.get(r.id)!;
    const good = (k: string) => { const s = a.scores[`suits_${k}`]; return !!s && s.score >= GOOD && s.n >= FEW_VOICES; };
    const fin = a.scores.finish?.score ?? null, tex = a.scores.texture?.score ?? null;
    return { r, a, c, signal: ctx.signal(r.id), good, finish: fin === null ? null : fin <= 40 ? "matte" : fin >= 60 ? "dewy" : null, texture: tex === null ? null : tex <= 40 ? "light" : tex >= 60 ? "rich" : null,
      ff: a.facts.fragrance_free === "free", price: typeof a.facts.price === "string" ? a.facts.price : null, type: niche.typePages?.find(t => t.shape === r.shape)?.slug ?? null };
  });
  type Row = (typeof rows)[number];
  const tests: Record<(typeof KEYS)[number], (x: Row, v: string) => boolean> = {
    type: (x, v) => x.type === v, skin: (x, v) => x.good(v), finish: (x, v) => x.finish === v, texture: (x, v) => x.texture === v, price: (x, v) => x.price === v };
  const pass = (x: Row, skip?: string) => KEYS.every(k => k === skip || !f[k] || tests[k](x, f[k]!)) && (skip === "sens" || f.sens !== "1" || x.good("sensitive"))
    && (skip === "acne" || f.acne !== "1" || x.good("acne")) && (skip === "ff" || f.ff !== "1" || x.ff);
  const choice: AttrChoice = { type: null, skin: f.skin && f.skin !== "sensitive" && f.skin !== "acne" ? f.skin : null,
    concerns: [...(f.sens === "1" || f.skin === "sensitive" ? ["sensitive"] : []), ...(f.acne === "1" || f.skin === "acne" ? ["acne"] : [])], finish: f.finish === "matte" || f.finish === "dewy" ? f.finish : null, ff: false };
  const matching = !!(choice.skin || choice.concerns.length);
  const sort = SORTS.some(([k]) => k === f.sort) ? f.sort! : "score";
  const shown = rows.filter(x => pass(x)).map(x => ({ ...x, m: matching ? ctx.match(x.r.id, choice) : null }))
    .sort((a, b) => (matching && sort === "score" ? (b.m?.pct ?? -1) - (a.m?.pct ?? -1) : 0) || (sort === "reviews" ? b.c.n - a.c.n : 0) || (sort === "price" ? (a.price?.length ?? 9) - (b.price?.length ?? 9) : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.r.name.localeCompare(b.r.name));
  const show = Math.min(1000, Math.max(PAGE, Number(f.show) || PAGE));
  const href = (next: Partial<F>) => { const q = new URLSearchParams(Object.entries({ ...f, show: undefined, ...next }).filter(([, v]) => v) as [string, string][]); return q.size ? `${base}?${q}` : base; };
  const groupDefs: [string, (typeof KEYS)[number], readonly (readonly [string, string])[]][] = [
    ...(fixedType ? [] : [["Type", "type", (niche.typePages ?? []).map(t => [t.slug, t.label.toLowerCase()] as const)] as [string, "type", (readonly [string, string])[]]]),
    ["Good for", "skin", GROUPS.filter(([k]) => k !== "sensitive" && k !== "acne").map(([k, l]) => [k, `${l.toLowerCase()} skin`] as const)],
    ["Finish", "finish", [["matte", "matte"], ["dewy", "dewy"]]],
    ["Texture", "texture", [["light", "light"], ["rich", "rich"]]],
    ["Price", "price", PRICES],
  ];
  const active = [...KEYS.filter(k => f[k]).map(k => ({ label: k === "skin" ? `good for ${f[k]} skin` : k === "type" ? typeOf(f[k])?.label.toLowerCase() ?? f[k]! : k === "price" ? f[k]! : `${f[k]} ${k}`, href: href({ [k]: undefined }) })),
    ...(f.sens === "1" ? [{ label: "good for sensitive skin", href: href({ sens: undefined }) }] : []), ...(f.acne === "1" ? [{ label: "good for acne-prone skin", href: href({ acne: undefined }) }] : []),
    ...(f.ff === "1" ? [{ label: "fragrance-free", href: href({ ff: undefined }) }] : [])];
  const group = ([label, key, vals]: (typeof groupDefs)[number]) =>
    <details key={key} className="bc-g" open>
      <summary><b>{label}</b><span>{f[key] && <span className="bc-val">{vals.find(v => v[0] === f[key])?.[1]}</span>}<i aria-hidden="true"/></span></summary>
      <div className="bc-opts">{vals.map(([v, l]) => { const on = f[key] === v, n = rows.filter(x => pass(x, key) && tests[key](x, v)).length;
        return <Link key={v} href={href({ [key]: on ? undefined : v })} scroll={false} replace className={`bc-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`} aria-current={on ? "true" : undefined}>
          <span className="bc-dot" aria-hidden="true"/><span className="bc-ol">{l}</span><span className="bc-n">{n}</span></Link>; })}</div>
    </details>;
  const checkLink = (key: "sens" | "acne" | "ff", label: string, test: (x: Row) => boolean) => { const on = f[key] === "1", n = rows.filter(x => pass(x, key) && test(x)).length;
    return <Link href={href({ [key]: on ? undefined : "1" })} scroll={false} replace className={`bc-check${on ? " on" : ""}`} aria-current={on ? "true" : undefined}>
      <i aria-hidden="true">{on ? "✓" : ""}</i><b>{label}</b><span className="bc-n">{n}</span></Link>; };
  const photo = (r: Row["r"]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const heading = title ?? (only ? only.name : "All");
  const nameOnly = (r: Row["r"]) => { const b = brand(r.brandId) ?? "", n = displayName(r.name, b); return b && n.toLowerCase().startsWith(`${b.toLowerCase()} `) ? n.slice(b.length + 1) : n; };
  const total = rows.length;
  return <main className={`bp bc ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bc-wrap">
      <section className="bc-hero">
        <div>{only && <p className="bc-crumbs"><Link href="/">home</Link> / <Link href="/brands">brands</Link> / {only.name.toLowerCase()}</p>}
          <h1>{fixedType || only ? heading : <>{`${heading} `}<em>products</em></>}</h1>
          <p>{intro ?? "Every product we track. Narrow it down on the left and the list updates as you tap. “Good for” comes from what people with that skin type said, not from the label."}</p></div>
        <span className="bc-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <div className="bc-grid">
        <aside className="bc-side" aria-label="Filters">
          <input type="checkbox" id="bc-ft" className="bc-ft"/>
          <div className="bc-sh"><label htmlFor="bc-ft" className="bp-tag sm">filters<span className="bc-mtog" aria-hidden="true"> ▾</span></label>
            {active.length > 0 && <Link href={base} scroll={false} replace className="bc-clear">clear all</Link>}</div>
          <div className="bc-groups">
            {groupDefs.slice(0, fixedType ? 1 : 2).map(group)}
            {checkLink("sens", "Good for sensitive skin", x => x.good("sensitive"))}
            {checkLink("acne", "Good for acne-prone skin", x => x.good("acne"))}
            {groupDefs.slice(fixedType ? 1 : 2).map(group)}
            {checkLink("ff", "Fragrance-free only", x => x.ff)}
          </div>
        </aside>
        <section className="bc-main">
          <div className="bc-bar">
            <div className="bc-count"><b>{active.length ? `${shown.length} ${shown.length === 1 ? niche.words.one : niche.words.many}` : `All ${total} ${total === 1 ? niche.words.one : niche.words.many}`}</b>
              {active.map(a => <Link key={a.label} href={a.href} scroll={false} replace className="bc-chipx">{a.label} <i aria-hidden="true">✕</i></Link>)}</div>
            <div className="bc-sort"><span>sort</span>{SORTS.map(([k, label]) => <Link key={k} href={href({ sort: k === "score" ? undefined : k })} scroll={false} replace className={`bp-pick sm${sort === k ? " on" : ""}`} aria-current={sort === k ? "true" : undefined}>{k === "score" && matching ? "best match" : label}</Link>)}</div>
          </div>
          <ol className="bc-list">{shown.slice(0, show).map((x, i) => {
            const r = x.r, pic = photo(r), line = shortLine(r) ?? listLine(r), shop = listShopLink(r);
            const meta = [fixedType ? null : r.shape?.toLowerCase(), x.texture ? `${x.texture} texture` : null, x.finish ? `${x.finish} finish` : null, x.price].filter((m): m is string => !!m);
            const goodFor = GROUPS.filter(([k]) => x.good(k)).map(([, l]) => l.toLowerCase());
            const pct = x.m?.pct ?? null, fit = x.m ? fitWord(pct) : null;
            const chips = [...(i === 0 && sort === "score" && !matching ? [{ k: "top", t: "★ top pick" }] : []), ...(x.ff ? [{ k: "ff", t: "fragrance-free" }] : []),
              ...(goodFor.length ? [{ k: "good", t: `good for ${goodFor.join(", ")}` }] : [])];
            return <li key={r.id} className={i === 0 ? "first" : i < 3 ? "top" : undefined}>
              <span className="bc-rank">{i + 1}</span>
              <span className="bc-pic">{pic && <img src={pic} alt="" width={116} height={144} decoding="async" loading={i < 4 ? "eager" : "lazy"}/>}</span>
              <span className="bc-body">
                <span className="bc-brand">{brand(r.brandId)}</span>
                <span className="bc-nrow"><a className="bc-name" href={productHref(r)}>{nameOnly(r)}</a>{chips.map(c => <span key={c.k} className={`bc-chip ${c.k}`}>{c.t}</span>)}</span>
                {fit ? <span className="bc-line"><b>{fit}</b>{x.m && reasonOf(ctx, x.m) ? ` · ${reasonOf(ctx, x.m)}` : ""}</span> : line && <span className="bc-line">{line}</span>}
                <span className="bc-mt">{meta.map(m => <span key={m}>{m}</span>)}{shop && <a className="bc-buy" href={shop.url} target="_blank" rel={shop.rel}>check price ↗</a>}</span>
              </span>
              <span className="bc-score">
                {matching ? <span className={`bc-sc pct ${pct === null ? "none" : pct >= 80 ? "hi" : pct >= 60 ? "mid" : "lo"}`} title="How well it fits your skin, from what people with your skin type said.">{pct === null ? "—" : `${pct}%`}</span>
                  : <span className={`bc-sc ${x.signal === null ? "none" : x.signal >= 88 ? "hi" : x.signal >= 82 ? "mid" : "lo"}`} title="User score: not a % of happy users. It blends how much people like it with how many have weighed in.">{x.signal ?? "—"}</span>}
                {x.c.positive + x.c.mixed + x.c.negative > 0 && <span className="bp-mood" aria-label={`${x.c.positive} positive, ${x.c.mixed} mixed, ${x.c.negative} negative`}><i className="p" style={{ flex: x.c.positive }}/><i className="m" style={{ flex: x.c.mixed }}/><i className="n" style={{ flex: x.c.negative }}/></span>}
                <small>{matching ? (pct === null ? "too few reports" : "match") : `${x.c.n.toLocaleString("en-US")} ${x.c.n === 1 ? "review" : "reviews"}`}</small>
              </span>
            </li>; })}</ol>
          {shown.length === 0 && <div className="bc-empty"><b>Nothing matches all of that</b><Link href={base} scroll={false} replace>clear filters</Link></div>}
          {shown.length > show && <Link className="bc-load" href={href({ show: String(show + PAGE) })} scroll={false} replace>{`load ${Math.min(PAGE, shown.length - show)} more ↓`}</Link>}
        </section>
      </div>
    </div>
    <V2Footer/>
  </main>;
}
