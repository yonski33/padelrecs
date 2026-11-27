"use client";
// The creator page's reviews (app/thread/creators/[slug]), in the owner mock's card structure (creator-page mockup
// 2026-11-22): the heading row with Sort, the filter pills (All / Loved it / Mixed / Not for me, then the sources, a pill
// only when it has a card), then one card per review: avatar, name, source, date, language box and the take; the real
// quote as the headline; Stood out / The trade-off / Compared to; the summary with its marked phrases and an inline Read
// more at its end; +/- chips; the link to the original. Videos have their thumbnail and the creator's own chapters on the
// right. TikTok takes are reviews too (owner 2026-11-22): a short card with a 9:16 tile, the quote, the take and its tags.
// A row of "All N reviews at a glance" (any a[href="#cr-…"]) opens the list if the card is hidden, clears a filter that
// hides it, scrolls to it and highlights it. Filtering runs in the browser on the cards the page already has, so the
// page's ISR cache is untouched.
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { atSecond, clock } from "../../../lib/thread/video-meta";
import { th } from "../../../lib/thread/look";
import { VideoProvider, clipOf, playClick, usePlay } from "./video-overlay";
import { mentionNodes, useMentions } from "./mention-links";
import { dayLabel, thumbOf } from "../../../lib/thread/web-sources";
import { SOURCE_COLOR, STANCE_LABEL, cardChips, initials, langCode, marks, measuredLine, platform, scoreText, sortReviews, mixTikToks,
  stanceCounts, type CreatorReview, type ReviewEntry, type Stance } from "../../../lib/thread/creators";
import { configGroupOf, configGroups, configLine, type ConfigAxis } from "../../../lib/thread/creator-config";

const OUT = { target: "_blank", rel: "noopener nofollow" } as const;
/** Cards shown before "Show N more reviews" (paddle page v3). */
const FIRST = 6;

const TYPE_TAG: Record<CreatorReview["type"], string | null> = { review: null, comparison: "Comparison", "long-term": null };
const DOT: Record<Stance | "all", string> = { all: "#171717", pos: "#62C878", mix: "#F0D16B", neg: "#F0796A" };
const SOURCES: [CreatorReview["kind"], string][] = [["youtube", "YouTube"], ["blog", "Blog"], ["tiktok", "TikTok"]];
type Src = CreatorReview["kind"] | null;

/** The creator's initials on their source's colour (the mock: YouTube coral, blog blue; TikTok black). */
/** A heart for Loved it only (Grok audit 2026-11-24: "♡ Not for me" read oddly); a neutral and a cross mark for the others. */
const STANCE_MARK = { pos: "♡", mix: "~", neg: "×" } as const;

export function Avatar({ name, kind, size }: { name: string; kind: CreatorReview["kind"]; size?: "sm" }) {
  return <span className={`thc-av${size ? ` ${size}` : ""}`} style={{ background: SOURCE_COLOR[kind] }} aria-hidden="true">{initials(name)}</span>;
}

