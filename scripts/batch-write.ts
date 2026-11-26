// Creator review cards through the Claude API Message Batches endpoint (any niche via NICHE; first used for PickleballRecs
// paddles 81+), so bulk card writing
// is billed to the API account instead of the Claude Code allowance. Staging files only: no DB reads or writes.
//
// Steps (each resumable; state lives in <stage>/state.json):
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-write.ts inputs  --stage <dir> --slugs a,b,c --sources <grok out dir> \
//        --pack <grok pack .md> --transcripts <dir> [--name "<product name>"]   # no LLM: links, metadata, transcripts, blog text;
//        merges into the stage by URL (a URL keeps its id and results), so packs can be added and re-runs pick up new transcripts
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-write.ts write   --stage <dir> [--max-usd 15]   # writer batch: submit
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-write.ts check   --stage <dir> [--max-usd 15]   # checker batch: submit
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-write.ts poll    --stage <dir> [--wait]         # poll + collect the open batch
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-write.ts build   --stage <dir>                  # staging JSON + report
//
// Writer and checker follow the brief used for paddles 1-80 (READER-BRIEF.md / SUMMARY-PROMPT.md / CHECK-BRIEF.md in the
// shared notes): exact model only, creator scores only with a stated scale, words not invented numbers, copy rules (no em or
// en dashes, no we/us/our, never "verdict", they/them, "players" not "owners", never claim the site tested anything).
// Every card the checker passes or fixes is then checked by code (word counts, highlights, banned words, quote found word for
// word in the source with its caption time) before it is staged. The run stops before submitting a batch whose estimated
// cost would take the stage's total over --max-usd.
import Anthropic from "@anthropic-ai/sdk";
import { niche } from "../lib/niche";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Out of API credit (owner 2026-11-24: the promo credit runs out; stop at once with a clear note, the key gets swapped).
const BILLING = /credit balance|billing|payment required|insufficient|quota|spend limit/i;
function stopIfBilling(e: unknown): never {
  const msg = String((e as { message?: string })?.message ?? e);
  if (BILLING.test(msg) || (e as { status?: number })?.status === 402) {
    console.error("\nSTOP: the Anthropic API account is out of credit (\"credit balance too low\" or a billing error).\n" +
      "Swap ANTHROPIC_API_KEY in .env.local, then re-run the same step: the stage state is kept and nothing is lost.\n");
    process.exit(3);
  }
  throw e;
}
const MODEL = "claude-sonnet-5-5";
// Niche from NICHE (required): site name, domain, product word and page path come from lib/niche. The attribute names,
// shape/thickness wording and the blocklists below were written for pickleball; review them before running another niche.
if (!process.env.NICHE) throw new Error("Set NICHE (e.g. NICHE=pickleball): the niche config defaults to padel otherwise.");
const SITE = niche.site.name, ITEM = niche.words.one, SPORT_ITEM = `${niche.id} ${niche.words.one}`;
// Message Batches bill at 50% of the standard rate. Claude Sonnet 5.5 standard: $2 / MTok in, $10 / MTok out,
// cache reads $0.10, 5-minute cache writes 1.25x input.
const PRICE = { input: 1.0, output: 5.0, cacheRead: 0.05, cacheWrite: 1.25 }; // $ per MTok, batch rate
const DROP = new Set(["FORWRD", "Man vs Debt", "REDTACKLE", "PickleballCentral", "Pickleball Hustle"]);
/** Channels the owner dropped for every paddle (2026-11-23: The Kitchen Pickle YouTube and TikTok, with its site). */
const BLOCK_CREATORS = /^the kitchen( pickle(ball)?)?$|padel\.how|streltcoff|pickleball3/i;
/** Sites the owner dropped for every paddle (2026-11-23: thekitchenpickle.com reads as AI content with no real testing). */
// Owner 2026-11-24: padel.how reads as AI-generated (no real play, figures estimated from spec sheets); pickleball3.com likewise.
const BLOCK_DOMAINS = ["thekitchenpickle.com", "padel.how", "pickleball3.com"];
const blocked = (u: string | null | undefined) => !!u && BLOCK_DOMAINS.some(d => new RegExp(`(^|[/.])${d.replace(/\./g, "\\.")}(/|$)`, "i").test(u.replace(/^https?:\/\//, "")));
const ATTR_NAMES = ["power", "control", "spin", "pop", "forgiveness", "comfort", "durability", "value"] as const;
const WORDS = ["Excellent", "Great", "Good", "Okay", "Weak"] as const;
const STANCES = ["Loved it", "Mixed", "Not for me"] as const;

const args = process.argv.slice(2), cmd = args[0];
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const has = (n: string) => args.includes(`--${n}`);
const need = (n: string) => { const v = flag(n); if (!v) throw new Error(`--${n} is required`); return v; };
const STAGE = need("stage");
const MAX_USD = Number(flag("max-usd") ?? 15);

// ---------------------------------------------------------------- state
type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; usd: number };
type Source = {
  id: string; slug: string; paddle: string; url: string; kind: "youtube" | "blog"; creator: string; grok_creator: string;
  language: string | null; date: string | null; duration_s: number | null; channel_url: string | null; video_id: string | null;
  chapters: { t: string; title: string }[]; starts_at: string | null; description: string; text: string | null;
  link_check: Record<string, unknown>; skip: string | null; grok_note: string;
};
type State = {
  slugs: string[]; packNotes: Record<string, string>;
  batches: { step: "write" | "check"; id: string; submitted: string; requests: number; estimate_usd: number; collected: boolean }[];
  usage: Record<string, Usage>; // by "<step>:<source id>"
};
const statePath = join(STAGE, "state.json");
const loadState = async (): Promise<State> => existsSync(statePath) ? JSON.parse(await readFile(statePath, "utf8"))
  : { slugs: [], packNotes: {}, batches: [], usage: {} };
const saveState = (s: State) => writeFile(statePath, JSON.stringify(s, null, 1));
const readJson = async <T>(p: string): Promise<T> => JSON.parse(await readFile(p, "utf8"));
const loadSources = async (s: State) => (await Promise.all(s.slugs.map(slug =>
  readJson<Source[]>(join(STAGE, "inputs", `${slug}.json`))))).flat();

// ---------------------------------------------------------------- inputs (no LLM)
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9" };
const vid = (u: string) => u.match(/(?:v=|youtu\.be\/|shorts\/|live\/)([\w-]{11})/)?.[1] ?? null;
const unescapeJson = (s: string) => { try { return JSON.parse(`"${s}"`) as string; } catch { return s; } };
const fmtT = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`; };
const chaptersOf = (desc: string) => desc.split("\n").map(l => l.match(/^\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–—:|]?\s*(.+)$/))
  .filter((m): m is RegExpMatchArray => !!m).map(m => ({ t: m[1], title: m[2].trim() }));

async function htmlText(url: string): Promise<{ status: number; text: string; title: string }> {
  const r = await fetch(url, { headers: UA, redirect: "follow" });
  const html = await r.text();
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const body = (html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html)
    .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h\d|tr|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"').replace(/&[a-z]+;/g, " ")
    .split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  return { status: r.status, text: body, title };
}

async function inputs() {
  const slugs = need("slugs").split(",").map(s => s.trim()).filter(Boolean);
  const srcDir = need("sources"), tDir = need("transcripts"), pack = await readFile(need("pack"), "utf8");
  await mkdir(join(STAGE, "inputs"), { recursive: true });
  const state = await loadState();
  state.slugs = [...new Set([...state.slugs, ...slugs])]; // a stage can take several packs (e.g. 141-159 + 160-178)
  for (const slug of slugs) {
    const sec = pack.split(/\n(?=## )/).find(b => b.startsWith(`## ${slug}\n`)) ?? "";
    if (sec.trim()) state.packNotes[slug] = [state.packNotes[slug], sec.trim()].filter(Boolean).filter((x, k, a) => a.indexOf(x) === k).join("\n\n");
    const page = await htmlText(`https://www.${niche.site.domain}/${niche.productPath}/${slug}`);
    const paddle = flag("name") ?? (page.title.replace(new RegExp(`\\s*review\\s*\\|\\s*${SITE}\\s*$`, "i"), "").trim() || slug);
    const grok = await readJson<{ sources: Record<string, string | null>[] }>(join(srcDir, `${slug}.json`));
    // Merge with what this stage already has for the product (another pack, or a re-run once transcripts exist): a URL keeps
    // its id, so its writer/checker results stay attached; new URLs get the next free id.
    const inPath = join(STAGE, "inputs", `${slug}.json`);
    const existing: Source[] = existsSync(inPath) ? await readJson<Source[]>(inPath) : [];
    const byUrl = new Map(existing.map(s => [s.url, s]));
    let next = existing.reduce((m, s) => Math.max(m, Number(s.id.split("__")[1]) + 1), 0);
    const out: Source[] = existing.filter(s => !grok.sources.some(g => String(g.url) === s.url));
    for (const g of grok.sources) {
      const url = String(g.url), v = vid(url);
      const id = byUrl.get(url)?.id ?? `${slug}__${String(next++).padStart(2, "0")}`;
      const s: Source = { id, slug, paddle, url, kind: v ? "youtube" : "blog",
        creator: String(g.creator ?? ""), grok_creator: String(g.creator ?? ""), language: (g.language as string) ?? null,
        date: (g.date as string) ?? null, duration_s: null, channel_url: null, video_id: v, chapters: [],
        starts_at: (g.starts_at as string) ?? null, description: "", text: null, link_check: {}, skip: null,
        grok_note: [g.exact_model_shown && `exact model shown (per Grok): ${g.exact_model_shown}`, g.why_relevant && `why (per Grok): ${g.why_relevant}`]
          .filter(Boolean).join("; ") };
      try {
        if (v) {
          const oe = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { headers: UA });
          if (oe.ok) { const o = await oe.json() as { author_name: string; author_url: string }; s.creator = o.author_name; s.link_check.oembed_author = o.author_name; }
          else { s.link_check.oembed = oe.status; s.skip = `oEmbed ${oe.status} (video unavailable)`; }
          const html = await (await fetch(`https://www.youtube.com/watch?v=${v}`, { headers: UA })).text();
          s.duration_s = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? "") || null;
          s.date = html.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/)?.[1] ?? s.date;
          const ch = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1]; if (ch) s.channel_url = `https://www.youtube.com/channel/${ch}`;
          s.description = unescapeJson(html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1] ?? "");
          s.chapters = chaptersOf(s.description);
          const tp = join(tDir, `${v}.txt`);
          if (existsSync(tp)) s.text = (await readFile(tp, "utf8")).replace(/\s+/g, " ").trim();
          else if (!s.skip) s.skip = "no transcript available";
          if (s.duration_s && s.duration_s < 61 && !s.skip) s.skip = "short (under a minute)";
        } else {
          const p = await htmlText(url);
          s.link_check.http = p.status;
          if (p.status !== 200) s.skip = `HTTP ${p.status}`;
          else if (p.text.length < 1500) s.skip = "page text under 1,500 characters (not a full review, or blocked)";
          s.text = p.text;
        }
        if (DROP.has(s.creator)) s.skip = "source the owner dropped";
        if (blocked(url) || BLOCK_CREATORS.test(s.creator) || BLOCK_CREATORS.test(s.grok_creator)) s.skip = "source the owner dropped (blocklist)";
      } catch (e) { s.skip = `fetch failed: ${(e as Error).message}`; }
      out.push(s);
      process.stdout.write(`${s.skip ? "skip" : "ok  "} ${s.id} ${s.kind} ${s.creator} ${s.text ? s.text.length : 0} chars${s.skip ? ` (${s.skip})` : ""}\n`);
    }
    await writeFile(join(STAGE, "inputs", `${slug}.json`), JSON.stringify(out, null, 1));
  }
  await saveState(state);
}

