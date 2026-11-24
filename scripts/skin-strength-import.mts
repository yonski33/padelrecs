// Import the Grok strength/acid pass (scripts/grok/skin-strength/) as owner facts: `strength` (strong/moderate/gentle, the
// reason in the text) and `acid` (aha/bha/pha… or none). Only replies that passed validate.py and the 1-in-5 spot-check.
// Owner rows win over the name stand-in (lib/skin-safety.ts). Dry run by default; --write after the owner's OK.
//   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-strength-import.mts out-01.json [out-02.json …] [--write]
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { catalog, database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
import { withSafety } from "../lib/skin-safety";

const TAG = "owner-strength-grok-v1";
type Row = { id: string; strength: string | null; reason?: string; acid: string | null; acid_ingredients?: string[]; inci_url?: string; unsure?: boolean; leave_on?: boolean };
// Corrections from the 1-in-5 spot-check (2026-11-17): U.F.O. carries 1.5% salicylic acid as its labelled active, which the
// INCI copy the reply used left out.
const FIXES: Record<string, Partial<Row>> = { "sunday-riley-u-f-o-acne-treatment-face-oil": { acid: "bha", acid_ingredients: ["Salicylic Acid 1.5% (active)"] } };
const files = process.argv.slice(2).filter(a => !a.startsWith("--"));
// The match reads `acid` as a leave-on acid: a rinse-off cleanser or mask with an acid is stored as "none".
const rows = files.flatMap(f => JSON.parse(readFileSync(f, "utf8")) as Row[]).map(r => ({ ...r, ...FIXES[r.id] }))
  .filter(r => !r.unsure && r.strength && r.acid).map(r => r.leave_on === false && r.acid !== "none" ? { ...r, acid: "none", reason: `${r.reason ?? ""} (rinse-off ${r.acid})` } : r);
const listed = (await catalog()).rackets, ids = new Set(listed.map(r => r.id));
const facts = rows.flatMap(r => {
  if (!ids.has(r.id)) throw new Error(`unknown product ${r.id}`);
  return [{ id: r.id, attribute: "strength", valueText: r.strength!, ref: `${r.reason ?? ""} · ${r.inci_url ?? ""}` },
    { id: r.id, attribute: "acid", valueText: r.acid!, ref: `${(r.acid_ingredients ?? []).join(", ")} · ${r.inci_url ?? ""}` }];
});
const count = (a: string, v: string) => facts.filter(f => f.attribute === a && f.valueText === v).length;
console.log(`${rows.length} products: strong ${count("strength", "strong")}, moderate ${count("strength", "moderate")}, gentle ${count("strength", "gentle")}; acid ${facts.filter(f => f.attribute === "acid" && f.valueText !== "none").length}`);
// Where the reply differs from the temporary name rule (lib/skin-safety.ts), for review.
const byId = new Map(listed.map(r => [r.id, r]));
for (const r of rows) {
  const p = byId.get(r.id)!, rule = withSafety({ scores: {}, facts: {} }, p.name, p.shape, []).facts;
  const ruleStrong = rule.strength === "strong", ruleAcid = !!rule.acid;
  if (ruleStrong !== (r.strength === "strong") || ruleAcid !== (r.acid !== "none"))
    console.log(`  ${p.name} [${p.shape}]: name rule ${ruleStrong ? "strong" : "-"}/${ruleAcid ? "acid" : "-"} → ${r.strength}/${r.acid} (${r.reason})`);
}
if (!process.argv.includes("--write")) { console.log("dry run: nothing written"); process.exit(0); }
const db = await database(), schema = sql.identifier(assertSchemaName(niche.schema)), at = new Date().toISOString();
await db.transaction(async tx => {
  for (const f of facts) {
    await tx.execute(sql`delete from ${schema}.evidence where niche = ${niche.id} and extracted_by = ${TAG} and product_id = ${f.id} and attribute = ${f.attribute}`);
    // The acid fact is "none" for no acid: stored as text, so the stand-in doesn't fill it back in.
    await tx.execute(sql`insert into ${schema}.evidence (product_id, niche, source_kind, source_ref, author_key, attribute, value, value_text, strength, quote, said_at, extracted_by, created_at)
      values (${f.id}, ${niche.id}, 'owner', ${f.ref.slice(0, 500)}, 'owner', ${f.attribute}, null, ${f.valueText}, 1, null, ${at}, ${TAG}, ${at})`);
  }
});
console.log(`wrote ${facts.length} owner facts`);
process.exit(0);
