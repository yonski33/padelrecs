export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche, productHref, isV2, v2copy } from "../../lib/niche";
// A form, not a page to land on from search (audit 2026-11-15, #17).
export const metadata: Metadata = { ...niche.seo.addReview, alternates: { canonical: "/add-review" }, robots: { index: false, follow: true } };
import { catalog } from "../../db/data";
import ReviewForm from "./review-form";
import AddReviewV2 from "./add-v2";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { displayName } from "../../lib/brand-name";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import "./add-v2.css";
import { productVariants } from "../../lib/variants";
// ?racket=<id> comes from a product page's own button; ?from=<path> from the header's, chosen only when the path is a product page.
export default async function AddReview({searchParams}:{searchParams:Promise<{racket?:string,from?:string,rating?:string,classic?:string}>}) { const data=await catalog(), {racket,from,rating,classic}=await searchParams;
 // PadelRecs: the design-v2 page (owner 2026-11-15). ?classic=1 keeps the full form (a racket that isn't listed yet).
 if(isV2&&!classic){
  const startId=racket??(from?data.rackets.find(r=>productHref(r)===from)?.id:undefined);
  const opts=(o:{value:string,hint?:string,display?:string}[]|undefined,word?:(v:string)=>string)=>(o??[]).map(x=>({value:x.value,label:word?word(x.value):x.value.toLowerCase()}));
  const p=niche.profile;
  return <><main className={`ar ${qtFontVars}`}><AddReviewV2 rackets={data.listed.map(r=>({id:r.id,name:displayName(r.name,data.brands.find(b=>b.id===r.brandId)?.name),photo:photoHidden(r)?null:shopPhoto(r)??amazonPhoto(r)?.image??null,href:productHref(r)})).sort((a,b)=>a.name.localeCompare(b.name))}
   initial={startId} levels={opts(p.playerLevel?.options.filter(o=>o.value!=="Competitive"))} sides={opts(p.playingSide?.options,v2copy.rate?undefined:v=>v==="Both"?"both":`${v.toLowerCase()} side`)}
   times={(p.timeWithRacket?.options??[]).map(o=>({value:o.value,label:(o as {hint?:string}).hint?.toLowerCase()??o.value.toLowerCase()}))}
   // Sites with their own rating words (niche.v2copy.rate): their categories, prompts and row words; padel keeps its own.
   {...(v2copy.rate?{traits:niche.categories.map(c=>[c.label,c.column,...(v2copy.rate![c.column]??["poor","great"])] as const),prompts:v2copy.prompts,
    labels:{level:`my ${(p.playerLevel?.label??"level").toLowerCase()}`,side:(p.playingSide?.label??"I play").toLowerCase(),how:`How does it ${v2copy.use==="works"?"work":"play"}?`,who:`similar ${niche.people.many}`}}:{})}/></main><V2Footer/></>;
 }
 // ?rating=1–5 comes from a product page's "tap a ball" thank-you: 4–5 starts the form on positive, 3 on mixed, 1–2 on negative.
 const balls=Number(rating), initialRating=balls>=4&&balls<=5?"5":balls===3?"3":balls>=1&&balls<=2?"1":undefined;
 const initialRacket=racket??(from?data.rackets.find(r=>productHref(r)===from)?.id:undefined);
 return <main><ReviewForm rackets={data.rackets.map(r=>({id:r.id,name:r.name,slug:r.slug,shape:r.shape,brand:data.brands.find(b=>b.id===r.brandId)?.name,
  // Niches with variants (DiscGolfRecs plastics): the product's list for the optional picker; absent when it has none.
  ...(niche.variants&&productVariants(r.core).length?{variants:productVariants(r.core)}:{})}))} brands={data.brands.map(b=>({name:b.name}))} initialRacket={initialRacket} initialRating={initialRating}/></main> }
