import {test} from "node:test";
import assert from "node:assert/strict";
import {collectDigest, digestEmail, sendDigest, type DigestReview} from "../lib/review-digest";
import {niches} from "../lib/niche";
import type {ContactEmail} from "../lib/contact";

const review:DigestReview={id:"rev 1",rating:4,reviewText:"Sticky rubber, a bit stiff for the first week.",alias:"Maria",email:"maria@example.com",status:"pending",createdAt:"2026-11-02T10:00:00Z",product:{name:"La Sportiva Skwama",slug:"la-sportiva-skwama",shape:null},newProduct:false};
const day=new Date("2026-11-02T14:00:00Z");

test("digest groups reviews by site with moderation, product and edit links",()=>{
 const email=digestEmail("inbox@example.test, second@example.test",[{niche:niches.climbing,reviews:[review,{...review,id:"rev2",alias:null,email:null,newProduct:true}]},{niche:niches.padel,reviews:[]}],day)!;
 assert.equal(email.from,"Recs Reviews <contact@redrecs.com>");
 assert.deepEqual(email.to,["inbox@example.test","second@example.test"]);
 assert.equal(email.subject,"[Recs] 2 new reviews on 1 site — 2 Nov");
 assert(email.text.startsWith("2 new reviews in the last 24 hours on 1 site."));
 assert(email.text.includes("== ClimbingRecs (2) — approve or reject: https://www.climbingrecs.com/funtimes?status=pending"));
 assert(email.text.includes("La Sportiva Skwama: 4/5 by Maria <maria@example.com> [pending]"));
 assert(email.text.includes("La Sportiva Skwama: 4/5 by anonymous [pending]"));
 assert(email.text.includes("Edit: https://www.climbingrecs.com/funtimes/edit-review?type=player&id=rev%201"));
 assert.match(email.text,/New product added with this review/);
 assert(!email.text.includes("PadelRecs"));
});

test("no reviews and no failures means no email; a failed site is reported",()=>{
 assert.equal(digestEmail("inbox@example.test",[{niche:niches.padel,reviews:[]}],day),null);
 const email=digestEmail("inbox@example.test",[{niche:niches.padel,error:"relation does not exist"}],day)!;
 assert.equal(email.subject,"[Recs] Review digest could not read 1 site — 2 Nov");
 assert(email.text.includes("Could not read: PadelRecs (relation does not exist)"));
});

test("collect reads every niche's schema and keeps going past a failure",async()=>{
 const asked:string[]=[];
 const sites=await collectDigest(async schema=>{asked.push(schema);if(schema===niches.golf.schema)throw new Error("down");return schema===niches.climbing.schema?[review]:[];},"2026-11-01T14:00:00Z",[niches.climbing,niches.golf,niches.padel]);
 assert.deepEqual(asked,[niches.climbing.schema,niches.golf.schema,niches.padel.schema]);
 assert.equal(sites.filter(s=>"error" in s).length,1);
});

test("send uses the contact env, skips without it and sends nothing on a quiet day",async()=>{
 const sent:ContactEmail[]=[];
 const send=async(email:ContactEmail)=>{sent.push(email);};
 const env=()=>({apiKey:"re_test",to:"inbox@example.test"});
 assert.equal((await sendDigest(async()=>[],day,{send,env})).status,"empty");
 assert.equal((await sendDigest(async()=>[review],day,{send,env:()=>({apiKey:"re_test"})})).status,"skipped");
 const one=async(schema:string)=>schema===niches.climbing.schema?[review]:[];
 assert.equal((await sendDigest(one,day,{send,env})).status,"sent");
 assert.equal(sent.length,1);assert.equal(sent[0].subject,"[Recs] 1 new review on 1 site — 2 Nov");
});
