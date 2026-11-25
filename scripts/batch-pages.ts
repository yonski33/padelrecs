// Creator-page content through the Claude API Message Batches: TL;DR, "In more detail" (reviewer wrap-up) and the
// "Players on Reddit and forums" box, in the shapes of db/creators/tldrs.json, reviewer-wrapups.json and reddit-roundups.json
// (#656 / #660 / #669). Reads the DB (read only) and staged card files; writes data files only. No DB writes.
//
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-pages.ts inputs --stage <dir> --slugs a,b [--cards <staging.json>...]
//        reviews come from the staged card files when given for a product, else from live creator_reviews (+ TikTok takes);
//        Reddit/forum posts from external_reviews. Products with fewer than 3 reviews are skipped (no creator page).
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-pages.ts write --stage <dir> [--max-usd 80]
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-pages.ts check --stage <dir> [--max-usd 80]
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-pages.ts poll  --stage <dir> [--wait]
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/batch-pages.ts build --stage <dir>   -> tldrs / wrapups / roundups JSON
// --max-usd caps the spend of every pb-batch-* / pb-pages-* stage folder next to this one together.
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { niche } from "../lib/niche";
import { B } from "./batch-niche";
import { connect } from "./connection";

if (!process.env.NICHE) throw new Error("Set NICHE (e.g. NICHE=pickleball): the niche config defaults to padel otherwise.");
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
const PRICE = { input: 1.0, output: 5.0, cacheRead: 0.05, cacheWrite: 1.25 }; // $ per MTok, Message Batches (50%) Sonnet 5.5
const SITE = niche.site.name, ITEM = niche.words.one, ITEMS = niche.words.many;
const args = process.argv.slice(2), cmd = args[0];
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const flags = (n: string) => args.flatMap((a, i) => a === `--${n}` && args[i + 1] ? [args[i + 1]] : []);
const has = (n: string) => args.includes(`--${n}`);
const STAGE = flag("stage") ?? (() => { throw new Error("--stage is required"); })();
const MAX_USD = Number(flag("max-usd") ?? 80);
const readJson = async <T>(p: string): Promise<T> => JSON.parse(await readFile(p, "utf8"));

type Review = { creator: string; kind: string; stance: string; summary: string; summary_more: string | null; stood_out: string | null;
  trade_off: string | null; compared_to: string[]; version: string | null; disclosure: string | null };
type Post = { id: string; url: string; date: string | null; text: string };
type Input = { slug: string; name: string; reviews: Review[]; tiktok: string[]; posts: Post[]; source: "staging" | "db" };
type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; usd: number };
type State = { slugs: string[]; noReddit?: boolean; batches: { step: string; id: string; requests: number; collected: boolean }[]; usage: Record<string, Usage> };
const statePath = join(STAGE, "state.json");
const loadState = async (): Promise<State> => existsSync(statePath) ? readJson(statePath) : { slugs: [], batches: [], usage: {} };
const saveState = (s: State) => writeFile(statePath, JSON.stringify(s, null, 1));
const spent = (s: State) => Object.values(s.usage).reduce((a, u) => a + u.usd, 0);
async function runSpent(s: State) {
  const parent = join(STAGE, "..");
  let total = spent(s);
  for (const d of await readdir(parent)) {
    const f = join(parent, d, "state.json");
    if (!/^pb-(batch|pages)-/.test(d) || join(parent, d) === join(STAGE) || !existsSync(f)) continue;
    total += Object.values((await readJson<State>(f)).usage ?? {}).reduce((a, u) => a + u.usd, 0);
  }
  return total;
}

