// StackRecs catalog (plan PR #517, owner sign-off 2026-11-19: Google AI Studio added, Emergent left out). Pure data, so the
// seed script, the pages and the tests share it. The database holds the same tools (scripts/stackrecs-seed.mts writes them);
// this file adds what the pages need and the database has no column for: the side, the budget facts and the programme.
//
// Prices: the cheapest paid plan in US dollars a month, rounded, and whether a free plan or a free trial exists. They change
// often, so `checked` stays false until each is confirmed on the vendor's pricing page (the seed's dry run lists them).
// Affiliate links: `programme` only says one exists (research note 2026-11-19). The link itself is the product's
// affiliate_url in the database, empty until the owner adds it, and it never reaches the score (lib/stack/score.ts).

export type Side = "build" | "grow";
export const SIDES: Side[] = ["build", "grow"];
export const CATEGORIES = {
  build: ["Coding agent", "App builder"],
  grow: ["SEO suite", "Content tool", "AI writer", "Technical SEO", "AI visibility"],
} as const;
export type Category = (typeof CATEGORIES)[Side][number];

export type StackTool = {
  slug: string; name: string; vendor: string; category: Category; website: string;
  /** Free plan or free trial. */ free: boolean;
  /** Cheapest paid plan, USD a month (yearly plans divided by 12); null when only by quote. */ fromUsd: number | null;
  /** Prices confirmed on the vendor's pricing page. */ checked: boolean;
  /** An affiliate programme exists (and its rough terms), else null: no "Try it" link, ever. */ programme: string | null;
  /** Earlier names, shown as "was …" and kept for search. */ was?: string[];
};

const t = (slug: string, name: string, vendor: string, category: Category, website: string, free: boolean, fromUsd: number | null,
  programme: string | null = null, was?: string[]): StackTool => ({ slug, name, vendor, category, website, free, fromUsd, checked: false, programme, ...(was ? { was } : {}) });

