"use client";
import { useEffect, useState } from "react";

/** The floating match box on the skin product page, as padel's FitSticky (app/rackets/[slug]/fit-live.tsx): shown once the hero
 *  and its fit box have scrolled out of view, a card on desktop and a bar on phones. The match comes from the server (the picks
 *  are in the URL), so this only watches the scroll. */
export default function SkinSticky({ pct, kind, word, buy, name }: { pct: number | null; kind: "good" | "maybe" | "no" | "thin" | null; word: string | null;
  buy: { url: string; label: string; rel: string } | null; name: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(".rf-top"); if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(hero); return () => io.disconnect();
  }, []);
  return <div className={`rp-stick${on ? " on" : ""}`} aria-label={`Your match with the ${name}`}>
    <div className="rp-sk">
      <span className="rp-k">⚡ your match</span>
      {pct !== null && kind && kind !== "thin" ? <a href="#fit" className={`rp-pct ${kind}`}><b>{`${pct}%`}</b><span className="rp-vw">{word}</span></a>
        : <a href="#fit" className="rp-check">{kind === "thin" ? "not enough reports yet" : "Check your fit ↑"}</a>}
    </div>
    {buy && <a className="rf-btn rp-buy" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a>}
  </div>;
}
