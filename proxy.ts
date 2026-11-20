import { assertAuthTarget } from "./lib/deployment-target";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";
import { niche } from "./lib/niche";
import type { Niche } from "./lib/niche/types";
import { productRedirect, productSlugIn } from "./lib/product-redirect";
import { isV2 } from "./lib/niche";
import { attrProfileFor } from "./lib/attr-profile";
import { readChoice, choiceKey, readChoiceKey, homeHref, OTHER_HOME_PARAMS } from "./lib/quick-match";
import { viewKey, readViewKey, viewQuery, CATALOG_VIEW, RANKING_VIEW, RACKET_VIEW, SKIN_HOME_VIEW, SKIN_CATALOG_VIEW, SKIN_PRODUCT_VIEW, SKIN_RANKING_VIEW } from "./lib/view-key";
import { catalogPath } from "./lib/niche";
import { specGroups } from "./lib/guide";
import { threadPath, threadSite, THREAD_LOOK, THREAD_DEFAULT, CLASSIC_LOOK } from "./lib/thread/look";
// The catalogue's cached views also hold the niche's spec filters (its guide config: padel balance and face).
const CATALOG_Q = [...CATALOG_VIEW, ...specGroups(niche.guide).map(g => g.key)];

// Only these paths depend on who is signed in (/account: PadelRecs players' optional accounts). The admin area lives at /funtimes, not /admin (which is an ordinary 404).
const PRIVATE = /^\/(?:funtimes|auth|account|api\/funtimes|api\/account)(?:\/|$)/;

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

const TYPE_SLUGS=new Set((niche.typePages??[]).map(t=>t.slug));
/** SkinRecs: an address with a simple query → its cached view (app/v/…); a direct visit to /v/… → its address (301). */
export function skinView(request:NextRequest) {
 const {pathname,searchParams}=request.nextUrl;
 const to=(path:string)=>{const url=request.nextUrl.clone();url.pathname=path;url.search="";return NextResponse.rewrite(url);};
 const back=(path:string,q:Record<string,string>|null)=>{const url=request.nextUrl.clone();url.pathname=path;url.search=q?viewQuery(q):"";return NextResponse.redirect(url,301);};
 const key=(allowed:readonly string[],path:(k:string)=>string)=>{const k=viewKey(searchParams,allowed);return k?to(path(k)):null;};
 const seg=pathname.split("/").slice(1);
 if(pathname==="/")return key(SKIN_HOME_VIEW,k=>`/v/home/${k}`);
 if(pathname===catalogPath)return key(SKIN_CATALOG_VIEW,k=>`/v/rackets/${k}`);
 if(seg.length===1&&TYPE_SLUGS.has(seg[0]))return key(SKIN_CATALOG_VIEW,k=>`/v/type/${seg[0]}/${k}`);
 if(seg.length===2&&/^[a-z0-9-]+$/.test(seg[1])&&(niche.categoryPaths?TYPE_SLUGS.has(seg[0]):`/${seg[0]}`===catalogPath))return key(SKIN_PRODUCT_VIEW,k=>`/v/racket/${seg[1]}/${k}`);
 if(seg.length===2&&seg[0]==="brands"&&/^[a-z0-9-]+$/.test(seg[1]))return key(SKIN_CATALOG_VIEW,k=>`/v/brand/${seg[1]}/${k}`);
 if(seg.length===2&&seg[0]==="rankings"&&/^[a-z0-9-]+$/.test(seg[1]))return key(SKIN_RANKING_VIEW,k=>`/v/rankings/${seg[1]}/${k}`);
 if(seg[0]==="v"){
  const [,kind,a,b]=seg;
  if(kind==="home"&&a&&!b)return back("/",readViewKey(a,SKIN_HOME_VIEW));
  if(kind==="rackets"&&a&&!b)return back(catalogPath,readViewKey(a,SKIN_CATALOG_VIEW));
  if(kind==="type"&&a&&b&&TYPE_SLUGS.has(a))return back(`/${a}`,readViewKey(b,SKIN_CATALOG_VIEW));
  if(kind==="brand"&&a&&b)return back(`/brands/${a}`,readViewKey(b,SKIN_CATALOG_VIEW));
  if(kind==="rankings"&&a&&b)return back(`/rankings/${a}`,null);
  // A product's address needs its type: its old address answers with a 301 to it (productMove), picks kept.
  if(kind==="racket"&&a&&b)return back(`/rackets/${a}`,readViewKey(b,SKIN_PRODUCT_VIEW));
  return back(catalogPath,null);
 }
 return null;
}

/** PadelRecs' Thread look (lib/thread/look.ts): by default (THREAD_DEFAULT) every address with a Thread page is served by it
 *  (app/thread/…); ?look=thread does the same in preview mode. ?look=classic is handled in proxy() below. */
export function threadView(request:NextRequest) {
 if(!threadSite(niche.id))return null;
 const look=request.nextUrl.searchParams.get("look");
 if(look===CLASSIC_LOOK||(!THREAD_DEFAULT&&look!==THREAD_LOOK))return null;
 const to=threadPath(request.nextUrl.pathname,catalogPath,niche.id);
 if(!to)return null;
 const url=request.nextUrl.clone();url.pathname=to;url.search="";
 return NextResponse.rewrite(url);
}

