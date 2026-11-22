"use client";
// The creator page's reviews (app/thread/creators/[slug]), in the owner mock's card structure (creator-page mockup
// 2026-11-22): the heading row with Sort, the filter pills (All / Loved it / Mixed / Not for me, a pill only when it has a
// card), then one card per creator: avatar, name, source, date, language box and the take; the real quote as the headline
// (none when the creator gave no clean quote); Stood out / The trade-off / Compared to; the summary with its marked
// phrases (the mock's yellow marker) and an inline Read more at its end (owner 2026-11-22) that opens the rest; +/- chips; Watch on YouTube or Read the full review. Videos have the thumbnail with its
// length and the creator's own chapters on the right. Filtering runs in the browser on the cards the page already has, so
// the page's ISR cache is untouched.
import { useMemo, useState } from "react";
import { atSecond, clock } from "../../../lib/thread/video-meta";
import { dayLabel, thumbOf } from "../../../lib/thread/web-sources";
import { SOURCE_COLOR, STANCE_LABEL, cardChips, initials, langCode, marks, measuredLine, platform, scoreText, sortReviews,
  stanceCounts, type CreatorReview, type Stance } from "../../../lib/thread/creators";

const OUT = { target: "_blank", rel: "noopener nofollow" } as const;
const CHAPTERS = 5, FIRST = 6;
const TYPE_TAG: Record<CreatorReview["type"], string | null> = { review: null, comparison: "Comparison", "long-term": null };
const DOT: Record<Stance | "all", string> = { all: "#171717", pos: "#62C878", mix: "#F0D16B", neg: "#F0796A" };

/** The creator's initials on their source's colour (the mock: YouTube coral, blog blue). */
export function Avatar({ name, kind, size }: { name: string; kind: CreatorReview["kind"]; size?: "sm" }) {
  return <span className={`thc-av${size ? ` ${size}` : ""}`} style={{ background: SOURCE_COLOR[kind] }} aria-hidden="true">{initials(name)}</span>;
}

function Card({ x }: { x: CreatorReview }) {
  const [open, setOpen] = useState(false);
  const measured = measuredLine(x.measured);
  const thumb = x.kind === "youtube" ? thumbOf(x.url) : null;
  const chapters = open ? x.chapters : x.chapters.slice(0, CHAPTERS), hidden = x.chapters.length - chapters.length;
  const more = !!x.more || !!measured || hidden > 0 || !!x.alsoUrl;
  const toggle = <button type="button" className="thc-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>;
  const tags = [TYPE_TAG[x.type], x.note, x.version].filter((t): t is string => !!t);
  const boxes = ([["+", "Stood out", x.stood, "pos"], ["−", "The trade-off", x.trade, "neg"], ["⇄", "Compared to", x.compared, "cmp"]] as
    [string, string, string | null, string][]).filter((b): b is [string, string, string, string] => !!b[2]);
  const chips = cardChips(x.attrs), day = dayLabel(x.date);
  return <article id={`cr-${x.id}`} className="thc-card">
    {thumb && <div className="thc-media">
      <a className="thc-thumb" href={x.url} {...OUT} aria-label={`Watch on YouTube: ${x.creator}`}>
        <img src={thumb} alt="" loading="lazy" width={320} height={200}/><span className="play" aria-hidden="true"/>
        {x.len ? <span className="len">{clock(x.len)}</span> : null}</a>
      {x.chapters.length > 0 && <div className="thc-chap"><strong>Chapters</strong>{chapters.map(([s, t]) =>
        <a key={s} href={atSecond(x.url, s)} {...OUT}><span aria-hidden="true">▶</span><strong>{clock(s)}</strong><span>{t}</span></a>)}
        {hidden > 0 && <button type="button" className="thc-more sm" onClick={() => setOpen(true)}>{`+${hidden} more`}</button>}</div>}
    </div>}
    <div className="thc-card-b">
      <div className="thc-card-top">
        <Avatar name={x.creator} kind={x.kind}/>
        <a className="thc-name" href={x.channel} {...OUT}>{x.creator}</a>
        <span className="thc-meta">{`· ${platform(x)}${day ? ` · ${day}` : ""}`}</span>
        <span className="thc-lang">{langCode(x.lang)}</span>
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
        <span className="thc-box-h"><b aria-hidden="true">{i}</b><span>{h}</span></span><span>{t}</span></div>)}</div>}
      <p className="thc-sum">{marks(x.summary, x.highlights).map((m, i) => m.on ? <mark key={i}>{m.t}</mark> : m.t)}
        {more && !open && <>{" "}{toggle}</>}</p>
      {open && x.more && <p className="thc-sum">{x.more}</p>}
      {open && measured && <p className="thc-sum sm">{`Measured by the reviewer: ${measured}.`}</p>}
      {open && <p className="thc-sum">{toggle}</p>}
      {chips.length > 0 && <div className="thc-tags">{chips.map(c => <span key={c.text} className={`thc-pm ${c.tone}`}>{`${c.tone === "pos" ? "+" : "−"} ${c.text}`}</span>)}</div>}
      <div className="thc-links">
        <a href={x.url} {...OUT}>{x.kind === "youtube" ? <><span className="thc-yt" aria-hidden="true"/>Watch on YouTube ↗</>
          : <><span className="thc-blog-i" aria-hidden="true">✎</span>Read the full review ↗</>}</a>
        {open && x.alsoUrl && <a href={x.alsoUrl} {...OUT}>Their written review ↗</a>}
      </div>
    </div>
  </article>;
}

export function CreatorReviews({ reviews }: { reviews: CreatorReview[] }) {
  const [only, setOnly] = useState<Stance | "all">("all"), [by, setBy] = useState<"stance" | "newest">("stance"), [all, setAll] = useState(false);
  const n = stanceCounts(reviews);
  const list = useMemo(() => sortReviews(only === "all" ? reviews : reviews.filter(r => r.stance === only), by), [reviews, only, by]);
  const shown = all ? list : list.slice(0, FIRST);
  const pills = ([["all", "All", reviews.length], ...(["pos", "mix", "neg"] as const).map(k => [k, STANCE_LABEL[k], n[k]] as const)] as const)
    .filter(c => c[2] > 0);
  return <section id="reviews" className="thc-reviews">
    <div className="thc-rv-h">
      <h2>Reviews <span>{`· ${reviews.length}`}</span></h2>
      <span className="thc-rv-sub">Summaries from YouTube and blogs. Watch or read the original review for the full details.</span>
      <label className="thc-sort"><span>Sort:</span><select value={by} onChange={e => setBy(e.target.value as "stance" | "newest")}>
        <option value="stance">Most relevant</option><option value="newest">Newest</option></select></label>
    </div>
    <div className="thc-pills" role="group" aria-label="Filter by take">{pills.map(([k, l, c]) =>
      <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(k)}>
        <span style={{ color: only === k && k === "all" ? "#fff" : DOT[k] }} aria-hidden="true">●</span>{`${l} (${c})`}</button>)}</div>
    {shown.map(x => <Card key={x.id} x={x}/>)}
    {list.length > shown.length && <button type="button" className="thc-show" onClick={() => setAll(true)}>
      {`Show ${list.length - shown.length} more review${list.length - shown.length === 1 ? "" : "s"}`}</button>}
  </section>;
}
