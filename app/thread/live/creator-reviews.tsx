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
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { atSecond, clock } from "../../../lib/thread/video-meta";
import { VideoProvider, clipOf, playClick, usePlay } from "./video-overlay";
import { dayLabel, thumbOf } from "../../../lib/thread/web-sources";
import { SOURCE_COLOR, STANCE_LABEL, cardChips, initials, langCode, marks, measuredLine, platform, scoreText, sortReviews, mixTikToks,
  stanceCounts, type CreatorReview, type ReviewEntry, type Stance } from "../../../lib/thread/creators";

const OUT = { target: "_blank", rel: "noopener nofollow" } as const;

const TYPE_TAG: Record<CreatorReview["type"], string | null> = { review: null, comparison: "Comparison", "long-term": null };
const DOT: Record<Stance | "all", string> = { all: "#171717", pos: "#62C878", mix: "#F0D16B", neg: "#F0796A" };
const SOURCES: [CreatorReview["kind"], string][] = [["youtube", "YouTube"], ["blog", "Blog"], ["tiktok", "TikTok"]];
type Src = CreatorReview["kind"] | null;

/** The creator's initials on their source's colour (the mock: YouTube coral, blog blue; TikTok black). */
export function Avatar({ name, kind, size }: { name: string; kind: CreatorReview["kind"]; size?: "sm" }) {
  return <span className={`thc-av${size ? ` ${size}` : ""}`} style={{ background: SOURCE_COLOR[kind] }} aria-hidden="true">{initials(name)}</span>;
}

function Card({ x, lit }: { x: ReviewEntry; lit: boolean }) {
  const [open, setOpen] = useState(false);
  const tt = x.kind === "tiktok", measured = measuredLine(x.measured);
  const thumb = x.kind === "youtube" ? thumbOf(x.url) : null;
  // Chapters collapsed by default (owner 2026-11-23): "▸ N chapters" under the thumbnail opens the full list.
  const [chOpen, setChOpen] = useState(false);
  // Every summary (videos 2026-11-22, blogs too 2026-11-23, owner): about three sentences before Read more, at most two
  // marked phrases, the rest of the summary after it, 68ch at 17px on 1.65.
  const vid = true;
  const [lead, rest] = vid ? leadSentences(x.summary, 3) : [x.summary, ""];
  const hl = vid ? x.highlights.slice(0, 2) : x.highlights;
  const more = !!rest || !!x.more || !!measured || !!x.alsoUrl;
  const toggle = <button type="button" className="thc-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>;
  const tags = [TYPE_TAG[x.type], x.note, x.version].filter((t): t is string => !!t);
  const boxes = ([["+", "Stood out", x.stood, "pos"], ["−", "The trade-off", x.trade, "neg"], ["⇄", "Compared to", x.compared, "cmp"]] as
    [string, string, string | null, string][]).filter((b): b is [string, string, string, string] => !!b[2]);
  // A TikTok take shows its own tags; a review shows its attribute words as +/- chips.
  const chips = tt ? (x.tags ?? []).map(t => ({ tone: /^[-−]/.test(t) ? "neg" as const : "pos" as const, text: t.replace(/^[+\-−]\s*/, "") }))
    : cardChips(x.attrs);
  const day = dayLabel(x.date);
  // The thumbnail, the TikTok tile and each chapter play in the page (live/video-overlay.tsx); the Watch on links stay.
  const play = usePlay(), clip = clipOf(x);
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
        <a className="thc-name" href={x.channel} {...OUT}>{x.creator}</a>
        <span className="thc-meta">{`· ${platform(x)}${x.handle ? ` · ${x.handle}` : ""}${day ? ` · ${day}` : ""}`}</span>
        {!tt && <span className="thc-lang">{langCode(x.lang)}</span>}
        <span className={`thc-take ${x.stance}`}>{`♡ ${STANCE_LABEL[x.stance]}`}</span>
      </div>
      {/* No "Works with [brand]" note (owner 2026-11-22: no disclosure lines; `tie` stays in the data). */}
      {(tags.length > 0 || x.score) && <div className="thc-tags">
        {tags.map(t => <span key={t} className="thc-tag">{t}</span>)}
        {x.score && <span className="thc-tag">{`Own score ${scoreText(x.score)}${x.score.label ? ` (${x.score.label.toLowerCase()})` : ""}`}</span>}
      </div>}
      {x.quote && <h3 className="thc-q">{x.quoteAt != null && x.kind === "youtube"
        ? <a href={atSecond(x.url, x.quoteAt)} {...OUT} aria-label={`Watch from ${clock(x.quoteAt)}`}>{`“${x.quote}”`}</a> : `“${x.quote}”`}</h3>}
      {boxes.length > 0 && <div className="thc-boxes">{boxes.map(([i, h, t, k]) => <div key={h} className={`thc-box ${k}`}>
        <span className="thc-box-h"><b aria-hidden="true">{i}</b><span>{h}</span></span><span className="thc-box-t">{t}</span></div>)}</div>}
      <p className={`thc-sum${vid ? " vid" : ""}`}>{marks(lead, hl).map((m, i) => m.on ? <mark key={i}>{m.t}</mark> : m.t)}
        {more && !open && <>{" "}{toggle}</>}</p>
      {open && rest && <p className={`thc-sum${vid ? " vid" : ""}`}>{marks(rest, hl.filter(h => !lead.includes(h))).map((m, i) => m.on ? <mark key={i}>{m.t}</mark> : m.t)}</p>}
      {open && x.more && <p className={`thc-sum${vid ? " vid" : ""}`}>{x.more}</p>}
      {open && measured && <p className="thc-sum sm">{`Measured by the reviewer: ${measured}.`}</p>}
      {open && <p className="thc-sum">{toggle}</p>}
      {chips.length > 0 && <div className="thc-tags">{chips.map(c => <span key={c.text} className={`thc-pm ${c.tone}`}>{`${c.tone === "pos" ? "+" : "−"} ${c.text}`}</span>)}</div>}
      <div className="thc-links">
        <a href={x.url} {...OUT}>{x.kind === "youtube" ? <><span className="thc-yt" aria-hidden="true"/>Watch on YouTube ↗</>
          : tt ? <><span className="thc-tt-i" aria-hidden="true">♪</span>Watch on TikTok ↗</>
          : <><span className="thc-blog-i" aria-hidden="true">✎</span>Read the full review ↗</>}</a>
        {open && x.alsoUrl && <a href={x.alsoUrl} {...OUT}>Their written review ↗</a>}
      </div>
    </div>
  </article>;
}

