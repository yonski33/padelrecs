// Turns on Amazon links for every Recs site: sets AMAZON_CREATORS_API_CREDENTIAL_ID, AMAZON_CREATORS_API_CREDENTIAL_SECRET
// and AMAZON_PA_API_PARTNER_TAG (Production and Preview) on each Vercel project in deployment/targets.json whose niche
// has `amazon` in lib/niche. Same approach as scripts/set-contact-env.mjs: Vercel's REST API, no team or CLI needed.
//
//   npm run amazon:env                  dry run: shows each site, its tag, and which variables it has or lacks
//   npm run amazon:env -- --apply       adds the missing variables
//   npm run amazon:env -- --apply --overwrite   also replaces values that are already set
//   --only=skin,golf                    limit to some niches
//   --redeploy                          with --apply: redeploy each changed site's latest production deployment
//   --link-tag-only                     manage only AMAZON_AFFILIATE_TAG (needs just VERCEL_TOKEN and that tag)
//
// Settings come from the environment or from .env.amazon in the repo root (git-ignored, like every .env* file), and
// anything still missing is asked for with hidden typing:
//   VERCEL_TOKEN                          vercel.com/account/tokens
//   AMAZON_CREATORS_API_CREDENTIAL_ID     Creators API credentials (same as SkinRecs)
//   AMAZON_CREATORS_API_CREDENTIAL_SECRET
//   AMAZON_PA_API_PARTNER_TAG             default associate tag for every site
//   AMAZON_PARTNER_TAG_<NICHE>            optional per-site tag, e.g. AMAZON_PARTNER_TAG_GOLF=golfrecs-20
//   AMAZON_AFFILIATE_TAG                  optional tag for the links visitors click on every site (e.g. recssite-20);
//                                         API calls keep AMAZON_PA_API_PARTNER_TAG. Added only when given.
// Secrets are never printed or written anywhere. Only variable names and associate tags (public in every link) are shown.
import { existsSync, readFileSync } from "node:fs";
import readline from "node:readline";
import { parseEnv } from "node:util";
import { niches } from "../lib/niche";
import { AMAZON_KEYS, LINK_TAG_KEY, envBody, isAssociateTag, keyStates, planProject, tagFor, tagOverrideKey, type AmazonKey, type ExistingEnv, type Step } from "../lib/amazon-env";
import targets from "../deployment/targets.json";

const args = process.argv.slice(2);
const apply = args.includes("--apply"), overwrite = args.includes("--overwrite"), redeploy = args.includes("--redeploy");
const linkTagOnly = args.includes("--link-tag-only");
const only = args.find(a => a.startsWith("--only="))?.slice(7).split(",").map(s => s.trim()).filter(Boolean);
// VERCEL_API_URL is only for testing against a local stand-in.
const API = process.env.VERCEL_API_URL || "https://api.vercel.com";

const fileSettings = existsSync(".env.amazon") ? parseEnv(readFileSync(".env.amazon", "utf8")) as Record<string, string> : {};
const settings: Record<string, string | undefined> = { ...fileSettings, ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k === "VERCEL_TOKEN" || k.startsWith("AMAZON_"))) };

let rl: readline.Interface | undefined, lines: AsyncIterableIterator<string> | undefined, muted = false;
async function ask(question: string) {
  if (!process.stdin.isTTY) return "";
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide pasted secrets: readline has no public option for this, so wrap its output writer (as set-contact-env.mjs does).
    const output = rl as unknown as { _writeToOutput: (text: string) => void };
    const write = output._writeToOutput.bind(rl);
    output._writeToOutput = text => { if (!muted) write(text); };
    lines = rl[Symbol.asyncIterator]();
  }
  console.log(`${question} (typing is hidden; paste it and press Enter, or just Enter to skip)`);
  muted = true;
  const { value = "" } = await lines!.next();
  muted = false;
  console.log("  received");
  return String(value).trim();
}
async function need(key: string) {
  if (!settings[key]) settings[key] = await ask(`${key}:`);
  return settings[key] || "";
}

const projects = Object.entries(targets.vercelProjects as Record<string, { id: string; name: string }>)
  .filter(([niche]) => !only || only.includes(niche));
if (only) for (const n of only) if (!(targets.vercelProjects as Record<string, unknown>)[n]) console.warn(`! ${n} is not in deployment/targets.json vercelProjects`);

