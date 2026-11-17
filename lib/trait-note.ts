// The six "How it plays" notes (owner 2026-11-16, expert voice, lib/voice.ts): each trait said as a plain statement, strong,
// middling or weak by the dots, with both sides named when the reports really split. Pure, so it is tested on its own
// (tests/trait-note.test.ts): the old generator built "Lots of players praise X; lots of want more power".
import type { Trait } from "./trait-score";

export type Say = { hi: string; mid: string; lo: string; split: [string, string]; /** 5 dots (4 says `hi`; audit 2026-11-17: 4 and 5 read differently). */ top?: string };
export const TRAIT_SAY: Record<Trait, Say> = {
  forgiveness: { top: "Huge sweet spot; mishits still go deep.", hi: "Forgiving sweet spot.", mid: "An average sweet spot.", lo: "Small sweet spot; it punishes mishits.", split: ["forgiving", "demanding"] },
  power: { top: "Easy power; the ball jumps off the face.", hi: "Good power when you swing through.", mid: "Moderate power; smashes need a full swing.", lo: "Little free power; you supply the pace.", split: ["powerful", "short on power"] },
  control: { top: "Pinpoint; the ball goes where you aim.", hi: "Precise and predictable.", mid: "Decent control.", lo: "Hard to control; the ball can fly.", split: ["precise", "hard to control"] },
  defence: { top: "Excellent in defence; blocks and lobs come easy.", hi: "Solid in defence.", mid: "Fine in defence.", lo: "Hard work in defence.", split: ["solid in defence", "hard work in defence"] },
  arm: { top: "Very kind to the arm; it soaks up vibration.", hi: "Kind to the arm.", mid: "Average comfort.", lo: "Hard on the arm, especially on mishits.", split: ["comfortable", "hard on the arm"] },
  speed: { top: "Very quick in the hand at the net.", hi: "Quick in the hand.", mid: "Average handling.", lo: "Heavy and slow in the hand.", split: ["quick", "heavy"] },
};

/** The note for one trait: `dots` 1–5, `plus` / `minus` the reports for and against (players and reviewers). A split needs
 *  3+ reports a side and a close ratio (at least 3:4), so it stays rare and means something. Padel's six traits have their own
 *  words (`TRAIT_SAY`); any other site's trait (pickleball's spin or pop, tennis's stability) is said from its label. */
export function traitNote(t: string, dots: number, plus = 0, minus = 0, label = t, say: Say | undefined = TRAIT_SAY[t as Trait]): string {
  const split = plus >= 3 && minus >= 3 && Math.min(plus, minus) / Math.max(plus, minus) >= 0.75;
  if (say) {
    if (split) return `Splits opinion: some find it ${say.split[0]}, others ${say.split[1]}.`;
    return dots >= 5 && say.top ? say.top : dots >= 4 ? say.hi : dots <= 2 ? say.lo : say.mid;
  }
  const w = label.toLowerCase();
  if (split) return `${label} splits opinion.`;
  return dots >= 4 ? `Strong ${w}: a real strength.` : dots <= 2 ? `Weak on ${w}.` : `Average ${w}.`;
}
