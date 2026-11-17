"use client";
// The SkinRecs catalogue's filters and list in the browser (owner 2026-11-16: "changing filters … is slow"). The server
// renders the address's filters (a cached page per view, app/v/…); a tap filters, counts and sorts the rows sent with the page
// here, with the match % from the server's own functions (app/skin/rank.ts), and updates the address with no request
// (app/instant-view.ts). Links stay real links: a new tab, or no JavaScript, still gets the server's page.
import { matchBox } from "../../lib/score-tone";
import { useMemo, useState } from "react";
import { skinBestFor } from "../../lib/skin-best";
import { useInstantView, instantClick } from "../instant-view";
import { wireCtx, skinMatch, fitWord, reasonOf, SKIN_GROUPS, type SkinWire } from "./rank";
import { unpack, type SkinPack } from "./pack";
import { attrProfileFor } from "../../lib/attr-profile";
import { niche } from "../../lib/niche";
import { FEW_VOICES, type AttrChoice } from "../../lib/attr-score";
import { scoreState } from "../../lib/score-view";
import { NewPill } from "../score-tags";

export const CATALOG_PAGE = 20;
/** The filters an address holds (anything else in it is kept as it is: ?q=, ?look=). */
export type SkinF = { skin?: string; sens?: string; acne?: string; finish?: string; texture?: string; price?: string; ff?: string; type?: string; sort?: string; show?: string; q?: string } & Record<string, string | undefined>;
/** One product with what its filters test: "good for" a skin type is a suits score of 65+ from enough people of it. */
type CatRow = SkinWire & { n: number; good: string[]; finish: string | null; texture: string | null; ff: boolean; price: string | null; type: string | null };
const GOOD = 65;
function catRow(w: SkinWire, n: number): CatRow {
  const a = w.attrs, fin = a.scores.finish?.score ?? null, tex = a.scores.texture?.score ?? null;
  return { ...w, n, good: SKIN_GROUPS.map(([k]) => k).filter(k => { const s = a.scores[`suits_${k}`]; return !!s && s.score >= GOOD && s.n >= FEW_VOICES; }),
    finish: fin === null ? null : fin <= 40 ? "matte" : fin >= 60 ? "dewy" : null, texture: tex === null ? null : tex <= 40 ? "light" : tex >= 60 ? "rich" : null,
    ff: a.facts.fragrance_free === "free", price: typeof a.facts.price === "string" ? a.facts.price : null, type: niche.typePages?.find(t => t.shape === w.shape)?.slug ?? null };
}
const KEYS = ["type", "skin", "finish", "texture", "price"] as const;
const SORTS = [["score", "top rated"], ["reviews", "most reviewed"], ["price", "lowest price"]] as const;
const PRICES = [["$", "$ · budget"], ["$$", "$$ · mid"], ["$$$", "$$$ · splurge"]] as const;

const queryOf = (f: SkinF) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);

