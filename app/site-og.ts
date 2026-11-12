import { niche } from "../lib/niche";
/** The site's share card (app/opengraph-image.tsx). A page that sets its own openGraph replaces the inherited one, image
 *  included, so pages without their own card add this back. */
export const siteOgImages = [{ url: "/opengraph-image", width: 1200, height: 630, alt: niche.seo.ogAlt }];
