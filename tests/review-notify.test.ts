import {test} from "node:test";
import assert from "node:assert/strict";
import {reviewEmail, notifyNewReview, type NewReview} from "../lib/review-notify";
import type {ContactEmail} from "../lib/contact";
import {POST} from "../app/api/reviews/route";
import {issueFormToken} from "../lib/form-token";

const site={name:"ClimbingRecs",domain:"climbingrecs.com"};
const review:NewReview={id:"rev 1",rating:4,reviewText:"Sticky rubber, a bit stiff for the first week. Great on slab.",alias:"Maria",email:"maria@example.com",product:{name:"La Sportiva Skwama",slug:"la-sportiva-skwama"},newProduct:false};

test("review email names the site and product, carries the rating and links to the page and the queue",()=>{
 const email=reviewEmail(site,"inbox@example.test, second@example.test","https://www.climbingrecs.com","/shoes",review);
 assert.equal(email.from,"ClimbingRecs Reviews <contact@redrecs.com>");
 assert.deepEqual(email.to,["inbox@example.test","second@example.test"]);
 assert.equal(email.subject,"[ClimbingRecs] New review: La Sportiva Skwama (4/5)");
 assert.equal(email.reply_to,"maria@example.com");
 assert.match(email.text,/^Maria <maria@example\.com> reviewed La Sportiva Skwama on climbingrecs\.com: 4\/5\./);
 assert(email.text.includes(review.reviewText));
 assert(email.text.includes("Product page: https://www.climbingrecs.com/shoes/la-sportiva-skwama"));
 assert(email.text.includes("Approve or reject: https://www.climbingrecs.com/funtimes?status=pending"));
 assert(email.text.includes("Edit this review: https://www.climbingrecs.com/funtimes/edit-review?type=player&id=rev%201"));
 assert(!email.text.includes("new product"));
});

test("anonymous reviews have no Reply-To; a new product is flagged; header text stays on one line",()=>{
 const email=reviewEmail(site,"inbox@example.test","https://x.test","/rackets",{...review,alias:null,email:null,newProduct:true,product:{name:"Odd\r\nBcc: evil@example.test",slug:"odd"}});
 assert.equal(email.reply_to,undefined);
 assert.equal(email.subject,"[ClimbingRecs] New review: Odd Bcc: evil@example.test (4/5)");
 assert.match(email.text,/^anonymous reviewed/);
 assert.match(email.text,/new product added with the review/);
});

test("notification is sent with the contact form's env, skipped without it, and never throws",async()=>{
 const sent:{email:ContactEmail,apiKey:string}[]=[];
 const send=async(email:ContactEmail,apiKey:string)=>{sent.push({email,apiKey});};
 assert.equal(await notifyNewReview(site,"https://x.test","/rackets",review,{send,env:()=>({apiKey:"re_test",to:"inbox@example.test"})}),"sent");
 assert.equal(sent.length,1);assert.equal(sent[0].apiKey,"re_test");
 assert.equal(await notifyNewReview(site,"https://x.test","/rackets",review,{send,env:()=>({apiKey:"re_test"})}),"skipped");
 assert.equal(await notifyNewReview(site,"https://x.test","/rackets",review,{send:async()=>{throw new Error("Resend 500: down");},env:()=>({apiKey:"re_test",to:"inbox@example.test"})}),"failed");
 assert.equal(sent.length,1);
});

test("submissions stopped by the spam checks never send an email",async()=>{
 const old={fetch:globalThis.fetch,key:process.env.RESEND_API_KEY,to:process.env.CONTACT_TO};
 const calls:string[]=[];
 globalThis.fetch=(async(url:string)=>{calls.push(String(url));return Response.json({});}) as unknown as typeof fetch;
 process.env.RESEND_API_KEY="re_test";process.env.CONTACT_TO="inbox@example.test";
 try{
  const post=(body:object,ip:string)=>POST(new Request("http://localhost:3000/api/reviews",{method:"POST",headers:{"content-type":"application/json","x-real-ip":ip},body:JSON.stringify(body)}));
  const formToken=issueFormToken(Date.now()-60_000);
  const bodies=[
   {racketId:"r1",rating:5,reviewText:"A perfectly normal review of this product.",website:"http://spam.example",formToken},
   {racketId:"r1",rating:5,reviewText:"A perfectly normal review of this product."},
   {racketId:"r1",rating:5,reviewText:"nsi4jhtFBuVsfLOS6YQz nsi4jhtFBuVsfLOS6YQz",alias:"nKrXGtJeygseSSaQQhCNgOn",email:"po.b.o.j.ev.odo.b5.0@gmail.com",formToken},
  ];
  for(const [i,body] of bodies.entries())assert.equal((await post(body,`192.0.2.${i+1}`)).status,201);
  assert.deepEqual(calls,[]);
 }finally{
  globalThis.fetch=old.fetch;
  if(old.key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=old.key;
  if(old.to===undefined)delete process.env.CONTACT_TO;else process.env.CONTACT_TO=old.to;
 }
});