// ---------------------------------------------------------------- prompts and schemas
const COPY_RULES = `Copy rules for every text field:
- Start every sentence of summary and summary_more with a verb, no subject: "Tests it over three weeks...", "Finds the sweet spot...". Never "This reviewer", "The creator", "He", "She" or "They" as the first word.
- Never name the channel, the creator or the site in any text field. Other ${niche.words.many} by name are fine.
- Refer to the creator only as "they/them". Never "he", "she", "his", "her".
- No em dashes or en dashes anywhere. Use commas, colons or full stops.
- Never use the word "verdict". Write "players", not "owners". Never "we", "us" or "our". Say "reviewers", never "creators".
- Never write that the site or anyone at the site tested the ${ITEM}.
- No prices anywhere (owner 2026-11-24: quoted prices go stale, live prices live in the price box): no currency amounts ($92, 390 euro, €220, under $100), no "list price", "MSRP", "costs X", "at $X with a code", "$150 more". Value words without a number are fine ("good value", "pricey for what it offers", "cheaper than X"). No price keys in measured.
- Name another product only by its exact model and edition, so readers (and the site's product links) know which one. Reviewers often use shorthand ("the Hard", "the Control", "the Vertex", "the Viper", "the Pro", "the 16mm"): resolve it to the exact model from context. Same family first (in a Metalbone 3.5 2026 review, "the Hard" is the Adidas Metalbone HRD+ 3.5 2026); otherwise the model current at the source's date ("the Vertex" in a late-2025 video is the Bullpadel Vertex 05 2026); use any extra hint in the source (edition, colour, player). Write the full name ("Babolat Technical Viper 2026"), never the line or brand alone. Only when it stays ambiguous, leave the comparison unnamed or describe the feel instead ("sits between soft and firm"). (Owner 2026-11-24.)
- Spell every product name exactly as the site catalog does. Transcripts often mishear names (Fenix as "Phoenix", AT10 as "AT", Xplo as "Explo", Vertex as "Vortex"); correct them to the catalog spelling, and if a name cannot be pinned down, write "another ${ITEM}". (Owner 2026-11-24.)
- Never repeat a review site's own star, category or overall ratings in the text (Pickleheads scores are hidden until their scale is confirmed). Describe them in words instead.
- Plain, dry English. No hype words unless inside the exact quote.
- Facts only from the source. Report opinions as theirs ("Finds", "Calls", "Rates"). When captions garble a number or a ${ITEM} name, leave it out rather than guess. Spell paddle and brand names correctly even if captions misspell them; if a garbled name cannot be pinned down, write "another ${ITEM}".`;

