// The evidence store (ENGINE-PLAN.md section A, owner 2026-11-15): every fact about a product is one row in `evidence`
// (migration 0023): who said it, which attribute, +1 / −1 (or a level / spec value), how strongly, and the exact words.
// This file holds the pure parts: the row type, how today's data turns into rows (the backfill), and how rows add up to
// the trait-score inputs. Pure, so tests can feed plain objects.
import { TRAITS, TRAIT_TAGS, type Trait } from "./trait-score";

export const SOURCE_KINDS = ["player_report", "own_review", "youtube", "blog", "maker", "owner"] as const;
export type SourceKind = typeof SOURCE_KINDS[number];
export type Strength = 0.5 | 1 | 1.5;
export type EvidenceRow = {
  productId: string; sourceKind: SourceKind; sourceRef: string; authorKey: string | null;
  attribute: string; value: number | null; valueText: string | null; strength: Strength;
  quote: string | null; saidAt: string | null; extractedBy: string;
};

/** Readers and backfills; a better version of a reader replaces only its own rows. */
export const EXTRACTORS = {
  /** A report's quick tags (one row per tag and trait, weighted as TRAIT_TAGS). */ tags: "tags-v1",
  /** Arm comfort read from report words by lib/youtube-trait-rules.ts armFromReportText, for reports with no arm tag. */ armWords: "arm-words-v1",
  /** A YouTube channel's checked notes, netted per channel and trait (scripts/youtube-trait-mentions.mts rules). */ ytNotes: "yt-notes-v1",
  /** A level the writer states (external_reviews.player_level with level_quote, or the review form's level). */ level: "level-v1",
  /** The catalog's spec columns. */ specs: "specs-v1",
  /** A maker's stated level (db/level-sources). */ makerLevel: "maker-level-v1",
  /** The Sonnet reader pass over report text (scripts/evidence-rules.md). */ reader: "reader-v1",
} as const;

/** The report a row comes from ("p:12#tag:good control" → "p:12"), so one report can't count twice for a trait. */
export const reportOf = (ref: string) => ref.split("#")[0];

/** Today's quick tags as rows: each tag counted on the report (a good tag doesn't count on a negative report, like the
 *  finder) becomes a row per trait it feeds, with the trait's weight as strength. */
export function tagRows(r: { productId: string; ref: string; kind: SourceKind; author: string | null; at: string | null; tags: string[] }): EvidenceRow[] {
  const out: EvidenceRow[] = [];
  for (const tag of r.tags) for (const t of TRAITS) {
    const { plus, minus } = TRAIT_TAGS[t];
    for (const [list, sign] of [[plus, 1], [minus, -1]] as const) for (const [name, w] of list) if (name === tag)
      out.push({ productId: r.productId, sourceKind: r.kind, sourceRef: `${r.ref}#tag:${tag}`, authorKey: r.author, attribute: t, value: sign,
        valueText: null, strength: w as Strength, quote: tag, saidAt: r.at, extractedBy: EXTRACTORS.tags });
  }
  return out;
}

export type TraitTotals = { net: number; plus: number; minus: number };
/** What trait-score needs per product, from rows: reports that carry evidence ("tagged"), and per trait the weighted net,
 *  praising voices (strength 1+) and complaints from players, plus YouTube channels that praise or fault it.
 *  Tag rows count as today. A reader row counts only when its report has no tag row for that trait (one report, one voice),
 *  as +value × strength, a voice when strength ≥ 1. */
export function evidenceTotals(rows: EvidenceRow[], taggedReports: Map<string, Set<string>>) {
  const out = new Map<string, { tagged: number; traits: Partial<Record<Trait, TraitTotals>>; youtube: Partial<Record<Trait, { plus: number; minus: number }>> }>();
  const get = (id: string) => { let o = out.get(id); if (!o) { o = { tagged: taggedReports.get(id)?.size ?? 0, traits: {}, youtube: {} }; out.set(id, o); } return o; };
  const isTrait = (a: string): a is Trait => (TRAITS as readonly string[]).includes(a);
  // Reports with a tag row per product and trait, so a reader row on the same report and trait is left out.
  const tagged = new Set(rows.filter(r => r.extractedBy === EXTRACTORS.tags).map(r => `${r.productId}|${reportOf(r.sourceRef)}|${r.attribute}`));
  const readerReports = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!isTrait(r.attribute) || r.value === null) continue;
    const o = get(r.productId);
    if (r.extractedBy === EXTRACTORS.ytNotes) { const y = (o.youtube[r.attribute] ??= { plus: 0, minus: 0 }); if (r.value > 0) y.plus++; else if (r.value < 0) y.minus++; continue; }
    if (r.extractedBy === EXTRACTORS.reader && tagged.has(`${r.productId}|${reportOf(r.sourceRef)}|${r.attribute}`)) continue;
    if (![EXTRACTORS.tags, EXTRACTORS.armWords, EXTRACTORS.reader].includes(r.extractedBy as never)) continue;
    const t = (o.traits[r.attribute] ??= { net: 0, plus: 0, minus: 0 });
    t.net += r.value * r.strength;
    if (r.value > 0 && r.strength >= 1) t.plus++;
    if (r.value < 0) t.minus++;
    if (r.extractedBy === EXTRACTORS.reader) { const s = readerReports.get(r.productId) ?? new Set(); s.add(reportOf(r.sourceRef)); readerReports.set(r.productId, s); }
  }
  // A report with only reader evidence joins the pool the shares are taken over, like a tagged one.
  for (const [id, reps] of readerReports) { const o = get(id), had = taggedReports.get(id) ?? new Set(); o.tagged = had.size + [...reps].filter(x => !had.has(x)).length; }
  return out;
}

