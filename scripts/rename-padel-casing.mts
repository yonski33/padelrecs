import { sql } from "drizzle-orm";
import { database } from "../db/data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "../db/migrations";
// Owner OK in session 2026-11-15: names only, slugs unchanged.
const NAMES: [string, string, string][] = [
  ["nox-at10-18k-2025", "Nox AT10 18k 2025", "Nox AT10 Genius 18K 2025"],
  ["babolat-counter-viper-2025", "Babolat Counter viper 2025", "Babolat Counter Viper 2025"],
  ["stiga-cybershape-2-3k-2026", "Stiga Cybershape 2 3k 2026", "Stiga Cybershape 2 3K 2026"],
  ["oxdog-ultimate-tour-x-2026", "Oxdog Ultimate tour X 2026", "Oxdog Ultimate Tour X 2026"],
  ["head-extreme-motion-2025", "Head Extreme motion 2025", "Head Extreme Motion 2025"],
  ["head-coello-motion-2025", "Head Coello motion 2025", "Head Coello Motion 2025"],
  ["adidas-metalbone-3-5-2026", "Adidas metalbone 3.5 2026", "Adidas Metalbone 3.5 2026"],
];
const db = await database(), t = sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`;
for (const [slug, from, to] of NAMES) {
  const res = await db.execute(sql`update ${t} set name = ${to} where slug = ${slug} and name = ${from} returning slug`);
  const n = ((res as unknown as { rows?: unknown[] }).rows ?? (res as unknown as unknown[])).length;
  console.log(`${n ? "renamed" : "SKIPPED (name differs)"}: ${slug}: ${from} → ${to}`);
}
process.exit(0);
