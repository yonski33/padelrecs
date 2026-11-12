import {test} from "node:test";
import assert from "node:assert/strict";
import {signals, signalCeiling, MIN_SIGNAL_REVIEWS, NEGATIVE_WEIGHT, MIXED_WEIGHT} from "../lib/signal";

const p=(id:string,category:string,positive:number,mixed:number,judged:number)=>({id,category,positive,mixed,judged});

test("the best-reviewed product leads, its score held down by its own negative and mixed reviews",()=>{
 const s=signals([p("a","x",60,0,64),p("b","x",14,0,15),p("c","x",30,10,60)]);
 // 4 of 64 negative (6.25%): 100 - 0.4 × 6.25 = 97.5, rounded 98.
 assert.equal(s.get("a")!.signal,98);
 assert.deepEqual([s.get("a")!.rank,s.get("b")!.rank,s.get("c")!.rank],[1,2,3]);
 // 14 of 15 (3.73) beats 30 positive + 10 mixed of 60 (3.46): being liked counts most.
 assert(s.get("b")!.signal>s.get("c")!.signal);
 assert.equal(s.get("a")!.of,3);
});

test("categories are scored apart, and too few reviews means no signal",()=>{
 const s=signals([p("a","x",50,0,60),p("b","y",10,0,12),p("c","y",5,0,MIN_SIGNAL_REVIEWS-1)]);
 assert.equal(s.get("b")!.signal,Math.round(signalCeiling(10,0,12)));
 assert.equal(signalCeiling(49,20,79),100-NEGATIVE_WEIGHT*100*10/79-MIXED_WEIGHT*100*20/79);
 assert.equal(s.get("b")!.of,1);
 assert.equal(s.has("c"),false);
});

test("a mixed review costs less than a negative one",()=>{
 const s=signals([p("neg","x",30,0,40),p("mix","x",30,10,40)]);
 assert(s.get("mix")!.signal>s.get("neg")!.signal);
});

test("a score set by hand replaces the worked-out one and takes its place in the order",()=>{
 const s=signals([{...p("a","x",60,0,64)},{...p("b","x",10,0,20),override:99},{...p("c","x",1,0,2),override:40}]);
 assert.equal(s.get("b")!.signal,99); assert.equal(s.get("b")!.rank,1); assert.equal(s.get("b")!.set,true);
 assert.equal(s.get("c")!.signal,40);
 assert.equal(s.get("a")!.set,undefined);
});
