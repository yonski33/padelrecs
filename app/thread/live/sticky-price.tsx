"use client";
// The quiet sticky price bar (paddle page v3, owner handoff 2026-11-26), folded into the site header (owner 2026-11-26: two
// sticky bars took too much room). Once the head panel (#thc-top) has scrolled off, the header's search, Sign in and Add a
// review give way to the photo, the name, the price and the page's one filled shop button; scrolling back up brings them
// back. Rendered into the header (live/header.tsx .th-head-in) with a portal; nothing shows before the page is in the browser.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STUCK = "thc-stuck";

export function StickyPrice({ name, pic, price, priceWord, cta }: { name: string; pic: string | null; price: string | null;
  /** "lowest", or "from" where prices are each shop's own currency (PadelRecs). */ priceWord: string;
  cta: { url: string; rel: string; text: string } }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null), [on, setOn] = useState(false);
  useEffect(() => {
    const head = document.getElementById("thc-top"), bar = document.querySelector<HTMLElement>(".th-head");
    const inner = bar?.querySelector<HTMLElement>(".th-head-in");
    if (!head || !bar || !inner) return;
    setSlot(inner);
    const check = () => setOn(head.getBoundingClientRect().bottom < bar.getBoundingClientRect().bottom);
    check();
    window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); document.documentElement.classList.remove(STUCK); };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle(STUCK, on); }, [on]);
  if (!slot) return null;
  return createPortal(<div className="thc-stick" aria-hidden={!on}>
    {pic ? <img src={pic} alt="" width={22} height={32}/> : null}
    <strong className="thc-stick-n">{name}</strong>
    {price && <span className="thc-stick-p"><strong>{price}</strong>{` ${priceWord}`}</span>}
    <a className="thc-stick-cta" href={cta.url} target="_blank" rel={cta.rel} tabIndex={on ? 0 : -1}>{cta.text}</a>
  </div>, slot);
}
