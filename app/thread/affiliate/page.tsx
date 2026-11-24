import { notFound } from "next/navigation";
import { InfoPage } from "../info";
import { amazonLinksOn } from "../../../lib/amazon-offer";

// The live page's metadata (title, description, canonical); like the live page, none without affiliate links.
export { generateMetadata } from "../../affiliate-disclosure/page";
export default function ThreadAffiliate() { if (!amazonLinksOn()) notFound(); return <InfoPage k="affiliate"/>; }
