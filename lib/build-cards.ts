// "What the <racket>'s build means for you" (owner 2026-11-17, product page v11): four cards from the catalog's own specs
// (shape, core, balance, face), each a plain one-liner in expert voice. The title always says what the catalog says (the
// v11 open item: never round a "Low/Medium" balance up to "Medium"). Padel words; ≤ 105 characters per line.

export type BuildCard = { key: "shape" | "core" | "balance" | "weight" | "face"; title: string; line: string; /** 0 … 1 for the card's small
 *  gauge (core softness → firmness, balance low → high); the shape's own word for the outline. */ at?: number; shape?: string };

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;

/** `armDots`: the racket's Arm comfort bar. At 4+ no card says it is hard on the arm (audit 2026-11-17: generic carbon and core
 *  lines on rackets the reviews call comfortable). */
export function buildCards(spec: { shape?: string | null; core?: string | null; balance?: string | null; surface?: string | null; weight?: string | null }, armDots?: number): BuildCard[] {
  const kind = (armDots ?? 0) >= 4;
  const out: BuildCard[] = [];
  const shape = clean(spec.shape).toLowerCase();
  const SHAPE: Record<string, string> = {
    round: "Biggest sweet spot of any shape, so mishits still go back deep.",
    teardrop: "Between round and diamond: some reach on smashes, still forgiving.",
    diamond: "Built for smashes: the sweet spot sits higher and is smaller than on a round.",
    hybrid: "A middle ground: more reach than a round, more forgiving than a diamond.",
    hexagonal: "An uncommon outline that sits close to a teardrop in feel.",
  };
  const sk = Object.keys(SHAPE).find(k => shape.startsWith(k)) ?? (shape.includes("geometric") ? "diamond" : null);
  if (shape) out.push({ key: "shape", title: `${cap(clean(spec.shape).replace(/\s+oversized$/i, ""))} shape`, line: sk ? SHAPE[sk] : "An uncommon shape; check the specs below.", shape: sk ?? "round" });
  const core = clean(spec.core), c = core.toLowerCase();
  if (core) {
    // The makers' own words (audit 2026-11-17): HEAD Power Foam is its most reactive foam and adidas EVA High Memory its hard,
    // high-density rubber (firm); Black EVA and MLD Black EVA sit in the middle; soft, comfort and control foams are soft.
    const hard = /hard|power foam|high memory|\bhr\b|pro eva/.test(c), soft = !hard && /soft|comfort|control foam|^foam$|light foam/.test(c);
    out.push(soft ? { key: "core", title: "Soft core", line: `${core} feels comfy and gives easy depth; fast blocks can fly long.`, at: 0.2 }
      : hard ? { key: "core", title: "Firm core", line: kind ? `${core} gives control and punch at pace.` : `${core} gives control and punch at pace; it asks more of your arm.`, at: 0.85 }
      : { key: "core", title: "Medium core", line: `${core} sits between soft and firm: some comfort, some control at pace.`, at: 0.5 });
  }
  const bal = clean(spec.balance), b = bal.toLowerCase();
  if (bal) {
    const lowMid = /low.*med|med.*low/.test(b), midHigh = /med.*high|high.*med/.test(b);
    const at = lowMid ? 0.38 : midHigh ? 0.65 : b.startsWith("high") ? 0.85 : b.startsWith("low") ? 0.15 : 0.5;
    const line = at >= 0.8 ? "Weight sits up top: more power on smashes, a little slower at the net."
      : at >= 0.6 ? "Weight leans to the head: extra punch, still fairly quick at the net."
      : at <= 0.2 ? "Weight sits near the hand: quick at the net and easy to move."
      : at < 0.45 ? "Weight sits a touch low: quick hands at the net with some punch left."
      : "Weight sits in the middle, so it stays quick at the net with some punch left.";
    out.push({ key: "balance", title: `${cap(bal.replace(/\//, " to ").replace(/-/, " to ").toLowerCase())} balance`, line, at });
  }
  // Weight (owner 2026-11-17, v11c): the catalog's figure as the chip ("345–360 g"), the midpoint read as light (< 350 g), mid
  // (350–365 g) or heavy (> 365 g). No figure, no chip.
  const grams = [...clean(spec.weight).matchAll(/(\d{3})(?:\.\d+)?/g)].map(m => +m[1]).filter(n => n >= 300 && n <= 420);
  if (grams.length) {
    const mid = (Math.min(...grams) + Math.max(...grams)) / 2;
    out.push({ key: "weight", title: grams.length > 1 ? `${Math.min(...grams)}–${Math.max(...grams)} g` : `${grams[0]} g`, at: Math.max(0, Math.min(1, (mid - 335) / 45)),
      line: mid < 350 ? (kind ? "Light: quick at the net and easy on the arm; less solid on hard blocks." : "Light: quick at the net; less solid on hard blocks.")
        : mid > 365 ? (kind ? "Heavy: solid on blocks and smashes; slower to move at the net." : "Heavy: solid on blocks and smashes; it can tire the arm over long matches.")
        : "Mid-weight: stable on blocks, still quick at the net." });
  }
  const face = clean(spec.surface), f = face.toLowerCase();
  if (face) {
    const glass = /fib(er|re)glass|fibrix|glass/.test(f) && !/carbon/.test(f.replace(/fibrix.*/, "")), mix = /fibrix|flex|\/|\+/.test(f);
    const k = Number(/(\d+)\s*k/.exec(f)?.[1] ?? 0);
    // The tap line names the face material first (owner 2026-11-17: "16K carbon, rough finish").
    const feel = glass && !mix ? "softer and kinder to the arm, a little less crisp at pace."
      : mix ? "a carbon and fibreglass mix, some comfort and some crispness."
      : k >= 12 ? (kind ? "crisp and firm, precise at pace." : "crisp and firm, precise at pace, less forgiving on the arm.")
      : "a crisp, firm feel with good control at pace.";
    const line = `${cap(face)}: ${feel}`.length <= 105 ? `${cap(face)}: ${feel}` : cap(feel);
    out.push({ key: "face", title: `${cap(face.split(/[,;]/)[0].trim())} face`, line });
  }
  // Never over 105 characters: a long core name gives way to "The core".
  return out.map(x => x.line.length <= 105 ? x : { ...x, line: x.line.replace(core, "The core") });
}
