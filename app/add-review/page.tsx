export const dynamic = "force-dynamic";
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string}>}) { const data=await catalog(), {racket}=await searchParams;return <main><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name,slug:r.slug}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={racket}/></main> }
