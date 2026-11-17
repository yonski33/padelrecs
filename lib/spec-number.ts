// A measured spec as one clean figure (Grok pickleball audit 2026-11-17, #30): research notes from several sources ("115 (john
// kew) · 116 (studio) · 120 (paddlespecs)") read as their range, "115–120". Words and labelled values ("Low (head-light)",
// "14 mm: 111 · 16 mm: 114") are left as they are. Pure, for tests.
export function specNumber(v: string): string {
  if (!/^\s*\d/.test(v) || !/\([a-z][^)]*\)/i.test(v)) return v;
  const nums = v.replace(/\([^)]*\)/g, " ").split(/[·;,]/).map(x => x.trim()).filter(Boolean);
  if (!nums.length || !nums.every(x => /^\d+(\.\d+)?$/.test(x))) return v;
  const n = nums.map(Number), lo = Math.min(...n), hi = Math.max(...n);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}
