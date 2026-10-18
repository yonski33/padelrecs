import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL(".",import.meta.url));
const config:NextConfig={turbopack:{root},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]},
 // Public pages look the same for everyone: Vercel's CDN may serve a copy up to a minute old and refresh it in the background.
 // Admin, sign-in and write endpoints are excluded, and client-side navigation payloads (RSC requests) are never cached.
 async headers(){
  const cdn=[{key:"Vercel-CDN-Cache-Control",value:"max-age=60, stale-while-revalidate=600"}];
  const missing=[{type:"header" as const,key:"rsc"}];
  return ["/","/rackets","/rackets/:slug*","/brands","/brands/:slug*","/about","/add-review","/api/racket-search","/sitemap.xml"].map(source=>({source,headers:cdn,missing}));
 }};
export default config;