const FIELDS = `Card fields:
- type: "review", "comparison" (a real part compares it head to head) or "long-term" (weeks or months of use stated).
- version: the shape/thickness/edition the source covers, as stated (e.g. "Widebody, 16mm"), or null.
- starts_at: "m:ss" where the part about this ${ITEM} starts in a multi-${ITEM} video, else null.
- creator_score: only if the source publishes its own overall score with a stated scale (e.g. 8.5 out of 10). Otherwise null. Never turn words into a number. Per-trait scores without an overall do not count.
- measured: only numbers the source states for this ${ITEM} (swing weight, twist weight, static weight, RPM, mph, balance point; never a price), as {name, value} with the unit in value.
- attributes: only those the source discusses, each one word from Excellent, Great, Good, Okay, Weak. Names: power, control, spin, pop, forgiveness (sweet spot), comfort (feel, vibration, arm), durability, value. In doubt go one lower.
- stance: "Loved it", "Mixed" or "Not for me".
- summary: ONE paragraph of 80 to 120 words with real substance: what they tested and how (drills, matches, hours, weeks, comparisons, pre-production unit), concrete findings (power, control, spin, pop, sweet spot, feel, weight, durability or grit wear) with the source's own numbers, and who they say it suits and who it doesn't.
- summary_more: a second paragraph of 60 to 100 words for "Read more" (comparisons, long-term notes, setup tips like lead tape or grip). null if the source does not go deeper; never pad.
- highlights: 3 to 5 phrases of 2 to 7 words, copied character for character from summary.
- key_point: ONE sentence, 6 to 12 words, at most 70 characters, ends with a full stop, NOT verb-first, concrete, e.g. "Best defensive ${ITEM} in the line this year." No names, no dashes.
- stood_out: one short line (at most 15 words): what they liked most.
- trade_off: one short line (at most 15 words): the main weakness or who it is not for, or null.
- compared_to: names of the other ${niche.words.many} they compare it with (correct spelling), or [].
- quote: one sentence they actually said or wrote about THIS ${ITEM}, copied word for word from the source text, 4 to 14 words. Fix nothing inside it. null if no good line. Never make one up.
- disclosure: any brand tie the source states (${ITEM} sent by the brand, paid testing, affiliate or discount code, sells it), in plain words, or null.`;

