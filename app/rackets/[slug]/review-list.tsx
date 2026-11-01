"use client";
import { useState, type MouseEvent, type ReactNode } from "react";
import { niche } from "../../../lib/niche";
import { helpfulRank } from "../../../lib/review-order";

type Sort = "newest" | "helpful";
export type ListItem = { key: string; kind: "players" | "web"; date: string; helpful: number; score: number; node: ReactNode };

/**
 * Racket-page review list. Sorting switches instantly in the browser; the links stay real
 * (shareable, crawlable, and working without JavaScript) and the address bar follows along.
 */
/** `addButton`, when given, sits beside the "Reviews" title (product pages whose scorecard button is Amazon's). */
export default function ReviewList({ href, addHref, addButton, items, initialSort }: { href: string; addHref: string; addButton?: ReactNode; items: ListItem[]; initialSort: Sort }) {
  const [sort, setSort] = useState<Sort>(initialSort);
  const link = (srt: Sort) => {
    const q = new URLSearchParams();
    if (srt !== "newest") q.set("sort", srt);
    const qs = q.toString();
    return `${href}${qs ? `?${qs}` : ""}`;
  };
  function go(event: MouseEvent<HTMLAnchorElement>, srt: Sort) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; // let "open in new tab" work
    event.preventDefault();
    setSort(srt);
    window.history.replaceState(window.history.state, "", link(srt));
  }

  const shown = [...items].sort((a, b) => (sort === "helpful" ? helpfulRank(b) - helpfulRank(a) : 0) || b.date.localeCompare(a.date));

  return <>
    <div className="feed-heading">
      <div className="feed-title-row">
        <h2 className="feed-title">Reviews</h2>
        {addButton}
      </div>
    </div>
    {shown.length > 1 && <p className="sort-links">Sort: {(["newest", "helpful"] as const).map(v =>
      <a key={v} href={link(v)} onClick={e => go(e, v)} aria-current={sort === v ? "page" : undefined}>{v === "newest" ? "Newest" : "Most helpful"}</a>)}</p>}
    {shown.map(i => <div key={i.key}>{i.node}</div>)}
    {shown.length === 0 && <p className="empty-feed">{`No reviews yet. This ${niche.words.one} is waiting for its first one.`} <a href={addHref}>Write one →</a></p>}
  </>;
}
