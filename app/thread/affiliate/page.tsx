import { notFound } from "next/navigation";
import { InfoPage } from "../info";
import { amazonLinksOn } from "../../../lib/amazon-offer";

// The live page's metadata (title, description, canonical); like the live page, none without affiliate links.
import { generateMetadata as live } from "../../affiliate-disclosure/page";
import { withPageShare } from "../seo";
export const generateMetadata = async () => withPageShare(await live(), "affiliate", "Affiliate disclosure");
export default function ThreadAffiliate() { if (!amazonLinksOn()) notFound(); return <InfoPage k="affiliate"/>; }
