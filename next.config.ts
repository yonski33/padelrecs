import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { selectNiche } from "./lib/niche/all";
const root=fileURLToPath(new URL(".",import.meta.url));
// Which Recs site this deployment is (lib/niche); an unknown NICHE fails the build here.
const niche=selectNiche(process.env.NICHE);
const products=`/${niche.productPath}`;
const config:NextConfig={
 // Inlined at build time so server and browser code agree.
 env:{NICHE:niche.id},
 // The catalogue pages live in app/rackets. A niche with another product word (PickleballRecs: /paddles) serves them there,
 // and plain /rackets addresses redirect. Generated share images keep their /rackets/<slug>/opengraph-image address.
 async rewrites(){
  // Browsers ask for /favicon.ico on their own, and older pages linked /icon.svg and /apple-icon.png: answer with the niche's.
  const icons=["favicon.ico","icon.svg","apple-icon.png"].map(file=>({source:`/${file}`,destination:`/niches/${niche.id}/${file}`}));
  // Type browse pages (SkinRecs /cleansers…) live in app/types/[slug]; only the configured slugs are mapped, so nothing else is caught.
  const types=(niche.typePages??[]).map(t=>({source:`/${t.slug}`,destination:`/types/${t.slug}`}));
  // categoryPaths niches serve product pages (and their share images) under the type page: /vpns/mullvad-vpn → app/rackets/[slug].
  // :path+ needs a segment, so /vpns itself stays the type page above. proxy.ts answers the old addresses with a 301.
  const categories=niche.categoryPaths?(niche.typePages??[]).map(t=>({source:`/${t.slug}/:path+`,destination:"/rackets/:path+"})):[];
  return products==="/rackets"?[...icons,...types,...categories]:[...icons,...types,...categories,{source:products,destination:"/rackets"},{source:`${products}/:path*`,destination:"/rackets/:path*"}];
 },
 async redirects(){
  const types=niche.typePages?.length?[{source:"/types/:slug",destination:"/:slug",permanent:true}]:[];
  // Renamed ranking lists: each former slug answers with a 301 to the current one (lib/niche/<niche>.ts formerSlugs).
  const rankings=(niche.topLists??[]).flatMap(l=>(l.formerSlugs??[]).map(old=>({source:`/rankings/${old}`,destination:`/rankings/${l.slug}`,statusCode:301 as const})));
  // A "last season" list's slug carries its model year (best-padel-rackets-{year}) and moves on each January: the three
  // years before it 301 to this year's page.
  const seasons=(niche.topLists??[]).filter(l=>l.modelYearsBack!==undefined&&l.slug.includes("{year}")).flatMap(l=>{
   const year=new Date().getUTCFullYear()-l.modelYearsBack!;
   return [1,2,3].map(n=>({source:`/rankings/${l.slug.replaceAll("{year}",String(year-n))}`,destination:`/rankings/${l.slug.replaceAll("{year}",String(year))}`,statusCode:301 as const}));
  });
  // Pages that moved to another Recs site: 301 to the absolute address there (lib/niche/<niche>.ts movedAway). Listed first
  // so they win over the generic /rackets and /types redirects.
  const moved=(niche.movedAway??[]).map(m=>({source:m.source,destination:m.destination,statusCode:301 as const,...(m.query?{has:[{type:"query" as const,key:m.query.key,value:m.query.value}]}:{})}));
  // "/product" (singular) 404'd on SkinRecs (owner 2026-11-16): the catalogue's singular, and a product under it, go to the catalogue.
  const singular=products.endsWith("s")&&products!=="/rackets"?[{source:products.slice(0,-1),destination:products,permanent:true},{source:`${products.slice(0,-1)}/:slug`,destination:`${products}/:slug`,permanent:true}]:[];
  return products==="/rackets"?[...moved,...types,...rankings,...seasons]:[...moved,...types,...rankings,...seasons,...singular,{source:"/rackets",destination:products,permanent:true},
   // categoryPaths niches: the product's new address depends on its shape (a database value), so proxy.ts sends that 301.
   ...(niche.categoryPaths?[]:[{source:"/rackets/:slug",destination:`${products}/:slug`,permanent:true}])];
 },
 // Only the running site's config goes into the build (lib/niche/index.ts): "@/lib/niche/selected" becomes lib/niche/<id>.ts.
 turbopack:{root,resolveAlias:{"@/lib/niche/selected":`./lib/niche/${niche.id}.ts`}},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]},
 // Public pages look the same for everyone: Vercel's CDN may serve a copy up to a minute old and refresh it in the background.
 // Admin, sign-in and write endpoints are excluded, and client-side navigation payloads (RSC requests) are never cached.
 async headers(){
  const cdn=[{key:"Vercel-CDN-Cache-Control",value:"max-age=60, stale-while-revalidate=600"}];
  const missing=[{type:"header" as const,key:"rsc"}];
  // Product photos (public/photos) rarely change and keep their file name when they do: a week in browsers and the CDN,
  // then a day served stale while it refreshes (audit 2026-11-15, #10: they were max-age=0).
  const photos={source:"/photos/:path*",headers:[{key:"Cache-Control",value:"public, max-age=604800, stale-while-revalidate=86400"}]};
  return [photos,...["/",products,`${products}/:slug*`,...(products==="/rackets"?[]:["/rackets/:slug*"]),"/brands","/brands/:slug*","/about","/contact","/reviews","/how-we-make-these",...(niche.amazon?["/affiliate-disclosure"]:[]),"/add-review","/rankings","/rankings/:slug*","/compare","/compare/:pair*","/api/racket-search","/sitemap.xml",...(niche.typePages??[]).flatMap(t=>niche.categoryPaths?[`/${t.slug}`,`/${t.slug}/:slug*`]:[`/${t.slug}`])].map(source=>({source,headers:cdn,missing}))];
 }};
export default config;