/** `configs`: the site's reviews carry the config they tested (LaptopRecs), shown as a "Reviewed: ..." line. */
function Card({ x, lit, configs }: { x: ReviewEntry; lit: boolean; configs?: boolean }) {
  const [open, setOpen] = useState(false);
  const tt = x.kind === "tiktok", measured = measuredLine(x.measured);
  const thumb = x.kind === "youtube" ? thumbOf(x.url) : null;
  // Chapters collapsed by default (owner 2026-11-23): "▸ N chapters" under the thumbnail opens the full list.
  const [chOpen, setChOpen] = useState(false);
  // Every summary (videos 2026-11-22, blogs too 2026-11-23, owner): about three sentences before Read more, at most two
  // marked phrases, the rest of the summary after it, 68ch at 17px on 1.65.
  const vid = true;
  const [lead, rest] = vid ? leadSentences(x.summary, 3) : [x.summary, ""];
  // Marked phrases: up to two in the lead; the opened part gets up to two of the others that sit in it (owner 2026-11-25:
  // the text after Read more had none, since the first two always fell in the lead).
  const hl = vid ? x.highlights.filter(h => lead.includes(h)).slice(0, 2) : x.highlights;
  const hlRest = vid ? x.highlights.filter(h => !hl.includes(h) && !lead.includes(h) && rest.includes(h)).slice(0, 2) : [];
  const hlMore = vid && x.more ? x.highlights.filter(h => !hl.includes(h) && !hlRest.includes(h) && x.more!.includes(h)).slice(0, 2 - hlRest.length) : [];
  // The config's extra lines (LaptopRecs): the source's note on a second config and the price as tested, in the open card only.
  const cfgMore = configs ? [x.config?.note, x.config?.fields.price_as_tested ? `Price as tested: ${x.config.fields.price_as_tested}.` : null].filter((t): t is string => !!t) : [];
  const more = !!rest || !!x.more || !!measured || !!x.alsoUrl || cfgMore.length > 0;
  // Read more keeps the summary where it was (owner 2026-11-25, iPhone): the inline button moves to the end of the card, and
  // the browser's scroll anchoring followed it, dropping the reader below the text they were about to read. Show less brings
  // the card's top back into view when the shorter card would leave it above the screen.
  const sumRef = useRef<HTMLParagraphElement>(null), held = useRef<number | null>(null);
  const flip = () => { held.current = sumRef.current?.getBoundingClientRect().top ?? null; setOpen(o => !o); };
  useLayoutEffect(() => {
    const el = sumRef.current, was = held.current;
    held.current = null;
    if (!el || was == null) return;
    const now = el.getBoundingClientRect().top;
    if (open) { if (Math.abs(now - was) > 1) window.scrollBy(0, now - was); }
    else if (now < 0) { const head = document.querySelector(".th-head")?.getBoundingClientRect().height ?? 0, card = el.closest("article");
      if (card) window.scrollBy(0, card.getBoundingClientRect().top - head - 12); }
  }, [open]);
  const toggle = <button type="button" className="thc-more" aria-expanded={open} onClick={flip}>{open ? "Show less" : "Read more"}</button>;
  const tags = [TYPE_TAG[x.type], x.note, x.version].filter((t): t is string => !!t);
  // Stood out, The trade-off, then Best for (owner 2026-11-23: in place of "Compared to", which only listed names): who this
  // reviewer says the paddle suits, and their reason. No Best for: just the first two boxes.
  const boxes = ([["+", "Stood out", x.stood, "pos", null], ["−", "The trade-off", x.trade, "neg", null], ["◎", "Best for", x.bestFor?.who ?? null, "best", x.bestFor?.why ?? null]] as
    [string, string, string | null, string, string | null][]).filter((b): b is [string, string, string, string, string | null] => !!b[2]);
  // A TikTok take shows its own tags; a review shows its attribute words as +/- chips.
  const chips = tt ? (x.tags ?? []).map(t => ({ tone: /^[-−]/.test(t) ? "neg" as const : "pos" as const, text: t.replace(/^[+\-−]\s*/, "") }))
    : cardChips(x.attrs);
  const day = dayLabel(x.date);
  // The thumbnail, the TikTok tile and each chapter play in the page (live/video-overlay.tsx); the Watch on links stay.
  const play = usePlay(), clip = clipOf(x);
  // Other products the summary names link to their pages, the first mention in this card only (live/mention-links.tsx).
  const mx = useMentions(), seen = new Set<string>(), link = (t: string) => mentionNodes(mx, t, seen);
  return <article id={`cr-${x.id}`} className={`thc-card${tt ? " thc-tt-c" : ""}${lit ? " lit" : ""}`}>
    {thumb && <div className="thc-media">
      <a className="thc-thumb" href={x.url} {...OUT} onClick={playClick(play, clip)} aria-label={`Play ${x.creator}'s video`}>
        <img src={thumb} alt="" loading="lazy" width={320} height={200}/><span className="play" aria-hidden="true"/>
        {x.len ? <span className="len">{clock(x.len)}</span> : null}</a>
      {x.chapters.length > 0 && <div className={`thc-chap${chOpen ? " open" : ""}`}>
        <button type="button" className="thc-chap-t" aria-expanded={chOpen} onClick={() => setChOpen(o => !o)}>{`${chOpen ? "▾" : "▸"} ${x.chapters.length} chapter${x.chapters.length === 1 ? "" : "s"}`}</button>
        {chOpen && x.chapters.map(([s, t]) => <a key={s} href={atSecond(x.url, s)} {...OUT} title={t} onClick={playClick(play, clipOf(x, s))}><strong>{clock(s)}</strong><span>{t}</span></a>)}</div>}
    </div>}
    {/* TikTok: a plain 9:16 tile (TikTok's oEmbed gives no cover) where the thumbnail sits. */}
    {tt && <div className="thc-media thc-tt-m">
      <a className={`thc-tt-cover${x.cover ? " pic" : ""}`} href={x.url} {...OUT} onClick={playClick(play, clip)} aria-label={`Play ${x.creator}'s TikTok`}>
        {x.cover && <img src={x.cover} alt="" loading="lazy"/>}
        <span className="logo">TikTok</span><span className="play" aria-hidden="true"/>{x.len ? <span className="len">{clock(x.len)}</span> : null}</a>
    </div>}
    <div className="thc-card-b">
      <div className="thc-card-top">
        <Avatar name={x.creator} kind={x.kind}/>
        {x.profile ? <a className="thc-name" href={th(x.profile)}>{x.creator}</a> : <a className="thc-name" href={x.channel} {...OUT}>{x.creator}</a>}
        <span className="thc-meta">{`· ${platform(x)}${x.handle ? ` · ${x.handle}` : ""}${day ? ` · ${day}` : ""}`}</span>
        {!tt && <span className="thc-lang">{langCode(x.lang)}</span>}
        <span className={`thc-take ${x.stance}`}>{`${STANCE_MARK[x.stance]} ${STANCE_LABEL[x.stance]}`}</span>
      </div>
      {x.badge && <span className="thc-xp-badge">{`Expert pick: ${x.badge}`}</span>}
      {configs && <span className="thc-cfg">{configLine(x.config)}</span>}
      {/* No "Works with [brand]" note (owner 2026-11-22: no disclosure lines; `tie` stays in the data). */}
      {(tags.length > 0 || x.score) && <div className="thc-tags">
        {tags.map(t => <span key={t} className="thc-tag">{t}</span>)}
        {x.score && <span className="thc-tag">{`Own score ${scoreText(x.score)}${x.score.label ? ` (${x.score.label.toLowerCase()})` : ""}`}</span>}
      </div>}
      {x.quote && <h3 className="thc-q">{x.quoteAt != null && x.kind === "youtube"
        ? <a href={atSecond(x.url, x.quoteAt)} {...OUT} aria-label={`Watch from ${clock(x.quoteAt)}`}>{`“${x.quote}”`}</a> : `“${x.quote}”`}</h3>}
      {boxes.length > 0 && <div className="thc-boxes">{boxes.map(([i, h, t, k, sub]) => <div key={h} className={`thc-box ${k}`}>
        <span className="thc-box-h"><b aria-hidden="true">{i}</b><span>{h}</span></span><span className="thc-box-t">{t}</span>
        {sub && <span className="thc-box-s">{sub}</span>}</div>)}</div>}
      <p ref={sumRef} className={`thc-sum${vid ? " vid" : ""}`}>{marks(lead, hl).map((m, i) => m.on ? <mark key={i}>{link(m.t)}</mark> : <Fragment key={i}>{link(m.t)}</Fragment>)}
        {more && !open && <>{" "}{toggle}</>}</p>
      {open && rest && <p className={`thc-sum${vid ? " vid" : ""}`}>{marks(rest, hlRest).map((m, i) => m.on ? <mark key={i}>{link(m.t)}</mark> : <Fragment key={i}>{link(m.t)}</Fragment>)}</p>}
      {open && x.more && <p className={`thc-sum${vid ? " vid" : ""}`}>{marks(x.more, hlMore).map((m, i) => m.on ? <mark key={i}>{link(m.t)}</mark> : <Fragment key={i}>{link(m.t)}</Fragment>)}</p>}
      {open && measured && <p className="thc-sum sm">{`Measured by the reviewer: ${measured}.`}</p>}
      {open && cfgMore.map(t => <p key={t} className="thc-sum sm">{t}</p>)}
      {open && <p className="thc-sum">{toggle}</p>}
      {chips.length > 0 && <div className="thc-tags">{chips.map(c => <span key={c.text} className={`thc-pm ${c.tone}`}>{`${c.tone === "pos" ? "+" : "−"} ${c.text}`}</span>)}</div>}
      <div className="thc-links">
        <a href={x.url} {...OUT}>{x.kind === "youtube" ? <><span className="thc-yt" aria-hidden="true"/>Watch on YouTube ↗</>
          : tt ? <><span className="thc-tt-i" aria-hidden="true">♪</span>Watch on TikTok ↗</>
          : <><span className="thc-blog-i" aria-hidden="true">✎</span>Read the full review ↗</>}</a>
        {open && x.alsoUrl && <a href={x.alsoUrl} {...OUT}>Their written review ↗</a>}
        {/* A TikTok channel's older takes on this product (one card per reviewer, lib/thread/creators.ts cardList). */}
        {(x.earlier ?? []).map(e => <a key={e.url} href={e.url} {...OUT}>{`Earlier take${dayLabel(e.date) ? ` (${dayLabel(e.date)})` : ""} ↗`}</a>)}
      </div>
    </div>
  </article>;
}

