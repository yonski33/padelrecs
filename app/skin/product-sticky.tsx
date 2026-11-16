"use client";
import { useEffect, useState } from "react";

/** The beauty product page's floating match (owner's design 2026-11-16): once the hero scrolls away, a card at the top right on
 *  wide screens and a bar at the bottom below 1400px, with the match % and Check price. The match comes from the server (the
 *  picks are in the URL); this only watches the scroll. */
export default function ProductSticky({ pct, word, pillBg, buy }: { pct: number | null; word: string | null; pillBg: string;
  buy: { url: string; label: string; rel: string } | null }) {
  const [past, setPast] = useState(false), [wide, setWide] = useState(true);
  useEffect(() => {
    const on = () => { const el = document.getElementById("bp-hero"); setPast(el ? el.getBoundingClientRect().bottom < 0 : window.scrollY > 500); setWide(window.innerWidth >= 1400); };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  if (!past) return null;
  const match = pct !== null ? <><span className="bp-st-pct">{`${pct}%`}</span><span className="bp-st-word" style={{ background: pillBg }}>{word}</span></>
    : <a href="#bp-hero" className="bp-st-check">Check your skin fit ↑</a>;
  return wide
    ? <div className="bp-side" aria-label="Your match"><span className="bp-tag">✦ your match</span><div className="bp-side-m">{match}</div>
      {buy && <a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a>}</div>
    : <div className="bp-bar" aria-label="Your match">{match}{buy && <a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a>}</div>;
}