const WRITER_SYSTEM = `You write creator review cards for ${SITE}, a site that collects what YouTube and blog reviewers said about each ${SPORT_ITEM}. One request = one source (a video transcript or an article) for one ${ITEM}.

First decide whether the source is usable. Set keep=false (with drop_reason) when:
- it is not about the EXACT ${ITEM} named in the request. Shape (elongated, hybrid, widebody, standard), thickness (14mm, 16mm), face, edition and generation all matter; a sibling shape, thickness or generation is a different ${ITEM}. Keep it only if the source itself names or clearly shows this exact model; never infer the shape or thickness. If only a part of a multi-paddle video covers it, keep it and use only that part.
- it is a shop or brand channel, an unboxing with no opinion, a sale post, a spec-only video or page, or has too little about this ${ITEM} to write an 80-word summary.
- it is an article by a shop or retailer (sells ${niche.words.many}, buy links, store discount codes) that does not describe real hands-on testing of this ${ITEM} by a named person: sessions played, drills, matches, measurements or direct comparisons. Restated maker specs and generic praise are not testing.
- it comes from ${BLOCK_DOMAINS.join(", ")} or from The Kitchen Pickle / The Kitchen Pickleball channels (dropped by the site owner for every ${ITEM}).
The notes from the link finder (Grok) are unverified hints, often wrong. The source text is the only authority.

${FIELDS}

${COPY_RULES}

Before answering, check: summary 80-120 words, summary_more 60-100 words or null, every highlight appears exactly in summary, key_point at most 70 characters ending with a full stop, every number appears in the source, the quote appears word for word in the source.`;

