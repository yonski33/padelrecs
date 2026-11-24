// The creators home at its preview address (proxy.ts: "/?view=creators"). The page itself is app/thread/creators-home-body.tsx,
// the same one "/" shows once CREATOR_PAGE is on (lib/thread/sites.ts).
import type { Metadata } from "next";
import { homeMetadata } from "../../home-metadata";
import { liveOr } from "../seo";
import { DEFAULT_CHOICE } from "../../../lib/quick-match";
import { CreatorsHomeBody } from "../creators-home-body";

export const revalidate = 21600;
// The live home's title, description, canonical ("/") and share card.
export const generateMetadata = (): Promise<Metadata> => liveOr(() => homeMetadata(DEFAULT_CHOICE, false));

export default function CreatorsHome() { return <CreatorsHomeBody/>; }
