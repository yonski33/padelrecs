// Video length and chapters for the "From around the web" video rows (owner mock 2026-11-22: "14:22" on the thumbnail and
// chips like "2:10 Defence and lobs"). Both come from YouTube itself (videos.list: contentDetails.duration and the
// channel's own chapter lines in the description), never from us: no chapter is ever made up or retimed. Stored per site
// in db/video-meta/<site>.json by scripts/video-meta-build.mts; pure, so the tests see exactly what the page shows.

/** One video: its length in seconds and its usable chapters (start second, the channel's own title); the page picks up
 *  to three per racket with pickChips. */
export type VideoMeta = { d: number | null; ch: [number, string][] };

/** "PT14M22S" → 862; null when it isn't an ISO 8601 duration (or is 0, a live stream). */
export function isoSeconds(iso?: string | null): number | null {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const s = Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
  return s > 0 ? s : null;
}
/** 862 → "14:22", 3725 → "1:02:05". */
export function clock(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(x)}` : `${m}:${p(x)}`;
}

const STAMP = /^\s*[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?(?:\s*[-–]\s*(?:\d{1,2}:)?\d{1,2}:\d{2})?\s*(?:[-–:|.)]\s*)?(.+?)\s*$/;
const secs = (t: string) => t.split(":").map(Number).reduce((a, n) => a * 60 + n, 0);
/** The description's chapters the way YouTube reads them: lines starting with a timestamp, the first at 0:00, at least
 *  three, each at least 10 seconds after the one before and inside the video. Anything else: no chapters. "00:00 - 2:10
 *  Intro" range lines keep their start. */
export function chaptersOf(description: string, duration: number | null): [number, string][] {
  const out: [number, string][] = [];
  for (const line of description.split(/\r?\n/)) {
    const m = line.match(STAMP);
    if (!m) continue;
    const title = m[2]!.replace(/\s+/g, " ").trim();
    if (title) out.push([secs(m[1]!), title]);
  }
  if (out.length < 3 || out[0]![0] !== 0) return [];
  for (let i = 1; i < out.length; i++) if (out[i]![0] - out[i - 1]![0] < 10) return [];
  if (duration && out[out.length - 1]![0] >= duration) return [];
  return out;
}

/** Chapters that tell a player nothing (intro, outro, sponsor, giveaway, channel plugs). */
const SKIP = /\b(intro(duction)?|outro|conclusions?|summary|final (thoughts|words|verdict)|verdict|wrap[- ]?up|sponsor(ed)?|ad|giveaway|subscribe|discount|code|links?|shop|price|unbox(ing)?|welcome|hello|thanks|bloopers?|start|end|recap|overview|round|match|set|game|points?)\b/i;
/** Chapters about how a racket plays. */
const PLAY = /\b(defen[cs]e|defensive|lobs?|volleys?|smash(es)?|power|control|bandeja|v[ií]bora|spin|feel|sweet ?spot|touch|balance|weight|hardness|stiffness|output|attack(ing)?|block(ing)?|serve|bajada|forgiv\w*|manoeuv\w*|maneuv\w*|playtest|play ?test|on court|at (the )?net|from (the )?back|baseline|who (is )?it'?s? for|who .* for|target audience|level|specs?|tech(nology|nical)?|features?|compar\w*|versus|opinion|impressions?|pros?( and|&) cons)\b/i;
const ENGLISH_TITLE = /^[\x20-\x7E’‘–]+$/;
const SPANISH = /\b(de|del|la|las|el|los|y|con|para|pala|que|potencia|defensa|salida|dureza|remate|conclusi[oó]n)\b/i;
const MAX_TITLE = 32, CHIPS = 3;

/** The chapters worth keeping for one video (what db/video-meta stores): English titles only (owner 2026-11-22: start
 *  with English, no translation), never the intro or outro, no 0:00 chapter. None when the video isn't English. */
export function usableChapters(chapters: [number, string][], lang?: string | null): [number, string][] {
  if (lang && !/^en\b/i.test(lang)) return [];
  return chapters.filter(([s, t]) => s > 0 && t.length <= MAX_TITLE && ENGLISH_TITLE.test(t) && !SPANISH.test(t) && !SKIP.test(t));
}

/** Words that mark another version of a model ("Metalbone HRD+", "12K Alum Xtrem Lite", "Vertex 04 Comfort"). */
const VARIANT = new Set(["lite", "light", "pro", "plus", "hrd", "ctrl", "carbon", "team", "junior", "jr", "hybrid", "soft", "comfort",
  "xtrem", "xtreme", "alum", "ltd", "limited", "women", "woman", "w", "ultralight", "air", "max", "elite", "tour", "x", "3k", "12k", "18k", "24k"]);
const toks = (t: string) => t.toLowerCase().replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, " ").split(" ").filter(w => w && !/^20\d\d$/.test(w));

/** The chips for one racket page: up to three of the video's chapters, in time order. Chapters naming this racket first,
 *  then play topics (defence, volleys, power…). A chapter about another racket in the same video (another brand, or this
 *  model's family with a variant word this racket doesn't have) is never shown, even when it names a topic. */
/** `name`: the racket's full name with its brand ("Nox AT10 Genius 12K Alum Xtrem 2026"); `brands`: every brand's name. */
export function pickChips(chapters: [number, string][], name: string, brands: string[] = []): [number, string][] {
  const brandToks = brands.map(toks).filter(b => b.length), all = new Set(toks(name));
  const mineBrand = new Set(brandToks.filter(b => b.every(x => all.has(x))).flat());
  const own = new Set([...all].filter(w => !mineBrand.has(w)));
  const family = [...own].filter(w => !VARIANT.has(w)), variants = [...own].filter(w => VARIANT.has(w));
  const scored = chapters.flatMap(([s, t]) => {
    const w = toks(t), ws = new Set(w);
    const otherBrand = brandToks.some(b => b.every(x => ws.has(x)) && !b.every(x => mineBrand.has(x)));
    const shares = family.some(f => ws.has(f)), otherVariant = shares && w.some(x => VARIANT.has(x) && !own.has(x));
    if (otherBrand || otherVariant) return [];
    // This racket: its variant words and one of its family words ("Genius 12K Alum Xtrem" on the AT10 Genius 12K Alum
    // Xtrem); a model without variant words needs all of its words ("Vertex 04").
    const mine = variants.length ? shares && variants.every(v => ws.has(v)) : family.length > 0 && family.every(f => ws.has(f));
    const play = PLAY.test(t);
    return mine || play ? [{ s, t, rank: mine ? 0 : 1 }] : [];
  });
  return scored.sort((a, b) => a.rank - b.rank || a.s - b.s).slice(0, CHIPS).sort((a, b) => a.s - b.s).map(x => [x.s, x.t] as [number, string]);
}

/** A chip's link: the video at that second. */
export const atSecond = (url: string, s: number) => { try { const u = new URL(url); u.searchParams.delete("lc"); u.searchParams.set("t", `${s}s`); return u.toString(); } catch { return url; } };
