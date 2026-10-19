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
  return products==="/rackets"?[]:[{source:products,destination:"/rackets"},{source:`${products}/:path*`,destination:"/rackets/:path*"}];
 },
 async redirects(){
  return products==="/rackets"?[]:[{source:"/rackets",destination:products,permanent:true},{source:"/rackets/:slug",destination:`${products}/:slug`,permanent:true}];
 },
 turbopack:{root},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]},
 // Public pages look the same for everyone: Vercel's CDN may serve a copy up to a minute old and refresh it in the background.
 // Admin, sign-in and write endpoints are excluded, and client-side navigation payloads (RSC requests) are never cached.
 async headers(){
  const cdn=[{key:"Vercel-CDN-Cache-Control",value:"max-age=60, stale-while-revalidate=600"}];
  const missing=[{type:"header" as const,key:"rsc"}];
  return ["/",products,`${products}/:slug*`,...(products==="/rackets"?[]:["/rackets/:slug*"]),"/brands","/brands/:slug*","/about","/add-review","/api/racket-search","/sitemap.xml"].map(source=>({source,headers:cdn,missing}));
 }};
export default config;
