import { assertAuthTarget } from "./lib/deployment-target";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only these paths depend on who is signed in.
const PRIVATE = /^\/(?:admin|auth|api\/admin)(?:\/|$)/;

export async function proxy(request:NextRequest) {
 if(!PRIVATE.test(request.nextUrl.pathname)) {
  const response=NextResponse.next();
  // Public pages look the same for everyone: Vercel's CDN may serve a copy up to a minute old and refresh it in the background.
  // Client-side navigation payloads (RSC requests) are never cached.
  if((request.method==="GET"||request.method==="HEAD")&&!request.headers.has("rsc"))response.headers.set("Vercel-CDN-Cache-Control","max-age=60, stale-while-revalidate=600");
  return response;
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.next();
 assertAuthTarget(url,process.env.SUPABASE_PROJECT_REF);
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){
  values.forEach(({name,value})=>request.cookies.set(name,value));
  response=NextResponse.next({request});
  values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
 }}});
 await supabase.auth.getUser();
 response.headers.set("Cache-Control","private, no-store");
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
