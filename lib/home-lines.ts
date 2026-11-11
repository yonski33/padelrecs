import { niche } from "./niche";

/** What the site covers, as people say it: the underlined end of the home headline, "What players are saying about
 *  padel rackets". The SEO wording ("Real Player Reviews of Padel Rackets") stays in the page title and description. */
const topics: Record<string, string> = {
  audio: "audio gear", babygear: "baby gear", badminton: "badminton rackets", camera: "cameras", climbing: "climbing gear",
  coffee: "coffee gear", cycling: "bikes", discgolf: "discs", fragrance: "fragrances", gaming: "gaming gear", golf: "drivers",
  homegym: "home gym gear", hosting: "web hosting", keyboard: "keyboards", kitchen: "kitchen appliances", money: "money apps and cards",
  monitor: "monitors", nails: "nail products", padel: "padel rackets", pickleball: "pickleball paddles", running: "running shoes",
  simracing: "sim racing gear", skin: "skincare", sleep: "sleep gear", snowboard: "snowboards", software: "software",
  tabletennis: "table tennis gear", tennis: "tennis rackets", travelgear: "travel gear", ultralight: "ultralight gear",
};

/** ["What players are saying about ", "padel rackets"]: the headline and its underlined topic. */
export function homeHeadline(): [string, string] {
  return [`What ${niche.people.many} are saying about `, topics[niche.id] ?? niche.words.many];
}

/** The ranking whose top four sit beside "What … are discussing": by default the next list with a different title
 *  from the top-five one; a site can name its own. */
export const secondRanking: Record<string, string> = { skin: "best-face-sunscreens" };