export const STACK_TOOLS: StackTool[] = [
  // Build: coding agents (no affiliate programme found for any of them).
  t("claude-code", "Claude Code", "Anthropic", "Coding agent", "https://www.anthropic.com/claude-code", false, 20),
  t("openai-codex", "OpenAI Codex", "OpenAI", "Coding agent", "https://openai.com/codex", false, 20),
  t("cursor", "Cursor", "Anysphere", "Coding agent", "https://cursor.com", true, 20),
  t("github-copilot", "GitHub Copilot", "GitHub", "Coding agent", "https://github.com/features/copilot", true, 10),
  t("devin-desktop", "Devin Desktop", "Cognition", "Coding agent", "https://devin.ai", true, 15, null, ["Windsurf"]),
  t("google-antigravity", "Google Antigravity", "Google", "Coding agent", "https://antigravity.google", true, null),
  t("cline", "Cline", "Cline", "Coding agent", "https://cline.bot", true, null),
  t("kilo-code", "Kilo Code", "Kilo Code", "Coding agent", "https://kilocode.ai", true, null),
  t("aider", "Aider", "Aider", "Coding agent", "https://aider.chat", true, null),
  t("opencode", "OpenCode", "OpenCode", "Coding agent", "https://opencode.ai", true, null),
  t("zed", "Zed", "Zed Industries", "Coding agent", "https://zed.dev", true, 10),
  t("jetbrains-ai", "JetBrains AI", "JetBrains", "Coding agent", "https://www.jetbrains.com/ai/", true, 10),
  t("kiro", "Kiro", "Amazon Web Services", "Coding agent", "https://kiro.dev", true, 20),
  t("amp", "Amp", "Amp", "Coding agent", "https://ampcode.com", true, null),
  t("warp", "Warp", "Warp", "Coding agent", "https://www.warp.dev", true, 18),
  // Build: app and site builders.
  t("lovable", "Lovable", "Lovable", "App builder", "https://lovable.dev", true, 25, "Impact: up to $100 per subscriber"),
  t("replit-agent", "Replit Agent", "Replit", "App builder", "https://replit.com", true, 20),
  t("bolt-new", "Bolt.new", "StackBlitz", "App builder", "https://bolt.new", true, 25),
  t("v0", "v0", "Vercel", "App builder", "https://v0.app", true, 20, "Vercel affiliate links (Dub): about 30% for 6 months"),
  t("base44", "Base44", "Wix", "App builder", "https://base44.com", true, 20, "$100 flat per sale"),
  t("framer-ai", "Framer AI", "Framer", "App builder", "https://www.framer.com", true, 10, "50% of year 1"),
  t("webflow-ai", "Webflow AI", "Webflow", "App builder", "https://webflow.com", true, 14, "50% for 12 months"),
  t("hostinger-horizons", "Hostinger Horizons", "Hostinger", "App builder", "https://www.hostinger.com/horizons", false, 20, "Up to 60%, one-off"),
  t("google-ai-studio", "Google AI Studio", "Google", "App builder", "https://aistudio.google.com", true, null),
  // Grow: SEO suites.
  t("semrush", "Semrush", "Semrush", "SEO suite", "https://www.semrush.com", true, 140, "Impact: $200 to $450 per sale, one-off"),
  t("ahrefs", "Ahrefs", "Ahrefs", "SEO suite", "https://ahrefs.com", true, 129),
  t("se-ranking", "SE Ranking", "SE Ranking", "SEO suite", "https://seranking.com", true, 65, "30% recurring"),
  t("moz-pro", "Moz Pro", "Moz", "SEO suite", "https://moz.com/products/pro", true, 49, "Terms conflict: verify in the dashboard"),
  // Grow: content and on-page.
  t("surfer", "Surfer", "Surfer", "Content tool", "https://surferseo.com", false, 99, "PartnerStack: first payment share, one-off"),
  t("clearscope", "Clearscope", "Clearscope", "Content tool", "https://www.clearscope.io", false, null),
  t("frase", "Frase", "Frase", "Content tool", "https://www.frase.io", true, 45, "30% for 12 months"),
  t("neuronwriter", "NeuronWriter", "NeuronWriter", "Content tool", "https://neuronwriter.com", true, 23, "30% recurring"),
  // Grow: AI writing.
  t("jasper", "Jasper", "Jasper", "AI writer", "https://www.jasper.ai", true, 69, "25 to 30% for 12 months"),
  t("writesonic", "Writesonic", "Writesonic", "AI writer", "https://writesonic.com", true, 49, "Terms conflict: verify in the dashboard"),
  t("koala", "Koala", "Koala", "AI writer", "https://koala.sh", true, 9, "30% lifetime"),
  // Grow: technical SEO.
  t("screaming-frog", "Screaming Frog", "Screaming Frog", "Technical SEO", "https://www.screamingfrog.co.uk/seo-spider/", true, 23),
  t("sitebulb", "Sitebulb", "Sitebulb", "Technical SEO", "https://sitebulb.com", true, 14),
  // Grow: AI visibility.
  t("otterly-ai", "Otterly.AI", "Otterly.AI", "AI visibility", "https://otterly.ai", true, 29, "20% for 12 months"),
  t("peec-ai", "Peec AI", "Peec AI", "AI visibility", "https://peec.ai", true, 99),
];

export const sideOf = (category: string | null | undefined): Side | null =>
  !category ? null : (CATEGORIES.build as readonly string[]).includes(category) ? "build" : (CATEGORIES.grow as readonly string[]).includes(category) ? "grow" : null;
export const toolBySlug = new Map(STACK_TOOLS.map(x => [x.slug, x]));
/** "Try it" only where a programme exists and the owner has added the link. */
export const tryLink = (slug: string, affiliateUrl: string | null | undefined) =>
  toolBySlug.get(slug)?.programme && affiliateUrl?.trim() ? affiliateUrl.trim() : null;
/** The one note next to every "Try it" link. */
export const COMMISSION_NOTE = "Commission link. It never changes the score.";
