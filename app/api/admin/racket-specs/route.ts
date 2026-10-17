import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { brands, rackets } from "../../../../db/schema";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../admin/auth";
const optionalText=(max:number)=>z.string().trim().max(max).transform(value=>value||null);
const input=z.object({
 id:z.string().min(1).max(100),name:z.string().trim().min(1).max(260),brandId:z.string().min(1).max(100),year:z.coerce.number().int().min(1980).max(2100),
 shape:optionalText(100),weight:optionalText(120),balance:optionalText(120),surface:optionalText(200),core:optionalText(200),description:optionalText(5000)
});
export async function POST(request:Request) {
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let raw;try{raw=await readAdminForm(request);}catch{return adminRedirect(request,"tab=specs&result=spec-invalid");}
 const parsed=input.safeParse(raw);
 const selected=typeof raw.id==="string"?`&racket=${encodeURIComponent(raw.id.slice(0,100))}`:"";
 if(!parsed.success)return adminRedirect(request,`tab=specs${selected}&result=spec-invalid`);
 try {
  const db=await database(),{id,...values}=parsed.data;
  const [brand]=await db.select({id:brands.id}).from(brands).where(eq(brands.id,values.brandId));
  if(!brand)return adminRedirect(request,`tab=specs${selected}&result=spec-invalid`);
  // Update only editable catalog fields. IDs, slugs, images, dates and reviews remain intact.
  const changed=await db.update(rackets).set(values).where(eq(rackets.id,id)).returning({id:rackets.id});
  return adminRedirect(request,`tab=specs${selected}&result=${changed.length?"spec-saved":"spec-missing"}`);
 }catch{return adminRedirect(request,`tab=specs${selected}&result=failed`);}
}
