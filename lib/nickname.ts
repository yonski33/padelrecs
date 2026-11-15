// Generated reviewer nicknames ("SteadyVolley482"), owner 2026-11-14: like Reddit's random usernames, nothing to type.
// Pure, so the review API can sign anonymous reviews server-side (owner 2026-11-16: every reviewer gets a nickname, never
// "A <Site> player") and the one-tap card can reuse the same words in the browser.
export const NICK_A = ["Swift", "Steady", "Lucky", "Bold", "Sunny", "Quiet", "Clever", "Brave", "Calm", "Sharp", "Happy", "Mellow", "Rapid", "Smooth", "Wild", "Cool"];
/** The generic second halves, for niches without form.quickVote.nicknames. */
export const DEFAULT_NICKNAMES = ["Volley", "Lob", "Smash", "Rally", "Spin", "Drop", "Ace", "Slice", "Serve", "Rebound", "Baseline", "Topspin"];
export function makeNickname(words: string[] = DEFAULT_NICKNAMES, rand: () => number = Math.random) {
  const pick = (list: string[]) => list[Math.floor(rand() * list.length)];
  return `${pick(NICK_A)}${pick(words.length ? words : DEFAULT_NICKNAMES)}${Math.floor(100 + rand() * 900)}`;
}
