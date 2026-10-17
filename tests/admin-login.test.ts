import {test} from "node:test";
import assert from "node:assert/strict";
import {signInAdminWithPassword} from "../lib/admin-login";
import {POST} from "../app/auth/login/route";

test("password sign-in grants access only to a verified, allowlisted user",async()=>{
 let signedOut=0;
 const auth={signInWithPassword:async()=>({data:{user:{id:"owner"}},error:null}),signOut:async(options:{scope:"local"})=>{assert.equal(options.scope,"local");signedOut++;}};
 assert.equal(await signInAdminWithPassword(auth,"owner@example.test","test-password","owner"),"success");
 auth.signInWithPassword=async()=>({data:{user:{id:"other"}},error:null});
 assert.equal(await signInAdminWithPassword(auth,"other@example.test","test-password","owner"),"invalid");
 assert.equal(signedOut,1);
});
test("invalid credentials and provider throttling never grant access",async()=>{
 let status=400;
 const auth={signInWithPassword:async()=>({data:{user:null},error:{status}}),signOut:async()=>{throw new Error("No new session to sign out");}};
 assert.equal(await signInAdminWithPassword(auth,"owner@example.test","wrong-password","owner"),"invalid");
 status=429;
 assert.equal(await signInAdminWithPassword(auth,"owner@example.test","test-password","owner"),"rate-limited");
});
test("password login rejects cross-site forms before authentication",async()=>{
 const response=await POST(new Request("https://www.padelrecs.com/auth/login",{method:"POST",headers:{origin:"https://unrelated.example","content-type":"application/x-www-form-urlencoded"},body:"method=password&email=owner%40example.test&password=test-password"}));
 assert.equal(response.status,403);
});
