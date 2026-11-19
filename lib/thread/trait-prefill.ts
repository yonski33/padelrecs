// "How does it play?" prefill rules (owner 2026-11-19). Pure, so tests feed plain objects; scripts/thread-trait-prefill.mts
// runs it over the stored data and saves db/thread/padel-traits.json, which the racket page reads.
//   - Evidence rows (lib/evidence.ts, the reader pass, quick tags, YouTube notes) give plays like, best for, sweet spot,
//     arm friendly, maneuverable and durability. Makers' and brands' stated levels are left out: only reviews count.
//   - Feel, best on and trampoline come from review words (FEEL, SIDE, TRAMPOLINE below); a negative review's side is
//     left out (playing there didn't work for them).
//   - One source counts once per group: its rows for that group are netted first.
//   - Specs are kept apart (`spec`): shape → plays like, core → feel, balance → maneuverable, only where the value settles
//     it (a "Soft" core, a "Diamond" shape). They're never counted as mentions.
import { reportOf, type EvidenceRow } from "../evidence";

export type PrefillGroup = Record<string, number>;
export type PrefillRacket = { slug: string; name: string; sources: number; groups: Record<string, PrefillGroup>; spec: Record<string, string> };
export type Prefill = { built: string; rule: string; rackets: Record<string, PrefillRacket> };
export type PrefillText = { productId: string; /** The report ref, "p:<review id>" or "w:<web report id>". */ key: string; negative: boolean; text: string };
type Cat = { id: string; slug: string; name: string; shape: string | null; core: string | null; balance: string | null };

const NOT = String.raw`(?<!\b(?:no|not|never|without|zero|little|minimal|low|not much|not too|isn'?t|wasn'?t)\s(?:\w+\s)?)`;
/** Words that settle a group, tried in order (the first that matches wins for that text). */
export const FEEL: [string, RegExp][] = [
  ["medium", /\b(medium|balanced|intermediate) (feel|touch|response|core)|neither (too )?(soft|hard|stiff)|not too (soft|hard|stiff|firm)|between soft and (hard|firm)/i],
  ["soft", new RegExp(String.raw`${NOT}\b(soft|softer|plush|cushioned|cushiony|mushy)\b(?! ?(spot|power))(?=[^.]{0,25}\b(feel|touch|core|response|face|contact)\b)|\b(feel|touch|core|response) (is |was |feels )?(very |quite |rather )?(soft|plush|cushioned)|feels? (very |quite |rather )?(soft|plush|cushioned)`, "i")],
  ["hard", new RegExp(String.raw`${NOT}\b(hard|harder|stiff|stiffer|firm|firmer|rigid|dry)\b(?=[^.]{0,25}\b(feel|touch|core|response|face|contact)\b)|\b(feel|touch|core|response) (is |was |feels )?(very |quite |rather )?(hard|stiff|firm|rigid|dry)|feels? (very |quite |rather )?(hard|stiff|firm|rigid)`, "i")],
];
export const SIDE: [string, RegExp][] = [
  ["both", /\b(both sides|either side|left or right|right or left)\b/i],
  ["left", /\b(left side|backhand side|on the left|rev[eé]s player|play(ing|s)? (on the )?left|left-side)\b/i],
  ["right", /\b(right side|forehand side|drive side|on the right|drive player|play(ing|s)? (on the )?right|right-side)\b/i],
];
export const TRAMPOLINE: [string, RegExp][] = [
  ["medium", /\b(some|moderate|a bit of|a little|slight|medium|controlled|mild) (trampoline|bounce|catapult)/i],
  ["low", /\b(no|little|minimal|zero|low|without( much)?|not much|barely any|hardly any|(much |a lot )?less) (trampoline|bounce|catapult)|\b(not|less) (very |too |overly )?(bouncy|springy)|\btrampoline (effect )?(is |was )?(low|minimal|limited)|\bdead(ish)? (feel|response)/i],
  ["high", new RegExp(String.raw`${NOT}\b(trampoline|bouncy|catapult|springy)\b`, "i")],
];
const firstMatch = (rules: [string, RegExp][], text: string) => rules.find(([, re]) => re.test(text))?.[0] ?? null;

/** Specs that settle a group (owner: "specs only where they settle it"); null where they don't. */
export function specLeans(r: Pick<Cat, "shape" | "core" | "balance">): Record<string, string> {
  const out: Record<string, string> = {}, shape = (r.shape ?? "").toLowerCase(), core = (r.core ?? "").toLowerCase(), bal = (r.balance ?? "").toLowerCase().trim();
  if (shape.startsWith("diamond")) out.plays_like = "power"; else if (shape.startsWith("round")) out.plays_like = "control"; else if (shape.startsWith("teardrop")) out.plays_like = "all_round";
  if (/\b(soft|flex)\b/.test(core)) out.feel = "soft"; else if (/\b(hard|firm)\b/.test(core)) out.feel = "hard";
  if (/^low\b(?![/-])/.test(bal)) out.maneuver = "very"; else if (/^high\b/.test(bal)) out.maneuver = "not_really"; else if (/^medium\b(?![/-])/.test(bal)) out.maneuver = "somewhat";
  return out;
}

