// A product page's own clear claims about a trait, so its "How it plays" bar never reads the opposite (PickleballRecs Grok
// audit 2026-11-17, #8 #9: "heavy spin" in the Why yes beside "3/5 Spin · Average spin", "gives up some pace" beside Power
// 4/5). The page lines are written from the same reports; where one plainly names the trait as a strength the bar reads at
// least 4, and where the tagline or a Why not plainly calls it weak the bar reads at most 3. Pure, for tests.

export type PageText = { tagline?: string; bottom?: string; yes?: { title: string; t: string }[]; no?: { title: string; t: string }[] };
type Rule = { up: RegExp; down: RegExp };

const RULES: Record<string, Rule> = {
  power: {
    up: /\b(power paddle|easy power|real power|big power|raw power|power on tap|firepower|hard[- ]hitting|heavy[- ]hitting|powerful|cannon)\b/i,
    down: /\b(gives up (some )?(pace|power)|mid-tier power|little (free )?power|no free power|you (bring|supply) the (power|pace)|low punch|underpowered|short on power)\b/i,
  },
  spin: {
    up: /\b(big|heavy|huge|exceptional|serious|massive|elite|lots of|top-tier) spin\b|\bspin monster\b|\bspinny\b/i,
    down: /\b(low|little|limited|average|modest) spin\b|\bspin (fades|drops)\b/i,
  },
  control: {
    up: /\b(control paddle|pinpoint|precise|precision|great control|easy control|touch paddle)\b/i,
    down: /\b(hard to control|tricky to control|poppy for touch|less control|little control)\b/i,
  },
};

/** The bar after the page's own claims: `dots` raised to 4 on a clear strength, lowered to 3 on a clear weakness (a
 *  strength in the Why yes wins only when no Why not says the opposite). Hand-set and expert dots are not passed here. */
export function pageBar(trait: string, dots: number, page: PageText | null | undefined): number {
  const r = RULES[trait];
  if (!r || !page) return dots;
  const yes = [page.tagline ?? "", ...(page.yes ?? []).map(i => `${i.title}. ${i.t}`)].join(" ");
  const no = [page.tagline ?? "", ...(page.no ?? []).map(i => `${i.title}. ${i.t}`)].join(" ");
  // Negations ("not a cannon", "isn't the most powerful") don't count as a claim either way.
  const strip = (t: string) => t.replace(/\b(not|isn't|isn’t|never|no|without)\s+(a\s+|the\s+|much\s+|as\s+)?[\w-]+(\s+[\w-]+)?/gi, " ");
  const up = r.up.test(strip(yes)), down = r.down.test(strip(no));
  if (up && !down && dots < 4) return 4;
  if (down && !up && dots > 3) return 3;
  return dots;
}

/** The traits this check covers. */
export const PAGE_BAR_TRAITS = Object.keys(RULES);
