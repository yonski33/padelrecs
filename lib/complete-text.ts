// Is a stored excerpt a whole comment, or a fragment cut from one? (owner 2026-11-18: Reddit cards ending "…its hilariously
// flippy. I also always have".) A whole comment ends a sentence: . ! ? (or …) maybe followed by closing quotes or brackets,
// or ends in a closing bracket or an emoji. Text that starts or stops with an ellipsis was cut, and so was text whose last
// word is one a sentence can't end on ("…and I", "…with the").
const DANGLING = /\b(a|an|the|and|or|but|so|to|of|in|on|at|for|with|from|by|as|than|that|which|who|if|when|because|my|your|their|his|her|its|is|are|was|were|have|has|had|i|i'm|it's|very|really|just|also)$/i;

export function isComplete(text?: string | null): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;
  if (/^(\.\.\.|…)/.test(t) || /(\.\.\.|…)$/.test(t)) return false;
  // Sentence end, optionally followed by closing quotes / brackets.
  if (/[.!?]["'”’)\]]*$/.test(t)) return !DANGLING.test(t.replace(/[.!?"'”’)\]]+$/, ""));
  // A closing bracket or an emoji at the very end.
  if (/[)\]]$/.test(t)) return true;
  if (/\p{Extended_Pictographic}️?$/u.test(t)) return true;
  return false;
}
