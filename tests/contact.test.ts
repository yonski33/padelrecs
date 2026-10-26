import {test} from "node:test";
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {migrationSql} from "../db/migrations";
import {contactMessages} from "../db/schema";
import type {getDb} from "../db/index";
import {contactInput, contactEmail, contactSpam, sendWithResend, CONTACT_FROM_ADDRESS, type ContactEmail} from "../lib/contact";
import {createContactHandler} from "../app/api/contact/handler";
import {issueFormToken} from "../lib/form-token";
import {niche} from "../lib/niche";

type Database=ReturnType<typeof getDb>;
async function setup(){
 const engine=new PGlite();
 for(const statement of migrationSql("padelrecs"))await engine.exec(statement);
 const db=drizzle(engine);
 return {engine,db,portable:db as unknown as Database};
}
const message={name:"Maria Lopez",email:"maria.lopez@example.com",subject:"Missing racket",message:"Could you add the Nox AT10 Luxury 2026? Happy to review it."};
let ipCounter=0;
function post(body:object,{origin,ip}:{origin?:string,ip?:string}={}){
 const headers:Record<string,string>={"content-type":"application/json","x-real-ip":ip||`203.0.113.${++ipCounter}`};
 if(origin)headers.origin=origin;
 return new Request("http://localhost:3000/api/contact",{method:"POST",headers,body:JSON.stringify(body)});
}
const formToken=()=>issueFormToken(Date.now()-60_000);
function recorder(fail?:string){
 const sent:{email:ContactEmail,apiKey:string}[]=[];
 return {sent,send:async(email:ContactEmail,apiKey:string)=>{if(fail)throw new Error(fail);sent.push({email,apiKey});return {id:"email-1"};}};
}
const env=()=>({apiKey:"re_test",to:"inbox@example.test"});

test("email names the site, comes from the redrecs.com sender and replies to the visitor",()=>{
 const value=contactInput.parse({...message,subject:"Missing\r\nBcc: someone@evil.test",name:"  Maria\nLopez "});
 assert.equal(value.subject,"Missing Bcc: someone@evil.test");
 assert.equal(value.name,"Maria Lopez");
 const email=contactEmail({name:"ClimbingRecs",domain:"climbingrecs.com"},"inbox@example.test, second@example.test",value);
 assert.equal(email.from,`ClimbingRecs Contact <${CONTACT_FROM_ADDRESS}>`);
 assert.equal(CONTACT_FROM_ADDRESS,"contact@redrecs.com");
 assert.deepEqual(email.to,["inbox@example.test","second@example.test"]);
 assert.equal(email.reply_to,"maria.lopez@example.com");
 assert.equal(email.subject,"[ClimbingRecs] Contact: Missing Bcc: someone@evil.test");
 assert.match(email.text,/From: Maria Lopez <maria\.lopez@example\.com>\nSite: climbingrecs\.com/);
 assert(email.text.endsWith(value.message));
});

test("input needs a name, a valid email, a subject and a 10-character message",()=>{
 assert.equal(contactInput.safeParse(message).success,true);
 for(const bad of [{name:" "},{email:"not-an-email"},{subject:""},{message:"short"},{message:"x".repeat(5001)},{subject:"x".repeat(151)}])
  assert.equal(contactInput.safeParse({...message,...bad}).success,false,JSON.stringify(bad).slice(0,40));
});

test("contact spam uses the review-form heuristics",()=>{
 assert.equal(contactSpam(contactInput.parse(message)).spam,false);
 assert.equal(contactSpam(contactInput.parse({name:"nKrXGtJeygseSSaQQhCNgOn",email:"po.b.o.j.ev.odo.b5.0@gmail.com",subject:"hi",message:"nsi4jhtFBuVsfLOS6YQz"})).spam,true);
});

test("Resend request carries the key as a bearer token and surfaces Resend's error",async()=>{
 const calls:{url:string,init:RequestInit}[]=[];
 const ok=(async(url:string,init:RequestInit)=>{calls.push({url,init});return Response.json({id:"abc"});}) as unknown as typeof fetch;
 const email=contactEmail(niche.site,"inbox@example.test",contactInput.parse(message));
 assert.deepEqual(await sendWithResend(email,"re_test",ok),{id:"abc"});
 assert.equal(calls[0].url,"https://api.resend.com/emails");
 assert.equal((calls[0].init.headers as Record<string,string>).Authorization,"Bearer re_test");
 assert.deepEqual(JSON.parse(calls[0].init.body as string),email);
 const refused=(async()=>Response.json({message:"The redrecs.com domain is not verified"},{status:403})) as unknown as typeof fetch;
 await assert.rejects(sendWithResend(email,"re_test",refused),/Resend 403: The redrecs.com domain is not verified/);
});

