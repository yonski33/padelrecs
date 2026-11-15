// Every listed product's Player score (lib/signal.ts via app/signals.ts) for one site, as JSON {slug: [name, score, pos, mix, neg]}.
//   NICHE=<id> npx tsx --conditions=react-server --env-file=.env.local scripts/dump-signals.mts <out.json>
import { writeFileSync } from "node:fs";
import { catalog, score } from "../db/data";
import { productSignals } from "../app/signals";
const [data, sig] = await Promise.all([catalog(), productSignals()]);
const out: Record<string, [string, number | null, number, number, number]> = {};
for (const r of data.listed) { const s = score(data, r.id); out[r.slug] = [r.name, sig.get(r.id)?.signal ?? null, s.positive, s.mixed, s.negative]; }
writeFileSync(process.argv[2], JSON.stringify(out));
process.exit(0);
