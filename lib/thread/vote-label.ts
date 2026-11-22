// PickleballRecs labels from votes (owner rule, Grok audit 2026-11-22): a paddle's style, feel and level labels follow its
// "How does it play?" boxes (review prefill or the owner's counts, plus votes) once the box is clear: 30 or more in it and the
// leader at least 1.5 times the runner-up. Otherwise the label stays as the reviews and the maker's positioning give it.
// Pure, for tests.
export const MIN_VOTES = 30, LEAD = 1.5;

/** The leading option of a vote box when it is clear, else null. */
export function clearLeader(box: Record<string, number> | undefined): string | null {
  const opts = Object.entries(box ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = opts.reduce((a, [, n]) => a + n, 0);
  if (total < MIN_VOTES || !opts.length) return null;
  return opts[0][1] >= LEAD * (opts[1]?.[1] ?? 0) ? opts[0][0] : null;
}

const STYLE = { control: "control", power: "power", all_round: "balance" } as const;
const FEEL = { soft: "Soft", medium: "Medium", hard: "Hard" } as const;
const LEVEL = ["beginner", "intermediate", "advanced"] as const;
type Level = typeof LEVEL[number];

/** The row fields to replace: the style vote, the feel word and a one-level range, each only when its box is clear. */
export function votedLabels(row: { id: string }, groupOf: (id: string) => (trait: string) => Record<string, number>) {
  const g = groupOf(row.id), out: { styleVote?: "control" | "power" | "balance"; feel?: "Soft" | "Medium" | "Hard"; levels?: Level[] } = {};
  const s = clearLeader(g("plays_like")); if (s && s in STYLE) out.styleVote = STYLE[s as keyof typeof STYLE];
  const f = clearLeader(g("feel")); if (f && f in FEEL) out.feel = FEEL[f as keyof typeof FEEL];
  const l = clearLeader(g("level")); if (l && (LEVEL as readonly string[]).includes(l)) out.levels = [l as Level];
  return out;
}
