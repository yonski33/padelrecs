import { selectNiche } from "./all";
// The running site's config when lib/niche isn't aliased to one site's file (tsx scripts and tests): chosen by NICHE.
// Next builds replace this module with lib/niche/<NICHE>.ts (next.config.ts turbopack.resolveAlias).
export const niche = selectNiche(process.env.NICHE);
