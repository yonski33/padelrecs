import { siteOrigin } from "../../../lib/site-url";
import { niche, productHref } from "../../../lib/niche";
import { after } from "next/server";
import { z } from "zod";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { database } from "../../../db/data";
import { racketSelection, ensureRacket } from "../../../db/racket-selection";
import { reviews, rackets } from "../../../db/schema";
import { tagsInput } from "../../../lib/tags";
import { profileChoice } from "../../../lib/review-options";
import { issueFormToken, checkFormToken } from "../../../lib/form-token";
import { spamScore, normalizeEmail } from "../../../lib/review-spam";
import { clientIp, createLimiter } from "../../../lib/rate-limit";
import { notifyNewReview } from "../../../lib/review-notify";
const rating=z.coerce.number().int().min(1).max(5);
const optionalRating=z.preprocess(v=>v===""||v===null?undefined:v,rating.optional());
const input=z.object({
 rating,
 powerRating:optionalRating,controlRating:optionalRating,maneuverabilityRating:optionalRating,comfortRating:optionalRating,forgivenessRating:optionalRating,
 playerLevel:profileChoice("playerLevel").optional(),playingSide:profileChoice("playingSide").optional(),playingStyle:profileChoice("playingStyle").optional(),timeWithRacket:profileChoice("timeWithRacket").optional(),
 reviewText:z.string().trim().min(20),tags:tagsInput,alias:z.string().trim().max(50).optional(),email:z.union([z.literal(""),z.string().trim().email().max(254)]).optional()
}).and(racketSelection);
const noStore={"Cache-Control":"no-store"};
// Spam is answered exactly like a saved review, so a bot learns nothing from the response; only the server log says why.
const accepted=()=>Response.json({status:"pending"},{status:201,headers:noStore});
function dropped(reason:string){console.warn(`Review dropped (${reason})`);return accepted();}
// Per server instance (lib/rate-limit.ts): a person posts a handful of reviews at most.
const perIpBurst=createLimiter({limit:5,windowMs:10*60_000}),perIpDay=createLimiter({limit:20,windowMs:24*60*60_000});
const EMAIL_DAILY_LIMIT=3;

// The form fetches this when it opens; see lib/form-token.ts.
export function GET(){return Response.json({token:issueFormToken()},{headers:noStore});}

export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==siteOrigin(request.url))return Response.json({error:"Please submit from the review form."},{status:403});
 let body;try{const raw=await request.text();body=JSON.parse(raw);}catch{return Response.json({error:"Invalid review submission."},{status:400});}
 if(!body||typeof body!=="object")return Response.json({error:"Invalid review submission."},{status:400});
 // Honeypot: the "website" field is hidden from people (review-form.tsx), so only a bot fills it.
 if(typeof body.website==="string"&&body.website.trim())return dropped("honeypot");
 const token=checkFormToken(body.formToken);if(token!=="ok")return dropped(`form-token-${token}`);
 const ip=clientIp(request);
 if(!perIpBurst.hit(ip)||!perIpDay.hit(ip))return dropped("ip-rate-limit");
 const parsed=input.safeParse({racketMode:"existing",...body});if(!parsed.success)return Response.json({error:`Check the ${niche.words.one} details (brand, model and year for a new ${niche.words.one}), rating, email, and review text (at least 20 characters).`},{status:400});
 const spam=spamScore(parsed.data);if(spam.spam)return dropped(`content: ${spam.reasons.join(", ")}`);
 try {
  const db=await database(),value=parsed.data;
  let product:{name:string,slug:string,shape:string|null,isNew?:boolean};
  if(value.email){
   // Gmail ignores dots and +tags, so compare normalised inboxes rather than the typed address.
   const since=new Date(Date.now()-24*60*60_000).toISOString(),inbox=normalizeEmail(value.email);
   const recent=await db.select({email:reviews.email}).from(reviews).where(and(isNotNull(reviews.email),gte(reviews.createdAt,since)));
   if(recent.filter(r=>r.email&&normalizeEmail(r.email)===inbox).length>=EMAIL_DAILY_LIMIT)return dropped("email-rate-limit");
  }
  const review={id:crypto.randomUUID(),rating:value.rating,powerRating:value.powerRating,controlRating:value.controlRating,maneuverabilityRating:value.maneuverabilityRating,comfortRating:value.comfortRating,forgivenessRating:value.forgivenessRating,playerLevel:value.playerLevel,playingSide:value.playingSide,playingStyle:value.playingStyle,timeWithRacket:value.timeWithRacket,reviewText:value.reviewText,tags:value.tags,email:value.email||null,alias:value.alias||null,status:"pending" as const,createdAt:new Date().toISOString()};
  if(value.racketMode==="existing") {
   const [racket]=await db.select({id:rackets.id,name:rackets.name,slug:rackets.slug,shape:rackets.shape}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return Response.json({error:`Choose a listed ${niche.words.one} or select New ${niche.words.one}.`},{status:400});
   await db.insert(reviews).values({...review,racketId:racket.id});
   product={name:racket.name,slug:racket.slug,shape:racket.shape};
  } else {
   product=await db.transaction(async tx=>{
    const racketId=await ensureRacket(tx,value,review.createdAt);
    await tx.insert(reviews).values({...review,racketId});
    const [racket]=await tx.select({name:rackets.name,slug:rackets.slug,shape:rackets.shape,createdAt:rackets.createdAt}).from(rackets).where(eq(rackets.id,racketId));
    return {name:racket.name,slug:racket.slug,shape:racket.shape,isNew:racket.createdAt===review.createdAt};
   });
  }
  // Emails the owner (lib/review-notify.ts) once the response is sent; reached only by saved reviews that passed every
  // spam check above, and a failed send is only logged.
  const origin=siteOrigin(request.url),saved={id:review.id,rating:review.rating,reviewText:review.reviewText,alias:review.alias,email:review.email,product:{name:product.name,slug:product.slug,shape:product.shape},newProduct:!!product.isNew};
  after(()=>notifyNewReview(niche.site,origin,productHref,saved));
  return accepted();
 }catch(error){console.error("Review save failed",error);return Response.json({error:"Could not save the review. Please try again."},{status:500});}
}
export const dynamic="force-dynamic";
