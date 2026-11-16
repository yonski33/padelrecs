"use client";
// Filter, sort and pick changes are instant on every site (owner 2026-11-15 for padel, 2026-11-16 for SkinRecs: "changing
// filters … is slow"). The server renders the first view for the address (a cached page per view: proxy.ts → app/v/…,
// lib/view-key.ts), and the page sends the rows it needs once; a tap changes the view here, re-runs the same pure functions the
// server used and writes the address with history, with no request to the server. Links stay real links, so a new tab, a
// shared link or no JavaScript still gets the server's page. Every filter UI uses this hook (tests/instant-views.test.ts
// fails a `<Link scroll={false}>` or router.push filter; lib/niche/README.md "Filters and picks are client-side").
import { useEffect, useRef, useState, type MouseEvent } from "react";

/** "push": back and forward step through the picks (padel). "replace": the address follows without new history entries. */
export type InstantMode = "push" | "replace";

/** A view held in the address. `fromUrl` reads one (back and forward re-read it); `hrefOf` is its address. `set` takes the
 *  next view, or a function of the current one (so two quick taps both count), and never asks the server. */
export function useInstantView<V>(first: V, fromUrl: (q: URLSearchParams) => V, hrefOf: (v: V) => string, mode: InstantMode = "push") {
  const [view, setView] = useState(first);
  const cur = useRef(first);
  useEffect(() => {
    const on = () => { const v = fromUrl(new URLSearchParams(location.search)); cur.current = v; setView(v); };
    addEventListener("popstate", on); return () => removeEventListener("popstate", on);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (next: V | ((v: V) => V)) => {
    const v = typeof next === "function" ? (next as (v: V) => V)(cur.current) : next;
    cur.current = v; setView(v);
    history[mode === "push" ? "pushState" : "replaceState"](null, "", hrefOf(v));
  };
  return [view, set] as const;
}

/** onClick for a real link: a plain click runs `run` instead of navigating; a new-tab or modified click is left alone. */
export const instantClick = (run: () => void) => (e: MouseEvent<HTMLAnchorElement>) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); run();
};
