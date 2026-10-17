export const dynamic = "force-dynamic";
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string}>}) { const data=await catalog(), {racket}=await searchParams;return <main><div className="page-title"><h1>Add a review</h1><p className="muted">What’s it like on court? Help another player decide.</p></div><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={racket}/></main> }
