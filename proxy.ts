import { assertAuthTarget } from "./lib/deployment-target";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only these paths depend on who is signed in. The admin area lives at /funtimes, not /admin (which is an ordinary 404).
const PRIVATE = /^\/(?:funtimes|auth|api\/funtimes)(?:\/|$)/;

export async function proxy(request:NextRequest) {
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
