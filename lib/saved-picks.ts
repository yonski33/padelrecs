// The visitor's saved quick-match picks (app/rackets/[slug]/ask-picks.tsx "remember my picks"), in this browser only.
import { niche } from "./niche";

export const SAVED_PICKS_KEY = `${niche.site.wordmark}-profile`;
/** Forgets the saved picks (a "reset" or "start over", owner 2026-11-16: reset must clear everything). */
export function forgetSavedPicks() { try { localStorage.removeItem(SAVED_PICKS_KEY); } catch { /* storage off */ } }
