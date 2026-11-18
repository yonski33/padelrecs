"use client";
// The deep section's sticky thumbnail strip (owner-approved mock 2026-11-19): rank and score per product, a jump to its block,
// and the block on screen highlighted as you scroll. It sticks under the site's sticky header and scrolls sideways on phones.
// Plain anchors and an IntersectionObserver: nothing here asks the server.
import { useEffect, useRef, useState } from "react";

type Item = { rank: number; pic: string | null; sig: number | null; name: string };
const tone = (n: number | null) => n === null ? "" : n >= 85 ? " hi" : n >= 70 ? " mid" : "";

export function DeepStrip({ items }: { items: Item[] }) {
  const [on, setOn] = useState(items[0]?.rank ?? 1);
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    // The site header is sticky (app/site-header-v2.css): the strip and the blocks' jump targets sit under it.
    const root = document.documentElement, head = document.querySelector<HTMLElement>(".hv2-top");
    const place = () => { const h = head && getComputedStyle(head).position === "sticky" ? head.getBoundingClientRect().height : 0;
      root.style.setProperty("--rkd-head", `${Math.round(h)}px`); root.style.setProperty("--rkd-strip", `${Math.round(bar.current?.getBoundingClientRect().height ?? 0)}px`); };
    place(); addEventListener("resize", place);
    const blocks = [...document.querySelectorAll<HTMLElement>(".rkd-b[data-rank]")];
    // The current block is the last one whose top has passed a line just under the strip.
    const pick = () => { const line = (head?.getBoundingClientRect().bottom ?? 0) + (bar.current?.getBoundingClientRect().height ?? 0) + 40;
      let cur = blocks[0]; for (const b of blocks) if (b.getBoundingClientRect().top <= line) cur = b; if (cur) setOn(Number(cur.dataset.rank)); };
    const io = new IntersectionObserver(pick, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    blocks.forEach(b => io.observe(b)); addEventListener("scroll", pick, { passive: true }); pick();
    return () => { io.disconnect(); removeEventListener("scroll", pick); removeEventListener("resize", place); };
  }, []);
  // Keep the highlighted thumbnail in view on a phone's sideways strip.
  useEffect(() => { const a = bar.current?.querySelector<HTMLElement>(`[data-r="${on}"]`), box = bar.current?.querySelector<HTMLElement>("ol");
    if (a && box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" }); }, [on]);
  return <nav className="rkd-strip" ref={bar} aria-label="Jump to a racket">
    <ol>{items.map(x => <li key={x.rank}><a href={`#rd-${x.rank}`} data-r={x.rank} aria-current={x.rank === on ? "true" : undefined} title={x.name}>
      <span className="rkd-tp">{x.pic ? <img src={x.pic} alt="" loading="lazy" width={30} height={40}/> : null}</span>
      <span className="rkd-tn"><b>{x.rank}</b><i className={tone(x.sig)}>{x.sig ?? "–"}</i></span>
    </a></li>)}</ol>
  </nav>;
}
