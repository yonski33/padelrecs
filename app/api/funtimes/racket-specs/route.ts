import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, rackets } from "../../../../db/schema";
import { changeRacketSlug } from "../../../../db/racket-slugs";
import { sql } from "drizzle-orm";
import { niche } from "../../../../lib/niche";
import { assertSchemaName } from "../../../../db/migrations";
import { traitDefsFor } from "../../../../lib/fit-config";
const TRAITS = traitDefsFor(niche).map(t => t.key);
import { readTraitOverride, editTraitOverride, MAX_TRAIT_TEXT } from "../../../../db/trait-override";
import { getCurrentUser } from "../../../../lib/supabase/auth";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
const optionalText=(max:number)=>z.string().trim().max(max).transform(value=>value||null);
const input=z.object({
 id:z.string().min(1).max(100),name:z.string().trim().min(1).max(260),brandId:z.string().min(1).max(100),year:z.coerce.number().int().min(1980).max(2100),
 shape:optionalText(100),weight:optionalText(120),balance:optionalText(120),surface:optionalText(200),core:optionalText(200),description:optionalText(5000),
 slug:z.string().trim().max(260).optional(),
 // Blank: the signal score is worked out from reviews. A number: shown and ranked instead (owner, 2026-11-12).
 signalOverride:z.union([z.literal("").transform(()=>null),z.coerce.number().int().min(1).max(99)]).optional().transform(v=>v??null)
});
export async function POST(request:Request) {
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let raw;try{raw=await readAdminForm(request);}catch{return adminRedirect(request,"tab=specs&result=spec-invalid");}
 const parsed=input.safeParse(raw);
 const selected=typeof raw.id==="string"?`&racket=${encodeURIComponent(raw.id.slice(0,100))}`:"";
 if(!parsed.success)return adminRedirect(request,`tab=specs${selected}&result=spec-invalid`);
 try {
  const db=await database(),{id,slug,...values}=parsed.data;
  // How it plays by hand (padel, migration 0022): per trait "" (auto) or 1–5 dots, and an optional line.
  const hasTraitFields=TRAITS.some(t=>`trait_${t}` in raw);
  const nextTraits=Object.fromEntries(TRAITS.map(t=>{const d=Number(raw[`trait_${t}`]),txt=String(raw[`traittext_${t}`]??"").trim().slice(0,MAX_TRAIT_TEXT);
   return [t,{...(Number.isInteger(d)&&d>=1&&d<=5?{dots:d}:{}),...(txt?{text:txt}:{})}];}));
  const [brand]=await db.select({id:brands.id}).from(brands).where(eq(brands.id,values.brandId));
  if(!brand)return adminRedirect(request,`tab=specs${selected}&result=spec-invalid`);
  // Update editable catalog fields and, if asked, the URL slug (the old one keeps redirecting). IDs, images, dates and reviews remain intact.
  let rejected="";
  const result=await db.transaction(async tx=>{
   const changed=await tx.update(rackets).set(values).where(eq(rackets.id,id)).returning({id:rackets.id});
   if(!changed.length)return "spec-missing";
   if(slug){
    const outcome=await changeRacketSlug(tx,id,slug);
    // Nothing is saved if the new URL can't be used.
    if(outcome==="taken"||outcome==="invalid"){rejected=outcome==="taken"?"spec-slug-taken":"spec-slug-invalid";tx.rollback();}
    if(outcome==="changed")return "spec-slug-changed";
   }
   return "spec-saved";
  }).catch(error=>{if(rejected)return rejected;throw error;});
  // Saved apart from the specs, so a niche without the column (migration 0022 not applied) still saves its details.
  if(hasTraitFields&&(result==="spec-saved"||result==="spec-slug-changed")){
   const table=sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`,wanted=Object.values(nextTraits).some(e=>Object.keys(e).length);
   try{
    const rows=await db.execute(sql`select trait_override from ${table} where id = ${id}`);
    const cur=readTraitOverride(((rows as unknown as {rows?:{trait_override:unknown}[]}).rows??(rows as unknown as {trait_override:unknown}[]))[0]?.trait_override);
    // Who changed what and when (owner): the admin's email, else their user id.
    const user=await getCurrentUser(),next=editTraitOverride(cur,nextTraits,user?.email??user?.id??"admin",new Date().toISOString());
    if(next.log.length!==cur.log.length)await db.execute(sql`update ${table} set trait_override = ${JSON.stringify(next)}::jsonb where id = ${id}`);
   }catch{if(wanted)return adminRedirect(request,`tab=specs${selected}&result=failed`);}
  }
  return adminRedirect(request,`tab=specs${selected}&result=${result}`);
 }catch{return adminRedirect(request,`tab=specs${selected}&result=failed`);}
}
