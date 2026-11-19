import { InfoPage } from "../info";

// The live page's metadata (title, description, canonical).
import { metadata as live } from "../../about/page";
import { withPageShare } from "../seo";
import { niche } from "../../../lib/niche";
export const metadata = withPageShare(live, "about", `About ${niche.site.name}`);
export default function ThreadAbout() { return <InfoPage k="about"/>; }
