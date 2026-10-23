import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { selectNiche } from "./lib/niche";
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
  return products==="/rackets"?[...icons,...types]:[...icons,...types,{source:products,destination:"/rackets"},{source:`${products}/:path*`,destination:"/rackets/:path*"}];
 },
 async redirects(){
  const types=niche.typePages?.length?[{source:"/types/:slug",destination:"/:slug",permanent:true}]:[];
  // Renamed ranking lists: each former slug answers with a 301 to the current one (lib/niche/<niche>.ts formerSlugs).
  const rankings=(niche.topLists??[]).flatMap(l=>(l.formerSlugs??[]).map(old=>({source:`/rankings/${old}`,destination:`/rankings/${l.slug}`,statusCode:301 as const})));
  // Pages that moved to another Recs site: 301 to the absolute address there (lib/niche/<niche>.ts movedAway). Listed first
  // so they win over the generic /rackets and /types redirects.
  const moved=(niche.movedAway??[]).map(m=>({source:m.source,destination:m.destination,statusCode:301 as const,...(m.query?{has:[{type:"query" as const,key:m.query.key,value:m.query.value}]}:{})}));
  return products==="/rackets"?[...moved,...types,...rankings]:[...moved,...types,...rankings,{source:"/rackets",destination:products,permanent:true},{source:"/rackets/:slug",destination:`${products}/:slug`,permanent:true}];
 },
 turbopack:{root},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]},
 // Public pages look the same for everyone: Vercel's CDN may serve a copy up to a minute old and refresh it in the background.
 // Admin, sign-in and write endpoints are excluded, and client-side navigation payloads (RSC requests) are never cached.
 async headers(){
  const cdn=[{key:"Vercel-CDN-Cache-Control",value:"max-age=60, stale-while-revalidate=600"}];
  const missing=[{type:"header" as const,key:"rsc"}];
  return ["/",products,`${products}/:slug*`,...(products==="/rackets"?[]:["/rackets/:slug*"]),"/brands","/brands/:slug*","/about","/add-review","/rankings","/rankings/:slug*","/api/racket-search","/sitemap.xml",...(niche.typePages??[]).map(t=>`/${t.slug}`)].map(source=>({source,headers:cdn,missing}));
 }};
export default config;
