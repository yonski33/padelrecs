"use client";
import { useState, type MouseEvent, type ReactNode } from "react";
import { niche, catalogPath } from "../../../lib/niche";
import { helpfulRank } from "../../../lib/review-order";

type Source = "all" | "players" | "web";
type Sort = "newest" | "helpful";
export type ListItem = { key: string; kind: "players" | "web"; date: string; helpful: number; score: number; node: ReactNode };

/**
 * Racket-page review list. Source tabs and sorting switch instantly in the browser; the links stay real
 * (shareable, crawlable, and working without JavaScript) and the address bar follows along.
 */
/** `addButton`, when given, sits beside the "Reviews" title (product pages whose scorecard button is Amazon's). */
export default function ReviewList({ slug, addHref, addButton, items, initialSource, initialSort }: { slug: string; addHref: string; addButton?: ReactNode; items: ListItem[]; initialSource: Source; initialSort: Sort }) {
  const [source, setSource] = useState<Source>(initialSource);
  const [sort, setSort] = useState<Sort>(initialSort);
  const link = (src: Source, srt: Sort) => {
    const q = new URLSearchParams();
    if (src !== "all") q.set("source", src);
    if (srt !== "newest") q.set("sort", srt);
    const qs = q.toString();
    return `${catalogPath}/${slug}${qs ? `?${qs}` : ""}`;
  };
  function go(event: MouseEvent<HTMLAnchorElement>, src: Source, srt: Sort) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; // let "open in new tab" work
    event.preventDefault();
    setSource(src); setSort(srt);
    window.history.replaceState(window.history.state, "", link(src, srt));
  }

  const count = (src: Source) => src === "all" ? items.length : items.filter(i => i.kind === src).length;
  const shown = items.filter(i => source === "all" || i.kind === source)
    .sort((a, b) => (sort === "helpful" ? helpfulRank(b) - helpfulRank(a) : 0) || b.date.localeCompare(a.date));
  const tabs: [Source, string][] = [["all", "All"], ["players", `From ${niche.people.many}`], ["web", "From around the web"]];

  return <>
    <div className="feed-heading">
      <div className="feed-title-row">
        <h2 className="feed-title">Reviews</h2>
        {addButton}
      </div>
      <nav className="source-nav" aria-label="Review sources">
        {tabs.map(([value, label]) => <a key={value} href={link(value, sort)} onClick={e => go(e, value, sort)} aria-current={source === value ? "page" : undefined}>{label}<span className="source-count">{count(value)}</span></a>)}
      </nav>
    </div>
    {shown.length > 1 && <p className="sort-links">Sort: {(["newest", "helpful"] as const).map(v =>
      <a key={v} href={link(source, v)} onClick={e => go(e, source, v)} aria-current={sort === v ? "page" : undefined}>{v === "newest" ? "Newest" : "Most helpful"}</a>)}</p>}
    {shown.map(i => <div key={i.key}>{i.node}</div>)}
    {shown.length === 0 && <p className="empty-feed">{source === "web" ? "Nothing quoted from around the web yet." : `No ${niche.people.one} reviews yet. This ${niche.words.one} is waiting for its first one.`} <a href={addHref}>Write one →</a></p>}
  </>;
}
