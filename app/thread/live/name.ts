// The name a person typed on a Thread form (review or comment), remembered in this browser so they needn't type it again.
// Never a generated nickname (owner 2026-11-19). Storage can be off (private mode): then it just isn't remembered.
const KEY = "th-name";
export function savedName() { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } }
export function saveName(name: string) { try { const n = name.trim(); if (n) localStorage.setItem(KEY, n); else localStorage.removeItem(KEY); } catch { /* storage off */ } }
