"use client";
// The quiet sticky price bar (paddle page v3, owner handoff 2026-11-26): once the head panel has scrolled away, a thin bar
// under the site header with the photo, the name, the price and the page's one filled shop button. Nothing else on purpose.
// It shows only while the head panel (#thc-top) is above the screen, so the head's own button and this one are never both
// on screen. Server-rendered hidden; the scroll check runs in the browser only.
import { useEffect, useState } from "react";

export function StickyPrice({ name, pic, price, priceWord, cta }: { name: string; pic: string | null; price: string | null;
  /** "lowest", or "from" where prices are each shop's own currency (PadelRecs). */ priceWord: string;
  cta: { url: string; rel: string; text: string } }) {
  const [on, setOn] = useState(false), [top, setTop] = useState(0);
  useEffect(() => {
    const head = document.getElementById("thc-top");
    if (!head) return;
    const check = () => {
      // Stack under the site header when it is sticky (thread.css .th-head).
      const bar = document.querySelector(".th-head")?.getBoundingClientRect();
      const under = bar && getComputedStyle(document.querySelector(".th-head")!).position === "sticky" ? Math.max(0, bar.bottom) : 0;
      setTop(under);
      setOn(head.getBoundingClientRect().bottom < under);
    };
    check();
    window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  return <div className={`thc-stick${on ? " on" : ""}`} style={{ top }} aria-hidden={!on}>
    <div className="thc-stick-in">
      {pic ? <img src={pic} alt="" width={28} height={40}/> : <span className="thc-stick-ph"/>}
      <strong className="thc-stick-n">{name}</strong>
      <span className="thc-stick-sp"/>
      {price && <span className="thc-stick-p"><strong>{price}</strong>{` ${priceWord}`}</span>}
      <a className="thc-cta" href={cta.url} target="_blank" rel={cta.rel} tabIndex={on ? 0 : -1}>{cta.text}</a>
    </div>
  </div>;
}
