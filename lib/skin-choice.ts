// SkinRecs quick match picks in the URL (?type=moisturizers&skin=dry&sens=1&acne=1&finish=matte&ff=1), so every combination
// is a shareable, server-rendered page. Pure.
import type { AttrChoice } from "./attr-score";

export const SKIN_TYPES = ["dry", "oily", "combination", "normal"] as const;
export const FINISHES = ["matte", "dewy"] as const;
type Q = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export function readSkinChoice(q: Q, typeSlugs: { slug: string; shape: string }[]): AttrChoice & { typeSlug: string | null } {
  const t = typeSlugs.find(x => x.slug === one(q.type));
  const skin = one(q.skin), finish = one(q.finish);
  return {
    type: t?.shape ?? null, typeSlug: t?.slug ?? null,
    skin: SKIN_TYPES.includes(skin as never) ? skin! : null,
    concerns: [...(one(q.sens) === "1" ? ["sensitive"] : []), ...(one(q.acne) === "1" ? ["acne"] : [])],
    finish: FINISHES.includes(finish as never) ? finish! : null,
    ff: one(q.ff) === "1",
  };
}
export type SkinChoice = ReturnType<typeof readSkinChoice>;
export function skinQuery(c: SkinChoice) {
  const q = new URLSearchParams();
  if (c.typeSlug) q.set("type", c.typeSlug);
  if (c.skin) q.set("skin", c.skin);
  if (c.concerns.includes("sensitive")) q.set("sens", "1");
  if (c.concerns.includes("acne")) q.set("acne", "1");
  if (c.finish) q.set("finish", c.finish);
  if (c.ff) q.set("ff", "1");
  return q;
}
export const skinHref = (c: SkinChoice, path = "/", anchor = "#match") => { const q = skinQuery(c); return `${path}${q.size ? `?${q}` : ""}${anchor}`; };
export const skinPicked = (c: SkinChoice) => !!(c.skin || c.concerns.length || c.finish || c.ff);
/** "dry, sensitive skin · matte · fragrance-free". */
export function skinWords(c: SkinChoice) {
  const skin = [c.skin === "combination" ? "combination" : c.skin, ...c.concerns.map(k => k === "acne" ? "acne-prone" : k)].filter(Boolean).join(", ");
  return [skin ? `${skin} skin` : null, c.finish ? `${c.finish} finish` : null, c.ff ? "fragrance-free" : null].filter((x): x is string => !!x);
}
