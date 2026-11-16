// A snapshot of SkinRecs' ranking inputs (read-only): every listed product's scores, facts, shape and slug, for offline
// before/after runs of the match engine (scripts/skin-grid.mts).
//   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-snapshot.mts out.json
import { writeFileSync } from "node:fs";
import { skinContext } from "../app/skin/context";
import { wireOf } from "../app/skin/payload";

const ctx = await skinContext();
const items = wireOf(ctx).map(w => ({ ...w, slug: ctx.data.listed.find(r => r.id === w.id)!.slug }));
writeFileSync(process.argv[2], JSON.stringify(items));
console.log(items.length, "products");
process.exit(0);
