import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { selectNiche } from "./lib/niche";
const root=fileURLToPath(new URL(".",import.meta.url));
// Which Recs site this deployment is (lib/niche); an unknown NICHE fails the build here.
const niche=selectNiche(process.env.NICHE);
const products=`/${niche.productPath}`;
// Query parameters that change what the home, catalogue and type pages show (see rewrites).
const filteredPages=[
 {source:"/",keys:["source","type","show"],destination:"/filtered"},
 {source:products,keys:["q","brand","year","shape","sort"],destination:"/filtered/catalog"},
 ...(niche.typePages??[]).map(t=>({source:`/${t.slug}`,keys:["brand","sort"],destination:`/filtered/types/${t.slug}`})),
];
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
  const afterFiles=products==="/rackets"?[...icons,...types]:[...icons,...types,{source:products,destination:"/rackets"},{source:`${products}/:path*`,destination:"/rackets/:path*"}];
  // The plain home, catalogue and type pages are static (lib/revalidate.ts). Their filtered and sorted versions read the
  // query, so they are rewritten to dynamic twins in app/filtered (the query travels along). Other parameters, such as
  // ?utm_source=, still get the cached page. Product pages read their ?source=/?sort= in the browser instead.
  const beforeFiles=filteredPages.flatMap(({source,keys,destination})=>keys.map(key=>({source,has:[{type:"query" as const,key}],destination})));
  return {beforeFiles,afterFiles,fallback:[]};
 },
 async redirects(){
  const types=niche.typePages?.length?[{source:"/types/:slug",destination:"/:slug",permanent:true}]:[];
  return products==="/rackets"?types:[...types,{source:"/rackets",destination:products,permanent:true},{source:"/rackets/:slug",destination:`${products}/:slug`,permanent:true}];
 },
 turbopack:{root},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]},
 // Static pages carry their own cache headers (ISR) and are refreshed on demand, so nothing is added to them here.
 // The dynamic, filtered versions and the add-review form and its product list look the same for everyone: Vercel's CDN
 // may serve a copy up to a minute old and refresh it in the background. Client-side navigation payloads (RSC requests) are never cached.
 async headers(){
  const cdn=[{key:"Vercel-CDN-Cache-Control",value:"max-age=60, stale-while-revalidate=600"}];
  const missing=[{type:"header" as const,key:"rsc"}];
  const filtered=filteredPages.flatMap(({source,keys})=>keys.map(key=>({source,has:[{type:"query" as const,key}],headers:cdn,missing})));
  return [...filtered,...["/add-review","/api/racket-search"].map(source=>({source,headers:cdn,missing}))];
 }};
export default config;
