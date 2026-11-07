export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche, productHref } from "../../lib/niche";
export const metadata: Metadata = { ...niche.seo.addReview, alternates: { canonical: "/add-review" } };
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
import { productVariants } from "../../lib/variants";
// ?racket=<id> comes from a product page's own button; ?from=<path> from the header's, chosen only when the path is a product page.
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string,from?:string}>}) { const data=await catalog(), {racket,from}=await searchParams;
 const initialRacket=racket??(from?data.rackets.find(r=>productHref(r)===from)?.id:undefined);
 return <main><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name,slug:r.slug,shape:r.shape,brand:data.brands.find(b=>b.id===r.brandId)?.name,
  // Niches with variants (DiscGolfRecs plastics): the product's list for the optional picker; absent when it has none.
  ...(niche.variants&&productVariants(r.core).length?{variants:productVariants(r.core)}:{})}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={initialRacket}/></main> }
