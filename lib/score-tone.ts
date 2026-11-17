/** Score and match colours (owner rule): green 85+, yellow 70–84, white below. Shared by server and browser parts. */
export const scoreTone = (n: number | null | undefined) => n == null ? "" : n >= 85 ? "g" : n >= 70 ? "y" : "w";
