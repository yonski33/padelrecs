// Keyword rules that turn a YouTube reviewer's checked note into trait mentions (+1 praise, −1 complaint). Used by
// scripts/youtube-trait-mentions.mts; kept in lib so tests can check them. Negations are matched first.
import type { Trait } from "./trait-score";

const R: Record<Trait, { minus: RegExp; plus: RegExp }> = {
  forgiveness: { minus: /(small|narrow|tight|reduced|not (very )?(wide|big|large)|smaller) sweet ?spot|sweet ?spot (is )?(not (wide|big|large)|small|narrow)|demanding|punish|unforgiving|needs? (clean|good) technique/i,
    plus: /(big|large|wide|huge|massive|generous|bigger|larger) sweet ?spot|sweet ?spot (is |felt |feels )?(big|large|wide|huge|massive|generous)|forgiving|tolerant|mishits? (still )?(land|go|travel)/i },
  power: { minus: /lacks? (some )?(power|pop|punch|exit)|(less|not much|little|limited|no) (power|pop|punch)|not (very )?powerful|underwhelming|hard to (power|finish)|need(s)? to (generate|swing)/i,
    plus: /power(ful)?(?! is (limited|lacking))|explosive|pop|punch|cannon|ball (exit|output)|kick ?smash|easy depth/i },
  control: { minus: /(less|lack(s|ing)?|hard to|harder to|loses?|lose|losing|out of|not much) control|(?<!not |n't |never )fl(y|ies) (long|to the glass)|uncontrollable|trampoline|bouncy|imprecise/i,
    plus: /control|precis(e|ion)|accura(te|cy)|placement|on a string|(does not|doesn'?t|never) fly|stays? in/i },
  defence: { minus: /(struggl|weak|hard|difficult|not great|less good|poor)[a-z ]*(defen|block|lob|chiquita)|(defen|block|lob|chiquita)[a-z ]*(struggl|weak|hard|difficult|float|fly long)/i,
    plus: /(solid|safe|stable|great|good|easy|excellent|comfortable|secure|reliable)[a-z ,]*(defen|block|lob|chiquita|from the back)|(defen|block|lob|chiquita|from the back)[a-z ,]*(solid|safe|stable|great|good|easy|excellent|comfortable|secure|reliable)/i },
  arm: { minus: /(?<!no |not |without |didn'?t |did not |doesn'?t |does not )vibrat|hurt|pain|tired|tiring|trained arm|hard on the arm|tough on the arm|elbow (issue|problem)/i,
    plus: /comfort|arm[- ]friendly|no vibration|(did not|didn'?t|doesn'?t|does not) vibrate|absorb|kind to (the|your) (arm|elbow)|gentle|easy on the (arm|elbow)|tennis elbow/i },
  speed: { minus: /slow(er)? (in the hand|to move|at the net|in fast)|heavy|head[- ]heavy|cumbersome|hard to move|not (very )?(quick|fast|manoeuvrable|maneuverable)|tiring/i,
    plus: /manoeuvr|maneuver|quick|fast (hands|at the net|in the hand)|light in the hand|handy|agile|easy to (move|swing)|whippy/i },
};
/** Which traits a note talks about. The zone and arm kinds narrow it: a defence note only counts for Defence, an arm note for
 *  Arm comfort; style, feel and catch notes can touch any trait. Level, spec, compare and tip notes are left out. */
export function classifyTraitNote(kind: string, text: string): [Trait, number][] {
  const only: Trait[] | null = kind === "zone-defence" ? ["defence"] : kind === "arm" ? ["arm"] : kind === "zone-net" ? ["speed", "control"] : kind === "zone-overhead" ? ["power", "control"]
    : ["style", "feel", "catch"].includes(kind) ? null : [];
  const traits = (only ?? (Object.keys(R) as Trait[]));
  const out: [Trait, number][] = [];
  for (const t of traits) {
    if (R[t].minus.test(text)) out.push([t, -1]);
    else if (R[t].plus.test(text)) out.push([t, 1]);
    // A reviewer's defence note is about defence: it counts as praise unless it complains.
    else if (kind === "zone-defence" && t === "defence") out.push([t, 1]);
  }
  return out;
}
