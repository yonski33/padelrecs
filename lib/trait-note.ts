// The six "How it plays" notes (owner 2026-11-16, expert voice, lib/voice.ts): each trait said as a plain statement, strong,
// middling or weak by the dots, with both sides named when the reports really split. Pure, so it is tested on its own
// (tests/trait-note.test.ts): the old generator built "Lots of players praise X; lots of want more power".
import type { Trait } from "./trait-score";

export const TRAIT_SAY: Record<Trait, { hi: string; mid: string; lo: string; split: [string, string] }> = {
  forgiveness: { hi: "Big, forgiving sweet spot.", mid: "An average sweet spot.", lo: "Small sweet spot; it punishes mishits.", split: ["forgiving", "demanding"] },
  power: { hi: "Easy power; the ball jumps off the face.", mid: "Moderate power; smashes need a full swing.", lo: "Little free power; you supply the pace.", split: ["powerful", "short on power"] },
  control: { hi: "Precise; the ball goes where you aim.", mid: "Decent control.", lo: "Hard to control; the ball can fly.", split: ["precise", "hard to control"] },
  defence: { hi: "Solid in defence; easy to block and lob.", mid: "Fine in defence.", lo: "Hard work in defence.", split: ["solid in defence", "hard work in defence"] },
  arm: { hi: "Kind to the arm; it soaks up vibration.", mid: "Average comfort.", lo: "Hard on the arm, especially on mishits.", split: ["comfortable", "hard on the arm"] },
  speed: { hi: "Quick in the hand at the net.", mid: "Average handling.", lo: "Heavy and slow in the hand.", split: ["quick", "heavy"] },
};

/** The note for one trait: `dots` 1–5, `plus` / `minus` the reports for and against (players and reviewers). A split needs
 *  3+ reports a side and a close ratio (at least 3:4), so it stays rare and means something. */
export function traitNote(t: Trait, dots: number, plus = 0, minus = 0): string {
  const say = TRAIT_SAY[t];
  if (plus >= 3 && minus >= 3 && Math.min(plus, minus) / Math.max(plus, minus) >= 0.75) return `Splits opinion: some find it ${say.split[0]}, others ${say.split[1]}.`;
  return dots >= 4 ? say.hi : dots <= 2 ? say.lo : say.mid;
}
