// SkinRecs' "best for" words (the ranking rows', shared with the home and catalogue rows, owner 2026-11-16): the skin types
// people with that skin gave it 65+ for, enough of them, best first, at most three: "dry, normal & sensitive skin".
import type { AttrProfile } from "./attr-profile";
import type { ProductAttrs } from "./attr-score";
import { FEW_VOICES } from "./attr-score";

const andJoin = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} & ${xs[xs.length - 1]}`;

export function skinBestFor(profile: AttrProfile, a: ProductAttrs | undefined): string | null {
  if (!a) return null;
  const ks = profile.attrs.filter(x => x.kind === "suits" && (a.scores[x.key]?.score ?? 0) >= 65 && (a.scores[x.key]?.n ?? 0) >= FEW_VOICES)
    .sort((x, y) => a.scores[y.key]!.score - a.scores[x.key]!.score).slice(0, 3).map(x => x.label.toLowerCase().replace(/ skin$/, ""));
  return ks.length ? `${andJoin(ks)} skin` : null;
}
