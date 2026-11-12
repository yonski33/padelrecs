import {test} from "node:test";
import assert from "node:assert/strict";
import {fitText} from "../lib/fit-text";

test("adds sentences while they fit and cuts a too-long first one at a word",()=>{
 assert.equal(fitText(["One two.","Three four.","Five."],20),"One two. Three four.");
 assert.equal(fitText(["alpha beta gamma delta"],12),"alpha beta…");
});
