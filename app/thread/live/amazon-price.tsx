"use client";
// The live Amazon price in the creator page's buy box (SkinRecs, owner 2026-11-23). The page is cached for hours, so the
// browser hides the price once its lookup is more than 24 hours old (Amazon's rule for shown prices); the button stays.
import { useEffect, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;
export function AmazonPrice({ price, checkedAt }: { price: string; checkedAt: string | null }) {
  const [fresh, setFresh] = useState(true);
  useEffect(() => { if (!checkedAt || Date.now() - Date.parse(checkedAt) > DAY) setFresh(false); }, [checkedAt]);
  if (!fresh || !checkedAt) return null;
  const when = new Date(checkedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  return <><span className="thc-pbox-l">Price on Amazon</span><strong className="thc-pbox-p">{price}</strong>
    <span className="thc-note thc-amz-when">{`As of ${when} UTC. Prices can change.`}</span></>;
}
