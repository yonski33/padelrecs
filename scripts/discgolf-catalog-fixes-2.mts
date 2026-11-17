// DiscGolfRecs catalogue fixes from the site audit (2026-11-17, batch E): Discmania flight numbers (the mold's own numbers on
// discmania.net, not one run's), the Krait's plastics and the Beast's Halo Star (innovadiscs.com). Dry run by default; --write
// only with the owner's OK. Rim widths are listed, not written: the makers' "rim width" (Tesla 18.5 mm) and our column (2 cm)
// may be different measures, so that waits for a decision.
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/discgolf-catalog-fixes-2.mts [--write]
import { eq } from "drizzle-orm";
import { database } from "../db/data";
import { rackets } from "../db/schema";

const FLIGHT: Record<string, string> = { "discmania-dd1": "11 / 5 / -1 / 2", "discmania-dd": "11 / 6 / -3 / 2", "discmania-fd1": "7 / 5 / 0 / 2", "discmania-link": "2 / 3 / 0 / 1" };
const PLASTICS: Record<string, (now: string | null) => string> = {
  "innova-krait": () => "GStar, Champion, Blizzard Champion",
  "innova-beast": now => now && !/halo star/i.test(now) ? `Halo Star, ${now}` : now ?? "Halo Star",
};
const db = await database(), write = process.argv.includes("--write");
for (const slug of [...Object.keys(FLIGHT), ...Object.keys(PLASTICS)]) {
  const [r] = await db.select().from(rackets).where(eq(rackets.slug, slug));
  if (!r) { console.log(`${slug}: not found`); continue; }
  const set: Partial<typeof rackets.$inferInsert> = {};
  if (FLIGHT[slug] && r.weight !== FLIGHT[slug]) set.weight = FLIGHT[slug];
  if (PLASTICS[slug]) { const v = PLASTICS[slug](r.core); if (v !== r.core) set.core = v; }
  if (!Object.keys(set).length) { console.log(`${slug}: already right`); continue; }
  console.log(`${slug}: ${Object.entries(set).map(([k, v]) => `${k === "weight" ? "flight" : "plastics"} ${(r as Record<string, unknown>)[k] ?? "—"} → ${v}`).join("; ")}`);
  if (write) await db.update(rackets).set(set).where(eq(rackets.id, r.id));
}
const rims = await db.select({ slug: rackets.slug, rim: rackets.balance }).from(rackets);
console.log(`rims (not written): ${rims.filter(r => /^(mvp|axiom|streamline)-/.test(r.slug) && r.rim).length} MVP / Axiom / Streamline pages; e.g. ${["mvp-tesla", "axiom-crave", "mvp-watt"].map(s => `${s} ${rims.find(r => r.slug === s)?.rim}`).join(", ")} vs the makers' 18.5 / 16.5 / 9 mm`);
console.log(write ? "written" : "dry run: nothing written (--write to apply)");
process.exit(0);
