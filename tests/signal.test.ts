import {test} from "node:test";
import assert from "node:assert/strict";
import {signals, signalCeiling, MIN_SIGNAL_REVIEWS, NEGATIVE_WEIGHT, MIXED_WEIGHT} from "../lib/signal";

const p=(id:string,category:string,positive:number,mixed:number,judged:number)=>({id,category,positive,mixed,judged});
// A site with a spread of review counts, so "well reviewed" means something.
const site=(extra:(ReturnType<typeof p>&{override?:number})[])=>[...Array.from({length:20},(_,i)=>p(`filler${i}`,"road",Math.round((20+i*7)*0.7),Math.round((20+i*7)*0.15),20+i*7)),...extra];


test("with the same volume, fewer negative and mixed reviews score higher",()=>{
 const s=signals(site([p("loved","road",90,5,100),p("split","road",60,20,100)]));
 assert(s.get("loved")!.signal>s.get("split")!.signal);
});

test("the ceiling takes NEGATIVE_WEIGHT points per % negative and MIXED_WEIGHT per % mixed",()=>{
 assert.equal(signalCeiling(0.1,0.2),100-NEGATIVE_WEIGHT*10-MIXED_WEIGHT*20);
});

test("rank follows the number within a category; too few reviews means no signal",()=>{
 const s=signals(site([p("a","x",50,5,60),p("b","x",20,2,25),p("c","x",3,0,MIN_SIGNAL_REVIEWS-1)]));
 assert.equal(s.get("a")!.rank,1); assert.equal(s.get("b")!.rank,2); assert.equal(s.get("a")!.of,2);
 assert.equal(s.has("c"),false);
 assert(s.get("a")!.signal<=99);
});

test("a score set by hand replaces the worked-out one and takes its place in the order",()=>{
 const s=signals(site([p("a","x",60,0,64),{...p("b","x",10,0,20),override:99},{...p("c","x",1,0,2),override:40}]));
 assert.equal(s.get("b")!.signal,99); assert.equal(s.get("b")!.rank,1); assert.equal(s.get("b")!.set,true);
 assert.equal(s.get("c")!.signal,40);
 assert.equal(s.get("a")!.set,undefined);
});



test("a mostly negative product doesn't top its category on volume alone",()=>{
 const s=signals(site([p("liked","road",150,20,200),p("panned","road",100,40,380)]));
 assert(s.get("liked")!.signal>s.get("panned")!.signal);
});

test("a widely reviewed product with mostly negative reviews gets a failing score, whatever its category (owner, MoneyRecs 2026-11-14)",()=>{
 const s=signals(site([p("loved","tax",453,75,554),p("hated","tax",46,13,303),p("small","tax",9,9,26)]));
 assert(s.get("hated")!.signal<=35, `${s.get("hated")!.signal}`);
 assert(s.get("loved")!.signal>s.get("small")!.signal);
});

test("the score is how happy owners are, never how many reviews (owner 2026-11-17: Prism Flash vs Jelly Bean 2)",()=>{
 const s=signals(site([p("popular","x",104,38,165),p("loved","x",23,0,24)]));
 assert(s.get("loved")!.signal>s.get("popular")!.signal,`${s.get("loved")!.signal} vs ${s.get("popular")!.signal}`);
 // Same happiness, ten times the reviews: the same number (a point either way from the smoothing).
 const t=signals(site([p("big","y",800,100,1000),p("small","y",80,10,100)]));
 assert(Math.abs(t.get("big")!.signal-t.get("small")!.signal)<=1,`${t.get("big")!.signal} vs ${t.get("small")!.signal}`);
});

test("a small sample is pulled toward the site average, so 16 of 16 positive isn't a perfect score",()=>{
 const s=signals(site([p("thin","trail",16,0,16)]));
 assert(s.get("thin")!.signal<97,`${s.get("thin")!.signal}`);
});

test("on a tie the better-reviewed product ranks first",()=>{
 const s=signals(site([p("many","z",160,20,200),p("few","z",16,2,20)]));
 if(s.get("many")!.signal===s.get("few")!.signal) assert.equal(s.get("many")!.rank,1);
});
