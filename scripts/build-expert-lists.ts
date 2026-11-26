// Builds db/creators/expert-lists.json for one site from checked expert-list files (lib/thread/expert-lists.ts).
// Inputs: the raw list files (one JSON per list: url, outlet, title, platform, published/updated, entries) and the checked
// answers (<task>.out.json arrays: per list status ok|drop|unreadable, fixed dates, per matched entry found / match_ok /
// position / award_label / reason). Only status "ok" lists and entries found with match_ok and a reason are kept.
// Code checks on every kept reason (fail = the entry is held, listed in the report, never written):
//   8–22 words, no prices or deal words, no "verdict", no first person, no outlet name.
// --second <dir>: the second reader's answers (*.out.json: id "<list>#<position>", verdict_code ok|fixed|reject, reason,
// award_label). With it, every kept entry needs a second-reader answer: its line and label are used, a reject is dropped.
//   npx tsx scripts/build-expert-lists.ts --site laptop --raw <dir> --checked <dir> --catalog <catalog.json> [--second <dir>] [--checked-on YYYY-MM-DD] [--write]
// Without --write it prints the report only. --catalog: [{ slug, name }] (the site's products, names as in catalog_match).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const site = arg("site"), raw = arg("raw"), checked = arg("checked"), catalogFile = arg("catalog"), write = process.argv.includes("--write");
const checkedOn = arg("checked-on") ?? new Date().toISOString().slice(0, 10);
if (!site || !raw || !checked || !catalogFile) throw new Error("Usage: --site --raw --checked --catalog [--write]");

type RawList = { url: string; outlet: string; title: string; platform: "blog" | "youtube"; topic?: string; published?: string | null; updated?: string | null };
type Ans = { file: string; status: "ok" | "drop" | "unreadable"; status_note?: string | null; published?: string | null; updated?: string | null;
  entries: { position: number; catalog_match: string; found: boolean; award_label: string | null; match_ok: boolean; note?: string | null; reason: string | null }[] };

const bySlug = new Map((JSON.parse(readFileSync(catalogFile, "utf8")) as { slug: string; name: string }[]).map(c => [c.name.trim().toLowerCase(), c.slug]));
const answers: Ans[] = readdirSync(checked).filter(f => f.endsWith(".out.json")).flatMap(f => JSON.parse(readFileSync(join(checked, f), "utf8")) as Ans[]);

// Weight in pounds is fine; money is not.
// One display name per outlet (Gemini wrote Notebookcheck three ways), so an outlet counts once on the ranking rows.
const OUTLET_NAMES: Record<string, string> = { "notebookcheck.com": "Notebookcheck", "notebookcheckreviews": "Notebookcheck", "notebookcheckreviews_de": "Notebookcheck" };
const outletName = (o: string) => OUTLET_NAMES[o.trim().toLowerCase()] ?? o.trim();
const PRICE = /[$€£¥]\s?\d|\d[\d.,]*\s?(€|eur|usd|dollars?|euros?)\b|\b(price[sd]?|pricey|expensive|cheap(er|est)?|deal|discount|sale|bargain|affordable|budget[- ]friendly|value for money)\b/i;
const secondDir = arg("second");
type Second = { id: string; verdict_code: "ok" | "fixed" | "reject"; reason: string | null; award_label: string | null; why?: string | null };
const second = secondDir ? new Map(readdirSync(secondDir).filter(f => f.endsWith(".out.json")).flatMap(f => JSON.parse(readFileSync(join(secondDir, f), "utf8")) as Second[]).map(x => [x.id, x])) : null;
const FIRST = /\b(we|our|us|I|my)\b/;
const lists: Record<string, RawList & { date: string; checked: string }> = {}, picks: Record<string, { list: string; position: number; label: string | null; reason: string }[]> = {};
const held: string[] = [], status = { ok: 0, drop: 0, unreadable: 0 } as Record<string, number>, ent = { kept: 0, badMatch: 0, notFound: 0, held: 0, rejected: 0, fixed: 0 };
const dropped: { file: string; status: string; note: string | null }[] = [];

for (const a of answers) {
  status[a.status] = (status[a.status] ?? 0) + 1;
  if (a.status !== "ok") { dropped.push({ file: a.file, status: a.status, note: a.status_note ?? null }); continue; }
  const r = JSON.parse(readFileSync(join(raw, a.file), "utf8")) as RawList;
  const id = a.file.replace(/\.json$/, "");
  const date = (a.updated || a.published || r.updated || r.published || "").slice(0, 10);
  if (!date) { held.push(`${a.file}: no date`); continue; }
  for (const e of a.entries) {
    if (!e.found) { ent.notFound++; continue; }
    if (!e.match_ok) { ent.badMatch++; continue; }
    if (second) { const x = second.get(`${id}#${e.position}`);
      if (!x) { ent.held++; held.push(`${a.file} #${e.position} ${e.catalog_match}: no second-reader answer`); continue; }
      if (x.verdict_code === "reject") { ent.rejected++; held.push(`${a.file} #${e.position} ${e.catalog_match}: second reader rejected: ${x.why ?? ""}`); continue; }
      if (x.verdict_code === "fixed") ent.fixed++;
      e.reason = x.reason; e.award_label = x.award_label; }
    const slug = bySlug.get(e.catalog_match.trim().toLowerCase());
    const why = !slug ? "not in the catalogue" : !e.reason ? "no reason"
      : (n => n < 8 || n > 22 ? `${n} words` : null)(e.reason.trim().split(/\s+/).length)
      ?? (PRICE.test(e.reason) ? "price word" : /verdict/i.test(e.reason) ? "verdict" : FIRST.test(e.reason) ? "first person"
      : e.reason.toLowerCase().includes(r.outlet.toLowerCase()) ? "outlet name" : null);
    if (why) { ent.held++; held.push(`${a.file} #${e.position} ${e.catalog_match}: ${why}${e.reason ? ` | ${e.reason}` : ""}`); continue; }
    lists[id] = { url: r.url, outlet: outletName(r.outlet), title: r.title, platform: r.platform, topic: r.topic ?? null, date, checked: checkedOn } as never;
    (picks[slug!] ??= []).push({ list: id, position: e.position, label: e.award_label?.trim() || null, reason: e.reason!.trim() });
    ent.kept++;
  }
}
for (const p of Object.values(picks)) p.sort((x, y) => x.position - y.position);
const outlets = new Map<string, Set<string>>();
for (const [slug, ps] of Object.entries(picks)) outlets.set(slug, new Set(ps.map(p => lists[p.list]!.outlet.toLowerCase())));

console.log(`Lists: ${JSON.stringify(status)}; kept lists with picks: ${Object.keys(lists).length}`);
console.log(`Entries: kept ${ent.kept} (second reader fixed ${ent.fixed}), bad match ${ent.badMatch}, not found ${ent.notFound}, second reader rejected ${ent.rejected}, held ${ent.held}`);
console.log(`Products with picks: ${Object.keys(picks).length}; by outlets: ${[1, 2, 3, 5, 10].map(n => `${n}+ ${[...outlets.values()].filter(s => s.size >= n).length}`).join(", ")}`);
if (held.length) console.log(`Held:\n  ${held.join("\n  ")}`);
const out = join(checked, `build-report-${site}.json`);
writeFileSync(out, JSON.stringify({ status, ent, held, dropped }, null, 1));
if (write) {
  const file = "db/creators/expert-lists.json", all = JSON.parse(readFileSync(file, "utf8"));
  all[site] = { lists, picks };
  writeFileSync(file, `${JSON.stringify(all, null, 1)}\n`);
  console.log(`Written: ${file} (${site})`);
}
