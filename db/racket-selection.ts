import { z } from "zod";
import { eq } from "drizzle-orm";
import type { getDb } from "./index";
import { brands, rackets } from "./schema";
import { slugify } from "../lib/slug";
import { hasYears } from "../lib/niche";
export { slugify };
const normalizedName=(max:number)=>z.string().trim().min(1).max(max).transform(s=>s.replace(/\s+/g," ")).refine(s=>slugify(s).length>0);
export const racketSelection=z.discriminatedUnion("racketMode",[
 z.object({racketMode:z.literal("existing"),racketId:z.string().min(1)}),
 z.object({racketMode:z.literal("new"),brandName:normalizedName(100),modelName:normalizedName(150),year:hasYears?z.coerce.number().int().min(1980).max(2100):z.coerce.number().int().min(1980).max(2100).optional()})
]);
type Database=ReturnType<typeof getDb>;
export type CatalogTransaction=Parameters<Parameters<Database["transaction"]>[0]>[0];
type NewRacket=Extract<z.infer<typeof racketSelection>,{racketMode:"new"}>;
export async function ensureRacket(tx:CatalogTransaction,value:NewRacket,createdAt:string) {
 const brandSlug=slugify(value.brandName);
 await tx.insert(brands).values({id:crypto.randomUUID(),name:value.brandName,slug:brandSlug}).onConflictDoNothing({target:brands.slug});
 const [brand]=await tx.select().from(brands).where(eq(brands.slug,brandSlug));
 if(!brand)throw new Error("Brand could not be saved");
 // Niches without model years (skincare) keep the year out of the name; the column holds the year it was added.
 const year=value.year??new Date(createdAt).getUTCFullYear();
 const name=hasYears?`${brand.name} ${value.modelName} ${year}`:`${brand.name} ${value.modelName}`,slug=slugify(name);
 await tx.insert(rackets).values({id:crypto.randomUUID(),brandId:brand.id,name,slug,year,createdAt}).onConflictDoNothing({target:rackets.slug});
 const [racket]=await tx.select({id:rackets.id}).from(rackets).where(eq(rackets.slug,slug));
 if(!racket)throw new Error("Racket could not be saved");
 return racket.id;
}