/** `count`: the reviews counted (one per reviewer; a TikTok channel with two videos counts once). */
/** `roundup`: the "Players on Reddit and forums" card, placed after the third card under All (never counted). */
export function CreatorReviews({ reviews, count, roundup }: { reviews: ReviewEntry[]; count: number; roundup?: ReactNode }) {
  const [only, setOnly] = useState<Stance | "all">("all"), [src, setSrc] = useState<Src>(null), [by, setBy] = useState<"stance" | "newest">("stance");
  const [lit, setLit] = useState<string | null>(null), [goTo, setGoTo] = useState<string | null>(null);
  const n = stanceCounts(reviews);
  // Under All sources, TikToks are mixed in between the others (owner 2026-11-22), never several in a row.
  const list = useMemo(() => { const l = sortReviews(reviews.filter(r => (only === "all" || r.stance === only) && (!src || r.kind === src)), by);
    return src ? l : mixTikToks(l, by); }, [reviews, only, src, by]);
  // Every review shows at once (owner 2026-11-22: little else follows on the page, so no reason to limit them).
  const shown = list;
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
      setGoTo(id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [reviews, only, src]);
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
    <div className="thc-rv-h">
      <h2>Reviews <span>{`· ${count}`}</span></h2>
      <span className="thc-rv-sub">{`Summaries from ${sourcesOf(reviews)}. Watch or read the original review for the full details.`}</span>
      <label className="thc-sort"><span>Sort:</span><select value={by} onChange={e => setBy(e.target.value as "stance" | "newest")}>
        <option value="stance">Most relevant</option><option value="newest">Newest</option></select></label>
    </div>
    <div className="thc-pills" role="group" aria-label="Filter reviews">{pills.map(([k, l, c]) =>
      <button key={k} type="button" aria-pressed={only === k && (k !== "all" || !src)} onClick={() => { setOnly(k); if (k === "all") setSrc(null); }}>
        <span style={{ color: only === k && k === "all" && !src ? "#fff" : DOT[k] }} aria-hidden="true">●</span>{`${l} (${c})`}</button>)}
      {sources.length > 1 && <span className="thc-pills-sep" aria-hidden="true"/>}
      {sources.length > 1 && sources.map(([k, l, c]) => <button key={k} type="button" aria-pressed={src === k} onClick={() => setSrc(src === k ? null : k)}>
        {`${l} (${c})`}</button>)}</div>
    {shown.map((x, i) => <Fragment key={x.id}><Card x={x} lit={lit === x.id}/>{roundup && i === Math.min(2, shown.length - 1) && only === "all" && !src && roundup}</Fragment>)}
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

/** "YouTube, blogs and TikTok": only the sources these reviews come from (SkinRecs has no TikTok takes yet). */
function sourcesOf(rs: { kind: string }[]) {
  const k = new Set(rs.map(r => r.kind));
  const l = [k.has("youtube") && "YouTube", k.has("blog") && "blogs", k.has("tiktok") && "TikTok"].filter((x): x is string => !!x);
  return l.length > 1 ? `${l.slice(0, -1).join(", ")} and ${l.at(-1)}` : l[0] ?? "reviews";
}
