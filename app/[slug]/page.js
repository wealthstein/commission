import { redirect, notFound } from "next/navigation";
import { parseSeoRouteSlug } from "@/lib/seo";
import { getComparisonBySlug } from "@/lib/comparisons";
import { findProgramRouteByLegacyKeyword } from "@/lib/programs";
import { urls } from "@/lib/urls";

/**
 * This route only exists to 301-redirect old flat-slug links to their
 * current nested home, so nothing already indexed or shared breaks:
 *   /commission-and-google-ads   -> /comparisons/google-ads
 *   /google-ads (a brief bare-URL phase this site went through) -> /comparisons/google-ads
 *   /real-estate                 -> /industries/real-estate
 *   /gtbank-affiliate-program    -> /programs/[industry]/gtbank (looked up - the
 *     old flat pattern does not encode which industry a company nests
 *     under, so this needs a real database lookup, not a guess)
 *   /fintech-affiliate-programs  -> /programs/fintech
 *   /about, /contact, /careers, /terms, /privacy, /security (old bare
 *     corporate URLs) -> /corporate/[page]
 * Comparisons live at /comparisons/[slug] - see app/comparisons/[slug]/page.js
 * for the real page. Every redirect target below comes from lib/urls.js -
 * if that ever changes again, this file does not need to.
 */
const OLD_CORPORATE_SLUGS = {
  about: urls.about(),
  contact: urls.contact(),
  careers: urls.careers(),
  terms: urls.terms(),
  privacy: urls.privacy(),
  security: urls.security(),
};

export default async function LegacySlugRedirect({ params }) {
  if (OLD_CORPORATE_SLUGS[params.slug]) redirect(OLD_CORPORATE_SLUGS[params.slug]);

  // A brief bare-URL phase (e.g. /google-ads) this site went through -
  // redirect straight to the current nested home.
  const bareComparison = getComparisonBySlug(params.slug);
  if (bareComparison) redirect(urls.comparison(bareComparison.slug));

  const parsed = parseSeoRouteSlug(params.slug);
  if (!parsed) notFound();

  if (parsed.type === "comparison") redirect(urls.comparison(parsed.keywordSlug));
  if (parsed.type === "industry-landing") redirect(urls.industry(params.slug));

  if (parsed.type === "company" || parsed.type === "industry") {
    const currentRouteSlug = await findProgramRouteByLegacyKeyword(parsed.type, parsed.keywordSlug);
    if (currentRouteSlug) redirect(urls.program(currentRouteSlug));
  }

  notFound();
}

