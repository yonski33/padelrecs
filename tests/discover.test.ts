import {test} from "node:test";
import assert from "node:assert/strict";
import {discoverPicks, weekOf} from "../lib/discover";

const pool=Array.from({length:30},(_,i)=>`p${i}`);
test("picks are stable for a page and week, differ between pages, and skip excluded ids",()=>{
 const a=discoverPicks(pool,new Set(["p0","p1"]),"page-a|1"), again=discoverPicks(pool,new Set(["p0","p1"]),"page-a|1"), b=discoverPicks(pool,new Set(),"page-b|1");
 assert.deepEqual(a,again); assert.notDeepEqual(a,b); assert.equal(a.length,5);
 assert(!a.includes("p0")&&!a.includes("p1"));
 // Only the better half of the pool is drawn from.
 assert(a.every(id=>Number(id.slice(1))<16));
});
test("a new week brings a new mix",()=>{
 assert.notDeepEqual(discoverPicks(pool,new Set(),"x|1"),discoverPicks(pool,new Set(),"x|2"));
 assert.equal(weekOf(new Date("2026-11-13T00:00:00Z")),weekOf(new Date("2026-11-15T00:00:00Z")));
});