const CHECKER_SYSTEM = `You fact-check one creator review card for ${SITE} against its source (a video transcript or an article). A different writer produced the card. Read the whole source, then go through summary, summary_more, key_point, stood_out, trade_off, compared_to, measured, creator_score, attributes, stance, quote and disclosure claim by claim.

A claim is supported only if the source says it about THIS exact ${ITEM} (or as a direct comparison with it). Numbers must match what is said. Watch for: claims about a sibling shape, thickness or another ${ITEM} in a multi-${ITEM} video; invented test details (hours, weeks, matches, levels); hedges dropped ("probably", "I think"); opinions turned into facts; garbled caption names written as if certain; a quote that is not word for word in the source; a creator_score without a stated scale; a disclosure that does not match what the source says.

Decide:
- "pass": everything supported and the copy rules are met.
- "fixed": some claims were unsupported or wrong, or copy rules were broken; you corrected them with the smallest edits. Return the full corrected card.
- "reject": the card is mostly wrong, the source is not about this exact ${ITEM}, or it cannot support an 80-word summary.
List every problem you found in problems (empty for pass).

${FIELDS}

${COPY_RULES}`;

const nul = (t: object) => ({ anyOf: [t, { type: "null" }] });
const str = { type: "string" }, strArr = { type: "array", items: str };
const CARD_PROPS = {
  type: { type: "string", enum: ["review", "comparison", "long-term"] },
  version: nul(str), starts_at: nul(str),
  creator_score: nul({ type: "object", properties: { value: { type: "number" }, scale: { type: "number" } }, required: ["value", "scale"], additionalProperties: false }),
  measured: { type: "array", items: { type: "object", properties: { name: str, value: str }, required: ["name", "value"], additionalProperties: false } },
  attributes: { type: "array", items: { type: "object", properties: { name: { type: "string", enum: [...ATTR_NAMES] }, word: { type: "string", enum: [...WORDS] } },
    required: ["name", "word"], additionalProperties: false } },
  stance: { type: "string", enum: [...STANCES] },
  summary: str, summary_more: nul(str), highlights: strArr, key_point: str, stood_out: str, trade_off: nul(str),
  compared_to: strArr, quote: nul(str), disclosure: nul(str),
};
const obj = (props: Record<string, unknown>) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });
const WRITER_SCHEMA = obj({ keep: { type: "boolean" }, drop_reason: nul(str), exact_model_evidence: nul(str), card: nul(obj(CARD_PROPS)) });
const CHECKER_SCHEMA = obj({ result: { type: "string", enum: ["pass", "fixed", "reject"] }, problems: strArr, card: nul(obj(CARD_PROPS)) });
type Card = { type: string; version: string | null; starts_at: string | null; creator_score: { value: number; scale: number } | null;
  measured: { name: string; value: string }[]; attributes: { name: string; word: string }[]; stance: string; summary: string;
  summary_more: string | null; highlights: string[]; key_point: string; stood_out: string; trade_off: string | null;
  compared_to: string[]; quote: string | null; disclosure: string | null };

