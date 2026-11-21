// PadelRecs racket page (owner mock "Racket Page", 2026-11-21): one pill in the top card with the racket's strongest "How does
// it play?" answer, in fixed words per group ("Most picked for power · 22 players", or quality first: "Big sweet spot · 29 players"). Only when the leading answer has 5+
// behind it and clearly leads its group (1.5x the runner-up); otherwise no pill. Counts are the group as the page shows it
// (review prefill or the owner's override, plus votes). Not the review highlights ("Often mentioned: …"), which stay off.
// Pure, so tests feed plain counts.

/** The words after "Most picked for", per group and answer. An answer without words never makes a pill (a small sweet spot
 *  or "wears fast" is not a selling line). */
export const PILL_WORDS: Record<string, Record<string, string>> = {
  plays_like: { power: "power", control: "control", all_round: "all-round play" },
  level: { beginner: "beginners", intermediate: "intermediate players", advanced: "advanced players" },
  sweet_spot: { big: "a big sweet spot" },
  arm: { very: "arm comfort" },
  feel: { soft: "a soft feel", medium: "a medium feel", hard: "a hard feel" },
  side: { right: "the right side", left: "the left side", both: "both sides" },
  maneuver: { very: "quick handling" },
  durability: { holds_up: "durability" },
};
/** Answers that describe the racket rather than who or what it is for read quality first (owner 2026-11-21: "Most picked for a
 *  big sweet spot" was awkward): "Big sweet spot · 29 players". The rest keep "Most picked for power · 22 players". */
export const PILL_LABELS: Record<string, Record<string, string>> = {
  sweet_spot: { big: "Big sweet spot" },
  arm: { very: "Easy on the arm" },
  feel: { soft: "Soft feel", medium: "Medium feel", hard: "Hard feel" },
  maneuver: { very: "Quick handling" },
  durability: { holds_up: "Holds up well" },
};
export const PILL_MIN = 5, PILL_LEAD = 1.5;

/** The pill's text, or null. Of the groups whose leader qualifies, the one where the leader holds the biggest share wins;
 *  a tie goes to the earlier group in PILL_WORDS order. */
export function votePill(groups: Record<string, Record<string, number> | null | undefined>, people = "players", pillWords = PILL_WORDS, pillLabels = PILL_LABELS): string | null {
  let best: { share: number; text: string } | null = null;
  for (const [key, words] of Object.entries(pillWords)) {
    const g = groups[key]; if (!g) continue;
    const opts = Object.entries(g).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    if (!opts.length) continue;
    const [[top, n], second] = [opts[0], opts[1]?.[1] ?? 0], total = opts.reduce((s, [, x]) => s + x, 0);
    if (n < PILL_MIN || n < PILL_LEAD * second || !words[top]) continue;
    const share = n / total;
    const who = `${n} ${n === 1 ? people.replace(/s$/, "") : people}`, label = pillLabels[key]?.[top];
    if (!best || share > best.share) best = { share, text: label ? `${label} · ${who}` : `Most picked for ${words[top]} · ${who}` };
  }
  return best?.text ?? null;
}

/** SimRacingRecs (v3 rollout 2026-11-21): quality first ("Sharp detail · 14 racers"); who or what it is for keeps "Most picked
 *  for …". Its groups are per gear type (lib/thread/traits.ts), so a pill comes from the product's own type. */
export const SIMRACING_PILL_WORDS: Record<string, Record<string, string>> = {
  best_in: { gt: "GT and touring", formula: "formula cars", rally: "rally and drift" },
  level: { beginner: "beginners", intermediate: "intermediate racers", advanced: "advanced racers" },
  detail: { sharp: "x" }, torque: { plenty: "x" }, brake_feel: { realistic: "x" }, throttle: { smooth: "x" }, flex: { none: "x" },
  grip: { great: "x" }, buttons: { great: "x" }, desk: { very: "x" }, noise: { quiet: "x" }, heat: { cool: "x" },
  build: { quick: "x" }, shift_feel: { crisp: "x" }, software: { easy: "x" }, durability: { holds_up: "x" },
};
export const SIMRACING_PILL_LABELS: Record<string, Record<string, string>> = {
  detail: { sharp: "Sharp detail" }, torque: { plenty: "Plenty of torque" }, brake_feel: { realistic: "Realistic brake feel" },
  throttle: { smooth: "Smooth throttle" }, flex: { none: "No flex" }, grip: { great: "Great grip" }, buttons: { great: "Great buttons" },
  desk: { very: "Desk friendly" }, noise: { quiet: "Quiet" }, heat: { cool: "Stays cool" }, build: { quick: "Quick to build" },
  shift_feel: { crisp: "Crisp shifts" }, software: { easy: "Easy software" }, durability: { holds_up: "Holds up well" },
};

/** AudioRecs (V3-ROLLOUT-BRIEF: "Quality · N listeners"): every answer reads quality first, so words and labels match. */
export const AUDIO_PILL_LABELS: Record<string, Record<string, string>> = {
  anc: { excellent: "Great noise cancelling" }, comfort: { all_day: "Comfortable all day" }, detail: { lots: "Lots of detail" },
  value: { worth_it: "Worth the money" }, soundstage: { wide: "Wide soundstage" }, battery: { lasts_days: "Battery lasts days" },
  calls: { clear: "Clear calls" }, build: { solid: "Solid build" }, fit: { secure: "Secure fit" }, connection: { solid: "Solid connection" },
  sound: { warm: "Warm sound", balanced: "Balanced sound", bright: "Bright sound" }, amp: { no: "No amp needed" }, glasses: { fine: "Fine with glasses" },
};
