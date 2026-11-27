"use client";
// A creator page's "All reviews · N" (owner mock 2026-11-27): filter chips (All / Loved it / Mixed / Not for me), newest first, and Show 10 more (owner 2026-11-27), all in the browser on the rows the page already has (instant filters rule: no request,
// the page's ISR cache untouched). Each row: the video thumbnail with its length (plays in the page, the same player as the
// product page, live/video-overlay.tsx) or an Article tile, the product with its shape, the review's line, date, the take and a check price link. No disclosure line on the rows (owner 2026-11-27: they cluttered the page).
import { useMemo, useState } from "react";
import { th } from "../../../lib/thread/look";
import { clock } from "../../../lib/thread/video-meta";
import { thumbOf, dayLabel } from "../../../lib/thread/web-sources";
import { STANCE_LABEL, type Stance } from "../../../lib/thread/creators";
import { VideoProvider, clipOf, playClick, usePlay } from "./video-overlay";

export type ReviewerListRow = { id: string; creator: string; kind: "youtube" | "blog" | "tiktok"; url: string; video: string | null; len: number | null;
  stance: Stance; date: string; product: string; href: string; pic: string | null; shape: string | null; line: string; tie: string | null; disclosure: string | null;
  price: { url: string; rel: string } | null };

const FIRST = 8, STEP = 10;
const DOT: Record<Stance | "all", string> = { all: "#171717", pos: "#62C878", mix: "#F0D16B", neg: "#F0796A" };
const OUT = { target: "_blank", rel: "noopener nofollow" } as const;

function Row({ r }: { r: ReviewerListRow }) {
  const play = usePlay(), clip = clipOf(r), thumb = r.kind === "youtube" ? thumbOf(r.url) : null;
  return <div className="rvp-row">
    {/* Blog rows show the product's own photo (owner 2026-11-27: the empty Article tiles looked sad), labelled Article. */}
    {r.kind === "blog" ? <a className={`rvp-tile art${r.pic ? " pic" : ""}`} href={r.url} {...OUT} aria-label={`Read ${r.creator}'s article`}>
        {r.pic && <img src={r.pic} alt="" loading="lazy"/>}<span>Article</span></a>
      : <a className={`rvp-tile${thumb ? "" : " tt"}`} href={r.url} {...OUT} onClick={playClick(play, clip)} aria-label={`Play ${r.creator}'s ${r.kind === "tiktok" ? "TikTok" : "video"}`}>
        {thumb ? <img src={thumb} alt="" loading="lazy" width={160} height={90}/> : <span className="logo">TikTok</span>}
        <span className="play" aria-hidden="true"/>{r.len ? <span className="len">{clock(r.len)}</span> : null}</a>}
    <div className="rvp-mid">
      <span className="rvp-top"><a className="rvp-prod" href={th(r.href)}>{r.product}</a>{r.shape && <span className="rvp-shape">{r.shape}</span>}</span>
      <p>{r.line}</p>
      {/* Owner 2026-11-27: no links on this line; the name opens the paddle's page and the thumbnail the video. */}
      <span className="rvp-meta">{dayLabel(r.date)}</span>
    </div>
    <span className={`rvp-take ${r.stance}`}>{STANCE_LABEL[r.stance]}</span>
    <span className="rvp-buy">{r.price && <a href={r.price.url} target="_blank" rel={r.price.rel}>check price ↗</a>}</span>
  </div>;
}

export function ReviewerList({ rows }: { rows: ReviewerListRow[] }) {
  const [f, setF] = useState<Stance | "all">("all"), [count, setCount] = useState(FIRST);
  const n = { all: rows.length, pos: rows.filter(r => r.stance === "pos").length, mix: rows.filter(r => r.stance === "mix").length, neg: rows.filter(r => r.stance === "neg").length };
  // Newest first only (owner 2026-11-27: "Most loved" went by site-wide counts, not this creator's own take, so it is gone).
  const list = useMemo(() => rows.filter(r => f === "all" || r.stance === f), [rows, f]);
  const shown = list.slice(0, count), left = list.length - shown.length, next = Math.min(STEP, left);
  const chips: [Stance | "all", string][] = [["all", "All"], ["pos", "Loved it"], ["mix", "Mixed"], ["neg", "Not for me"]];
  return <VideoProvider>
    <section className="rvp-all" id="reviews">
      <div className="rvp-all-h"><h2>{`All reviews · ${rows.length}`}</h2>
        <div className="rvp-ctl">
          <div className="rvp-chips" role="group" aria-label="Filter by take">{chips.filter(([k]) => k === "all" || n[k] > 0).map(([k, l]) =>
            <button key={k} type="button" aria-pressed={f === k} onClick={() => { setF(k); setCount(FIRST); }}><i style={{ background: DOT[k] }} aria-hidden="true"/>{k === "all" ? `${l} ${n.all}` : `${l} (${n[k]})`}</button>)}</div>
        </div></div>
      <div className="rvp-box">
        {shown.map(r => <Row key={r.id} r={r}/>)}
        {list.length > FIRST && <div className="rvp-more"><button type="button" onClick={() => setCount(c => left > 0 ? c + STEP : FIRST)}>{left > 0 ? `Show ${next} more ${next === 1 ? "review" : "reviews"}` : "Show fewer"}</button></div>}
      </div>
    </section>
  </VideoProvider>;
}