const scale = (net: number, maxStrength: number, [yes, some, no]: [string, string, string]) => net < 0 ? no : net > 0 ? (maxStrength >= 1 ? yes : some) : null;
/** One source's evidence rows for one racket → its pick per group (or none). */
export function sourcePicks(rows: EvidenceRow[]): Record<string, string> {
  const sum = (a: string) => { const rs = rows.filter(r => r.attribute === a && typeof r.value === "number"); return { net: rs.reduce((s, r) => s + (r.value as number) * r.strength, 0), max: Math.max(0, ...rs.map(r => r.strength)), n: rs.length }; };
  const out: Record<string, string> = {};
  const p = sum("power").net, c = sum("control").net;
  if (p > 0 && c > 0) out.plays_like = "all_round"; else if (p > 0 || (c < 0 && p === 0)) out.plays_like = "power"; else if (c > 0 || (p < 0 && c === 0)) out.plays_like = "control";
  const f = sum("forgiveness"); if (f.n) { const v = f.net < 0 ? "small" : f.net > 0 ? (f.max >= 1 ? "big" : "medium") : null; if (v) out.sweet_spot = v; }
  const a = sum("arm"); if (a.n) { const v = scale(a.net, a.max, ["very", "somewhat", "not_really"]); if (v) out.arm = v; }
  const s = sum("speed"); if (s.n) { const v = scale(s.net, s.max, ["very", "somewhat", "not_really"]); if (v) out.maneuver = v; }
  const d = sum("durability"); if (d.n) { const v = d.net > 0 ? "holds_up" : d.net < 0 ? "wears_fast" : null; if (v) out.durability = v; }
  const lv = rows.filter(r => r.attribute === "level" && r.valueText).map(r => r.valueText!.toLowerCase()).find(l => ["beginner", "intermediate", "advanced"].includes(l));
  if (lv) out.level = lv;
  return out;
}

export function buildPrefill(cat: Cat[], evidence: EvidenceRow[], texts: PrefillText[], built: string): Prefill {
  const bySource = new Map<string, EvidenceRow[]>();
  for (const r of evidence) {
    if (r.sourceKind === "maker" || r.sourceKind === "owner" || r.attribute.startsWith("spec:")) continue;
    const k = `${r.productId}|${r.authorKey ?? reportOf(r.sourceRef)}`;
    const l = bySource.get(k); if (l) l.push(r); else bySource.set(k, [r]);
  }
  const picks = new Map<string, Map<string, Record<string, string>>>(); // product → source → group → choice
  const put = (pid: string, src: string, g: string, v: string) => { let m = picks.get(pid); if (!m) picks.set(pid, m = new Map()); const o = m.get(src) ?? {}; if (!o[g]) o[g] = v; m.set(src, o); };
  for (const [k, rows] of bySource) { const [pid, src] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)]; for (const [g, v] of Object.entries(sourcePicks(rows))) put(pid, src, g, v); }
  // A text's source is the evidence rows' source for the same report (so a review counts once in `sources`).
  const authorOf = new Map(evidence.filter(r => r.authorKey).map(r => [`${r.productId}|${reportOf(r.sourceRef)}`, r.authorKey!]));
  for (const t of texts) {
    const src = authorOf.get(`${t.productId}|${t.key}`) ?? t.key;
    const feel = firstMatch(FEEL, t.text), tramp = firstMatch(TRAMPOLINE, t.text), side = t.negative ? null : firstMatch(SIDE, t.text);
    if (feel) put(t.productId, src, "feel", feel); if (tramp) put(t.productId, src, "trampoline", tramp); if (side) put(t.productId, src, "side", side);
  }
  const out: Prefill = { built, rule: "One count per review, web report or YouTube channel per group; specs kept apart in `spec` and never counted.", rackets: {} };
  for (const r of [...cat].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const m = picks.get(r.id), groups: Record<string, PrefillGroup> = {};
    for (const o of m?.values() ?? []) for (const [g, v] of Object.entries(o)) (groups[g] ??= {})[v] = (groups[g][v] ?? 0) + 1;
    out.rackets[r.id] = { slug: r.slug, name: r.name, sources: m?.size ?? 0, groups, spec: specLeans(r) };
  }
  return out;
}
