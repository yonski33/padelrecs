// DiscGolfRecs catalogue fixes from the match audit (2026-11-17): flight numbers for 4 discs, max weights for 16 (Lynx included),
// and the type of 3 speed-11 "fairway drivers". Dry run by default (prints now → new); --write applies, only with the owner's OK.
// Figures: Marshall Street's PDGA spec blocks (maker sites refused or show no max weight); VCobra from a retailer.
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/discgolf-catalog-fixes.mts [--write]
import { eq } from "drizzle-orm";
import { database } from "../db/data";
import { rackets } from "../db/schema";

const FLIGHT: Record<string, string> = { "innova-groove": "13 / 6 / -2 / 2", "discraft-flick": "12 / 3 / 1 / 5", "discraft-xs": "8 / 5 / 0 / 3", "gateway-wizard": "2 / 3 / 0 / 2" };
const MAX_G: Record<string, string> = { "discraft-flick": "175.1 g", "trash-panda-inner-core": "176.8 g", "discraft-comet": "180.9 g", "discraft-stalker": "179.3 g",
  "discraft-captains-caliber": "175.1 g", "discraft-xl": "175.1 g", "discraft-xs": "175.1 g", "innova-cro": "176 g", "innova-gazelle": "176 g", "innova-vcobra": "180.1 g",
  "innova-krait": "176 g", "discraft-magnet": "176 g", "thought-space-athletics-pathfinder": "178.5 g", "innova-groove": "175.1 g", "gateway-wizard": "174.3 g", "innova-lynx": "176 g" };
// Speed 11, filed as fairway drivers; Marshall Street and DiscIt call them hybrid drivers; the site's guide puts 11–14 in distance.
const TYPE: Record<string, string> = { "discraft-scorch": "Distance driver", "dynamic-discs-sergeant": "Distance driver", "westside-boatman": "Distance driver" };

const db = await database(), write = process.argv.includes("--write");
for (const slug of new Set([...Object.keys(FLIGHT), ...Object.keys(MAX_G), ...Object.keys(TYPE)])) {
  const [r] = await db.select().from(rackets).where(eq(rackets.slug, slug));
  if (!r) { console.log(`${slug}: not found`); continue; }
  const set: Partial<typeof rackets.$inferInsert> = {};
  if (FLIGHT[slug] && r.weight !== FLIGHT[slug]) set.weight = FLIGHT[slug];
  if (MAX_G[slug] && r.surface !== MAX_G[slug]) set.surface = MAX_G[slug];
  if (TYPE[slug] && r.shape !== TYPE[slug]) set.shape = TYPE[slug];
  if (!Object.keys(set).length) { console.log(`${slug}: already right`); continue; }
  console.log(`${slug}: ${Object.entries(set).map(([k, v]) => `${k === "weight" ? "flight" : k === "surface" ? "max weight" : "type"} ${(r as Record<string, unknown>)[k] ?? "—"} → ${v}`).join("; ")}`);
  if (write) await db.update(rackets).set(set).where(eq(rackets.id, r.id));
}
console.log(write ? "written" : "dry run: nothing written (--write to apply)");
process.exit(0);
