export const dynamic = "force-dynamic";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Padel Racket Brands", description: "Browse padel rackets by brand — Nox, Bullpadel, Adidas, Head, Babolat and more — and read real player reviews of each model.", alternates: { canonical: "/brands" } };
import { catalog } from "../../db/data";
export default async function Brands(){ const data=await catalog();return <main className="narrow"><div className="page-title"><h1>Brands</h1><p className="muted">Browse the racket database by maker.</p></div><ul className="brands-directory">{data.brands.map(b=><li key={b.id}><a href={`/brands/${b.slug}`}>{b.name}</a><span className="muted small">{data.rackets.filter(r=>r.brandId===b.id).length} racket{data.rackets.filter(r=>r.brandId===b.id).length===1?"":"s"} →</span></li>)}</ul></main>}