export async function proxy(request:NextRequest) {
 const thread=threadView(request);
 if(thread)return thread;
 // Rollback look while Thread is the default: ?look=classic runs the live routing on the address without the query, so it
 // gets exactly today's pages and their cached views (not the older "classic" look the pages themselves know).
 if(THREAD_DEFAULT&&threadSite(niche.id)&&request.nextUrl.searchParams.get("look")===CLASSIC_LOOK){
  const url=request.nextUrl.clone();url.searchParams.delete("look");
  const res=await liveProxy(new NextRequest(url,request));
  return res.headers.get("x-middleware-next")==="1"&&!PRIVATE.test(url.pathname)?NextResponse.rewrite(url):res;
 }
 return liveProxy(request);
}

async function liveProxy(request:NextRequest) {
 if(niche.categoryPaths){
  const moved=await productMove(request,niche,async()=>(await import("./lib/product-lookup")).productLookup());
  if(moved)return moved;
 }
 // The quick-match home (batch D): "/" and its picks are served from one cached page per combination (app/quick/[key]).
 // Other home views (?home=, ?type=, ?feed=, ?q=) stay with app/page.tsx. /quick/<key> itself is only ever a rewrite target.
 // SkinRecs (an attribute profile, lib/attr-profile.ts) has its own quick match on app/page.tsx (app/skin/home-skin.tsx).
 if(isV2&&niche.finder&&!attrProfileFor(niche)){
  const {pathname,searchParams}=request.nextUrl;
  if(pathname==="/"&&!OTHER_HOME_PARAMS.some(k=>searchParams.has(k))){
   const url=request.nextUrl.clone();
   url.pathname=`/quick/${choiceKey(readChoice(Object.fromEntries(searchParams)),searchParams.get("older")==="1")}`;url.search="";
   return NextResponse.rewrite(url);
  }
  if(pathname.startsWith("/quick/")){
   const k=readChoiceKey(pathname.slice(7));
   const url=request.nextUrl.clone();url.pathname="/";url.search=k?homeHref(k.choice,k.older).replace(/^\/\??/,""):"";
   return NextResponse.redirect(url,301);
  }
 }
 // The catalogue, the rankings and the racket pages (speed batch): an address with a simple query is served from one cached
 // page per view (app/v/…, lib/view-key.ts); anything else renders per request as before. /v/… is only ever a rewrite target.
 // SkinRecs (an attribute profile) has its own views, keyed on its own picks and filters (owner 2026-11-16: "SkinRecs has the
 // same slowness padel had"; padel's views 500'd there, #374): the home, /products, each type and brand page, each product
 // page and each ranking. The pages render the skin designs; filters and picks then work in the browser (app/instant-view.ts).
 if(isV2&&attrProfileFor(niche)){
  const skin=skinView(request);
  if(skin)return skin;
 }
 if(isV2&&niche.finder&&!attrProfileFor(niche)){
  const {pathname,searchParams}=request.nextUrl;
  const to=(path:string)=>{const url=request.nextUrl.clone();url.pathname=path;url.search="";return NextResponse.rewrite(url);};
  const ranking=/^\/rankings\/([a-z0-9-]+)$/.exec(pathname),seg=pathname.split("/").slice(1);
  // A categoryPaths site (SimRacingRecs) has its product pages under the type page (/wheelbases/<slug>), not the catalogue.
  const racket=niche.categoryPaths?(seg.length===2&&TYPE_SLUGS.has(seg[0])?/^([a-z0-9-]+)$/.exec(seg[1]):null)
   :pathname.startsWith(`${catalogPath}/`)?/^([a-z0-9-]+)$/.exec(pathname.slice(catalogPath.length+1)):null;
  if(pathname===catalogPath){const k=viewKey(searchParams,CATALOG_Q);if(k)return to(`/v/rackets/${k}`);}
  else if(ranking){const k=viewKey(searchParams,RANKING_VIEW);if(k)return to(`/v/rankings/${ranking[1]}/${k}`);}
  else if(racket){const k=viewKey(searchParams,RACKET_VIEW);if(k)return to(`/v/racket/${racket[1]}/${k}`);}
  else if(pathname.startsWith("/v/")){
   const m=/^\/v\/(?:(rackets)\/([^/]+)|(rankings)\/([a-z0-9-]+)\/([^/]+)|(racket)\/([a-z0-9-]+)\/([^/]+))$/.exec(pathname);
   const back=(path:string,q:Record<string,string>|null)=>{const url=request.nextUrl.clone();url.pathname=path;url.search=q?viewQuery(q):"";return NextResponse.redirect(url,301);};
   if(m?.[1])return back(catalogPath,readViewKey(m[2],CATALOG_Q));
   if(m?.[3])return back(`/rankings/${m[4]}`,readViewKey(m[5],RANKING_VIEW));
   if(m?.[6])return back(`${catalogPath}/${m[7]}`,readViewKey(m[8],RACKET_VIEW));
  }
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
