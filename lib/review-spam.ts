// Content checks for public review submissions. Spam in the queue looked like this: review text "nsi4jhtFBuVsfLOS6YQz",
// alias "nKrXGtJeygseSSaQQhCNgOn", email "po.b.o.j.ev.odo.b5.0@gmail.com". Each signal adds to a score; a submission at
// SPAM_THRESHOLD or above is dropped (app/api/reviews/route.ts). One weak signal alone (a dotted Gmail address, an odd
// alias) is not enough, so a real person with an unusual handle still reaches the queue.

const VOWELS = /[aeiouy]/gi;
const strip = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/**
 * Capitals that don't start a capitalised chunk: "nKrXGtJ" has K, X, G, J; "McDonald", "PlayStation", "iPhone" have none.
 * Random mixed-case strings are full of them, real words and brand names almost never are.
 */
function strayCapitals(word: string) {
 let count = 0;
 for (let i = 1; i < word.length; i++) {
  if (!/[A-Z]/.test(word[i])) continue;
  if (!/^[a-z]{2}/.test(word.slice(i + 1, i + 3))) count++;
 }
 return count;
}

/** A single token that reads as machine-generated rather than a word, name or product code. */
export function gibberishWord(raw: string) {
 const word = strip(raw);
 if (word.length < 8) return false;
 // All-caps model codes (WH1000XM5, RTX4090) and plain words are left alone by the capital test.
 const mixedCase = /[a-z]/.test(word) && /[A-Z]/.test(word);
 if (mixedCase && strayCapitals(word) >= 3) return true;
 // Long keyboard mash in one run of letters: almost no vowels, or a long consonant run. Hyphenated words are checked
 // part by part, so "well-thought-through" passes.
 return (word.match(/[A-Za-z]{12,}/g) || []).some(run =>
  (run.match(VOWELS) || []).length / run.length < 0.2 || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(run));
}

const words = (text: string) => text.split(/\s+/).filter(w => /\p{L}/u.test(w));

/** Review text that is one long unbroken token, or largely made of gibberish tokens. */
export function looksRandomText(text: string) {
 const tokens = text.trim().split(/\s+/).filter(Boolean);
 if (tokens.length === 1 && tokens[0].length >= 15) return true;
 const junk = tokens.filter(gibberishWord).length;
 return junk >= 1 && (tokens.length <= 3 || junk / tokens.length >= 0.3);
}

/** An alias with no spaces that reads as a random string. "Jo", "padel_king_88" and "SteelSeriesFan" pass. */
export function looksRandomName(alias: string) {
 const name = alias.trim();
 return !!name && !/\s/.test(name) && gibberishWord(name);
}

const GMAIL = /^(gmail|googlemail)\.com$/i;
/** Gmail ignores dots, so bots sprinkle them to make one inbox look like many: "po.b.o.j.ev.odo.b5.0@gmail.com". */
export function dottedGmail(email: string) {
 const [local, domain] = email.trim().toLowerCase().split("@");
 return !!local && !!domain && GMAIL.test(domain) && (local.split("+")[0].match(/\./g) || []).length >= 3;
}

/** One address per inbox: lowercase, and for Gmail drop dots and +tags. */
export function normalizeEmail(email: string) {
 const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
 if (!GMAIL.test(domain)) return `${local}@${domain}`;
 return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
}

export const SPAM_THRESHOLD = 3;
export function spamScore(review: {reviewText: string; alias?: string | null; email?: string | null}) {
 const reasons: string[] = [];
 let score = 0;
 const add = (points: number, reason: string) => { score += points; reasons.push(reason); };
 if (looksRandomText(review.reviewText)) add(3, "random-text");
 if (words(review.reviewText).length < 3) add(1, "few-words");
 if (/https?:\/\/|www\./i.test(review.reviewText)) add(2, "link");
 if (review.alias && looksRandomName(review.alias)) add(2, "random-alias");
 if (review.email && dottedGmail(review.email)) add(2, "dotted-gmail");
 return {score, reasons, spam: score >= SPAM_THRESHOLD};
}
