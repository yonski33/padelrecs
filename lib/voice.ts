// The expert voice (owner 2026-11-16): advice reads as plain, confident statements ("Easy racket with a big sweet spot, but less
// power than the Metalbone 3.5"), not as "14 players mention it" / "many players say". The evidence stays where it belongs:
// the Reviews section, the Player score, report counts and the small "N players mention it" lines. Accuracy doesn't change:
// a statement still has to match the evidence and specs, split evidence is said plainly ("splits opinion: …"), and nothing
// may imply we played it. Shared copy guide: QUICK-TAKE-RECIPE.md, "Voice".

/** Who-said-it wording inside advice: "players say", "a few players", "one tester", "12 players", "reviewers call it". */
export const ATTRIBUTION = new RegExp([
  String.raw`\b(players?|testers?|reviewers?|owners?|users?|people)\s+(say|says|said|find|finds|found|call|calls|called|report|reports|reported|like|likes|liked|praise|praises|praised|feel|feels|felt|got|saw|want|wants|wanted|mention|mentions|mentioned|point|points|prefer|prefers|left|moved|agree|agrees|describe|describes|weighed|ended|note|notes|rate|rates|love|loves|warn|warns|complain|complains|expect|expected|coming|switched|tried|get|see|use|dislike|trust|struggle|dropped|outgrow|outgrew|miss|disagree)\b`,
  String.raw`\b(players?|testers?|users?)\s+(with|new to|coming from)\b[^.;:]*?\b(say|says|find|finds|found|reach|get|got|dropped|felt|report)\b`,
  String.raw`\b(players?|testers?|reviewers?|users?)\s+who\s+(found|moved|left|switched|tried|said|call|called)\b`,
  String.raw`\b(some|many|several|a few|few|most|lots of|two|three|one|other|\d+)\s+(players?|testers?|reviewers?|owners?|users?)\b`,
  String.raw`\b(a|one|another)\s+(player|tester|reviewer|owner|user)\b`,
  String.raw`\b(some|many|several|a few|most)\s+(find|say|call|feel|report|praise|want|got|found|felt|said)\b`,
].join("|"), "i");

/** True when a line of advice says who said it instead of saying the thing. */
export const hasAttribution = (text: string) =>
  // A split said plainly is allowed: "Splits opinion: some find it stiff, others crisp."
  ATTRIBUTION.test(text.replace(/==/g, "").replace(/\b(splits? (opinion|reviews)|opinion splits|opinions? (is |are )?split)\b[^.]*/gi, ""));
