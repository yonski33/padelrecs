// AudioRecs' "How does it sound?" prefill (owner design handoff 2026-11-21), the discgolf and simracing way: what reviews
// already say about each product, per vote group (lib/thread/traits.ts audioGroupsFor), so the grid isn't empty before
// listeners vote. AudioRecs has no evidence store yet (drizzle/0023 isn't on its schema), so it reads the quick tags each
// review carries and its summary text. Pure, so tests feed plain objects; scripts/thread-trait-prefill.mts runs it.
//   - One source (an own review or a web report) counts once per group: the first rule that matches wins for that group.
//   - Tags first (a "great noise cancelling" tag is Noise cancelling: Excellent), then the words.
//   - Where a review's own verdict could mean the opposite (Best for, With glasses fine), a negative review is left out.
//   - Only the groups the product's kind shows count (a wired IEM gets no Battery).
import { audioGroupsFor } from "./traits";
import type { Prefill, PrefillGroup } from "./trait-prefill";

/** Not after a negation ("doesn't need an amp", "no muddy bass"). */
const NOT = String.raw`(?<!\b(?:no|not|never|without|isn'?t|wasn'?t|doesn'?t|don'?t|didn'?t|won'?t|hardly|barely)\s(?:\w+\s)?)`;
const re = (s: string) => new RegExp(s, "i");
const NC = String.raw`(?:ANC|noise[- ]cancell?(?:ing|ation))`;
const BAD = String.raw`(?:weak|poor|bad|mediocre|underwhelming|disappointing|lackluster|terrible|awful)`;
const OK = String.raw`(?:okay|ok|decent|fine|average|passable|serviceable|alright)`;

export type AudioSource = { tags: readonly string[]; text: string; negative: boolean };
type Rule = [option: string, test: (s: AudioSource) => boolean];
const tag = (t: string) => (s: AudioSource) => s.tags.includes(t);
const says = (r: RegExp) => (s: AudioSource) => r.test(s.text);
const kind = (r: RegExp) => (s: AudioSource) => !s.negative && r.test(s.text);

