"use client";
// The SkinRecs brands grid and its sort in the browser (owner 2026-11-16: sorts and filters change with no wait): the server
// sends every brand once; "most reviewed" / "A to Z" re-sorts here and updates the address (app/instant-view.ts).
import type { ReactNode } from "react";
import { useInstantView, instantClick } from "../instant-view";

export type BrandCard = { id: string; name: string; slug: string; count: number; reviews: number; known: string[]; pics: { id: string; src: string }[] };
const TINTS = ["oklch(0.97 0.02 20)", "oklch(0.97 0.025 155)", "#f4ede6", "oklch(0.97 0.03 70)"];
const HEIGHTS = [72, 64, 68];

export function BrandsSort({ brands, sort: first, children }: { brands: BrandCard[]; sort: "az" | "reviews"; /** The hero's words. */ children: ReactNode }) {
  const href = (s: "az" | "reviews") => s === "az" ? "/brands?sort=az" : "/brands";
  const [sort, set] = useInstantView(first, q => q.get("sort") === "az" ? "az" as const : "reviews" as const, href, "replace");
  const az = sort === "az";
  const shown = [...brands].sort((a, b) => az ? a.name.localeCompare(b.name) : b.reviews - a.reviews || a.name.localeCompare(b.name));
  const pick = (s: "az" | "reviews", label: string) => <a href={href(s)} onClick={instantClick(() => set(s))} className={`bp-pick sm${sort === s ? " on" : ""}`} aria-current={sort === s ? "true" : undefined}>{label}</a>;
  return <>
    <section className="bb-hero">{children}
      <div className="bc-sort"><span>sort</span>{pick("reviews", "most reviewed")}{pick("az", "A to Z")}</div>
    </section>
    <ul className="bb-grid">{shown.map(({ id, name, slug, count, reviews, known, pics }, i) => <li key={id}><a className="bb-card" href={`/brands/${slug}`}>
      <span className="bb-top"><span><b>{name}</b><small>{`${count} ${count === 1 ? "product" : "products"} · ${reviews.toLocaleString("en-US")} reviews`}</small></span><i aria-hidden="true">→</i></span>
      <span className="bb-strip" style={{ background: TINTS[i % TINTS.length] }}>
        {pics.length ? pics.map((p, j) => <span key={p.id} className="bb-slot" style={{ height: HEIGHTS[j] }}><img src={p.src} alt="" width={120} height={160} decoding="async" loading={i < 8 ? "eager" : "lazy"}/></span>)
          : <span className="bb-mono" aria-hidden="true">{name}</span>}
      </span>
      {known.length > 0 && <span className="bb-known">{known.map(k => <span key={k}>{k}</span>)}</span>}
    </a></li>)}</ul>
  </>;
}
