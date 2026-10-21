export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
const w = niche.words;
export const metadata: Metadata = { ...niche.seo.brands, alternates: { canonical: "/brands" } };
import { catalog } from "../../db/data";
export default async function Brands(){ const data=await catalog();return <main className="narrow"><div className="page-title"><h1>Brands</h1><p className="muted">{`Browse the ${w.one} database by maker.`}</p></div><ul className="brands-directory">{data.listedBrands.map(b=>{const n=data.listed.filter(r=>r.brandId===b.id).length;return <li key={b.id}><a href={`/brands/${b.slug}`}>{b.name}</a><span className="muted small">{n} {n===1?w.one:w.many} →</span></li>})}</ul></main>}
