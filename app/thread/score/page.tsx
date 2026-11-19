import { InfoPage } from "../info";

// The live page's metadata (title, description, canonical).
import { metadata as live } from "../../how-we-make-these/page";
import { withPageShare } from "../seo";
import { niche } from "../../../lib/niche";
export const metadata = withPageShare(live, "score", "How the player score works");
export default function ThreadScore() { return <InfoPage k="score"/>; }