// ---------------------------------------------------------------- inputs (DB read only)
const STANCE: Record<string, string> = { pos: "Loved it", mix: "Mixed", neg: "Not for me" };
async function inputs() {
  const slugs = (flag("slugs") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const staged = new Map<string, { paddle: string; reviews: any[] }>();
  for (const f of flags("cards")) for (const p of (await readJson<{ paddles: any[] }>(f)).paddles) staged.set(p.slug, p);
  await mkdir(join(STAGE, "inputs"), { recursive: true });
  const state = await loadState();
  // --no-reddit: TL;DR and wrap-up only (e.g. a rewrite after cards were removed); the Reddit box is left as it is.
  if (has("no-reddit")) state.noReddit = true;
  const { client } = connect(), S = niche.schema;
  try {
    for (const slug of slugs) {
      const [r] = await client`select id, name from ${client(S)}.rackets where slug = ${slug}`;
      if (!r) { console.log(`skip ${slug}: not in the catalog`); continue; }
      let reviews: Review[], tiktok: string[] = [], source: Input["source"];
      const st = staged.get(slug);
      const rows = await client`select platform, creator, stance, summary, summary_more, stood_out, trade_off, compared_to, version, disclosure
        from ${client(S)}.creator_reviews where racket_id = ${r.id} and status = 'live' order by published_on desc nulls last`;
      const live: Review[] = rows.filter(x => x.platform !== "tiktok").map(x => ({ creator: x.creator, kind: x.platform, stance: STANCE[x.stance] ?? x.stance,
        summary: x.summary, summary_more: x.summary_more, stood_out: x.stood_out, trade_off: x.trade_off,
        compared_to: Array.isArray(x.compared_to) ? x.compared_to : [], version: x.version, disclosure: x.disclosure }));
      tiktok = rows.filter(x => x.platform === "tiktok").map(x => `${x.creator}: ${x.summary}`);
      if (st) {
        // Staged cards plus any live card from a creator the staging file does not cover (the page shows both once imported).
        source = "staging";
        reviews = st.reviews.map(x => ({ creator: x.creator, kind: x.kind, stance: x.stance, summary: x.summary, summary_more: x.summary_more ?? null,
          stood_out: x.stood_out ?? null, trade_off: x.trade_off ?? null, compared_to: x.compared_to ?? [], version: x.version ?? null, disclosure: x.disclosure ?? null }));
        const have = new Set(reviews.map(x => x.creator.toLowerCase()));
        reviews.push(...live.filter(x => !have.has(x.creator.toLowerCase())));
      } else {
        source = "db";
        reviews = live;
      }
      if (reviews.length < 3) { console.log(`skip ${slug}: ${reviews.length} reviews (creator page needs 3+)`); continue; }
      const posts = (await client`select id, source_url, source_date, coalesce(excerpt, summary) as text from ${client(S)}.external_reviews
        where racket_id = ${r.id} and source_platform = 'Reddit' and coalesce(excerpt, summary) is not null order by source_date desc nulls last`)
        .map(p => ({ id: String(p.id), url: String(p.source_url), date: p.source_date ? String(p.source_date).slice(0, 10) : null, text: String(p.text) }));
      const inp: Input = { slug, name: String(r.name), reviews, tiktok, posts, source };
      await writeFile(join(STAGE, "inputs", `${slug}.json`), JSON.stringify(inp, null, 1));
      if (!state.slugs.includes(slug)) state.slugs.push(slug);
      console.log(`ok   ${slug}: ${reviews.length} reviews (${source}), ${tiktok.length} TikTok, ${posts.length} Reddit posts`);
    }
  } finally { await client.end(); }
  await saveState(state);
}

// ---------------------------------------------------------------- prompts
const RULES = `Copy rules for every field:
- No prices anywhere (owner 2026-11-24: quoted prices go stale, live prices live in the price box): no currency amounts ($92, 390 euro, €220, under $100), no "list price", "MSRP", "costs X", "at $X with a code", "$150 more". Value words without a number are fine ("good value", "pricey for what it offers", "cheaper than X"). No price keys in measured.
- ${B.shorthand}
- ${B.spelling}
- No em dashes or en dashes. Never the word "verdict". Never "we", "us", "our". Write "${B.people}" for Reddit and forum people and "reviewers" for YouTube and blog reviewers, never "owners" or "creators". Refer to any person as they/them.
- Plain, dry English, no hype. Never claim that ${SITE} or anyone at the site tested the ${ITEM}.
- Facts only from the material given. Every claim in the TL;DR needs 2+ reviews behind it. Counts must be exact ("two ${B.people}", "one reviewer"); when unsure, say "some" rather than inflate. Never state the total number of reviews or posts. In the Reddit box never give ANY exact count of ${B.people}, posts, comments or threads (see the reddit rules).
- Keep sibling versions apart: a claim about another shape, thickness, generation or edition is not about this ${ITEM}. Leave it out or label it as that version.
- Highlights are short phrases (2 to 7 words) copied character for character from your own text.`;

const SPEC = `Write three things for the ${ITEM} page of {NAME}:

1. tldr: the page's TL;DR, one or two sentences, 15 to 35 words, in the form "<What it is, from the reviews>. The catch: <the main trade-off>." Use only points that 2 or more reviews make.

2. wrapup ("In more detail", shown above the review table): ONE paragraph of 2 or 3 sentences. Open with who it suits or what reviewers praise. Then where mixed takes come from, comparisons and disagreements. You may name reviewers (channel or site names) when you attribute a specific finding. Give 2 to 4 highlights: tone "pos" for praise (shown yellow), "neg" for criticism (shown pink); at least one "pos", and at least one "neg" when there is criticism.

3. reddit: the "${B.people[0]!.toUpperCase() + B.people.slice(1)} on Reddit and forums" box, written from the Reddit posts. Only if 4 or more posts are clearly about THIS ${ITEM}; otherwise null. Ignore posts about other ${ITEMS} or sibling versions, and posts that only mention the name. Fields:
- used_post_ids: ids of the posts you used (only posts about this ${ITEM}).
- headline: one line, 6 to 14 words, what ${B.people} agree on and the main drawback.
- tags: 2 to 5 short tags (2 to 6 words), tone "pos" or "neg", each with post_ids of the 2 or more posts that back it.
- paras: exactly two short paragraphs. First: what ${B.people} agree on. Second: ${B.redditSecond}. If fewer than 10 posts are used, end the second paragraph with exactly "Early signal from a small number of posts."
- NO exact counts of ${B.people}, posts, comments or threads anywhere in the box (owner rule 2026-11-24: exact numbers make it look like an automated sweep of Reddit). Use vague amounts on this scale: "most ${B.people}" (about two thirds or more), "many ${B.people}", "some ${B.people}", "a few ${B.people}" (3 to 5), "a couple of ${B.people}" (2), "one ${B.person}" (1, kept for single examples). Never write "24 ${B.people}", "three ${B.people}", "five posts", "half of the 24" or "N% of ${B.people}". Numbers that are not counts of people (grams, 12K, 16mm, years, a score a ${B.person} gave) are fine.
- highlights: 2 to 4, each a short phrase from your paragraphs that also appears word for word in the one post it points to (post_id).`;

const WRITER_SYSTEM = `You write page content for ${SITE}, a site that collects what reviewers and ${B.people} say about each ${niche.id} ${ITEM}.\n\n${RULES}`;
const CHECKER_SYSTEM = `You fact-check page content for ${SITE} against the reviews and posts it was written from. A different writer produced it.
Check every claim and count: the TL;DR (each point backed by 2+ reviews), the wrap-up (attributions correct, counts exact, nothing borrowed from a sibling version or another ${ITEM}), and the Reddit box (only posts about this exact ${ITEM}, tag counts match the posts listed, each highlight word for word in its post, "Early signal from a small number of posts." when fewer than 10 posts, and NO exact count of ${B.people}, posts, comments or threads anywhere in it: replace any with a vague amount).
Return result "pass" (no change needed), "fixed" (you corrected it with the smallest edits; return the full corrected content) or "reject" (too wrong to fix). List every problem.\n\n${RULES}`;

const nul = (t: object) => ({ anyOf: [t, { type: "null" }] });
const str = { type: "string" }, obj = (p: Record<string, unknown>) => ({ type: "object", properties: p, required: Object.keys(p), additionalProperties: false });
const CONTENT = obj({
  tldr: str,
  wrapup: obj({ paras: { type: "array", items: str }, highlights: { type: "array", items: obj({ text: str, tone: { type: "string", enum: ["pos", "neg"] } }) } }),
  reddit: nul(obj({ used_post_ids: { type: "array", items: str }, headline: str,
    tags: { type: "array", items: obj({ tone: { type: "string", enum: ["pos", "neg"] }, text: str, post_ids: { type: "array", items: str } }) },
    paras: { type: "array", items: str }, highlights: { type: "array", items: obj({ text: str, post_id: str }) } })),
});
const CHECK = obj({ result: { type: "string", enum: ["pass", "fixed", "reject"] }, problems: { type: "array", items: str }, content: nul(CONTENT) });
type Content = { tldr: string; wrapup: { paras: string[]; highlights: { text: string; tone: "pos" | "neg" }[] };
  reddit: null | { used_post_ids: string[]; headline: string; tags: { tone: "pos" | "neg"; text: string; post_ids: string[] }[]; paras: string[];
    highlights: { text: string; post_id: string }[] } };

const NO_REDDIT_SPEC = (spec: string) => spec.replace(/\n\n3\. reddit:[\s\S]*$/, "\n\n3. reddit: null (not needed this time).");
function material(i: Input, noReddit = false) {
  if (noReddit) i = { ...i, posts: [] };
  const rv = i.reviews.map((r, k) => [`[R${k + 1}] ${r.creator} (${r.kind}, ${r.stance}${r.version ? `, version: ${r.version}` : ""})`,
    r.summary, r.summary_more, r.stood_out && `Stood out: ${r.stood_out}`, r.trade_off && `Trade-off: ${r.trade_off}`,
    r.compared_to?.length ? `Compared to: ${r.compared_to.join(", ")}` : "", r.disclosure && `Disclosure: ${r.disclosure}`].filter(Boolean).join("\n"));
  return [`${niche.words.One}: ${i.name} (slug ${i.slug})`, `Reviews (YouTube and blog reviewers):\n\n${rv.join("\n\n")}`,
    i.tiktok.length ? `TikTok takes (short, unverified):\n${i.tiktok.map(t => `- ${t}`).join("\n")}` : "",
    `Reddit and forum posts (${i.posts.length}):\n${i.posts.map(p => `[${p.id}] ${p.date ?? "no date"} ${p.url}\n${p.text}`).join("\n\n") || "none"}`]
    .filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------- batches
const usd = (u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }) =>
  (u.input_tokens * PRICE.input + u.output_tokens * PRICE.output + (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) / 1e6;
async function submit(step: "write" | "check") {
  const state = await loadState();
  if (state.batches.some(b => !b.collected)) throw new Error("A batch is still open: run poll first.");
  const prev = existsSync(join(STAGE, `${step}-results.json`)) ? await readJson<Record<string, any>>(join(STAGE, `${step}-results.json`)) : {};
  const W = step === "check" ? await readJson<Record<string, any>>(join(STAGE, "write-results.json")) : {};
  const items: { id: string; system: string; user: string; schema: object }[] = [];
  for (const slug of state.slugs) {
    if (prev[slug] && !prev[slug].error) continue;
    const i = await readJson<Input>(join(STAGE, "inputs", `${slug}.json`));
    const nr = !!state.noReddit, task = (nr ? NO_REDDIT_SPEC(SPEC) : SPEC).replace("{NAME}", i.name);
    if (step === "write") items.push({ id: slug, system: WRITER_SYSTEM, schema: CONTENT, user: `${material(i, nr)}\n\n${task}` });
    else if (W[slug] && !W[slug].error) items.push({ id: slug, system: CHECKER_SYSTEM, schema: CHECK,
      user: `${material(i, nr)}\n\nThe task the writer had:\n${task}\n\nContent to check (JSON):\n${JSON.stringify(W[slug], null, 1)}` });
  }
  if (!items.length) throw new Error("Nothing to submit.");
  const est = (items.reduce((a, i) => a + i.system.length + i.user.length, 0) / 3.5 * PRICE.input + items.length * 6000 * PRICE.output) / 1e6;
  const total = await runSpent(state);
  console.log(`${step}: ${items.length} requests, estimate $${est.toFixed(2)}; spent so far $${total.toFixed(2)} of $${MAX_USD} (all stages)`);
  if (total + est > MAX_USD) throw new Error(`Stopping: the estimate would pass the $${MAX_USD} cap.`);
  if (has("dry")) return;
  const batch = await new Anthropic().messages.batches.create({ requests: items.map(i => ({ custom_id: i.id, params: {
    model: MODEL, max_tokens: 16000, system: [{ type: "text", text: i.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: i.user }],
    output_config: { effort: "high", format: { type: "json_schema", schema: i.schema as Record<string, unknown> } } } })) }).catch(stopIfBilling);
  state.batches.push({ step, id: batch.id, requests: items.length, collected: false });
  await saveState(state);
  console.log(`Submitted ${step} batch ${batch.id}`);
}
async function poll() {
  const state = await loadState(), open = state.batches.find(b => !b.collected);
  if (!open) { console.log("No open batch."); return; }
  const c = new Anthropic();
  for (;;) {
    const b = await c.messages.batches.retrieve(open.id).catch(stopIfBilling);
    console.log(`${open.step} ${open.id}: ${b.processing_status} ${JSON.stringify(b.request_counts)}`);
    if (b.processing_status === "ended") break;
    if (!has("wait")) return;
    await new Promise(r => setTimeout(r, 60_000));
  }
  const file = join(STAGE, `${open.step}-results.json`);
  const out: Record<string, unknown> = existsSync(file) ? await readJson(file) : {};
  for await (const r of await c.messages.batches.results(open.id).catch(stopIfBilling)) {
    if (r.result.type === "errored" && BILLING.test(JSON.stringify(r.result))) stopIfBilling(new Error(JSON.stringify(r.result)));
    if (r.result.type !== "succeeded") { out[r.custom_id] = { error: r.result.type }; continue; }
    const m = r.result.message, u = m.usage;
    state.usage[`${open.step}:${r.custom_id}`] = { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0, usd: usd(u) };
    if (m.stop_reason === "refusal" || m.stop_reason === "max_tokens") { out[r.custom_id] = { error: m.stop_reason }; continue; }
    try { out[r.custom_id] = JSON.parse(m.content.filter(b => b.type === "text").map(b => b.text).join("")); } catch { out[r.custom_id] = { error: "unparseable" }; }
  }
  open.collected = true;
  await writeFile(file, JSON.stringify(out, null, 1));
  await saveState(state);
  console.log(`Collected ${open.step}; stage spent $${spent(state).toFixed(2)}`);
}

// ---------------------------------------------------------------- code checks + build
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => s.trim().split(/\s+/).length;
const CNUM = "(?:\\d{1,3}(?!\\d)|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|dozen|dozens|hundred|hundreds)";
const CWHO = "(?:players?|posts?|comments?|threads?|people|users?|reviewers?|redditors?|voices|replies|mentions?|reports?|takes|accounts?)";
const NO_COUNT = new RegExp(`\\b${CNUM}(?:\\s+(?:of(?:\\s+the)?|out\\s+of)\\s+\\w+)?(?:\\s+(?!issues|things|points|problems|complaints|reasons|ways|tags|times|weeks|months|days|sessions|games)\\w+){0,1}?\\s+${CWHO}\\b|\\b(?:of|out of)\\s+the\\s+${CNUM}\\b|\\b${CNUM}\\s+(?:of|out of)\\s+(?:the\\s+)?${CNUM}\\b`, "i");
function codeCheck(c: Content, i: Input): string[] {
  const p: string[] = [];
  const texts = [c.tldr, ...c.wrapup.paras, ...(c.reddit ? [c.reddit.headline, ...c.reddit.paras, ...c.reddit.tags.map(t => t.text)] : [])].join(" ");
  if (/[—–]/.test(texts)) p.push("dash");
  const PRICE_TEXT = /[€$£]\s?\d|\d[\d.,]*\s?(€|euros?\b|eur\b|dollars?\b|usd\b|bucks\b|gbp\b)|\blist price\b|\bmsrp\b|\bretails? (for|at)\b|\bcosts? (about |around |roughly )?[€$£]?\d/i;
  if (PRICE_TEXT.test(texts)) p.push("price in text");
  if (/verdict|\b(we|us|our|owners?|creators?)\b/i.test(texts.replace(/\bU\.?S\.?A?\b/g, ""))) p.push("banned word");
  if (/\b(he|she|his|her|him|hers)\b/i.test(texts)) p.push("gendered pronoun");
  if (!/The catch:/.test(c.tldr) || words(c.tldr) < 12 || words(c.tldr) > 40) p.push(`tldr shape (${words(c.tldr)} words)`);
  const wp = c.wrapup.paras.join(" "), sentences = wp.replace(/\b(Dr|Mr|Mrs|Ms|St|Jr|Sr|vs|No|Gen|approx|e\.g|i\.e)\./gi, "$1").split(/(?<=[.!?])\s+/).filter(Boolean).length; // "Dr. Christy Price" is one sentence
  if (c.wrapup.paras.length !== 1 || sentences < 2 || sentences > 3) p.push(`wrapup ${c.wrapup.paras.length} paras / ${sentences} sentences`);
  if (!c.wrapup.highlights.some(h => h.tone === "pos")) p.push("wrapup has no pos highlight");
  for (const h of c.wrapup.highlights) if (!wp.includes(h.text)) p.push(`wrapup highlight not in text: ${h.text}`);
  const rd = c.reddit;
  if (rd) {
    const byId = new Map(i.posts.map(x => [x.id, x])), used = new Set(rd.used_post_ids);
    if (used.size < 4) p.push(`reddit: only ${used.size} posts`);
    for (const id of used) if (!byId.has(id)) p.push(`reddit: unknown post ${id}`);
    if (rd.paras.length !== 2) p.push("reddit: paras != 2");
    if (rd.tags.length < 2 || rd.tags.length > 5) p.push("reddit: tags count");
    for (const t of rd.tags) if (new Set(t.post_ids).size < 2 || t.post_ids.some(id => !used.has(id))) p.push(`reddit tag needs 2+ used posts: ${t.text}`);
    const rp = rd.paras.join(" ");
    for (const h of rd.highlights) {
      if (!rp.includes(h.text)) p.push(`reddit highlight not in text: ${h.text}`);
      const post = byId.get(h.post_id);
      if (!post || !used.has(h.post_id) || !norm(post.text).includes(norm(h.text))) p.push(`reddit highlight not in its post: ${h.text}`);
    }
    if (used.size < 10 && !rd.paras[1]?.trim().endsWith("Early signal from a small number of posts.")) p.push("reddit: missing 'Early signal from a small number of posts.'");
    // Owner rule 2026-11-24: no exact player or post counts in a Reddit box ("one player" stays allowed).
    const rt = [rd.headline, ...rd.paras, ...rd.tags.map(t => t.text)].join(" ").replace(/\b[Oo]ne (?:players?|persons?|people)\b/g, "someone");
    const hit = rt.match(NO_COUNT) ?? rt.match(/\d+\s*(?:%|percent)\s+of\s+(?:the\s+)?(?:players|posts|comments|people)|\b(?:two|three) thirds?\b|\b(?:half|a third|a quarter) of the (?:players|posts|comments|people)\b/i);
    if (hit) p.push(`reddit: exact count: ${hit[0]}`);
  }
  return p;
}
async function build() {
  const state = await loadState();
  const W = await readJson<Record<string, any>>(join(STAGE, "write-results.json"));
  const C = existsSync(join(STAGE, "check-results.json")) ? await readJson<Record<string, any>>(join(STAGE, "check-results.json")) : {};
  const tldrs: Record<string, string> = {}, wrapups: Record<string, unknown> = {}, roundups: Record<string, unknown> = {};
  const rows: string[] = [], tally = { products: 0, pass: 0, fixed: 0, reject: 0, code_fail: 0, errors: 0, reddit_boxes: 0 };
  for (const slug of state.slugs) {
    tally.products++;
    const i = await readJson<Input>(join(STAGE, "inputs", `${slug}.json`)), w = W[slug], c = C[slug];
    const cost = ["write", "check"].reduce((a, s) => a + (state.usage[`${s}:${slug}`]?.usd ?? 0), 0);
    let why = "";
    if (!w || w.error || !c || c.error) { tally.errors++; why = `error ${w?.error ?? c?.error ?? "missing"}`; }
    else if (c.result === "reject") { tally.reject++; why = `rejected: ${c.problems.join("; ")}`; }
    else {
      const content: Content = c.result === "pass" && !c.content ? w : c.content;
      const probs = codeCheck(state.noReddit ? { ...content, reddit: null } : content, i);
      if (probs.length) { tally.code_fail++; why = `code check: ${probs.join("; ")}`; }
      else {
        tally[c.result as "pass" | "fixed"]++;
        tldrs[slug] = content.tldr;
        wrapups[slug] = { paras: content.wrapup.paras, highlights: content.wrapup.highlights };
        const rd = state.noReddit ? null : content.reddit;
        if (rd) {
          tally.reddit_boxes++;
          const used = i.posts.filter(x => rd.used_post_ids.includes(x.id)), url = new Map(i.posts.map(x => [x.id, x.url]));
          roundups[slug] = { posts: used.length, threads: new Set(used.map(x => x.url.match(/\/comments\/(\w+)/)?.[1] ?? x.url)).size,
            at: used.map(x => x.date).filter(Boolean).sort().at(-1) ?? null, headline: rd.headline,
            tags: rd.tags.map(t => ({ tone: t.tone, text: t.text, n: new Set(t.post_ids).size })), paras: rd.paras,
            highlights: rd.highlights.map(h => ({ text: h.text, url: url.get(h.post_id) })) };
        }
        why = `${c.result}${rd ? `, Reddit box from ${rd.used_post_ids.length} posts` : ", no Reddit box"}`;
      }
    }
    rows.push(`| ${slug} | ${i.reviews.length} (${i.source}) | ${i.posts.length} | ${why.replace(/\|/g, "/")} | $${cost.toFixed(3)} |`);
  }
  for (const [name, data] of [["tldrs", tldrs], ["reviewer-wrapups", wrapups], ["reddit-roundups", roundups]] as const)
    await writeFile(join(STAGE, `${name}.json`), JSON.stringify({ [niche.id]: data }, null, 1));
  const report = [`# Page content: ${state.slugs.length} ${ITEMS}`, "", `Stage spend $${spent(state).toFixed(2)}.`, "",
    `| ${ITEM} | reviews | Reddit posts | result | cost |`, "|---|---|---|---|---|", ...rows, "", "```", JSON.stringify(tally, null, 1), "```"].join("\n");
  await writeFile(join(STAGE, "report.md"), report);
  console.log(report);
}

const run: Record<string, () => Promise<void>> = { inputs, write: () => submit("write"), check: () => submit("check"), poll, build };
if (!run[cmd]) throw new Error(`Unknown command ${cmd}: inputs | write | check | poll | build`);
await run[cmd]();
