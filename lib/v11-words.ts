// Product page v11's fit-check headlines per site (owner 2026-11-17, design_handoff_product_page_v11), kept apart from
// lib/v11-site.ts so the browser part (fit-live.tsx) loads only these words. A site not listed keeps its older page.
export const V11_HEADLINES: Record<string, { good: string; maybe: string; no: string; thin: string }> = {
  padel: { good: "Good match for you", maybe: "Maybe, demo it first", no: "Probably not your racket", thin: "Not enough reports from players like you yet." },
  pickleball: { good: "Good match for you", maybe: "Maybe, demo it first", no: "Probably not your paddle", thin: "Not enough reports from players like you yet." },
  tennis: { good: "Good match for you", maybe: "Maybe, demo it first", no: "Probably not your racket", thin: "Not enough reports from players like you yet." },
  discgolf: { good: "Good match for you", maybe: "Maybe, try it first", no: "Probably not your disc", thin: "Not enough reports from players like you yet." },
};
