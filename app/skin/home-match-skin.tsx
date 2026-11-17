"use client";
// The SkinRecs home's quick match, list and texture links in the browser (owner 2026-11-16: "changing filters, categories,
// skin picks … is slow"). The server renders the address's picks (a cached page per combination, app/v/home); a tap re-ranks
// the products sent with the page with the server's own functions (app/skin/rank.ts) and updates the address, with no request
// (app/instant-view.ts). Links stay real links: a new tab, or no JavaScript, still gets the server's page.
import { matchBox } from "../../lib/score-tone";
import { useMemo, type ReactNode } from "react";
import { skinBestFor } from "../../lib/skin-best";
import { useInstantView, instantClick } from "../instant-view";
import { rankSkin, effectiveChoice, wireCtx } from "./rank";
import { skinHomeTitle, MATCH_NOTE } from "./titles";
import { unpack, type SkinPack } from "./pack";
import { attrProfileFor } from "../../lib/attr-profile";
import { niche, catalogPath } from "../../lib/niche";
import { SKIN_TYPES, GOALS, TEXTURES, BUDGETS, readSkinChoice, skinHref, skinPicked, skinQuery, type SkinChoice } from "../../lib/skin-choice";
import { scoreState, newLine } from "../../lib/score-view";

const LIST_SIZE = 8;
const GOAL_LABEL: Record<(typeof GOALS)[number], string> = { hydrate: "hydrate", calm: "calm", clear: "clear skin", daily: "just everyday" };
const CATS = ["moisturizers", "serums", "cleansers", "sunscreens", "toners", "treatments"];
const types = niche.typePages ?? [];
const typeOf = (slug: string) => types.find(t => t.slug === slug);
const fromUrl = (q: URLSearchParams) => readSkinChoice(Object.fromEntries(q), types);

/** A texture link: its texture pick on the current choice, or a fixed address (the balm aisle). */
export type TextureLink = { name: string; line: string; n: number; cls: string; tex?: "light" | "rich" | null; href?: string };

