// "What the <racket>'s build means for you" (owner 2026-11-17, product page v11): four cards from the catalog's own specs
// (shape, core, balance, face), each a plain one-liner in expert voice. The title always says what the catalog says (the
// v11 open item: never round a "Low/Medium" balance up to "Medium"). Padel words; ≤ 105 characters per line.

export type BuildCard = { key: "shape" | "core" | "balance" | "face"; title: string; line: string; /** 0 … 1 for the card's small
 *  gauge (core softness → firmness, balance low → high); the shape's own word for the outline. */ at?: number; shape?: string };

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;

/** `armDots`: the racket's Arm comfort bar. At 4+ no card says it is hard on the arm (audit 2026-11-17: generic carbon and core
 *  lines on rackets the reviews call comfortable). */
export function buildCards(spec: { shape?: string | null; core?: string | null; balance?: string | null; surface?: string | null }, armDots?: number): BuildCard[] {
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
  const face = clean(spec.surface), f = face.toLowerCase();
  if (face) {
    const glass = /fib(er|re)glass|fibrix|glass/.test(f) && !/carbon/.test(f.replace(/fibrix.*/, "")), mix = /fibrix|flex|\/|\+/.test(f);
    const k = Number(/(\d+)\s*k/.exec(f)?.[1] ?? 0);
    const line = glass && !mix ? "Fibreglass is softer and kinder to the arm; it feels less crisp at pace."
      : mix ? "A carbon and fibreglass mix: some comfort, some crispness."
      : k >= 12 ? (kind ? "High-K carbon is crisp and firm: precise at pace." : "High-K carbon is crisp and firm: precise at pace, less forgiving on the arm.")
      : "Carbon gives a crisp, firm feel with good control at pace.";
    out.push({ key: "face", title: `${cap(face.replace(/\bcarbon\b/i, "carbon"))} face`, line });
  }
  // Never over 105 characters: a long core name gives way to "The core".
  return out.map(x => x.line.length <= 105 ? x : { ...x, line: x.line.replace(core, "The core") });
}
