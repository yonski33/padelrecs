"use client";
// A post's age, worked out in the visitor's browser (owner 2026-11-19): the Thread pages are cached for hours (ISR), so an
// age written into the page froze at render time ("just now" for hours). The page's own text shows first (it matches the
// server's HTML), then the real age, renewed every half minute.
import { useSyncExternalStore } from "react";
import { ago } from "../ui";

const tick = (cb: () => void) => { const id = setInterval(cb, 30_000); return () => clearInterval(id); };
const minute = () => Math.floor(Date.now() / 60_000);
export function Ago({ at, initial = "" }: { at: string | null | undefined; initial?: string }) {
  const m = useSyncExternalStore(tick, minute, () => null);
  return <>{m == null ? initial : ago(at, m * 60_000)}</>;
}
