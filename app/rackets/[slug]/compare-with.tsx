"use client";
// "compare with…" on a product page (UX audit 2026-11-17: compare was hard to find): opens the catalogue's compare mode with
// this product already picked, through the tray's tab storage (app/rackets/compare-tray.tsx). Without JavaScript it still
// opens compare mode, just without the pick.
export function CompareWith({ href, pick }: { href: string; pick: { id: string; slug: string; name: string; pic: string | null } }) {
  return <a className="v11-cmp" href={href} onClick={() => { try {
    const s = JSON.parse(sessionStorage.getItem("compare-picks") ?? "null"), picks = Array.isArray(s?.picks) ? s.picks.filter((p: { id: string }) => p.id !== pick.id) : [];
    sessionStorage.setItem("compare-picks", JSON.stringify({ on: true, picks: [pick, ...picks].slice(0, 3) })); } catch { /* private mode */ } }}>compare with… →</a>;
}
