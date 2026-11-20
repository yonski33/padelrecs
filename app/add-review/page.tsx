export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche, productHref, isV2 } from "../../lib/niche";
// A form, not a page to land on from search (audit 2026-11-15, #17).
export const metadata: Metadata = { ...niche.seo.addReview, alternates: { canonical: "/add-review" }, robots: { index: false, follow: true } };
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
import AddReviewV2 from "./add-v2";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { addV2Props } from "./v2-props";
import "./add-v2.css";
import { productVariants } from "../../lib/variants";
// ?racket=<id> comes from a product page's own button; ?from=<path> from the header's, chosen only when the path is a product page.
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string,from?:string,rating?:string,classic?:string}>}) { const data=await catalog(), {racket,from,rating,classic}=await searchParams;
 // PadelRecs: the design-v2 page (owner 2026-11-15). ?classic=1 keeps the full form (a racket that isn't listed yet).
 if(isV2&&!classic){
  return <><main className={`ar ${qtFontVars}`}><AddReviewV2 {...addV2Props(data,racket,from)}/></main><V2Footer/></>;
 }
 // ?rating=1–5 comes from a product page's "tap a ball" thank-you: 4–5 starts the form on positive, 3 on mixed, 1–2 on negative.
 const balls=Number(rating), initialRating=balls>=4&&balls<=5?"5":balls===3?"3":balls>=1&&balls<=2?"1":undefined;
 const initialRacket=racket??(from?data.rackets.find(r=>productHref(r)===from)?.id:undefined);
 return <main><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name,slug:r.slug,shape:r.shape,brand:data.brands.find(b=>b.id===r.brandId)?.name,
  // Niches with variants (DiscGolfRecs plastics): the product's list for the optional picker; absent when it has none.
  ...(niche.variants&&productVariants(r.core).length?{variants:productVariants(r.core)}:{})}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={initialRacket} initialRating={initialRating}/></main> }