function sourceBlock(s: Source, notes: string) {
  return [`${niche.words.One}: ${s.paddle} (page slug: ${s.slug})`, `Source: ${s.kind === "youtube" ? "YouTube video" : "article"} ${s.url}`,
    s.date && `Published: ${s.date}`, s.duration_s && `Length: ${fmtT(s.duration_s)}`, s.starts_at && `Part about this ${ITEM} starts near (per Grok): ${s.starts_at}`,
    s.grok_note && `Link finder note: ${s.grok_note}`, notes && `Link finder notes for this ${ITEM} (unverified):\n${notes.slice(0, 4000)}`,
    s.chapters.length ? `Chapters (from the description):\n${s.chapters.map(c => `${c.t} ${c.title}`).join("\n")}` : "",
    s.kind === "youtube" && s.description ? `Video description (for disclosures and specs only):\n${s.description.slice(0, 3000)}` : "",
    `${s.kind === "youtube" ? "Transcript (auto-captions)" : "Article text"}:\n"""\n${s.text}\n"""`].filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------- cost
const usd = (u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }) =>
  (u.input_tokens * PRICE.input + u.output_tokens * PRICE.output + (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
    (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) / 1e6;
const spent = (s: State) => Object.values(s.usage).reduce((a, u) => a + u.usd, 0);
/** Spend across every stage folder next to this one (pb-batch-*), so --max-usd caps the whole run, not one stage. */
async function runSpent(s: State) {
  const parent = join(STAGE, "..");
  let total = spent(s);
  for (const d of await readdir(parent)) {
    const f = join(parent, d, "state.json");
    if (!d.startsWith("pb-batch-") || join(parent, d) === join(STAGE) || !existsSync(f)) continue;
    total += spent(await readJson<State>(f));
  }
  return total;
}
// Rough pre-submit estimate: 1 token per 3.5 characters in, plus an output allowance per request (thinking included).
const estimate = (chars: number, n: number, outPer: number) => (chars / 3.5 * PRICE.input + n * outPer * PRICE.output) / 1e6;

// ---------------------------------------------------------------- submit
const client = () => new Anthropic();
async function submit(step: "write" | "check") {
  const state = await loadState();
  if (state.batches.some(b => !b.collected)) throw new Error("A batch is still open: run poll first.");
  // Re-runs only send sources without a good result yet (e.g. videos whose transcript arrived later).
  const prev = existsSync(join(STAGE, `${step}-results.json`)) ? await readJson<Record<string, { error?: string }>>(join(STAGE, `${step}-results.json`)) : {};
  const sources = (await loadSources(state)).filter(s => !s.skip && s.text && (!prev[s.id] || prev[s.id].error) &&
    !blocked(s.url) && !BLOCK_CREATORS.test(s.creator) && !BLOCK_CREATORS.test(s.grok_creator) &&
    (!flag("slugs") || flag("slugs")!.split(",").includes(s.slug))); // --slugs: submit only these products (e.g. pages already live)
  let items: { id: string; system: string; user: string; schema: object }[];
  if (step === "write") {
    items = sources.map(s => ({ id: s.id, system: WRITER_SYSTEM, schema: WRITER_SCHEMA,
      user: `${sourceBlock(s, state.packNotes[s.slug] ?? "")}\n\nWrite the card for ${s.paddle}, or drop the source.` }));
  } else {
    const written = await readJson<Record<string, { keep: boolean; card: Card | null }>>(join(STAGE, "write-results.json"));
    items = sources.filter(s => written[s.id]?.keep && written[s.id].card).map(s => ({ id: s.id, system: CHECKER_SYSTEM, schema: CHECKER_SCHEMA,
      user: `${sourceBlock(s, "")}\n\nCard to check (JSON):\n${JSON.stringify(written[s.id].card, null, 1)}` }));
  }
  if (!items.length) throw new Error("Nothing to submit.");
  const est = estimate(items.reduce((a, i) => a + i.system.length + i.user.length, 0), items.length, 5000);
  const total = await runSpent(state);
  console.log(`${step}: ${items.length} requests, estimate $${est.toFixed(2)}; spent so far $${total.toFixed(2)} of $${MAX_USD} (all stages)`);
  if (total + est > MAX_USD) throw new Error(`Stopping: the estimate would pass the $${MAX_USD} cap.`);
  if (has("dry")) return;
  const batch = await client().messages.batches.create({
    requests: items.map(i => ({ custom_id: `${step}__${i.id}`, params: {
      model: MODEL, max_tokens: 16000,
      system: [{ type: "text", text: i.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: i.user }],
      output_config: { effort: "high", format: { type: "json_schema", schema: i.schema as Record<string, unknown> } },
    } })),
  }).catch(stopIfBilling);
  state.batches.push({ step, id: batch.id, submitted: new Date().toISOString(), requests: items.length, estimate_usd: est, collected: false });
  await saveState(state);
  console.log(`Submitted ${step} batch ${batch.id}`);
}

async function poll() {
  const state = await loadState();
  const open = state.batches.find(b => !b.collected);
  if (!open) { console.log("No open batch."); return; }
  const c = client();
  for (;;) {
    const b = await c.messages.batches.retrieve(open.id).catch(stopIfBilling);
    console.log(`${open.step} ${open.id}: ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === "ended") break;
    if (!has("wait")) return;
    await new Promise(r => setTimeout(r, 60_000));
  }
  const file = join(STAGE, `${open.step}-results.json`);
  const results: Record<string, unknown> = existsSync(file) ? await readJson(file) : {};
  for await (const r of await c.messages.batches.results(open.id).catch(stopIfBilling)) {
    const id = r.custom_id.replace(/^(write|check)__/, "");
    if (r.result.type === "errored" && BILLING.test(JSON.stringify(r.result))) stopIfBilling(new Error(JSON.stringify(r.result)));
    if (r.result.type !== "succeeded") { results[id] = { error: r.result.type }; continue; }
    const m = r.result.message;
    const u = m.usage;
    state.usage[`${open.step}:${id}`] = { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0, usd: usd(u) };
    if (m.stop_reason === "refusal" || m.stop_reason === "max_tokens") { results[id] = { error: m.stop_reason }; continue; }
    const text = m.content.filter(b => b.type === "text").map(b => b.text).join("");
    try { results[id] = JSON.parse(text); } catch { results[id] = { error: "unparseable", text }; }
  }
  open.collected = true;
  await writeFile(file, JSON.stringify(results, null, 1));
  await saveState(state);
  console.log(`Collected ${open.step}: ${Object.keys(results).length} results; total spent $${spent(state).toFixed(2)}`);
}

// ---------------------------------------------------------------- code checks and build
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
async function quoteAt(videoId: string, quote: string, tDir: string): Promise<string | null> {
  const p = join(tDir, `${videoId}.seg.json`);
  if (!existsSync(p)) return null;
  const seg = await readJson<[string, string][]>(p), words = norm(quote).split(" ");
  const stream: { w: string; t: string }[] = [];
  for (const [t, txt] of seg) for (const w of norm(txt ?? "").split(" ").filter(Boolean)) stream.push({ w, t });
  for (let i = 0; i + words.length <= stream.length; i++) if (words.every((w, k) => stream[i + k].w === w)) return stream[i].t;
  return null;
}
const PRICE_TEXT = /[€$£]\s?\d|\d[\d.,]*\s?(€|euros?\b|eur\b|dollars?\b|usd\b|bucks\b|gbp\b)|\blist price\b|\bmsrp\b|\bretails? (for|at)\b|\bcosts? (about |around |roughly )?[€$£]?\d/i;
function codeCheck(c: Card, s: Source): string[] {
  const p: string[] = [], wc = (x: string | null) => x ? x.trim().split(/\s+/).length : 0;
  if (wc(c.summary) < 80 || wc(c.summary) > 120) p.push(`summary ${wc(c.summary)} words`);
  if (c.summary_more && (wc(c.summary_more) < 60 || wc(c.summary_more) > 100)) p.push(`summary_more ${wc(c.summary_more)} words`);
  if (c.highlights.length < 3 || c.highlights.length > 5 || new Set(c.highlights).size !== c.highlights.length) p.push("highlights count");
  for (const h of c.highlights) if (!c.summary.includes(h)) p.push(`highlight not in summary: ${h}`);
  if (!c.key_point || c.key_point.length > 70 || !c.key_point.endsWith(".")) p.push(`key_point: ${c.key_point}`);
  const all = [c.summary, c.summary_more, c.key_point, c.stood_out, c.trade_off].filter(Boolean).join(" ");
  if (/[—–]/.test(all)) p.push("dash");
  if (PRICE_TEXT.test(all) || (c.measured ?? []).some(m => /price|cost|msrp/i.test(m.name) || PRICE_TEXT.test(m.value))) p.push("price in text");
  if (/verdict|\b(we|us|our|owners?|creators?)\b/i.test(all.replace(/\bU\.?S\.?\b/g, ""))) p.push("banned word");
  if (/\b(he|she|his|her|him|hers)\b/i.test(all)) p.push("gendered pronoun");
  for (const w of s.creator.split(/\W+/).filter(w => w.length > 3 && !/^(pickleball|pickle|paddle|paddles|padel|racket|rackets|review|reviews)$/i.test(w)))
    if (new RegExp(`\\b${w}\\b`).test(all)) p.push(`creator name? ${w}`);
  if (blocked(s.url) || BLOCK_CREATORS.test(s.creator)) p.push("blocked source");
  if (/pickleheads/i.test(s.creator) && (c.creator_score || /\b\d+(\.\d+)?\s*(out of|\/)\s*\d+/i.test(all))) p.push("Pickleheads score in text");
  if (c.quote && c.quote.split(/\s+/).length >= 15) p.push("quote 15+ words");
  if (c.quote && s.text && !norm(s.text).includes(norm(c.quote))) p.push("quote not in source");
  if (c.creator_score && !(c.creator_score.scale > 0 && c.creator_score.value <= c.creator_score.scale)) p.push("creator_score scale");
  return p;
}

async function build() {
  const state = await loadState(), tDir = need("transcripts");
  const sources = await loadSources(state);
  const W = existsSync(join(STAGE, "write-results.json")) ? await readJson<Record<string, any>>(join(STAGE, "write-results.json")) : {};
  const C = existsSync(join(STAGE, "check-results.json")) ? await readJson<Record<string, any>>(join(STAGE, "check-results.json")) : {};
  const paddles: any[] = [], rows: string[] = [], tally = { sources: 0, skipped_inputs: 0, dropped_writer: 0, pass: 0, fixed: 0, reject: 0, code_fail: 0, errors: 0, staged: 0 };
  const per: Record<string, { usd: number; input: number; output: number }> = {};
  for (const [k, u] of Object.entries(state.usage)) { const slug = k.split(":")[1].split("__")[0];
    per[slug] ??= { usd: 0, input: 0, output: 0 }; per[slug].usd += u.usd; per[slug].input += u.input + u.cacheRead + u.cacheWrite; per[slug].output += u.output; }
  for (const slug of state.slugs) {
    const ss = sources.filter(s => s.slug === slug), reviews: any[] = [], skipped: any[] = [];
    for (const s of ss) {
      tally.sources++;
      if (s.skip) { tally.skipped_inputs++; skipped.push({ url: s.url, why: s.skip }); continue; }
      const w = W[s.id], c = C[s.id];
      if (!w || w.error) { tally.errors++; skipped.push({ url: s.url, why: `writer ${w?.error ?? "missing"}` }); continue; }
      if (!w.keep) { tally.dropped_writer++; skipped.push({ url: s.url, why: `writer dropped: ${w.drop_reason}` }); continue; }
      if (!c || c.error) { tally.errors++; skipped.push({ url: s.url, why: `checker ${c?.error ?? "missing"}` }); continue; }
      if (c.result === "pass" && !c.card) c.card = w.card; // a pass may come back without repeating the card
      if (c.result === "reject" || !c.card) { tally.reject++; skipped.push({ url: s.url, why: `checker rejected: ${(c.problems ?? []).join("; ")}` }); continue; }
      const card: Card = c.card, probs = codeCheck(card, s);
      if (probs.length) { tally.code_fail++; skipped.push({ url: s.url, why: `code check: ${probs.join("; ")}`, result: c.result }); continue; }
      tally[c.result as "pass" | "fixed"]++;
      const qAt = card.quote && s.video_id ? await quoteAt(s.video_id, card.quote, tDir) : null;
      reviews.push({ creator: s.creator, kind: s.kind, type: card.type, channel_url: s.channel_url, language: s.language, date: s.date,
        url: s.url, video_id: s.video_id, duration_s: s.duration_s, chapters: s.chapters, starts_at: card.starts_at, version: card.version,
        creator_score: card.creator_score, measured: Object.fromEntries(card.measured.map(m => [m.name, m.value])),
        attributes: Object.fromEntries(card.attributes.map(a => [a.name, a.word])), stance: card.stance, summary: card.summary,
        summary_more: card.summary_more, highlights: card.highlights, key_point: card.key_point, stood_out: card.stood_out,
        trade_off: card.trade_off, compared_to: card.compared_to,
        quote: s.kind === "youtube" && card.quote && !qAt ? null : card.quote, quote_at: qAt, disclosure: card.disclosure,
        evidence_note: `${s.kind === "youtube" ? "transcript full" : "article text (script fetch)"}; API batch writer + checker (${c.result})`,
        link_check: s.link_check, check: { result: c.result, problems: c.problems } });
    }
    // One card per creator: the video stays, a blog by the same creator becomes also_url.
    const byCreator = new Map<string, any>();
    for (const r of reviews.sort((a, b) => (a.kind === "youtube" ? 0 : 1) - (b.kind === "youtube" ? 0 : 1))) {
      const key = r.creator.toLowerCase().replace(/[^a-z0-9]/g, "");
      const first = byCreator.get(key);
      if (first) { if (blocked(r.url)) continue; first.also_url = r.url; skipped.push({ url: r.url, why: "same creator, kept as also_url" }); } else byCreator.set(key, r);
    }
    const kept = [...byCreator.values()];
    tally.staged += kept.length;
    paddles.push({ slug, paddle: ss[0]?.paddle ?? slug, searched_at: new Date().toISOString().slice(0, 10), reviews: kept, skipped,
      notes: "Written and checked through the Claude API Message Batches (scripts/batch-write.ts)." });
    const u = per[slug] ?? { usd: 0, input: 0, output: 0 };
    rows.push(`| ${slug} | ${ss.length} | ${kept.length} | ${u.input.toLocaleString()} | ${u.output.toLocaleString()} | $${u.usd.toFixed(3)} |`);
  }
  await writeFile(join(STAGE, "staging.json"), JSON.stringify({ generated: new Date().toISOString().slice(0, 10),
    status: "staging, not in DB, owner review pending", paddles }, null, 1));
  const total = spent(state), byStep = (st: string) => Object.entries(state.usage).filter(([k]) => k.startsWith(st)).reduce((a, [, u]) => a + u.usd, 0);
  const report = [`# Batch API pilot: ${state.slugs.length} paddles`, "",
    `Model ${MODEL}, Message Batches (50% rate). Total $${total.toFixed(2)} (writer $${byStep("write").toFixed(2)}, checker $${byStep("check").toFixed(2)}).`, "",
    "| paddle | sources | cards staged | input tokens | output tokens | cost |", "|---|---|---|---|---|---|", ...rows, "",
    "```", JSON.stringify(tally, null, 1), "```"].join("\n");
  await writeFile(join(STAGE, "report.md"), report);
  console.log(report);
}

const run: Record<string, () => Promise<void>> = { inputs, write: () => submit("write"), check: () => submit("check"), poll, build };
if (!run[cmd]) throw new Error(`Unknown command ${cmd}: inputs | write | check | poll | build`);
await run[cmd]();
void createHash;
