// The Thread racket page's data, from what the live racket page already reads (app/rackets/[slug]/racket-fit.tsx builds the
// same review cards): own reviews, one YouTube summary per channel, one blog per site, the Reddit summaries (lib/reddit-cards),
// the page's own TL;DR words (lib/racket-page), the trait bars (expert How it plays first), similar rackets and the line.
import { reviewerInfo, typedName } from "../../lib/thread/display-name";
import { sideWord } from "../../lib/byline";
import { niche } from "../../lib/niche";
import { threadRows } from "./data";
import { onePerChannel, videoOf } from "../../lib/youtube-pick";
import { redditPick, subOf } from "../../lib/reddit-cards";
import { plainSummary } from "../../lib/plain-summary";
import { padelWords } from "../../lib/content-consistency";
import { isComplete } from "../../lib/complete-text";
import { pageContent, evidenceLine, marked } from "../../lib/racket-page";
import { summary } from "../../lib/product-summary";
import { similarProducts, tagProfiles, tagSimilarity } from "../../lib/similar";
import type { SimSpec } from "../../lib/thread/similar-pick";
import { modelFamily } from "../../lib/compare-pairs";
import { score, database } from "../../db/data";
import { memberMap } from "../../lib/thread/member-marks";
import { shortLine } from "../../lib/short-lines";
import { listLine } from "../../lib/list-lines";
import { styleOf } from "../../lib/fit-verdict";
import { TRAIT_LABEL } from "../../lib/trait-score";
import { SITE_FIT } from "../../lib/fit-config";
import { W } from "../../lib/thread/words";
import { tagTone, tagSays } from "../../lib/tags";
import { ago, type ThreadRow } from "./ui";
import { flightOf } from "../../lib/discgolf-profile";
import { writtenTldr } from "../../lib/thread/written-tldr";

export type RvCard = { /** A player review's typed name ("" when none), for the owner's Rename. */ alias?: string; id: string; kind: "player" | "youtube" | "blog" | "reddit" | "forum"; who: string; meta: string | null; verdict: "positive" | "mixed" | "negative" | null;
  when: string; at: string; text: string; quote: boolean; url: string | null; video: string | null; helpful: number;
  /** A player review by a signed-in member (optional accounts, drizzle/0028): a small mark by the name. */ member?: true;
  /** The version the review is about (StackRecs, the review's variant), shown as a chip. */ version?: string | null;
  /** A player review with no typed name: its level and side as reviewer info ("Intermediate · right side"), else null. */ info?: string | null };
const DG = niche.id === "discgolf", SKIN = niche.id === "skin";
/** DiscGolfRecs' trait names (lib/discgolf-fit.ts, the shown ones: Easy to throw, Distance, Accuracy, Glide, Wind), not padel's. */
const DG_TRAIT_LABEL: Record<string, string> = DG ? Object.fromEntries(SITE_FIT.traits.filter(t => !t.hidden).map(t => [t.key, t.label])) : {};
const unmd = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*\*|__/g, "").replace(/==/g, "");
const verdictOf = (n: number) => n >= 4 ? "positive" as const : n === 3 ? "mixed" as const : "negative" as const;
const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const SOCIAL = /(^|\.)(t\.me|telegram\.org|facebook\.com|instagram\.com|x\.com|twitter\.com|reddit\.com|tiktok\.com|discord\.(gg|com))$/;
const shortEnglish = (t?: string | null) => !!t && t.length >= 30 && t.length <= 320 && /^[\x00-\x7F’‘“”–…é]+$/.test(t);

