// AudioRecs' quick match (its Thread home and "Is it right for me?"): what you use them for, the sound you like and noise
// cancelling, matched on each product's attribute scores (lib/audio-profile.ts AUDIO, scored by lib/attr-score.ts scoreAll
// from what listeners say) and its listener score. Pure and small, so the home re-ranks in the browser on every tap (instant
// filters) and tests feed plain objects. A first pass (2026-11-21): the weights wait for the owner's yardstick check.
//   - the listener score is the base (0.4); the use (0.3) and the sound (0.3) count only when picked and scored;
//   - a use reads its own attributes (commute: noise cancelling, comfort, battery, connection …), each only where it applies
//     (battery, mic and connection on wireless pairs, noise cancelling on pairs that have it) and has 3+ reviews behind it;
//   - a hard mismatch (noise cancelling ticked on a pair without it, open-back on the commute, over-ears in the gym) holds the
//     % under "Worth a look" and sorts the row after the rest; a softer one holds it under "Strong fit".
import type { AudioKind } from "./audio-profile";

export type AudioUse = "commute" | "office" | "home" | "gym";
export type AudioSound = "bass" | "balanced" | "detail";
export type AudioPicks = { use: AudioUse | null; sound: AudioSound | null; anc: boolean };
export const NO_AUDIO_PICKS: AudioPicks = { use: null, sound: null, anc: false };
export const audioPickedAny = (p: AudioPicks) => !!(p.use || p.sound || p.anc);
/** One product's ranking inputs, as the page sends them to the browser: attribute → [score 0–100, voices]. */
export type AudioWire = { id: string; kind: AudioKind | null; wireless: boolean; anc: boolean; signal: number | null; n: number; s: Record<string, [number, number]> };

export const USES: [AudioUse, string][] = [["commute", "Commute"], ["office", "Office"], ["home", "Home"], ["gym", "Gym"]];
export const SOUNDS: [AudioSound, string][] = [["bass", "Bass"], ["balanced", "Balanced"], ["detail", "Detail"]];
/** "Best for …" words per use. */
export const USE_WORDS: Record<AudioUse, string> = { commute: "commuting", office: "the office", home: "home listening", gym: "the gym" };
const PARTS: Record<AudioUse, [string, number][]> = {
  commute: [["anc", 3], ["comfort", 2], ["battery", 1.5], ["connection", 1]],
  office: [["comfort", 3], ["mic", 2], ["anc", 1.5], ["battery", 1]],
  home: [["comfort", 2], ["detail", 1.5], ["build", 1], ["value", 1]],
  gym: [["build", 2], ["connection", 1.5], ["comfort", 1.5], ["battery", 1]],
};
const WIRELESS_ONLY = new Set(["battery", "mic", "connection"]);
const W_SCORE = 0.4, W_USE = 0.3, W_SOUND = 0.3, HARD_CAP = 54, WARN_CAP = 74;