/** `count`: the reviews counted (one per reviewer; a TikTok channel with two videos counts once). */
/** `roundup`: the "Players on Reddit and forums" card, placed after the third card under All (never counted). */
/** `configs` and `axis` (LaptopRecs): each card's "Reviewed: ..." line, and the model's config axis for the "All (n) · <group>
 *  (n)" chips, shown only when 2 or more groups have cards; the chips filter in the browser like the other pills. */
export function CreatorReviews({ reviews, roundup, configs, axis }: { reviews: ReviewEntry[]; count: number; roundup?: ReactNode;
  configs?: boolean; axis?: ConfigAxis | null }) {
  const [only, setOnly] = useState<Stance | "all">("all"), [src, setSrc] = useState<Src>(null), [by, setBy] = useState<"stance" | "newest">("stance");
  const [grp, setGrp] = useState<string | null>(null);
  const groups = useMemo(() => configs ? configGroups(reviews, axis ?? null) : [], [reviews, configs, axis]);
  const [lit, setLit] = useState<string | null>(null), [goTo, setGoTo] = useState<string | null>(null);
  const n = stanceCounts(reviews);
  // Under All sources, TikToks are mixed in between the others (owner 2026-11-22), never several in a row.
  const list = useMemo(() => { const l = sortReviews(reviews.filter(r => (only === "all" || r.stance === only) && (!src || r.kind === src) && (!grp || configGroupOf(r.config, axis ?? null) === grp)), by);
    return src ? l : mixTikToks(l, by); }, [reviews, only, src, by, grp, axis]);
  // Paddle page v3 (owner handoff 2026-11-26): the first FIRST cards, then "Show N more reviews" (N = the cards not shown yet).
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, FIRST);
  const pills = ([["all", "All", reviews.length], ...(["pos", "mix", "neg"] as const).map(k => [k, STANCE_LABEL[k], n[k]] as const)] as const)
    .filter(c => c[2] > 0);
  const sources = SOURCES.map(([k, l]) => [k, l, reviews.filter(r => r.kind === k).length] as const).filter(c => c[2] > 0);
  // "All N reviews at a glance": a row jumps to its card. Open the list and clear a filter that hides it first, then
  // scroll once it is on the page and highlight it briefly. Rows are links, so Enter works too.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#cr-"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute("href")!.slice(4);
      if (!reviews.some(r => r.id === id)) return;
      e.preventDefault();
      const r = reviews.find(x => x.id === id)!;
      if (only !== "all" && r.stance !== only) setOnly("all");
      if (src && r.kind !== src) setSrc(null);
      if (grp && configGroupOf(r.config, axis ?? null) !== grp) setGrp(null);
      setAll(true);
      setGoTo(id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [reviews, only, src, grp, axis]);
  useEffect(() => {
    if (!goTo) return;
    const el = document.getElementById(`cr-${goTo}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#cr-${goTo}`);
    setLit(goTo); setGoTo(null);
  }, [goTo, shown]);
  useEffect(() => { if (!lit) return; const t = setTimeout(() => setLit(null), 2600); return () => clearTimeout(t); }, [lit]);
  return <VideoProvider><section id="reviews" className="thc-reviews">
    {/* Paddle page v3: the heading on the same row as the filter chips; a chip only when it has cards; Sort at the end. */}
    <div className="thc-rv-h v3">
      <h2>Reviews</h2>
    <div className="thc-pills" role="group" aria-label="Filter reviews">{pills.map(([k, l, c]) =>
      <button key={k} type="button" aria-pressed={only === k && (k !== "all" || !src)} onClick={() => { setOnly(k); if (k === "all") setSrc(null); }}>
        <span style={{ color: only === k && k === "all" && !src ? "#fff" : DOT[k] }} aria-hidden="true">●</span>{`${l} (${c})`}</button>)}
      {sources.length > 1 && <span className="thc-pills-sep" aria-hidden="true"/>}
      {sources.length > 1 && sources.map(([k, l, c]) => <button key={k} type="button" aria-pressed={src === k} onClick={() => setSrc(src === k ? null : k)}>
        {`${l} (${c})`}</button>)}</div>
      <label className="thc-sort"><span>Sort:</span><select value={by} onChange={e => setBy(e.target.value as "stance" | "newest")}>
        <option value="stance">Most relevant</option><option value="newest">Newest</option></select></label>
    </div>
    {/* The config chips (LaptopRecs): "All (n) · Snapdragon (6) · AMD (4)", only with 2 or more groups. */}
    {groups.length > 0 && <div className="thc-pills thc-cfg-chips" role="group" aria-label={`Filter by ${axis!.axis}`}>
      <button type="button" aria-pressed={!grp} onClick={() => setGrp(null)}>{`All (${reviews.length})`}</button>
      {groups.map(g => <button key={g.label} type="button" aria-pressed={grp === g.label} onClick={() => setGrp(grp === g.label ? null : g.label)}>{`${g.label} (${g.n})`}</button>)}</div>}
    {shown.map((x, i) => <Fragment key={x.id}><Card x={x} lit={lit === x.id} configs={configs}/>{roundup && i === Math.min(2, shown.length - 1) && only === "all" && !src && !grp && roundup}</Fragment>)}
    {list.length > shown.length && <button type="button" className="thc-show" onClick={() => setAll(true)}>{`Show ${list.length - shown.length} more ${list.length - shown.length === 1 ? "review" : "reviews"}`}</button>}
  </section></VideoProvider>;
}

/** The first `n` sentences of a summary and the rest ("No. 1" style abbreviations aside, a sentence ends at . ! or ? before
 *  a space or the end). */
function leadSentences(t: string, n: number): [string, string] {
  // Split only where a sentence end (. ! or ?, maybe a closing quote) is followed by a space, so "6.5" stays whole and no
  // text is ever dropped: the two parts always join back into the summary.
  const parts = t.split(/(?<=[.!?]["”’)]*)\s+(?=\S)/).filter(Boolean);
  return parts.length <= n ? [t, ""] : [parts.slice(0, n).join(" "), parts.slice(n).join(" ")];
}
