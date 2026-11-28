/** A creator's chapter title without the word "verdict" (owner rule, every site; paddle page v13 handoff 2026-11-28): a
 *  chapter that is only the verdict reads "Final thoughts", elsewhere the word becomes "final thoughts". */
export function chapterTitle(t: string): string {
  if (/^\s*(the |final |my |our |overall |quick )?verdicts?\s*[:!.?]*\s*$/i.test(t)) return "Final thoughts";
  return t.replace(/\b(final )?verdicts?\b/gi, m => /^[A-Z]/.test(m) ? "Final thoughts" : "final thoughts");
}
