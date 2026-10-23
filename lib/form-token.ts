import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// The review form asks for a signed timestamp when it opens (GET /api/reviews) and sends it back with the review.
// A post without one never loaded the form; one back within a few seconds was not typed by a person; a very old one is
// being replayed. Signed with a server secret, so it can't be forged or backdated.
export const FORM_MIN_MS = 3_000;
export const FORM_MAX_MS = 6 * 60 * 60 * 1000;
const secret = () => process.env.FORM_SECRET || process.env.VOTE_SECRET || process.env.DATABASE_URL || "local-development";
const sign = (payload: string, key: string) => createHmac("sha256", key).update(`review-form:${payload}`).digest("base64url");

export function issueFormToken(now = Date.now(), key = secret()) {
 const payload = `${now.toString(36)}.${randomBytes(6).toString("base64url")}`;
 return `${payload}.${sign(payload, key)}`;
}

export type FormTokenCheck = "ok" | "missing" | "invalid" | "too-fast" | "expired";
export function checkFormToken(token: unknown, now = Date.now(), key = secret()): FormTokenCheck {
 if (typeof token !== "string" || !token) return "missing";
 const parts = token.split(".");
 if (parts.length !== 3) return "invalid";
 const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, key)), given = Buffer.from(parts[2]);
 if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
 const issued = parseInt(parts[0], 36);
 if (!Number.isFinite(issued)) return "invalid";
 if (now - issued < FORM_MIN_MS) return "too-fast";
 if (now - issued > FORM_MAX_MS) return "expired";
 return "ok";
}
