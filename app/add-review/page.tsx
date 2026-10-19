export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
export const metadata: Metadata = { ...niche.seo.addReview, alternates: { canonical: "/add-review" } };
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string}>}) { const data=await catalog(), {racket}=await searchParams;return <main><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name,slug:r.slug,shape:r.shape,brand:data.brands.find(b=>b.id===r.brandId)?.name}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={racket}/></main> }
