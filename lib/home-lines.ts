import { niche } from "./niche";

/** The home page headline (2026-11 redesign): a line with some personality, its first part underlined. The SEO wording
 *  ("Real User Reviews of Skincare Products") stays in the page title and description. Niches without a line get the default. */
const lines: Record<string, [string, string]> = {
  skin: ["Skincare", ", according to people who’ve actually used it."],
  padel: ["Padel rackets", ", according to people who’ve actually played them."],
};

export function homeHeadline(): [string, string] {
  return lines[niche.id] ?? [niche.words.Many, `, according to people who’ve actually used them.`];
}
