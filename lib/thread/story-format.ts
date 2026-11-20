// The story composer's toolbar actions (owner 2026-11-20) on the textarea's text and selection. Pure, for tests: each takes
// the text and the selection and returns the new text and selection. Marks are the story Markdown subset's own.
export type Sel = { text: string; start: number; end: number };

/** Bold (**) or italic (*): wraps the selection, or unwraps it when it is already wrapped; with no selection, inserts the
 *  pair with the cursor between. */
export function wrap({ text, start, end }: Sel, mark: "**" | "*"): Sel {
  const before = text.slice(0, start), sel = text.slice(start, end), after = text.slice(end), n = mark.length;
  if (before.endsWith(mark) && after.startsWith(mark) && !(mark === "*" && (before.endsWith("**") || after.startsWith("**")))) return { text: before.slice(0, -n) + sel + after.slice(n), start: start - n, end: end - n };
  return { text: before + mark + sel + mark + after, start: start + n, end: end + n };
}

const PREFIX = { h: "## ", ul: "- ", ol: "1. ", q: "> " } as const;
const ANY = /^(## |[-*] |\d{1,3}[.)] |> ?)/;
/** Subheading, bullet list, numbered list or quote on every line the selection touches; again removes it. Numbered lists
 *  count 1, 2, 3. */
export function prefix({ text, start, end }: Sel, kind: keyof typeof PREFIX): Sel {
  const from = text.lastIndexOf("\n", start - 1) + 1, toNl = text.indexOf("\n", end), to = toNl === -1 ? text.length : toNl;
  const lines = text.slice(from, to).split("\n");
  const has = (l: string) => kind === "ol" ? /^\d{1,3}[.)] /.test(l) : kind === "ul" ? /^[-*] /.test(l) : l.startsWith(PREFIX[kind].trimEnd());
  const off = lines.every(l => !l.trim() || has(l));
  let n = 0;
  const next = lines.map(l => { if (!l.trim()) return l; const bare = l.replace(ANY, ""); if (off) return bare; n++; return (kind === "ol" ? `${n}. ` : PREFIX[kind]) + bare; }).join("\n");
  const out = text.slice(0, from) + next + text.slice(to);
  return { text: out, start: from, end: from + next.length };
}