/** Per group, its rules in order. */
export const AUDIO_RULES: Record<string, Rule[]> = {
  sound: [["warm", tag("warm")], ["bright", tag("bright")],
    ["balanced", says(re(String.raw`\b(neutral|balanced|even|flat)[- ](sound|sounding|tuning|signature|presentation|profile|response)\b|\b(sounds?|tuned|tuning is|signature is) (very |quite |pretty |fairly )?(neutral|balanced)\b`))]],
  anc: [["excellent", tag("great noise cancelling")],
    ["weak", says(re(String.raw`\b${BAD} ${NC}|\b${NC} (is |was |feels )?(quite |pretty |rather )?${BAD}\b`))],
    ["good", says(re(String.raw`\b(good|decent|solid|okay|ok) ${NC}|\b${NC} (is |was )?(quite |pretty )?(good|decent|solid|okay|ok|fine)\b`))]],
  comfort: [["few_hours", s => s.tags.includes("uncomfortable") && re(String.raw`\b(after|for|beyond|past) (a few|an?|one|two|three|\d+|a couple of|couple) hours?\b`).test(s.text)],
    ["tight", tag("uncomfortable")], ["all_day", tag("comfortable")]],
  calls: [["clear", tag("great mic")],
    ["poor", says(re(String.raw`\b${BAD} (mic|microphone|call quality|calls)\b|\b(mic|microphone|call quality) (is |was |sounds? )?(quite |pretty )?(${BAD}|muffled)\b`))],
    ["okay", says(re(String.raw`\b(mic|microphone|call quality) (is |was )?(quite |pretty )?${OK}\b`))]],
  battery: [["lasts_days", tag("long battery life")],
    ["short", says(re(String.raw`\b(short|${BAD}) battery|\bbattery( life)? (is |was )?(quite |pretty |rather )?(short|${BAD})\b|\bbattery (drains|dies)\b`))],
    ["daily", says(re(String.raw`\bbattery[^.]{0,30}\b(a day|all day|a full day|the day|daily)\b|\bcharge (them |it )?(every|each) (day|night)\b`))]],
  build: [["fragile", tag("build quality issues")],
    ["solid", says(re(String.raw`${NOT}\b(well|solidly|sturdily|nicely) (built|made)\b|\bbuild( quality)? (is |feels )?(really |very )?(excellent|great|solid|premium|sturdy|good)\b|\bbuilt like a tank\b|${NOT}\bfeels? (premium|solid|sturdy)\b`))],
    ["average", says(re(String.raw`\bbuild( quality)? (is |feels )?(${OK}|plasticky)\b|\bplasticky\b`))]],
  best_for: [["commute", kind(/\b(commut\w*|trains?|subway|bus|metro|the tube)\b/i)], ["travel", kind(/\b(flights?|planes?|travel\w*|airports?|trips?)\b/i)],
    ["office", kind(/\b(office|at work|work calls|meetings?|zoom|teams calls)\b/i)]],
  use: [["studio", kind(/\b(studio|mixing|mastering|monitoring|recording|producers?|music production)\b/i)],
    ["on_the_go", kind(/\b(on the go|commut\w*|portable|travel\w*|walks?)\b/i)],
    ["home", kind(/\b(at home|home listening|on the couch|at (my|the) desk|desktop setup)\b/i)]],
  glasses: [["painful", s => /\bglasses\b/i.test(s.text) && /\b(pain\w*|hurts?|headaches?|unbearable)\b/i.test(s.text)],
    ["some_pressure", s => /\bglasses\b/i.test(s.text) && /\b(pressure|press(es)? (on|into)|pinch\w*)\b/i.test(s.text)],
    ["fine", s => !s.negative && /\b(with|wearing|wear) (my )?glasses\b/i.test(s.text) && /\b(fine|no (problems?|issues?)|comfortabl[ey]|great|works?)\b/i.test(s.text)]],
  value: [["worth_it", tag("great value")], ["overpriced", tag("overpriced")],
    ["fair", says(/\b(fair|reasonabl[ey]) priced?\b|\bfair price\b|\bworth it (on|at|in a) (a )?(sale|discount)\b/i)]],
  detail: [["lots", tag("detailed")], ["little", tag("muddy")],
    ["little", says(re(String.raw`\blacks? (detail|resolution|clarity)\b|${NOT}\bnot (very |that )?detailed\b`))],
    ["some", says(/\b(some|decent|fair|reasonable|okay|ok) (detail|resolution)\b/i)]],
  soundstage: [["wide", tag("wide soundstage")],
    ["intimate", says(/\b(intimate|narrow|small|closed[- ]in|congested|cramped) (soundstage|stage)\b|\b(soundstage|stage) (is |feels )?(quite |pretty |rather )?(intimate|narrow|small|cramped)\b/i)],
    ["medium", says(/\b(average|decent|medium|moderate|okay|ok) (soundstage|stage)\b/i)]],
  fit: [["loose", says(/\b(falls?|fell|falling) out\b|\bloose fit\b|\bwon'?t stay\b|\bslips? out\b|\bkept slipping\b|\b(hard|difficult|struggled?) to (get a )?(good )?(seal|fit)\b/i)],
    ["tips", says(/\b(swap\w*|switch\w*|chang\w*|tr(?:y|ied|ying)|replac\w*|aftermarket|third[- ]party) (?:to |the |out |my |some |different |other |foam |silicone |wider |smaller |bigger )*(?:ear ?)?tips\b|\btip rolling\b/i)],
    ["secure", says(re(String.raw`${NOT}\b(secure|snug) fit\b|\bfits? (great|perfectly|securely|snugly|well)\b|\bstays? (in|put)\b|\bgreat fit\b`))]],
  amp: [["no", says(/\beasy to drive\b|\b(runs?|works?|sounds?) (fine|well|great) (off|from|on|with) (a |my |the |any )?(phone|laptop|dongle)\b|\bno (need for an? |need of an? )?amp\b|\bdoesn'?t need an? amp\b|\bdon'?t need an? amp\b/i)],
    ["helps", says(/\bscales? (well |nicely )?with (an? )?(amp|better source|good source)\b|\b(an )?amp helps\b|\bbenefits? from (an? )?(amp|good source)\b/i)],
    ["yes", says(re(String.raw`${NOT}\b(needs?|requires?|demands?) (a |an |some |real )?(good |dedicated |decent |powerful |proper )?(amp|amplifier|power)\b|${NOT}\bhard to drive\b`))]],
  connection: [["drops_often", s => s.tags.includes("connection issues") && /\b(constant\w*|always|keeps? (dropping|disconnecting|cutting)|frequent\w*|all the time|every few)\b/i.test(s.text)],
    ["drops_sometimes", tag("connection issues")],
    ["solid", says(re(String.raw`\b(stable|rock[- ]solid|solid|reliable|flawless) (connection|bluetooth|pairing)\b|${NOT}\bnever (drops|dropped|disconnects?|cuts? out)\b`))]],
};

/** One source's pick per group (only the groups listed). */
export function audioPicks(s: AudioSource, groups: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of groups) { const hit = (AUDIO_RULES[g] ?? []).find(([, test]) => test(s)); if (hit) out[g] = hit[0]; }
  return out;
}

type Cat = { id: string; slug: string; name: string; kind: string | null; wireless: boolean; anc: boolean };
export function buildAudioPrefill(cat: Cat[], sources: (AudioSource & { productId: string })[], built: string): Prefill {
  const by = new Map<string, (AudioSource & { productId: string })[]>();
  for (const s of sources) { const l = by.get(s.productId) ?? []; l.push(s); by.set(s.productId, l); }
  const rackets: Prefill["rackets"] = {};
  for (const r of [...cat].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const groups = audioGroupsFor(r).map(g => g.key), counts: Record<string, PrefillGroup> = {};
    const mine = by.get(r.id) ?? [];
    for (const s of mine) for (const [g, o] of Object.entries(audioPicks(s, groups))) { counts[g] ??= {}; counts[g][o] = (counts[g][o] ?? 0) + 1; }
    rackets[r.id] = { slug: r.slug, name: r.name, sources: mine.length, groups: counts, spec: {} };
  }
  return { built, rule: "One count per source and group, from the review's quick tags and its summary words (lib/thread/audio-prefill.ts); only the groups the product's kind shows.", rackets };
}