/** The sentence of `text` that holds a match, as an exact substring (for rule-read rows' quotes). */
export function sentenceWith(text: string, test: (s: string) => boolean): string | null {
  const parts = text.match(/[^.!?\n]+[.!?]*/g) ?? [];
  const hit = parts.map(s => s.trim()).find(s => s.length >= 12 && test(s));
  return hit && text.includes(hit) ? hit : null;
}

/** A quote that compares or sets a condition ("slightly larger than the Pro 5", "less restrictive than expected",
 *  "generous when attacking from the net", "good for a diamond") says less about the racket on its own: such reader rows
 *  count at most 0.5 (owner 2026-11-15). */
export const COMPARISON = /\b(than|compared|expected|when|for a)\b/i;

export type Balance = { P: number; C: number; voices: number; plusVoices: number; minusVoices: number;
  /** People counted for the line under a bar: players (and our reviewers) and YouTube reviewers, praising or faulting. */
  people: { players: { plus: number; minus: number }; reviewers: { plus: number; minus: number } } };
/** Praise (P) and complaints (C) per product and trait, one voice once (owner 2026-11-15, scorer v2): a voice is a person or
 *  channel where we know one (`voiceOf`), else the report. A voice's rows net out to praise or complaint at the strength of its
 *  strongest row that way. YouTube channels count YT_WEIGHT. Tag, arm-word, reader and YouTube rows all count. */
export function evidenceBalance(rows: EvidenceRow[], voiceOf: (report: string) => string, ytWeight = 2) {
  const isTrait = (a: string): a is Trait => (TRAITS as readonly string[]).includes(a);
  const used = new Set<string>([EXTRACTORS.tags, EXTRACTORS.armWords, EXTRACTORS.reader, EXTRACTORS.ytNotes]);
  const by = new Map<string, { v: number; s: number }[]>();
  const voiceKinds = new Map<string, boolean>(); // voice key → a YouTube reviewer (channel notes or a channel's video summary)
  for (const r of rows) {
    if (!isTrait(r.attribute) || r.value === null || !r.value || !used.has(r.extractedBy)) continue;
    const yt = r.extractedBy === EXTRACTORS.ytNotes;
    const voice = yt ? r.authorKey ?? r.sourceRef : voiceOf(reportOf(r.sourceRef));
    const s = (r.extractedBy === EXTRACTORS.reader && r.quote && COMPARISON.test(r.quote) ? Math.min(r.strength, 0.5) : r.strength) * (yt ? ytWeight : 1);
    const k = `${r.productId}\u0000${r.attribute}\u0000${voice}`;
    if (yt || voice.startsWith("YouTube:")) voiceKinds.set(k, true);
    (by.get(k) ?? by.set(k, []).get(k)!).push({ v: Math.sign(r.value), s });
  }
  const out = new Map<string, Partial<Record<Trait, Balance>>>();
  for (const [k, xs] of by) {
    const [id, t] = k.split("\u0000") as [string, Trait];
    const net = xs.reduce((a, x) => a + x.v * x.s, 0);
    if (!net) continue;
    const s = Math.max(...xs.filter(x => (x.v > 0) === (net > 0)).map(x => x.s));
    const o = out.get(id) ?? out.set(id, {}).get(id)!;
    const b = (o[t] ??= { P: 0, C: 0, voices: 0, plusVoices: 0, minusVoices: 0, people: { players: { plus: 0, minus: 0 }, reviewers: { plus: 0, minus: 0 } } });
    b.voices++;
    const who = voiceKinds.get(k) ? b.people.reviewers : b.people.players;
    if (net > 0) who.plus++; else who.minus++;
    if (net > 0) { b.P += s; b.plusVoices++; } else { b.C += s; b.minusVoices++; }
  }
  return out;
}