export async function racketData(slug: string) {
  const { ctx, rows } = await threadRows();
  if (!ctx) return null;
  const r = ctx.data.rackets.find(x => x.slug === slug);
  if (!r) return null;
  const row = rows.get(r.id) ?? null;
  const brand = ctx.data.brands.find(b => b.id === r.brandId) ?? null;
  const now = Date.now();
  const reviews = ctx.data.reviews.filter(x => x.racketId === r.id);
  const external = ctx.data.external.filter(e => e.racketId === r.id);

  // Review cards (racket-fit.tsx rules): every own review; one YouTube card per channel; one blog per site; Reddit summaries.
  const ytProducts = new Map<string, number>(), seen = new Set<string>();
  for (const e of ctx.data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !seen.has(`${v}|${e.racketId}`)) { seen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const lv = (v?: string | null) => v ? v.toLowerCase() : null;
  const base: RvCard[] = [
    // Names (lib/thread/display-name.ts): a typed name, else one made from the level and side; those then aren't repeated.
    ...reviews.map(x => ({ id: `p-${x.id}`, kind: "player" as const, who: typedName(x.alias) ?? "", alias: typedName(x.alias) ?? "",
      // No typed name (owner 2026-11-21): no name at all; the level and side show as a small grey tag (`info`), not a username.
      info: typedName(x.alias) ? null : reviewerInfo({ level: x.playerLevel, side: x.playingSide }),
      meta: typedName(x.alias) ? [lv(x.playerLevel), x.playingSide ? (niche.id === "padel" ? `${x.playingSide.toLowerCase()} side` : sideWord(x.playingSide)) : null].filter(Boolean).join(" · ") || null : null,
      verdict: verdictOf(x.rating), at: x.createdAt, when: ago(x.createdAt, now), text: unmd(x.reviewText), quote: false, url: null, video: null, helpful: x.helpful })),
    ...onePerChannel(external.filter(e => e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).flatMap(e => {
      const english = !e.sourceLanguage || e.sourceLanguage === "en";
      const text = unmd(e.summary ? padelWords(plainSummary(e.summary)) : (!english && e.excerptTranslation) || e.excerpt || "");
      return text ? [{ id: `w-${e.id}`, kind: "youtube" as const, who: e.sourceName, meta: null, verdict: e.sentiment ?? null, at: e.sourceDate ?? "", when: ago(e.sourceDate, now), text,
        quote: !e.summary && english && !!e.excerpt, url: e.sourceUrl, video: /[?&]lc=/.test(e.sourceUrl) ? null : vid(e.sourceUrl), helpful: e.helpful }] : [];
    }),
    ...(() => {
      const hosts = new Set<string>();
      return external.filter(e => e.sourcePlatform === "Blog" && !SOCIAL.test(host(e.sourceUrl))).map(e => {
        const english = !e.sourceLanguage || e.sourceLanguage === "en";
        const text = e.summary ? unmd(padelWords(plainSummary(e.summary))) : english && shortEnglish(e.excerpt) && isComplete(unmd(e.excerpt!)) ? unmd(e.excerpt!) : "";
        return { e, text };
      }).filter(x => x.text).sort((a, b) => (b.e.sourceDate ?? "").localeCompare(a.e.sourceDate ?? ""))
        .filter(({ e }) => { const k = host(e.sourceUrl) || e.sourceName.trim().toLowerCase(); if (hosts.has(k)) return false; hosts.add(k); return true; })
        .map(({ e, text }) => ({ id: `w-${e.id}`, kind: "blog" as const, who: e.sourceName, meta: null, verdict: e.sentiment ?? null, at: e.sourceDate ?? "", when: ago(e.sourceDate, now), text,
          quote: !e.summary, url: e.sourceUrl, video: null, helpful: e.helpful }));
    })(),
    ...redditPick(ctx.data.external, r.id).map(({ row: e, text }) => ({ id: `w-${e.id}`, kind: "reddit" as const, who: subOf(e.sourceUrl, e.sourceName), meta: null, verdict: e.sentiment ?? null,
      at: e.sourceDate ?? "", when: ago(e.sourceDate, now), text: padelWords(text), quote: false, url: e.sourceUrl, video: null, helpful: (e as { helpful?: number }).helpful ?? 0 })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  // DiscGolfRecs: each review's plastic (review_variant, PR #256) as its version chip; other sites carry none.
  const plastic = niche.id === "discgolf" ? new Map<string, string>([
    ...reviews.flatMap(x => x.variant ? [[`p-${x.id}`, x.variant] as [string, string]] : []),
    ...ctx.data.external.flatMap(e => (e as { variant?: string | null }).variant ? [[`w-${e.id}`, (e as { variant?: string | null }).variant!] as [string, string]] : []),
  ]) : null;
  const cards: RvCard[] = plastic ? base.map(c => plastic.has(c.id) ? { ...c, version: plastic.get(c.id)! } : c) : base;

  // TL;DR: the page's own checked words where it has them (lib/racket-page.ts), else the most-mentioned praise and catch.
  const pc = pageContent(r.slug), sum = summary(ctx.data, r.id);
  // A summary written as TL;DR lines (lib/thread/written-tldr.ts) wins over both.
  const written = writtenTldr(r.reviewSummary);
  const lead = written?.lead ?? pc?.tagline ?? shortLine(r) ?? listLine(r) ?? row?.line ?? null;
  const plainLine = (t: string) => marked(t).map(x => x.text).join("");
  const bullets: { tone: "pos" | "mix" | "neg" | "catch"; text: string }[] = written ? [...written.bullets] : pc
    ? [...pc.yes.slice(0, 2).map(i => ({ tone: "pos" as const, text: [plainLine(i.t).replace(/\.\s*$/, ""), evidenceLine(i, DG ? W.people : undefined)].filter(Boolean).join(". ") })), ...pc.no.slice(0, 1).map(i => ({ tone: "catch" as const, text: plainLine(i.t) }))]
    : [...sum.loved.filter(t => (sum.tagCounts.get(t) ?? 0) >= 5).slice(0, 2).map(t => ({ tone: "pos" as const, text: `${sum.tagCounts.get(t)} reviews ${tagSays(t)}.` })),
      ...sum.complaints.filter(t => (sum.tagCounts.get(t) ?? 0) >= 5).slice(0, 1).map(t => ({ tone: "catch" as const, text: `${sum.tagCounts.get(t)} reviews ${tagSays(t)}.` }))];
  // SkinRecs (audit 2026-11-20): one count story. The byline counts every opinion with a clear verdict ("88 opinions
  // analysed"), so the TL;DR counts tags in those same opinions, all of them, and says "of 88 opinions". With no written
  // line and no tag 5 opinions share, the lead is the poll split, so a scored page always has a TL;DR.
  const judged = (row?.pos ?? 0) + (row?.mix ?? 0) + (row?.neg ?? 0);
  if (SKIN && !pc && !written) {
    const n = new Map<string, number>();
    for (const x of [...reviews, ...external.filter(e => e.sentiment)]) for (const t of new Set(x.tags)) n.set(t, (n.get(t) ?? 0) + 1);
    const top = (tone: "pos" | "neg") => [...n].filter(([t, c]) => c >= 5 && c <= judged && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    bullets.splice(0, bullets.length,
      ...top("pos").slice(0, 2).map(([t, c]) => ({ tone: "pos" as const, text: `${c} of ${judged} ${W.opinions} ${tagSays(t)}.` })),
      ...top("neg").slice(0, 1).map(([t, c]) => ({ tone: "catch" as const, text: `${c} of ${judged} ${W.opinions} ${tagSays(t)}.` })));
  }
  const pollLead = SKIN && !lead && judged >= 5 && row?.score != null
    ? `Of ${judged} ${W.opinions}, ${row.pos} loved it, ${row.neg} say not for me and ${row.mix} are mixed.` : null;

  // How it plays: the trait bars the live page shows (an expert's How it plays score wins), with the expert's line.
  const facts = ctx.facts(r.id), traitScores = ctx.traits(r.id).scores;
  const traits = Object.entries(DG ? DG_TRAIT_LABEL : TRAIT_LABEL).flatMap(([k, label]) => { const t = traitScores?.[k]; if (!t || t.basis === "none") return [];
    return [{ key: k, label, dots: t.dots, line: ctx.expertLine(r.id, k), expert: !!t.expert, n: t.people ? t.people.players.plus + t.people.reviewers.plus : t.plus }]; });
  const style = styleOf(facts);

  // Similar rackets (the live page's similarProducts), one per model, best liked first, and the brand's own line. Both keep
  // only each model's current row (ThreadRow.current, the classic rule), so an older year never stands in for its model.
  const pool = ctx.data.listed.filter(x => score(ctx.data, x.id).judged >= 5);
  const profiles = tagProfiles([...ctx.data.reviews, ...ctx.data.external]);
  const sim = similarProducts(r, pool, profiles, 12)
    .filter((x, i, a) => modelFamily(x) !== modelFamily(r) && a.findIndex(y => modelFamily(y) === modelFamily(x)) === i)
    .map(x => rows.get(x.id)).filter((x): x is ThreadRow => !!x && x.score != null && !!x.current).sort((a, b) => b.score! - a.score!).slice(0, niche.id === "padel" ? 4 : 2);
  // PadelRecs shows four (owner mock 2026-11-21). DiscGolfRecs (audit 2026-11-20: 3 discs with few reviews had no Similar discs): a disc whose reviews give no match is
  // filled with the same type's nearest flight numbers (speed, glide, turn, fade), one per model, scored and current.
  const fl = DG ? flightOf(r.weight) : null;
  if (fl && sim.length < 2) {
    const gap = (w: string | null) => { const f = flightOf(w); return f ? Math.abs(f.speed - fl.speed) + Math.abs(f.glide - fl.glide) + Math.abs(f.turn - fl.turn) + Math.abs(f.fade - fl.fade) : null; };
    const fam = new Map(ctx.data.listed.map(x => [x.id, modelFamily(x)])), taken = new Set(sim.map(x => fam.get(x.id)));
    const near = ctx.data.listed.filter(x => x.id !== r.id && x.shape === r.shape && modelFamily(x) !== modelFamily(r)).flatMap(x => { const d = gap(x.weight), t = rows.get(x.id);
      return d !== null && t && t.score != null && t.current ? [{ t, d }] : []; }).sort((a, b) => a.d - b.d || b.t.score! - a.t.score!).map(x => x.t);
    for (const t of near) { if (sim.length >= 2) break; if (!taken.has(fam.get(t.id))) { sim.push(t); taken.add(fam.get(t.id)); } }
  }
  // PadelRecs Similar rackets (owner bug 2026-11-21): every listed racket as a spec, for lib/thread/similar-pick.ts on the page
  // (after Often compared with takes its three). The racket itself rides along as `simSelf`.
  let simSpecs: SimSpec[] = [], simSelf: SimSpec | null = null;
  if (niche.id === "padel") {
    const tags = tagSimilarity(r, ctx.data.listed, profiles);
    const spec = (x: typeof r): SimSpec | null => { const t = rows.get(x.id); return t ? { id: x.id, family: modelFamily(x), year: x.year, shape: x.shape ?? null,
      feel: t.feel, balance: x.balance ?? null, levels: t.levels, style: styleOf(ctx.facts(x.id)), tags: tags.get(x.id) ?? 0, votes: t.pos + t.mix + t.neg } : null; };
    simSpecs = ctx.data.listed.flatMap(x => spec(x) ?? []);
    simSelf = spec(r);
  }
  const model = brand && r.name.toLowerCase().startsWith(`${brand.name.toLowerCase()} `) ? r.name.slice(brand.name.length + 1) : r.name;
  const word = model.split(" ")[0]?.toLowerCase() ?? "";
  const line = ctx.data.listed.filter(x => x.id !== r.id && x.brandId === r.brandId && modelFamily(x) !== modelFamily(r)).map(x => rows.get(x.id)).filter((x): x is ThreadRow => !!x && x.score != null && !!x.current)
    .sort((a, b) => Number(b.name.toLowerCase().includes(` ${word} `)) - Number(a.name.toLowerCase().includes(` ${word} `)) || (b.score ?? -1) - (a.score ?? -1)).slice(0, 4);
  const tagTones = Object.fromEntries([...sum.tagCounts.keys()].map(t => [t, tagTone(t)]));
  const latest = [...reviews.map(x => x.createdAt), ...external.map(x => x.sourceDate || x.createdAt)].sort().pop() ?? null;
  // Member marks (optional accounts): none without a database (CI) or before the migration.
  const own = cards.filter(c => c.kind === "player").map(c => c.id.slice(2));
  // A member's level and side come from the account, read live (a change on /account shows here on the next refresh).
  if (own.length && process.env.DATABASE_URL) {
    const m = await memberMap(await database(), "review", own), byId = new Map(reviews.map(x => [x.id, x]));
    for (const c of cards) { const p = c.kind === "player" ? m.get(c.id.slice(2)) : undefined; if (!p) continue;
      const x = byId.get(c.id.slice(2)), level = p.level ?? x?.playerLevel ?? null, side = p.side ?? x?.playingSide ?? null;
      c.member = true;
      c.meta = [lv(level), side ? (niche.id === "padel" ? `${side.toLowerCase()} side` : sideWord(side)) : null].filter(Boolean).join(" · ") || null; }
  }
  return { r, row, brand, cards, lead: lead ?? pollLead, bullets, traits, style, sim, simSpecs, simSelf, line, tagTones, latest, facts, judged };
}
