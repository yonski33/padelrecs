import {test} from "node:test";
import assert from "node:assert/strict";
import {signals, signalCeiling, MIN_SIGNAL_REVIEWS, NEGATIVE_WEIGHT, MIXED_WEIGHT} from "../lib/signal";

const p=(id:string,category:string,positive:number,mixed:number,judged:number)=>({id,category,positive,mixed,judged});
// A site with a spread of review counts, so "well reviewed" means something.
const site=(extra:(ReturnType<typeof p>&{override?:number})[])=>[...Array.from({length:20},(_,i)=>p(`filler${i}`,"road",Math.round((20+i*7)*0.7),Math.round((20+i*7)*0.15),20+i*7)),...extra];

test("a handful of all-positive reviews can't beat a product many people like (owner, RunningRecs 2026-11-12)",()=>{
 const s=signals(site([p("thin","trail",16,0,16),p("popular","road",130,15,150)]));
 assert(s.get("popular")!.signal>s.get("thin")!.signal, `${s.get("popular")!.signal} vs ${s.get("thin")!.signal}`);
});

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

test("each category's best scores in the 90s and the next ones step down, even when their reviews are close (owner, 2026-11-13)",()=>{
 const close=Array.from({length:8},(_,i)=>p(`m${i}`,"moist",80-i,8,100));
 const s=signals(site([...close,p("weak1","vps",40,20,80),p("weak2","vps",38,20,80)]));
 const m=close.map(x=>s.get(x.id)!.signal);
 assert(m[0]>=92,`leader ${m[0]}`);
 for(let i=1;i<m.length;i++) assert(m[i]<m[i-1],`${m.join(" ")}`);
 // A category whose products are all weaker still has its best near the top: scores are against its own kind.
 assert(s.get("weak1")!.signal>=88,`vps leader ${s.get("weak1")!.signal}`);
 assert(s.get("weak1")!.signal>s.get("weak2")!.signal);
});

test("more positive reviews usually rank higher, even with a slightly lower share (owner, 2026-11-13)",()=>{
 const s=signals(site([p("many","road",300,60,520),p("few","road",90,15,130)]));
 assert(s.get("many")!.signal>s.get("few")!.signal,`${s.get("many")!.signal} vs ${s.get("few")!.signal}`);
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