const applies = (w: AudioWire, key: string) => (key !== "anc" || w.anc) && (!WIRELESS_ONLY.has(key) || w.wireless);
/** On the commute, a pair with no noise cancelling and no in-ear seal (over-ears, on-ears, earbuds) scores this for it. */
const NO_ANC_COMMUTE = 40;
function useScore(w: AudioWire, use: AudioUse): number | null {
  let sum = 0, wt = 0;
  for (const [k, x] of PARTS[use]) {
    const s = w.s[k];
    if (s && applies(w, k)) { sum += s[0] * x; wt += x; }
    else if (k === "anc" && use === "commute" && !w.anc && w.kind !== "IEM") { sum += NO_ANC_COMMUTE * x; wt += x; }
  }
  return wt ? sum / wt : null;
}
function soundScore(w: AudioWire, sound: AudioSound): number | null {
  if (sound === "bass") return w.s.bass?.[0] ?? null;
  if (sound === "detail") return w.s.detail?.[0] ?? null;
  // Balanced: how near the middle listeners put the tuning (warm … bright), and how rarely they call it harsh or muddy.
  const t = w.s.tuning?.[0], smooth = w.s.smooth?.[0];
  const mid = t === undefined ? null : 30 + 0.6 * (100 - 2 * Math.abs(t - 50));
  return mid === null ? smooth ?? null : smooth === undefined ? mid : (mid + smooth) / 2;
}
/** Why a pair can't be a strong fit for these picks: [hard reasons, softer warnings]. */
export function catches(w: AudioWire, p: AudioPicks): [string[], string[]] {
  const hard: string[] = [], warn: string[] = [];
  if (p.anc && !w.anc) hard.push("it has no noise cancelling");
  if (p.use === "commute" && w.kind === "Open-back") hard.push("open-backs leak sound and let the train in");
  if (p.use === "gym" && (w.kind === "Over-ear" || w.kind === "Open-back" || w.kind === "On-ear")) hard.push("headphones get hot and slip in the gym");
  if (p.use === "office" && w.kind === "Open-back") warn.push("open-backs leak sound in a shared office");
  if (p.use === "gym" && !w.wireless) warn.push("a cable gets in the way in the gym");
  return [hard, warn];
}
export type AudioMatch = { pct: number | null; hard: boolean; warn: boolean; reasons: string[]; strong: string[] };
export function audioMatch(w: AudioWire, p: AudioPicks): AudioMatch {
  const [hard, warn] = catches(w, p);
  if (w.signal == null) return { pct: null, hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong: [] };
  let sum = w.signal * W_SCORE, wt = W_SCORE;
  const u = p.use ? useScore(w, p.use) : null, s = p.sound ? soundScore(w, p.sound) : null;
  if (u !== null) { sum += u * W_USE; wt += W_USE; }
  if (s !== null) { sum += s * W_SOUND; wt += W_SOUND; }
  let pct = Math.round(sum / wt);
  if (hard.length) pct = Math.min(pct, HARD_CAP); else if (warn.length) pct = Math.min(pct, WARN_CAP);
  // What listeners praise most among the picked parts (65+ is the top 40% of the catalogue for that attribute).
  const keys = [...(p.use ? PARTS[p.use].map(([k]) => k) : []), ...(p.sound === "bass" ? ["bass"] : p.sound === "detail" ? ["detail"] : [])];
  const strong = [...new Set(keys)].filter(k => applies(w, k) && (w.s[k]?.[0] ?? 0) >= 65).sort((a, b) => w.s[b][0] - w.s[a][0]).slice(0, 2);
  return { pct: Math.max(0, Math.min(99, pct)), hard: hard.length > 0, warn: warn.length > 0, reasons: [...hard, ...warn], strong };
}
/** Ranked for the picks: hard mismatches last, then softer ones, then by match % and by how many reviews back it. */
export function rankAudio(wire: AudioWire[], p: AudioPicks, keep: (w: AudioWire) => boolean = () => true) {
  return wire.filter(keep).map(w => ({ w, m: audioMatch(w, p) })).sort((a, b) =>
    Number(a.m.hard) - Number(b.m.hard) || Number(a.m.warn) - Number(b.m.warn) || (b.m.pct ?? -1) - (a.m.pct ?? -1) || b.w.n - a.w.n);
}
/** The verdict bands (ENGINE-ALGO.md step 7, as lib/attr-score.ts verdictOf): Strong fit 75+, Worth a look 55–74. */
export const audioVerdict = (pct: number | null) => pct === null ? "thin" as const : pct >= 75 ? "good" as const : pct >= 55 ? "maybe" as const : "no" as const;
/** The words for a strong attribute in a reason line. */
export const STRONG_WORDS: Record<string, string> = { anc: "noise cancelling", comfort: "comfort", battery: "battery life", connection: "connection", mic: "mic",
  detail: "detail", build: "build", value: "value", bass: "bass" };
/** "Best for …" from the engine: the uses this pair matches at 75%+ with no catch, best first, at most two. */
export function bestUses(w: AudioWire): AudioUse[] {
  return USES.map(([u]) => ({ u, m: audioMatch(w, { use: u, sound: null, anc: false }) }))
    .filter(x => x.m.pct !== null && x.m.pct >= 75 && !x.m.hard && !x.m.warn && x.m.strong.length > 0).sort((a, b) => b.m.pct! - a.m.pct!).slice(0, 2).map(x => x.u);
}
