/** Joins sentences until the next would pass `max` characters (search snippets show about 155). The first sentence
 *  always goes in; if it alone is too long it is cut at a word with "…". */
export function fitText(sentences: string[], max = 155) {
  let out = "";
  for (const s of sentences.filter(Boolean)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length <= max) out = next; else if (!out) out = `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`; else break;
  }
  return out;
}
