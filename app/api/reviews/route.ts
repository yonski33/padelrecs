import { siteOrigin } from "../../../lib/site-url";
import { niche } from "../../../lib/niche";
import { z } from "zod";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { database } from "../../../db/data";
import { racketSelection, ensureRacket } from "../../../db/racket-selection";
import { variantInput, reviewVariant } from "../../../db/review-variant";
import { reviews, rackets } from "../../../db/schema";
import { tagsInput } from "../../../lib/tags";
import { profileChoice } from "../../../lib/review-options";
import { issueFormToken, checkFormToken, reviewEditToken, checkReviewEdit } from "../../../lib/form-token";
import { spamScore, normalizeEmail } from "../../../lib/review-spam";
import { clientIp, createLimiter } from "../../../lib/rate-limit";
const rating=z.coerce.number().int().min(1).max(5);
const optionalRating=z.preprocess(v=>v===""||v===null?undefined:v,rating.optional());
const input=z.object({
 rating,
 powerRating:optionalRating,controlRating:optionalRating,maneuverabilityRating:optionalRating,comfortRating:optionalRating,forgivenessRating:optionalRating,
 playerLevel:profileChoice("playerLevel").optional(),playingSide:profileChoice("playingSide").optional(),playingStyle:profileChoice("playingStyle").optional(),timeWithRacket:profileChoice("timeWithRacket").optional(),
 reviewText:z.string().trim().min(20),tags:tagsInput,alias:z.string().trim().max(50).optional(),email:z.union([z.literal(""),z.string().trim().email().max(254)]).optional(),
 // Niches with variants (DiscGolfRecs: the plastic): stored only when it is one of the chosen product's variants (reviewVariant).
 variant:variantInput
}).and(racketSelection);
const noStore={"Cache-Control":"no-store"};
type Valid=z.infer<typeof input>;
const reviewRow=(value:Valid,status:"pending"|"rejected",variant:string|null=null)=>({id:crypto.randomUUID(),rating:value.rating,powerRating:value.powerRating,controlRating:value.controlRating,maneuverabilityRating:value.maneuverabilityRating,comfortRating:value.comfortRating,forgivenessRating:value.forgivenessRating,playerLevel:value.playerLevel,playingSide:value.playingSide,playingStyle:value.playingStyle,timeWithRacket:value.timeWithRacket,reviewText:value.reviewText,tags:value.tags,email:value.email||null,alias:value.alias||null,variant,status,createdAt:new Date().toISOString()});
// Spam is answered exactly like a saved review, so a bot learns nothing from the response; only the server log says why.
// Every accepted answer carries an id and edit token (the one-tap card adds details to it). Dropped and rejected posts get
// one too, so the answer looks the same; their details just never land, since only pending reviews take them.
const accepted=(id:string=crypto.randomUUID())=>Response.json({status:"pending",id,edit:reviewEditToken(id)},{status:201,headers:noStore});
function dropped(reason:string){console.warn(`Review dropped (${reason})`);return accepted();}
// A flagged submission that is still a valid review of a listed product is kept as "rejected", so the owner sees it in the
// admin area and can approve a false positive. New products are never created for it, and a failed save is only logged.
async function rejected(reason:string,value:Valid){
 console.warn(`Review rejected (${reason})`);
 if(value.racketMode==="existing")try{
  const db=await database();
  const [racket]=await db.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
  if(racket){const row=reviewRow(value,"rejected",await reviewVariant(db,niche,racket.id,value.variant));await db.insert(reviews).values({...row,racketId:racket.id});return accepted(row.id);}
 }catch(error){console.error("Rejected review save failed",error);}
 return accepted();
}
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
 const honeypot=typeof body.website==="string"&&!!body.website.trim();
 const token=checkFormToken(body.formToken);
 // Floods are dropped outright: keeping every one would only fill the table.
 const ip=clientIp(request);
 if(!perIpBurst.hit(ip)||!perIpDay.hit(ip))return dropped("ip-rate-limit");
 const parsed=input.safeParse({racketMode:"existing",...body});
 if(!parsed.success)return honeypot||token!=="ok"?dropped(honeypot?"honeypot":`form-token-${token}`):Response.json({error:`Check the ${niche.words.one} details (brand, model and year for a new ${niche.words.one}), rating, email, and review text (at least 20 characters).`},{status:400});
 if(honeypot)return rejected("honeypot",parsed.data);
 if(token!=="ok")return rejected(`form-token-${token}`,parsed.data);
 const spam=spamScore(parsed.data);if(spam.spam)return rejected(`content: ${spam.reasons.join(", ")}`,parsed.data);
 try {
  const db=await database(),value=parsed.data;
  if(value.email){
   // Gmail ignores dots and +tags, so compare normalised inboxes rather than the typed address.
   const since=new Date(Date.now()-24*60*60_000).toISOString(),inbox=normalizeEmail(value.email);
   const recent=await db.select({email:reviews.email}).from(reviews).where(and(isNotNull(reviews.email),gte(reviews.createdAt,since)));
   if(recent.filter(r=>r.email&&normalizeEmail(r.email)===inbox).length>=EMAIL_DAILY_LIMIT)return rejected("email-rate-limit",value);
  }
  const review=reviewRow(value,"pending");
  if(value.racketMode==="existing") {
   const [racket]=await db.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return Response.json({error:`Choose a listed ${niche.words.one} or select New ${niche.words.one}.`},{status:400});
   await db.insert(reviews).values({...review,racketId:racket.id,variant:await reviewVariant(db,niche,racket.id,value.variant)});
  } else {
   await db.transaction(async tx=>{
    const racketId=await ensureRacket(tx,value,review.createdAt);
    await tx.insert(reviews).values({...review,racketId});
   });
  }
  // New reviews reach the owner in the daily digest (lib/review-digest.ts), not one email each.
  return accepted(review.id);
 }catch(error){console.error("Review save failed",error);return Response.json({error:"Could not save the review. Please try again."},{status:500});}
}
// The one-tap card's optional details, added one tap at a time to the review it just posted. Only the fields below, only
// while the review is still pending and less than an hour old, and only with the edit token the post returned.
const EDIT_WINDOW_MS=60*60_000;
const details=z.object({id:z.string().min(1).max(100),edit:z.string().min(1).max(200),
 playerLevel:profileChoice("playerLevel").optional(),playingSide:profileChoice("playingSide").optional(),playingStyle:profileChoice("playingStyle").optional(),timeWithRacket:profileChoice("timeWithRacket").optional(),
 tags:tagsInput.optional()});
export async function PATCH(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==siteOrigin(request.url))return Response.json({error:"Please submit from the site."},{status:403});
 let parsed;try{parsed=details.safeParse(await request.json());}catch{return Response.json({error:"Invalid details."},{status:400});}
 if(!parsed.success||!checkReviewEdit(parsed.data.id,parsed.data.edit))return Response.json({error:"Invalid details."},{status:400});
 const {id,edit:_edit,...fields}=parsed.data;void _edit;
 const set=Object.fromEntries(Object.entries(fields).filter(([,v])=>v!==undefined));
 if(!Object.keys(set).length)return new Response(null,{status:204,headers:noStore});
 try{
  const db=await database(),since=new Date(Date.now()-EDIT_WINDOW_MS).toISOString();
  await db.update(reviews).set(set).where(and(eq(reviews.id,id),eq(reviews.status,"pending"),gte(reviews.createdAt,since)));
  return new Response(null,{status:204,headers:noStore});
 }catch(error){console.error("Review details failed",error);return Response.json({error:"Could not save that."},{status:500});}
}
export const dynamic="force-dynamic";
