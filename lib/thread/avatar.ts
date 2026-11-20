// Discussion avatars (PadelRecs v7b): initials on one of seven soft tones, the same tone for the same name every time.
// Seven soft tones (the mock's palette). The colour follows the shown name, which is reserved for members (accounts) and
// typed for guests: comments carry no account id to the browser.
const AV = ["oklch(0.9 0.05 145)", "oklch(0.9 0.04 250)", "oklch(0.91 0.05 60)", "oklch(0.9 0.04 320)", "oklch(0.92 0.06 100)", "oklch(0.9 0.04 200)", "oklch(0.9 0.05 25)"];
export function avatarOf(name: string) {
  let h = 0; for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  const init = (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "").replace(/[^\p{L}]/gu, "").slice(0, 2)).toUpperCase() || "?";
  return { bg: AV[h % AV.length], init };
}
