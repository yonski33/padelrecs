// Owner 2026-11-18 (voice rule: players, never owners): 11 stored blog / YouTube summaries that call people "owners" or say
// "This player owns…", now shown as review cards (#465). Each fix swaps one exact phrase; a row whose text no longer holds the
// phrase is skipped. Writing also sets admin_edited_at so the next publish leaves the text alone.
// Dry run by default; --write applies it in one transaction, after the owner's OK.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/fix-owner-wording.mts [--write]
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { externalReviews } from "../db/schema";

const FIXES: Record<string, [id: string, from: string, to: string][]> = {
  padel: [
    ["research-a5d18d87-1749-4e45-b323-6e82f6717786", "An owner of both", "A player who has used both"],
    ["research-01b4deac-cbd4-49ac-8339-205a293ec47b", "An owner of both", "A player who has used both"],
    ["research-5f62f98b-db67-445d-92d2-ac1085ca94f5", "This owner of the Siux Electra Pro ST4, who has also had", "This player, who plays the Siux Electra Pro ST4 and has also had"],
    ["research-7dd9da8f-236b-4a13-be90-3fd5a4f25505", "This player owns the", "This player uses the"],
    ["research-a59596cd-5bcc-42f3-abb1-3ad30f7e4c7c", "This player owns the", "This player uses the"],
    ["research-3a87fa7b-0726-425f-96ac-69759b245fc8", "Replying to a new Blade Pro V3 owner,", "Replying to a player new to the Blade Pro V3,"],
    ["research-d271550d-ca72-42b4-9eb1-87b3f6df4b28", "This player, who owns both", "This player, who has both"],
  ],
  pickleball: [
    ["b24ee455-7d46-4f89-96df-a824a7232c00", "so happy DBD owners needn’t rush to switch", "so players happy with the DBD needn’t rush to switch"],
    ["1b20ca2e-8377-470e-b9f7-9d9f889512e7", "little reason for existing Vatic V-Pro owners to switch", "little reason for players already on the Vatic V-Pro to switch"],
    ["93058101-f099-4b78-9e05-e5dd0b0d9abd", "Owners who already like the Pro IV", "Players who already like the Pro IV"],
  ],
  discgolf: [
    ["research-1987b3ff-cc02-4002-b597-df316a4b27b3", "Long-time owner of a 2013 first-run Neutron Resistor describes", "A player who has thrown a 2013 first-run Neutron Resistor for years describes"],
  ],
};
const site = process.env.NICHE ?? "", write = process.argv.includes("--write"), db = getDb();
const fixes = FIXES[site] ?? [];
console.log(`${write ? "WRITE" : "DRY RUN"} ${site}: ${fixes.length} summaries`);
const todo: { id: string; text: string }[] = [];
for (const [id, from, to] of fixes) {
  const [row] = await db.select({ s: externalReviews.summary }).from(externalReviews).where(eq(externalReviews.id, id));
  if (!row?.s || !row.s.includes(from)) { console.log(`- SKIP ${id}: phrase not found (text changed?)`); continue; }
  const text = row.s.replace(from, to);
  console.log(`- ${id}\n    before: ${row.s}\n    after:  ${text}`);
  todo.push({ id, text });
}
if (!write) { console.log("Nothing written. Run with --write after the owner's OK."); process.exit(0); }
const now = new Date().toISOString();
await db.transaction(async tx => { for (const t of todo) await tx.update(externalReviews).set({ summary: t.text, adminEditedAt: now }).where(eq(externalReviews.id, t.id)); });
console.log(`Written: ${todo.length}.`);
process.exit(0);