export function CatalogSkinBrowser({ pack, f: first, base, fixedType }: { pack: SkinPack; f: SkinF; base: string; fixedType?: string }) {
  const hrefOf = (f: SkinF) => { const q = queryOf(f); return q.size ? `${base}?${q}` : base; };
  const [f, set] = useInstantView<SkinF>(first, q => Object.fromEntries(q), hrefOf, "replace");
  const { rows, cards, ctx } = useMemo(() => { const u = unpack(pack); return { rows: u.items.map(w => catRow(w, u.cards[w.id].n)), cards: u.cards, ctx: wireCtx(attrProfileFor(niche)!, u.items) }; }, [pack]);
  const typeOf = (slug?: string) => niche.typePages?.find(t => t.slug === slug);
  type Row = CatRow;
  const good = (x: Row, k: string) => x.good.includes(k);
  const tests: Record<(typeof KEYS)[number], (x: Row, v: string) => boolean> = {
    type: (x, v) => x.type === v, skin: (x, v) => good(x, v), finish: (x, v) => x.finish === v, texture: (x, v) => x.texture === v, price: (x, v) => x.price === v };
  const pass = (x: Row, skip?: string) => KEYS.every(k => k === skip || !f[k] || tests[k](x, f[k]!)) && (skip === "sens" || f.sens !== "1" || good(x, "sensitive"))
    && (skip === "acne" || f.acne !== "1" || good(x, "acne")) && (skip === "ff" || f.ff !== "1" || x.ff);
  const choice: AttrChoice = { type: null, skin: f.skin && f.skin !== "sensitive" && f.skin !== "acne" ? f.skin : null,
    concerns: [...(f.sens === "1" || f.skin === "sensitive" ? ["sensitive"] : []), ...(f.acne === "1" || f.skin === "acne" ? ["acne"] : [])], finish: f.finish === "matte" || f.finish === "dewy" ? f.finish : null, ff: false };
  const matching = !!(choice.skin || choice.concerns.length);
  const sort = SORTS.some(([k]) => k === f.sort) ? f.sort! : "score";
  const shown = rows.filter(x => pass(x)).map(x => ({ ...x, m: matching ? skinMatch(ctx, x.id, { ...choice, typeSlug: null, noConcerns: false, goal: null, tex: null, budget: null }) : null }))
    .sort((a, b) => (matching && sort === "score" ? (b.m?.pct ?? -1) - (a.m?.pct ?? -1) : 0) || (sort === "reviews" ? b.n - a.n : 0) || (sort === "price" ? (a.price?.length ?? 9) - (b.price?.length ?? 9) : 0) || (b.signal ?? -1) - (a.signal ?? -1) || a.name.localeCompare(b.name));
  const show = Math.min(1000, Math.max(CATALOG_PAGE, Number(f.show) || CATALOG_PAGE));
  const nextOf = (next: Partial<SkinF>) => ({ ...f, show: undefined, ...next }) as SkinF;
  // From the latest view, not this render's, so two quick taps both count.
  const to = (next: Partial<SkinF>, cls?: string, on?: boolean) => ({ href: hrefOf(nextOf(next)), onClick: instantClick(() => set(cur => ({ ...cur, show: undefined, ...next }) as SkinF)),
    ...(cls !== undefined ? { className: cls } : {}), ...(on ? { "aria-current": "true" as const } : {}) });
  // Clearing drops everything. A text search (?q=) narrowed the rows on the server, so clearing it asks the server again.
  const clearTo = (cls?: string) => first.q ? { href: base, ...(cls ? { className: cls } : {}) } : to(Object.fromEntries(Object.keys(f).map(k => [k, undefined])), cls);
  const groupDefs: [string, (typeof KEYS)[number], readonly (readonly [string, string])[]][] = [
    ...(fixedType ? [] : [["Type", "type", (niche.typePages ?? []).map(t => [t.slug, t.label.toLowerCase()] as const)] as [string, "type", (readonly [string, string])[]]]),
    ["Good for", "skin", SKIN_GROUPS.filter(([k]) => k !== "sensitive" && k !== "acne").map(([k, l]) => [k, `${l.toLowerCase()} skin`] as const)],
    ["Finish", "finish", [["matte", "matte"], ["dewy", "dewy"]]],
    ["Texture", "texture", [["light", "light"], ["rich", "rich"]]],
    ["Price", "price", PRICES],
  ];
  const active = [...KEYS.filter(k => f[k]).map(k => ({ label: k === "skin" ? `good for ${f[k]} skin` : k === "type" ? typeOf(f[k])?.label.toLowerCase() ?? f[k]! : k === "price" ? f[k]! : `${f[k]} ${k}`, next: { [k]: undefined } })),
    ...(f.sens === "1" ? [{ label: "good for sensitive skin", next: { sens: undefined } }] : []), ...(f.acne === "1" ? [{ label: "good for acne-prone skin", next: { acne: undefined } }] : []),
    ...(f.ff === "1" ? [{ label: "fragrance-free", next: { ff: undefined } }] : [])];
  // On phones each group starts closed and "+" opens it (owner's mobile mockup); on wider screens they start open.
  const [mobOpen, setMobOpen] = useState<Record<string, boolean>>({});
  const onPhone = () => typeof matchMedia === "function" && matchMedia("(max-width: 640px)").matches;
  const toggle = (key: string) => (e: React.MouseEvent) => { if (!onPhone()) return; e.preventDefault(); setMobOpen(m => ({ ...m, [key]: !m[key] })); };
  const group = ([label, key, vals]: (typeof groupDefs)[number]) =>
    <details key={key} className={`bc-g${mobOpen[key] ? " mob-open" : ""}`} open>
      <summary onClick={toggle(key)}><b>{label}</b><span>{f[key] && <span className="bc-val">{vals.find(v => v[0] === f[key])?.[1]}</span>}<i aria-hidden="true"/></span></summary>
      <div className="bc-opts">{vals.map(([v, l]) => { const on = f[key] === v, n = rows.filter(x => pass(x, key) && tests[key](x, v)).length;
        return <a key={v} {...to({ [key]: on ? undefined : v }, `bc-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`, on)}>
          <span className="bc-dot" aria-hidden="true"/><span className="bc-ol">{l}</span><span className="bc-n">{n}</span></a>; })}</div>
    </details>;
  const checkLink = (key: "sens" | "acne" | "ff", label: string, test: (x: Row) => boolean) => { const on = f[key] === "1", n = rows.filter(x => pass(x, key) && test(x)).length;
    return <a {...to({ [key]: on ? undefined : "1" }, `bc-check${on ? " on" : ""}`, on)}>
      <i aria-hidden="true">{on ? "✓" : ""}</i><b>{label}</b><span className="bc-n">{n}</span></a>; };
  const total = rows.length;
  return <div className="bc-grid">
    <aside className="bc-side" aria-label="Filters">
      <input type="checkbox" id="bc-ft" className="bc-ft"/>
      <div className="bc-sh"><label htmlFor="bc-ft" className="bp-tag sm">filters<span className="bc-mtog" aria-hidden="true"> ▾</span></label>
        {active.length > 0 && <a {...clearTo("bc-clear")}>clear all</a>}</div>
      <div className="bc-groups">
        {groupDefs.slice(0, fixedType ? 1 : 2).map(group)}
        {checkLink("sens", "Good for sensitive skin", x => good(x, "sensitive"))}
        {checkLink("acne", "Good for acne-prone skin", x => good(x, "acne"))}
        {groupDefs.slice(fixedType ? 1 : 2).map(group)}
        {checkLink("ff", "Fragrance-free only", x => x.ff)}
      </div>
    </aside>
    <section className="bc-main" aria-live="polite">
      <div className="bc-bar">
        <div className="bc-count"><b>{active.length ? `${shown.length} ${shown.length === 1 ? niche.words.one : niche.words.many}` : `All ${total} ${total === 1 ? niche.words.one : niche.words.many}`}</b>
          {active.map(a => <a key={a.label} {...to(a.next, "bc-chipx")}>{a.label} <i aria-hidden="true">✕</i></a>)}</div>
        <div className="bc-sort"><span>sort</span>{SORTS.map(([k, label]) => <a key={k} {...to({ sort: k === "score" ? undefined : k }, `bp-pick sm${sort === k ? " on" : ""}`, sort === k)}>{k === "score" && matching ? "best match" : label}</a>)}</div>
      </div>
      <ol className="bc-list">{shown.slice(0, show).map((x, i) => {
        const card = cards[x.id];
        const meta = [fixedType ? null : x.shape?.toLowerCase(), x.texture ? `${x.texture} texture` : null, x.finish ? `${x.finish} finish` : null, x.price].filter((m): m is string => !!m);
        const goodFor = SKIN_GROUPS.filter(([k]) => good(x, k)).map(([, l]) => l.toLowerCase());
        const pct = x.m?.pct ?? null, fit = x.m ? fitWord(pct) : null, reason = x.m ? reasonOf(ctx, x.m) : null;
        const chips = [...(i === 0 && sort === "score" && !matching ? [{ k: "top", t: "★ top pick" }] : []), ...(x.ff ? [{ k: "ff", t: "fragrance-free" }] : []),
          ...(goodFor.length ? [{ k: "good", t: `good for ${goodFor.join(", ")}` }] : [])];
        return <li key={x.id} className={i === 0 ? "first" : i < 3 ? "top" : undefined}>
          <span className="bc-rank">{i + 1}</span>
          <span className="bc-pic">{card.pic && <img src={card.pic} alt="" width={116} height={144} decoding="async" loading={i < 4 ? "eager" : "lazy"}/>}</span>
          <span className="bc-body">
            <span className="bc-brand">{card.brand}</span>
            <span className="bc-nrow"><a className="bc-name" href={card.href}>{card.name}</a>{chips.map(c => <span key={c.k} className={`bc-chip ${c.k}`}>{c.t}</span>)}</span>
            {fit ? <span className="bc-line"><b>{fit}</b>{reason ? ` · ${reason}` : ""}</span> : card.line && <span className="bc-line">{card.line}</span>}
            {(() => { const b = skinBestFor(ctx.profile, ctx.attrs.get(x.id)); return b && <span className="bc-best">{`best for ${b}`}</span>; })()}
            <span className="bc-mt">{meta.map(m => <span key={m}>{m}</span>)}{card.shop && <a className="bc-buy" href={card.shop.url} target="_blank" rel={card.shop.rel}>check price ↗</a>}</span>
          </span>
          <span className="bc-score">
            {matching ? <span className={`bc-sc pct ${pct === null ? "none" : matchBox(pct) || "lo"}`} title="How well it fits your skin, from what people with your skin type said.">{pct === null ? "—" : `${pct}%`}</span>
              : scoreState(card.pos + card.mix + card.neg) === "new" ? <NewPill n={card.pos + card.mix + card.neg}/> : <span className={`bc-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 70 ? "mid" : "lo"}`} title="User score: not a % of happy users. It blends how much people like it with how many have weighed in.">{x.signal ?? "—"}</span>}
            {card.pos + card.mix + card.neg > 0 && <span className="bp-mood" aria-label={`${card.pos} positive, ${card.mix} mixed, ${card.neg} negative`}><i className="p" style={{ flex: card.pos }}/><i className="m" style={{ flex: card.mix }}/><i className="n" style={{ flex: card.neg }}/></span>}
            <small>{matching ? (pct === null ? "too few reports" : "match") : `${card.n.toLocaleString("en-US")} ${card.n === 1 ? "review" : "reviews"}`}</small>
          </span>
        </li>; })}</ol>
      {shown.length === 0 && <div className="bc-empty"><b>Nothing matches all of that</b><a {...clearTo()}>clear filters</a></div>}
      {shown.length > show && <a className="bc-load" {...to({ show: String(show + CATALOG_PAGE) })}>{`load ${Math.min(CATALOG_PAGE, shown.length - show)} more ↓`}</a>}
    </section>
  </div>;
}
