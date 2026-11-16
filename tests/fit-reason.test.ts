import { describe, expect, it } from "vitest";
import { butLevel, clause, fitReason, type ReasonItem } from "../lib/fit-reason";

const yes: ReasonItem[] = [
  { title: "Forgives your mishits", t: "The sweet spot covers most of the face, so ==mishits still go deep==.", for: ["beginner", "intermediate"] },
  { title: "Easy in defence", t: "Lobs, chiquitas and low balls from the back feel ==safe under pressure==.", for: ["control"] },
];
const no: ReasonItem[] = [
  { title: "Bouncy at the net", t: "The soft face launches fast blocks, so ==volleys can fly long==.", for: ["advanced", "balance"] },
  { title: "Smashes need help", t: "Out of the box ==flat smashes lack pop==; players move the weights up top.", for: ["power"] },
];
const pick = (style: "control" | "power" | "balance" | "any", level: "beginner" | "intermediate" | "advanced" | null, arm = false) => ({ style, level: level ?? undefined, arm });

describe("match box reason line", () => {
  it("strong fit: built for the picks, then the one thing to know", () => {
    expect(fitReason("good", yes, no, pick("control", "intermediate"))).toBe(
      "Built for what you picked: lobs, chiquitas and low balls from the back feel safe under pressure. "
      + "One thing to know: the soft face launches fast blocks, so volleys can fly long.");
  });
  it("leads each side with the item that matters for the picks", () => {
    expect(fitReason("maybe", yes, no, pick("power", "intermediate"))).toBe(
      "What suits your game: the sweet spot covers most of the face, so mishits still go deep. "
      + "But out of the box flat smashes lack pop; players move the weights up top.");
  });
  it("weak fit: the level reason when the catch doesn't speak to the picks", () => {
    expect(fitReason("no", yes, no, pick("control", "beginner"), ["Level: players say advanced. Not aimed at beginners."])).toBe(
      "It has one thing going for you: lobs, chiquitas and low balls from the back feel safe under pressure. "
      + "But it isn't aimed at beginners.");
  });
  it("weak fit with a catch on the picks keeps both", () => {
    expect(fitReason("no", yes, no, pick("power", "advanced"), ["A pro line, built for advanced players."]))
      .toContain("But out of the box flat smashes lack pop");
  });
  it("every sentence stays within 105 characters", () => {
    const long: ReasonItem[] = [{ title: "Huge sweet spot", t: "Almost the whole racket is sweet spot, and even the edges send the ball deep with very little effort from you." }];
    expect(fitReason("good", long, [], pick("any", null))).toBe("Built for what you picked: huge sweet spot.");
  });
  it("words", () => {
    expect(clause("AT10 owners say ==x==.")).toBe("AT10 owners say x");
    expect(butLevel("A pro line, built for advanced players.")).toBe("it's a pro line, built for advanced players");
    expect(fitReason("good", [], [], pick("any", null))).toBeNull();
  });
});
