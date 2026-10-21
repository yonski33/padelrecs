import { createHash, timingSafeEqual } from "node:crypto";

/** Whether an Authorization header carries "Bearer <secret>". No secret configured means nobody is allowed. */
export function revalidationAuthorized(header: string | null, secret: string | undefined) {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  // Compare digests so the comparison takes the same time whatever the lengths.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header.slice(7)), digest(secret));
}
