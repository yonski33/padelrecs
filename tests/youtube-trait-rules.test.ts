import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyTraitNote } from "../lib/youtube-trait-rules";

const get = (k: string, t: string) => Object.fromEntries(classifyTraitNote(k, t));

test("YouTube notes become trait mentions, negations first", () => {
  assert.equal(get("zone-net", "Preferred for blocks: the ball does not fly to the glass.").control, 1);
  assert.equal(get("zone-overhead", "More controllable on víbora and bandeja, with more range before the ball goes to the glass.").control, 1);
  assert.equal(get("zone-overhead", "Easier for aggressive víbora but you gain ball output and lose control.").control, -1);
  assert.equal(get("zone-defence", "Feels safer for chiquitas and angles.").defence, 1);
  assert.equal(get("arm", "Needs a very well-trained arm; the weight tired the arm, though it did not vibrate.").arm, -1);
  assert.equal(get("arm", "Feels a bit more arm friendly than the 12K versions.").arm, 1);
  assert.equal(get("catch", "Sweet spot is not wide.").forgiveness, -1);
  assert.equal(get("style", "Power comes very easily with little effort.").power, 1);
  assert.deepEqual(classifyTraitNote("level", "For advanced players."), []);
});
