import {test} from "node:test";
import assert from "node:assert/strict";
import {siteOrigin} from "../lib/site-url";
import {POST} from "../app/api/reviews/route";
import {issueFormToken} from "../lib/form-token";

test("custom-domain and Vercel forms pass the origin guard; foreign sites stay blocked",async()=>{
 const old={site:process.env.SITE_URL,allowed:process.env.SITE_ALLOWED_ORIGINS};
 process.env.SITE_URL="https://www.padelrecs.com";
 process.env.SITE_ALLOWED_ORIGINS="https://padelrecs.vercel.app";
 try{
  for(const origin of ["https://www.padelrecs.com","https://padelrecs.vercel.app"]){
   assert.equal(siteOrigin(`${origin}/auth/callback`),origin);
   // A payload with only a valid form token reaches validation without making any database write.
   const response=await POST(new Request(`${origin}/api/reviews`,{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({formToken:issueFormToken(Date.now()-60_000)})}));
   assert.equal(response.status,400);
  }
  const evil="https://www.padelrecs.com.example.org";
  assert.equal(siteOrigin(`${evil}/auth/callback`),"https://www.padelrecs.com");
  for(const origin of [evil,"null","https://unrelated.example"]){
   const response=await POST(new Request("https://www.padelrecs.com/api/reviews",{method:"POST",headers:{origin,"content-type":"application/json"},body:"{}"}));
   assert.equal(response.status,403);
  }
 }finally{
  if(old.site===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=old.site;
  if(old.allowed===undefined)delete process.env.SITE_ALLOWED_ORIGINS;else process.env.SITE_ALLOWED_ORIGINS=old.allowed;
 }
});
