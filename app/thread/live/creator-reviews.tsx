"use client";
// The creator page's cards (app/thread/creators/[slug]): filter chips (All / Loved it / Mixed / Not for me, a chip only when
// it has a card), a sort, then one card per creator: the real quote as the headline (none when the creator gave no clean
// quote), Stood out / Trade-off / Compared to, a short summary with Read more, and the video with its length and the
// creator's own chapters (or the blog link). Filtering is in the browser on the cards the page already has, so the page's
// ISR cache is untouched.
import { useMemo, useState } from "react";
import { atSecond, clock } from "../../../lib/thread/video-meta";
import { dayLabel, thumbOf } from "../../../lib/thread/web-sources";
import { ATTRS, STANCE_LABEL, initials, langCode, measuredLine, platform, scoreText, sortReviews, splitSummary, stanceCounts,
  wordTone, type CreatorReview, type Stance } from "../../../lib/thread/creators";

const OUT = { target: "_blank", rel: "noopener nofollow" } as const;
const CHAPTERS = 5;
const TYPE_TAG: Record<CreatorReview["type"], string | null> = { review: null, comparison: "Comparison", "long-term": null };

function Card({ x }: { x: CreatorReview }) {
  const [open, setOpen] = useState(false);
  const [short, rest] = splitSummary(x.summary), measured = measuredLine(x.measured);
  const thumb = x.kind === "youtube" ? thumbOf(x.url) : null;
  const chapters = open ? x.chapters : x.chapters.slice(0, CHAPTERS), hidden = x.chapters.length - chapters.length;
  const more = !!rest || !!measured || hidden > 0 || !!x.alsoUrl;
  const tags = [TYPE_TAG[x.type], x.note, x.version].filter((t): t is string => !!t);
  const boxes = ([["Stood out", x.stood, "pos"], ["Trade-off", x.trade, "neg"], ["Compared to", x.compared, "cmp"]] as [string, string | null, string][])
    .filter((b): b is [string, string, string] => !!b[1]);
  const day = dayLabel(x.date);
  return <article id={`cr-${x.id}`} className="th-card thc-card">
    <div className="thc-card-b">
      <div className="thc-card-top">
        <span className="thc-av" aria-hidden="true">{initials(x.creator)}</span>
        <span className="thc-by"><a href={x.channel} {...OUT}><b>{x.creator}</b></a>
          <small>{[platform(x), day, x.len ? clock(x.len) : null, langCode(x.lang)].filter(Boolean).join(" · ")}</small></span>
        <span className={`th-vpill ${x.stance}`}>{STANCE_LABEL[x.stance]}</span>
      </div>
      {(tags.length > 0 || x.score || x.tie) && <div className="thc-tags">
        {tags.map(t => <span key={t} className="th-pill">{t}</span>)}
        {x.score && <span className="th-pill thc-own">{`Own score ${scoreText(x.score)}${x.score.label ? ` (${x.score.label.toLowerCase()})` : ""}`}</span>}
        {x.tie && <span className="thc-tie">{`Works with ${x.tie}`}</span>}
      </div>}
      {x.quote && <blockquote className="thc-q">{x.quoteAt != null && x.kind === "youtube"
        ? <a href={atSecond(x.url, x.quoteAt)} {...OUT} aria-label={`Watch from ${clock(x.quoteAt)}`}>{`“${x.quote}”`}<small>{clock(x.quoteAt)}</small></a>
        : `“${x.quote}”`}</blockquote>}
      {boxes.length > 0 && <div className="thc-boxes">{boxes.map(([h, t, k]) => <div key={h} className={`thc-box ${k}`}><b>{h}</b><span>{t}</span></div>)}</div>}
      <p className="thc-sum">{short}{open && rest && <> {rest}</>}</p>
      {open && measured && <p className="thc-measured">{`Measured by the creator: ${measured}`}</p>}
      {open && x.alsoUrl && <a className="thc-go" href={x.alsoUrl} {...OUT}>Their written review ↗</a>}
      <div className="thc-chips">{ATTRS.filter(([k]) => x.attrs[k]).map(([k, l]) => <span key={k} className="thc-chip"><small>{l}</small>
        <span className={`thc-w ${wordTone(x.attrs[k])}`}>{x.attrs[k]}</span></span>)}</div>
      <div className="thc-card-f">
        {more && <button type="button" className="thc-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>}
        <a className="thc-go" href={x.url} {...OUT}>{x.kind === "youtube" ? "Watch on YouTube ↗" : "Read the full review ↗"}</a>
      </div>
    </div>
    <div className="thc-media">
      {thumb ? <a className="thc-thumb" href={x.url} {...OUT} aria-label={`Watch on YouTube: ${x.creator}`}>
        <img src={thumb} alt="" loading="lazy" width={320} height={180}/><span className="play" aria-hidden="true"/>
        {x.len ? <span className="len">{clock(x.len)}</span> : null}</a>
        : <a className="thc-blog" href={x.url} {...OUT}><span>Blog</span><b>{x.creator}</b><small>Read the full review ↗</small></a>}
      {x.chapters.length > 0 && <div className="thc-chap"><b>Chapters</b><ul>{chapters.map(([s, t]) => <li key={s}>
        <a href={atSecond(x.url, s)} {...OUT}><span>{clock(s)}</span>{t}</a></li>)}</ul>
        {hidden > 0 && <button type="button" className="thc-more sm" onClick={() => setOpen(true)}>{`+${hidden} more`}</button>}</div>}
    </div>
  </article>;
}

export function CreatorReviews({ reviews }: { reviews: CreatorReview[] }) {
  const [only, setOnly] = useState<Stance | "all">("all"), [by, setBy] = useState<"stance" | "newest">("stance");
  const n = stanceCounts(reviews);
  const list = useMemo(() => sortReviews(only === "all" ? reviews : reviews.filter(r => r.stance === only), by), [reviews, only, by]);
  const chips = ([["all", "All", reviews.length], ...(["pos", "mix", "neg"] as const).map(k => [k, STANCE_LABEL[k], n[k]] as const)] as const)
    .filter(c => c[2] > 0);
  return <section id="reviews" className="thc-reviews">
    <div className="thc-rv-h">
      <div><h2 className="th-h2">{`Creator reviews · ${reviews.length}`}</h2><span className="thc-sub">Summaries of YouTube and blog reviews. Open the original for the full details.</span></div>
      <label className="thc-sort"><span>Sort</span><select value={by} onChange={e => setBy(e.target.value as "stance" | "newest")}>
        <option value="stance">Loved it first</option><option value="newest">Newest</option></select></label>
    </div>
    <div className="th-wv-tabs thc-tabs" role="group" aria-label="Filter by take">{chips.map(([k, l, c]) =>
      <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(k)}>{`${l} (${c})`}</button>)}</div>
    {list.map(x => <Card key={x.id} x={x}/>)}
  </section>;
}
