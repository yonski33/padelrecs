import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { niche } from "../lib/niche";
import { connect } from "./connection";
import { parseCandidates, planImport, siteState, applyImport, markPublished } from "../db/web-review-import";

// Publishes approved research-agent candidates as web reviews on the active niche's site (NICHE, default padel).
//   NICHE=padel npm run db:publish-web-reviews -- ../../research-agent/data/candidates.jsonl           (dry run: shows the plan)
//   NICHE=padel npm run db:publish-web-reviews -- ../../research-agent/data/candidates.jsonl --apply   (backup, insert, mark published)
const path = process.argv[2];
const apply = process.argv.includes("--apply");
if (!path) throw new Error("Usage: npm run db:publish-web-reviews -- <path to candidates.jsonl> [--apply]");

const queue = readFileSync(path, "utf8");
const candidates = parseCandidates(queue);
const { db, client } = connect();
try {
  const plan = planImport(candidates, await siteState(db), niche);
  const approved = candidates.filter(c => c.status === "approved").length;
  console.log(`${niche.site.name} (schema "${niche.schema}"): ${approved} approved in the queue, ${plan.rows.length} ready to publish, ${plan.skipped.length} skipped.`);
  for (const r of plan.rows) console.log(`  + ${candidates.find(c => c.id === r.candidateId)!.racket_name} | ${r.sourceName} | ${r.sourceUrl}`);
  for (const s of plan.skipped) console.log(`  - ${s.candidate.racket_name} | ${s.candidate.source_url}\n      skipped: ${s.reason}`);
  if (!apply) { console.log("\nDry run: nothing changed. Add --apply to back up the database and publish."); process.exit(0); }
  if (!plan.rows.length) { console.log("Nothing to publish."); process.exit(0); }

  // A backup of this niche's schema before any change, like every other data change.
  const backup = `backups/${niche.id}-before-web-reviews-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 13)}.json`;
  execFileSync("npx", ["tsx", "--env-file-if-exists=.env.local", "scripts/export-data.ts", backup], { stdio: "inherit", env: process.env });
  console.log(`Backup written to ${backup}`);

  const inserted = await applyImport(db, plan);
  const now = await siteState(db);
  const live = new Set(now.external.map(e => e.id));
  const published = plan.rows.filter(r => live.has(r.id)).map(r => ({ candidateId: r.candidateId, id: r.id }));
  if (published.length !== plan.rows.length) throw new Error(`Only ${published.length} of ${plan.rows.length} web reviews are on the site after publishing; the queue was not changed.`);
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, markPublished(queue, published));
  renameSync(tmp, path);
  console.log(`Published ${inserted} new web review(s) on ${niche.site.name}; ${published.length} marked "published" in the queue. They appear on the site within a minute (page cache).`);
} finally { await client.end(); }
