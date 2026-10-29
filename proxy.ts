import { assertAuthTarget } from "./lib/deployment-target";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { niche } from "./lib/niche";
import type { Niche } from "./lib/niche/types";
import { productRedirect, productSlugIn } from "./lib/product-redirect";

// Only these paths depend on who is signed in. The admin area lives at /funtimes, not /admin (which is an ordinary 404).
const PRIVATE = /^\/(?:funtimes|auth|api\/funtimes)(?:\/|$)/;

/** categoryPaths niches (lib/niche): old product addresses (/tools/<slug>, /rackets/<slug>), former slugs and products filed
 *  under another type answer with a 301 to /<type slug>/<slug>. A real 301, which next.config redirects can't give here
 *  because the address depends on the product's shape, and permanentRedirect() in a page would answer 308. */
export async function productMove(request:NextRequest, niche:Niche, lookup:()=>Promise<Map<string,{slug:string;shape:string|null}>>) {
 const {pathname}=request.nextUrl;
 if(productSlugIn(niche,pathname)===null)return null;
 try {
  const products=await lookup();
  const target=productRedirect(niche,pathname,slug=>products.get(slug));
  if(!target)return null;
  const url=request.nextUrl.clone();url.pathname=target;
  return NextResponse.redirect(url,301);
 } catch(error) {
  // The page still renders (its canonical names the new address), so a lookup failure never takes a product page down.
  console.error("Product redirect lookup failed",error);
  return null;
 }
}

export async function proxy(request:NextRequest) {
 if(niche.categoryPaths){
  const moved=await productMove(request,niche,async()=>(await import("./lib/product-lookup")).productLookup());
  if(moved)return moved;
 }
 if(!PRIVATE.test(request.nextUrl.pathname)) {
  // Public pages need no session; their CDN caching is set in next.config.ts.
  return NextResponse.next();
 }
 // Never cached, never indexed. robots.txt does not mention the admin path, so this header is what keeps it out of search.
 const privateHeaders=(response:NextResponse)=>{response.headers.set("Cache-Control","private, no-store");response.headers.set("X-Robots-Tag","noindex, nofollow");return response;};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return privateHeaders(NextResponse.next());
 assertAuthTarget(url,process.env.SUPABASE_PROJECT_REF);
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){
  values.forEach(({name,value})=>request.cookies.set(name,value));
  response=NextResponse.next({request});
  values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
 }}});
 await supabase.auth.getUser();
 return privateHeaders(response);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
