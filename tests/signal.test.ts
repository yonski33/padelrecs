import {test} from "node:test";
import assert from "node:assert/strict";
import {signals, MIN_SIGNAL_REVIEWS, TOP_SIGNAL} from "../lib/signal";

const p=(id:string,category:string,positive:number,mixed:number,judged:number)=>({id,category,positive,mixed,judged});

test("the best-reviewed product in a category scores the top signal, the rest relative to it",()=>{
 const s=signals([p("a","x",60,0,64),p("b","x",14,0,15),p("c","x",30,10,60)]);
 assert.equal(s.get("a")!.signal,TOP_SIGNAL);
 assert.deepEqual([s.get("a")!.rank,s.get("b")!.rank,s.get("c")!.rank],[1,2,3]);
 // 14 of 15 (3.73) beats 30 positive + 10 mixed of 60 (3.46): being liked counts most.
 assert(s.get("b")!.signal>s.get("c")!.signal);
 assert.equal(s.get("a")!.of,3);
});

test("categories are scored apart, and too few reviews means no signal",()=>{
 const s=signals([p("a","x",50,0,60),p("b","y",10,0,12),p("c","y",5,0,MIN_SIGNAL_REVIEWS-1)]);
 assert.equal(s.get("b")!.signal,TOP_SIGNAL);
 assert.equal(s.get("b")!.of,1);
 assert.equal(s.has("c"),false);
});

test("mixed reviews count half",()=>{
 const s=signals([p("all-pos","x",20,0,40),p("half-mixed","x",10,20,40)]);
 assert.equal(s.get("all-pos")!.signal,s.get("half-mixed")!.signal);
});
