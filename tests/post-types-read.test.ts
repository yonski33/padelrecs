import test from "node:test";
import assert from "node:assert/strict";
import { postTypes } from "../db/comments";

// The app's client is node-postgres, whose execute() answers { rows }; the scripts' postgres-js answers an array. Before
// this, postTypes treated { rows } as an array, threw, and quietly returned nothing: saved Tips showed no flair.
const fake = (result: unknown) => ({ execute: async () => result }) as unknown as Parameters<typeof postTypes>[0];
const rows = [{ id: "a", t: "tip" }, { id: "b", t: "question" }, { id: "c", t: "other" }];

test("post types are read from node-postgres ({ rows }) and postgres-js (array) results", async () => {
  assert.deepEqual([...(await postTypes(fake({ rows }), ["a", "b", "c"]))], [["a", "tip"], ["b", "question"]]);
  assert.deepEqual([...(await postTypes(fake(rows), ["a", "b", "c"]))], [["a", "tip"], ["b", "question"]]);
  assert.equal((await postTypes(fake({ rows }), [])).size, 0);
});