const token = await need("VERCEL_TOKEN");
if (linkTagOnly) await need(LINK_TAG_KEY);
const linkTag = settings[LINK_TAG_KEY]?.trim() || "";
if (linkTag && !isAssociateTag(linkTag)) { rl?.close(); console.error(`${LINK_TAG_KEY} "${linkTag}" does not look like an associate tag (e.g. recssite-20).`); process.exit(1); }
const keys: AmazonKey[] = linkTagOnly ? [LINK_TAG_KEY] : linkTag ? [...AMAZON_KEYS, LINK_TAG_KEY] : [...AMAZON_KEYS];
if (apply) {
  for (const key of keys) await need(key);
  const missing = keys.filter(k => !settings[k]);
  if (!token || missing.length) { rl?.close(); console.error(`--apply needs ${[!token && "VERCEL_TOKEN", ...missing].filter(Boolean).join(", ")}.`); process.exit(1); }
}
rl?.close();

async function vercel(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string } } & Record<string, unknown>;
  if (!response.ok) throw new Error(`${response.status} ${body.error?.message ?? ""}`.trim());
  return body;
}

console.log(`\n${apply ? "APPLYING" : "DRY RUN (nothing changes; add --apply)"}${overwrite ? " · overwrite existing values" : ""}\n`);
let failed = 0, changedSites = 0;
const needsTag: string[] = [];
for (const [niche, project] of projects) {
  const config = niches[niche]?.amazon;
  const tag = tagFor(niche, settings);
  const label = `${project.name.padEnd(18)} ${niche.padEnd(12)}`;
  if (!config) { console.log(`${label} skipped: lib/niche/${niche}.ts has no amazon config`); continue; }
  if (!linkTagOnly && tag && !isAssociateTag(tag)) { failed++; console.error(`${label} ✗ "${tag}" does not look like an associate tag (e.g. skinrecs-20)`); continue; }
  if (!tag && !linkTagOnly) needsTag.push(niche);
  const tagNote = `${linkTagOnly ? "" : `tag ${tag || "(none yet)"}${settings[tagOverrideKey(niche)] ? " (own)" : ""} · `}${linkTag ? `link tag ${linkTag} · ` : ""}index ${config.searchIndex}`;
  if (!token) { console.log(`${label} ${tagNote} · current variables unknown (no VERCEL_TOKEN)`); continue; }
  try {
    const { envs = [] } = await vercel(`/v9/projects/${project.id}/env`) as { envs?: ExistingEnv[] };
    const states = keyStates(envs, keys);
    const steps = planProject(envs, overwrite, keys);
    const have = states.map(s => `${s.key.replace("AMAZON_", "").replace("_API_CREDENTIAL", "")}:${s.missing.length ? (s.has.length ? s.has.join("+") : "none") : "ok"}`).join(" ");
    const todo = steps.length ? steps.map(s => `${s.kind} ${s.key} [${s.targets.join(",")}]`).join("; ") : "nothing to do";
    console.log(`${label} ${tagNote}\n${" ".repeat(32)}has ${have}\n${" ".repeat(32)}${apply ? "→" : "would"} ${todo}`);
    if (!apply || !steps.length) continue;
    for (const step of steps as Step[]) {
      const value = step.key === "AMAZON_PA_API_PARTNER_TAG" ? tag : step.key === LINK_TAG_KEY ? linkTag : settings[step.key]!;
      const path = step.kind === "create" ? `/v10/projects/${project.id}/env` : `/v9/projects/${project.id}/env/${step.envId}`;
      try {
        await vercel(path, { method: step.kind === "create" ? "POST" : "PATCH", body: JSON.stringify(envBody(step, value)) });
        console.log(`${" ".repeat(32)}✓ ${step.kind} ${step.key}`);
      } catch (error) { failed++; console.error(`${" ".repeat(32)}✗ ${step.kind} ${step.key}: ${(error as Error).message}`); }
    }
    changedSites++;
    if (redeploy) {
      try {
        const { deployments = [] } = await vercel(`/v6/deployments?projectId=${project.id}&target=production&state=READY&limit=1`) as { deployments?: { uid: string }[] };
        if (!deployments[0]) throw new Error("no ready production deployment");
        await vercel(`/v13/deployments?forceNew=1`, { method: "POST", body: JSON.stringify({ name: project.name, deploymentId: deployments[0].uid, target: "production" }) });
        console.log(`${" ".repeat(32)}✓ redeploy started`);
      } catch (error) { failed++; console.error(`${" ".repeat(32)}✗ redeploy: ${(error as Error).message}`); }
    }
  } catch (error) { failed++; console.error(`${label} ✗ ${(error as Error).message}`); }
}

console.log("");
if (needsTag.length) console.log(`No associate tag yet for: ${needsTag.join(", ")}. Set AMAZON_PA_API_PARTNER_TAG (shared) or ${tagOverrideKey("<niche>")} per site.`);
if (apply && changedSites && !redeploy) console.log(`Changed ${changedSites} project(s). Vercel uses new variables from the next deployment: merge a change to main, or rerun with --redeploy.`);
console.log(failed ? `${failed} problem(s).` : apply ? "Done." : "Dry run finished.");
process.exit(failed ? 1 : 0);
