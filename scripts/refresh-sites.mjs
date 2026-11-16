#!/usr/bin/env node
// Refreshes the kept sites' cached pages after data is written outside the admin (imports, publish and review jobs): pages
// otherwise wait up to 6–24 hours (owner 2026-11-16, Vercel cost). Needs REFRESH_SECRET (or CRON_SECRET) in the environment.
//   node --env-file=.env.local scripts/refresh-sites.mjs            every kept site
//   node --env-file=.env.local scripts/refresh-sites.mjs padel skin  only these
export const KEPT = { padel: "padelrecs", tennis: "tennisrecs", pickleball: "pickleballrecs", simracing: "simracingrecs", discgolf: "discgolfrecs", skin: "skinrecs" };

async function main() {
  const secret = process.env.REFRESH_SECRET || process.env.CRON_SECRET;
  if (!secret) { console.error("Set REFRESH_SECRET (or CRON_SECRET) to refresh the sites."); process.exit(2); }
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(KEPT);
  let failed = 0;
  for (const id of ids) {
    const host = KEPT[id];
    if (!host) { console.error(`${id}: not a kept site`); failed++; continue; }
    try {
      const res = await fetch(`https://www.${host}.com/api/refresh`, { method: "POST", headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(30_000) });
      console.log(`${id}: ${res.status === 200 ? "refreshed" : `HTTP ${res.status}`}`);
      if (res.status !== 200) failed++;
    } catch (e) { console.log(`${id}: ${e?.name ?? e}`); failed++; }
  }
  process.exit(failed ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
