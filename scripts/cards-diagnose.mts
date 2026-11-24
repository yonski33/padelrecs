// Read-only: which products can be an "Other … to consider" card, and why not (owner 2026-11-18: every product usable).
// A product is usable when, on at least one other product's page, it gets a gain and a different give-up that pass the claim
// guard (lib/claim-guard.ts), as the page picks them. "before" = the guard without spec facts. Prints a summary; writes a CSV.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/cards-diagnose.mts out.csv
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { claimBlock, factFor, sameFlightFact } from "../lib/claim-guard";
import { SITE_FIT } from "../lib/fit-config";
import { flightOf } from "../lib/similar-picks";
import { niche } from "../lib/niche";
const site = niche.id, out = process.argv[2];
const ctx: any = await matchContext();
const keys = SITE_FIT.traits.filter(t => !t.hidden).map(t => t.key);
const FIELDS: Record<string, string[]> = { padel: ["shape", "weight", "balance", "core", "surface"], pickleball: ["shape", "weight", "balance", "core", "surface"],
  tennis: ["shape", "weight", "balance", "surface"], simracing: ["weight"], discgolf: ["weight"] };
const FIELD_NAME: Record<string, Record<string, string>> = { tennis: { shape: "head size", surface: "stiffness (RA)" }, pickleball: { balance: "swing weight", core: "core thickness" },
  discgolf: { weight: "flight numbers" }, simracing: { weight: "torque (Nm)" } };
const spec = (r: any) => ({ shape: r.shape, core: r.core, surface: r.surface, balance: r.balance, weight: r.weight, flight: site === "discgolf" ? flightOf(r.weight) : null });
const listed = ctx.data.listed as any[];
const tr = (id: string, k: string) => ctx.traits(id).scores?.[k];
function usable(x: any, useSpecs: boolean) {
  for (const y of listed) {
    if (y.id === x.id) continue;
    const ok = (k: string, dir: 1 | -1) => {
      const f = useSpecs || site === "discgolf" ? factFor(site, k, spec(x), spec(y)) : null;
      const a = tr(x.id, k), b = tr(y.id, k), dotGap = a && b && a.dots && b.dots ? a.dots - b.dots : 0;
      const gap = f && Math.abs(f.gap) >= 1 ? f.gap : dotGap;
      if (gap * dir <= 0) return false;
      if (k === "arm" && dir > 0 && (a?.dots ?? 0) < 4) return false;
      return claimBlock(site, k, dir, { spec: spec(x), tr: a }, { spec: spec(y), tr: b }, useSpecs) === null;
    };
    const gains = keys.filter(k => ok(k, 1)), gives = keys.filter(k => ok(k, -1));
    if (gains.some(g => gives.some(v => v !== g && !sameFlightFact(site, g, v)))) return true;
  }
  return false;
}
const rows: string[] = []; let before = 0, after = 0; const why: Record<string, number> = {};
for (const x of listed) {
  const b = usable(x, false), a = usable(x, true); if (b) before++; if (a) after++;
  const reports = ctx.facts(x.id).reports;
  const missing = (FIELDS[site] ?? []).filter(f => !x[f] || (site === "discgolf" && !flightOf(x.weight))).map(f => FIELD_NAME[site]?.[f] ?? f);
  const voiced = keys.filter(k => { const t = tr(x.id, k); return t && (t.set || t.plus + t.minus >= 3); }).length;
  const reason = a ? (reports < 10 ? "usable, but under 10 reports (not in the card pool)" : "") : missing.length ? "missing specs" : voiced < 2 ? "too few player voices" : "every candidate line blocked or no gap";
  if (!a || reports < 10) why[reason] = (why[reason] ?? 0) + 1;
  rows.push([site, x.slug, JSON.stringify(x.name), reports, b ? "yes" : "no", a ? "yes" : "no", JSON.stringify(reason), JSON.stringify(missing.join("; ")), `${voiced}/${keys.length}`].join(","));
}
if (out) { if (!existsSync(out)) writeFileSync(out, "site,slug,name,reports,usable_before,usable_after,reason,missing_spec_fields,traits_with_3plus_voices\n"); appendFileSync(out, rows.join("\n") + "\n"); }
console.log(`${site}: ${listed.length} products; usable as a card before ${before}, after ${after}`);
for (const [k, n] of Object.entries(why).sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${k}`);
process.exit(0);