test("a message is saved, then emailed and marked sent",async()=>{
 const {engine,db,portable}=await setup();try{
  const mail=recorder(),POST=createContactHandler({database:async()=>portable,send:mail.send,env});
  const response=await POST(post({...message,formToken:formToken()}));
  assert.equal(response.status,201);
  assert.equal(mail.sent.length,1);
  assert.equal(mail.sent[0].apiKey,"re_test");
  assert.equal(mail.sent[0].email.subject,`[${niche.site.name}] Contact: Missing racket`);
  assert.equal(mail.sent[0].email.reply_to,message.email);
  const rows=await db.select().from(contactMessages);
  assert.equal(rows.length,1);assert.equal(rows[0].status,"sent");assert.equal(rows[0].message,message.message);
 }finally{await engine.close();}
});

test("a failed send or missing env vars keep the message saved as failed and still thank the visitor",async()=>{
 const {engine,db,portable}=await setup();try{
  let response=await createContactHandler({database:async()=>portable,send:recorder("Resend 500: down").send,env})(post({...message,formToken:formToken()}));
  assert.equal(response.status,201);
  response=await createContactHandler({database:async()=>portable,send:recorder().send,env:()=>({apiKey:"re_test"})})(post({...message,email:"other@example.com",formToken:formToken()}));
  assert.equal(response.status,201);
  const rows=(await db.select().from(contactMessages)).sort((a,b)=>a.email.localeCompare(b.email));
  assert.deepEqual(rows.map(r=>[r.email,r.status,r.error]),[
   ["maria.lopez@example.com","failed","Resend 500: down"],
   ["other@example.com","failed","Email not configured (CONTACT_TO missing)"],
  ]);
 }finally{await engine.close();}
});

test("the visitor sees an error only when the message was neither saved nor sent",async()=>{
 const broken=async()=>{throw new Error("database down");};
 const mail=recorder();
 assert.equal((await createContactHandler({database:broken,send:mail.send,env})(post({...message,formToken:formToken()}))).status,201);
 assert.equal(mail.sent.length,1);
 assert.equal((await createContactHandler({database:broken,send:recorder("down").send,env})(post({...message,formToken:formToken()}))).status,500);
});

test("honeypot, form token, origin, rate limits and spam content are stopped like the review form",async()=>{
 const {engine,db,portable}=await setup();try{
  const mail=recorder(),POST=createContactHandler({database:async()=>portable,send:mail.send,env});
  // Bots get the normal success answer but nothing is saved or sent.
  for(const body of [{...message,website:"http://spam.example",formToken:formToken()},{...message},{...message,formToken:issueFormToken(Date.now())},{...message,formToken:"forged.token.value"}])
   assert.equal((await POST(post(body))).status,201);
  assert.equal(mail.sent.length,0);assert.equal((await db.select().from(contactMessages)).length,0);
  assert.equal((await POST(post({...message,formToken:formToken()},{origin:"https://unrelated.example"}))).status,403);
  assert.equal((await POST(post({...message,message:"short",formToken:formToken()}))).status,400);
  // Three per IP in ten minutes.
  for(let i=0;i<4;i++)await POST(post({...message,email:`person${i}@example.com`,formToken:formToken()},{ip:"198.51.100.7"}));
  assert.equal(mail.sent.length,3);
  // Three per inbox a day, Gmail dots and +tags included.
  for(const email of ["jo.smith@gmail.com","josmith+a@gmail.com","j.o.smith@googlemail.com","jo.s.mith@gmail.com"])await POST(post({...message,email,formToken:formToken()}));
  assert.equal(mail.sent.length,6);
  // Spam content is kept for review but never emailed.
  assert.equal((await POST(post({name:"nKrXGtJeygseSSaQQhCNgOn",email:"bot@example.com",subject:"hello",message:"nsi4jhtFBuVsfLOS6YQz",formToken:formToken()}))).status,201);
  assert.equal(mail.sent.length,6);
  const spam=(await db.select().from(contactMessages)).filter(r=>r.status==="spam");
  assert.equal(spam.length,1);assert.match(spam[0].error||"",/random-text/);
 }finally{await engine.close();}
});