export function SkinHomeMatch({ pack, choice: first, counts, textures, children }: { pack: SkinPack; choice: SkinChoice;
  /** Listed products per type (shape), and "" for all. */ counts: Record<string, number>; textures: TextureLink[]; children: ReactNode }) {
  const [choice, set] = useInstantView(first, fromUrl, c => skinHref(c), "replace");
  const { ctx, cards } = useMemo(() => { const u = unpack(pack); return { ctx: wireCtx(attrProfileFor(niche)!, u.items), cards: u.cards }; }, [pack]);
  const go = (next: SkinChoice) => instantClick(() => { set(next); document.title = skinHomeTitle(next); });
  const picked = skinPicked(effectiveChoice(choice)); // "just everyday" alone reads like no pick (same order and header)
  const rows = rankSkin(ctx, choice).slice(0, LIST_SIZE);
  const allOfType = counts[choice.type ?? ""] ?? 0;
  const pickQ = skinQuery({ ...choice, type: null, typeSlug: null }).size ? `?${skinQuery({ ...choice, type: null, typeSlug: null })}` : "";
  const catWord = choice.typeSlug ? typeOf(choice.typeSlug)!.label.toLowerCase() : "skincare";
  const link = (next: SkinChoice, on: boolean, cls: string) => ({ href: skinHref(next), onClick: go(next), "aria-current": on ? "true" as const : undefined, className: `${cls}${on ? " on" : ""}` });
  const pill = (label: string, next: SkinChoice, on: boolean, cls = "bp-pick") => <a {...link(next, on, cls)}>{label}</a>;
  const sens = choice.concerns.includes("sensitive");
  const nExtra = [choice.tex, choice.budget, choice.ff].filter(Boolean).length;
  const canRefine = !!(choice.skin && choice.goal) || nExtra > 0;
  const reset = readSkinChoice(choice.typeSlug ? { type: choice.typeSlug } : {}, types);
  const title = picked ? `Top ${catWord} for ${choice.skin ? `your ${choice.skin} skin` : "you"}` : `Top ${catWord} right now`;
  const subtitle = !picked ? "ranked by user score · pick above for your match %"
    : [choice.goal && choice.goal !== "daily" ? `ranked to ${GOAL_LABEL[choice.goal]}` : !choice.goal ? "pick a goal to sharpen this" : null, sens ? "gentle first" : null].filter(Boolean).join(" · ") || "ranked by your match";
  const base = { ...choice, tex: null } as SkinChoice;

  return <>
    <section className="bh-qm" id="match" aria-label="Quick match">
      <span className="bh-qk"><span className="bp-tag sm">✦ quick match</span>My skin is</span>
      <span className="bp-picks" role="group" aria-label="Your skin type">{SKIN_TYPES.map(s => <span key={s}>{pill(s, { ...choice, skin: choice.skin === s ? null : s }, choice.skin === s)}</span>)}</span>
      <span className="bh-qk">and I want to</span>
      <span className="bp-picks" role="group" aria-label="What you want it to do">{GOALS.map(g => <span key={g}>{pill(GOAL_LABEL[g], { ...choice, goal: choice.goal === g ? null : g }, choice.goal === g)}</span>)}</span>
      <a {...link({ ...choice, concerns: sens ? choice.concerns.filter(k => k !== "sensitive") : [...choice.concerns, "sensitive"] }, sens, "bp-sens")}>
        <i aria-hidden="true">{sens ? "✓" : ""}</i>reacts easily</a>
      {picked && <a {...link(reset, false, "bh-reset")}>reset ↺</a>}
      {canRefine && <details className="bh-more" open={nExtra > 0 || undefined}>
        <summary><span>Want it sharper?</span><b className={nExtra ? "on" : undefined}>{nExtra ? `fine-tune (${nExtra})` : "fine-tune"}<i aria-hidden="true"/></b>
          <small>{nExtra ? `match % includes ${nExtra} extra filter${nExtra > 1 ? "s" : ""}` : "texture, budget & fragrance · all optional"}</small></summary>
        <div className="bh-extras">
          <div><span>Texture</span><span className="bp-picks">{TEXTURES.map(t => <span key={t}>{pill(t, { ...choice, tex: choice.tex === t ? null : t }, choice.tex === t, "bp-pick sm")}</span>)}</span></div>
          <div><span>Budget</span><span className="bp-picks">{BUDGETS.map(b => <span key={b}>{pill(b, { ...choice, budget: choice.budget === b ? null : b }, choice.budget === b, "bp-pick sm")}</span>)}</span></div>
          <div><span>Fragrance</span><span className="bp-picks"><span>{pill("fragrance-free only", { ...choice, ff: !choice.ff }, choice.ff, "bp-pick sm")}</span></span></div>
        </div>
      </details>}
    </section>

    <div className="bh-grid">
      <section className="bh-main" aria-live="polite">
        <div className="bh-lhead"><h2>{title}</h2><span>{subtitle}</span></div>
        <div className="bp-picks bh-cats" role="group" aria-label="Product type">
          <span>{pill("everything", { ...choice, type: null, typeSlug: null }, !choice.type)}</span>
          {CATS.map(typeOf).filter(t => !!t).map(t => <span key={t.slug}>{pill(t.label.toLowerCase(), { ...choice, type: t.shape, typeSlug: t.slug }, choice.typeSlug === t.slug)}</span>)}
        </div>
        <div className="bh-box">
          {rows.length === 0 && <p className="bh-empty">Nothing matches that yet. Try fewer filters.</p>}
          <ol className="bh-list">{rows.map((x, i) => {
            const r = x.r, card = cards[r.id];
            const top = i === 0 && picked && x.pct !== null && x.pct >= 75;
            const texture = ctx.attrs.get(r.id)?.scores.texture;
            const chips = [
              ...(top ? [{ k: "best", t: "best match" }] : []),
              ...(!choice.type && r.shape ? [{ k: "", t: r.shape.toLowerCase() }] : texture && texture.n >= 3 ? [{ k: "", t: texture.score < 35 ? "light" : texture.score > 65 ? "rich" : "in between" }] : []),
              ...(sens && x.ff ? [{ k: "gentle", t: "fragrance-free" }] : []),
            ];
            // The user score until a pick, then the match % (owner 2026-11-16: as on padel), with the same colours.
            const sig = ctx.signal(r.id), best = skinBestFor(ctx.profile, ctx.attrs.get(r.id));
            const pctCls = picked ? (x.pct === null ? "none" : matchBox(x.pct)) : sig === null ? "none" : sig >= 85 ? "hi" : sig >= 70 ? "mid" : "";
            return <li key={r.id} className={top ? "top" : undefined}>
              <span className="bh-rank">{i + 1}</span>
              <span className="bh-pic">{card.pic && <img src={card.pic} alt="" width={112} height={140} decoding="async" loading={i < 3 ? "eager" : "lazy"}/>}</span>
              <span className="bh-body">
                <span className="bh-brand">{card.brand}</span>
                <span className="bh-nrow"><a className="bh-name" href={`${card.href}${pickQ}`}>{card.name}</a>
                  {chips.map(ch => <span key={ch.t} className={`bh-chip ${ch.k}`}>{ch.t}</span>)}</span>
                {card.line && <span className="bh-line">{card.line}</span>}
                {best && <span className="bh-best">{`best for ${best}`}</span>}
                {/* "check price" sits with the name and line, as on padel's rows (owner 2026-11-17). */}
                {card.shop && <a className="bh-buy" href={card.shop.url} target="_blank" rel={card.shop.rel}>check price ↗</a>}
                {picked && x.pct === null && x.m?.missing.length ? <span className="bh-thin">{`not enough reports yet from people with ${x.m.missing.join(" or ")}`}</span> : null}
              </span>
              <span className="bh-sent"><span>{`${card.n.toLocaleString("en-US")} ${card.n === 1 ? "review" : "reviews"}`}</span>
                {card.pos + card.mix + card.neg > 0 && <span className="bp-mood" aria-label={`${card.pos} positive, ${card.mix} mixed, ${card.neg} negative`}><i className="p" style={{ flex: card.pos }}/><i className="m" style={{ flex: card.mix }}/><i className="n" style={{ flex: card.neg }}/></span>}</span>
              <span className={`bh-pct ${pctCls}`} title={MATCH_NOTE}><b>{picked ? (x.pct !== null ? `${x.pct}%` : "—") : scoreState(card.pos + card.mix + card.neg) === "new" ? "—" : sig ?? "—"}</b><small>{picked ? (x.pct === null ? "too few reports" : "your match") : scoreState(card.pos + card.mix + card.neg) === "new" ? newLine(card.pos + card.mix + card.neg) : "user score"}</small>
                {/* With picks the match % is the star; the user score stays as a small neutral pill (owner 2026-11-16). */}
                {picked && sig !== null && <span className={`bh-spill ${sig >= 85 ? "hi" : sig >= 70 ? "mid" : ""}`}><b>{sig}</b> user score</span>}</span>
            </li>;
          })}</ol>
          <a className="bh-all" href={choice.typeSlug ? `/${choice.typeSlug}${pickQ}` : `${catalogPath}${pickQ}`}>{`see all ${allOfType} ${catWord === "skincare" ? niche.words.many : catWord} →`}</a>
        </div>
      </section>
      {children}
    </div>

    {textures.length > 1 && <section className="bh-sec" id="textures">
      <h2>Which texture suits you?</h2>
      <div className="bh-tex">{textures.map(t => { const next = { ...base, tex: t.tex ?? null } as SkinChoice;
        // The list is above: a texture tap shows it, as the old full-page link to #match did.
        return <a key={t.name} {...(t.href ? { href: t.href } : { href: skinHref(next), onClick: instantClick(() => { set(next); document.title = skinHomeTitle(next); document.getElementById("match")?.scrollIntoView(); }) })}>
          <span className={`bh-drop ${t.cls}`} aria-hidden="true"><i/></span>
          <span><b>{t.name}</b><span>{t.line}</span><small>{`see ${t.n} →`}</small></span>
        </a>; })}</div>
      <a className="bh-guide" href="/guide">Ingredients, actives &amp; layering explained → skin guide</a>
    </section>}
  </>;
}
