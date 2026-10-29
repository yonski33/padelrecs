/**
 * Planning for scripts/set-amazon-env.ts: which Amazon variables each Recs Vercel project needs, compared with what it
 * already has. Pure functions, no network, so tests can cover them. Only variable names, targets and associate tags
 * (which are public in every Amazon link) ever appear in a plan; credential values never do.
 */

export const AMAZON_KEYS = ["AMAZON_CREATORS_API_CREDENTIAL_ID", "AMAZON_CREATORS_API_CREDENTIAL_SECRET", "AMAZON_PA_API_PARTNER_TAG"] as const;
/** Optional: the tag for the links visitors click (lib/amazon.ts affiliateTag). Managed only when it is given. */
export const LINK_TAG_KEY = "AMAZON_AFFILIATE_TAG";
export type AmazonKey = typeof AMAZON_KEYS[number] | typeof LINK_TAG_KEY;
const TAG_KEYS: string[] = ["AMAZON_PA_API_PARTNER_TAG", LINK_TAG_KEY];
export const TARGETS = ["production", "preview"] as const;
export type Target = typeof TARGETS[number];

/** One variable as Vercel's GET /v9/projects/:id/env lists it (values are left out on purpose). */
export type ExistingEnv = { id: string; key: string; target?: string[] | string };

/** Per-site associate tag override: AMAZON_PARTNER_TAG_GOLF for golf, AMAZON_PARTNER_TAG_TABLETENNIS for tabletennis. */
export const tagOverrideKey = (niche: string) => `AMAZON_PARTNER_TAG_${niche.toUpperCase()}`;

/** The associate tag a site gets: its own override when set, otherwise the shared AMAZON_PA_API_PARTNER_TAG. */
export function tagFor(niche: string, settings: Record<string, string | undefined>) {
  return settings[tagOverrideKey(niche)]?.trim() || settings.AMAZON_PA_API_PARTNER_TAG?.trim() || "";
}

/** Associate tags look like "skinrecs-20": letters, digits and dashes, ending in a dash and two digits. */
export const isAssociateTag = (tag: string) => /^[A-Za-z0-9][A-Za-z0-9-]{0,62}-\d{2}$/.test(tag);

export type Step =
  | { kind: "create"; key: AmazonKey; targets: Target[] }
  | { kind: "update"; key: AmazonKey; envId: string; targets: Target[] };

export type KeyState = { key: AmazonKey; has: Target[]; missing: Target[] };

const targetsOf = (env: ExistingEnv) => (Array.isArray(env.target) ? env.target : env.target ? [env.target] : []);

/** Which of the production and preview targets already carry each Amazon variable. */
export function keyStates(existing: ExistingEnv[], keys: readonly AmazonKey[] = AMAZON_KEYS): KeyState[] {
  return keys.map(key => {
    const covered = new Set(existing.filter(e => e.key === key).flatMap(targetsOf));
    return { key, has: TARGETS.filter(t => covered.has(t)), missing: TARGETS.filter(t => !covered.has(t)) };
  });
}

/**
 * What to change on one project. By default only missing variables are added, so running again changes nothing and
 * values someone already set (SkinRecs, SimRacingRecs) are kept. With overwrite, existing entries get the new value.
 */
export function planProject(existing: ExistingEnv[], overwrite = false, keys: readonly AmazonKey[] = AMAZON_KEYS): Step[] {
  const steps: Step[] = [];
  for (const { key, missing } of keyStates(existing, keys)) {
    if (overwrite) {
      for (const env of existing.filter(e => e.key === key)) {
        const targets = targetsOf(env).filter((t): t is Target => (TARGETS as readonly string[]).includes(t));
        if (targets.length) steps.push({ kind: "update", key, envId: env.id, targets });
      }
    }
    if (missing.length) steps.push({ kind: "create", key, targets: missing });
  }
  return steps;
}

/** The request body for one step. Credentials are "sensitive" (write-only in Vercel); tags are public anyway. */
export function envBody(step: Step, value: string) {
  const type = TAG_KEYS.includes(step.key) ? "encrypted" : "sensitive";
  return step.kind === "create" ? { key: step.key, value, type, target: step.targets } : { value, type, target: step.targets };
}
