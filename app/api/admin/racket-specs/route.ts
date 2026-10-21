import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, rackets } from "../../../../db/schema";
import { changeRacketSlug } from "../../../../db/racket-slugs";
import { revalidateSite } from "../../../../lib/revalidate";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../admin/auth";
const optionalText=(max:number)=>z.string().trim().max(max).transform(value=>value||null);
const input=z.object({
 id:z.string().min(1).max(100),name:z.string().trim().min(1).max(260),brandId:z.string().min(1).max(100),year:z.coerce.number().int().min(1980).max(2100),
 shape:optionalText(100),weight:optionalText(120),balance:optionalText(120),surface:optionalText(200),core:optionalText(200),description:optionalText(5000),
 slug:z.string().trim().max(260).optional()
});
export async function POST(request:Request) {
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let raw;try{raw=await readAdminForm(request);}catch{return adminRedirect(request,"tab=specs&result=spec-invalid");}
 const parsed=input.safeParse(raw);
 const selected=typeof raw.id==="string"?`&racket=${encodeURIComponent(raw.id.slice(0,100))}`:"";
 if(!parsed.success)return adminRedirect(request,`tab=specs${selected}&result=spec-invalid`);
 try {
  const db=await database(),{id,slug,...values}=parsed.data;
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
  if(result==="spec-saved"||result==="spec-slug-changed")revalidateSite();
  return adminRedirect(request,`tab=specs${selected}&result=${result}`);
 }catch{return adminRedirect(request,`tab=specs${selected}&result=failed`);}
}
