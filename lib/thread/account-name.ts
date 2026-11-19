// Reserved names for optional PadelRecs accounts (drizzle/0028). Pure, for tests and both sides of the forms.
// A name's key folds case, accents, spaces and punctuation, so "Padel Pete", "padel.pete" and "PádelPete" are one name.
import { nameProblem } from "./display-name";
import { looksRandomName } from "../review-spam";

export const nameKey = (name: string) => name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
/** Names nobody can reserve or post under: they would read as the site speaking. */
const STAFF = /^(admin|administrator|mod|moderator|padelrecs|padelrec|official|staff|owner|support|team|system|removed|player|anonymous)\d*$/;

/** What's wrong with a name an account wants to reserve, or null. The posting rules (display-name.ts nameProblem) plus:
 *  two letters or digits at least, no staff-like names, no random strings (the review form's spam check). */
export function accountNameProblem(name: string) {
  const p = nameProblem(name); if (p) return p;
  const key = nameKey(name);
  if (key.length < 2) return "Use at least 2 letters or numbers.";
  if (STAFF.test(key)) return "That name is kept for the site. Pick another.";
  if (looksRandomName(name)) return "That looks like a random string. Pick a name people can read.";
  return null;
}
