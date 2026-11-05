import { test } from "node:test";
import assert from "node:assert/strict";
import { similarProducts, tagProfiles } from "../lib/similar";

const says = (racketId: string, tags: string[], times = 1) => Array.from({ length: times }, () => ({ racketId, tags }));
const profiles = tagProfiles([
  ...says("attack", ["easy power", "head-heavy"], 5),
  ...says("attack2", ["easy power", "head-heavy"], 3),
  ...says("control", ["good control", "arm-friendly"], 5),
  ...says("square", ["easy power", "head-heavy"], 4),
]);

test("similar means reviewers say the same things, not that both have no shape on file", () => {
  const found = similarProducts({ id: "attack", shape: null }, [{ id: "control", shape: null }, { id: "attack2", shape: null }], profiles);
  assert.deepEqual(found.map(x => x.id), ["attack2"]);
});

test("a known shape still counts, and nothing is padded in", () => {
  const found = similarProducts({ id: "attack", shape: "Diamond" }, [{ id: "square", shape: "Round" }, { id: "attack2", shape: "Diamond" }, { id: "control", shape: "Diamond" }], profiles);
  assert.deepEqual(found.map(x => x.id), ["attack2"]);
  assert.deepEqual(similarProducts({ id: "new" }, [{ id: "attack" }], profiles), []);
});
