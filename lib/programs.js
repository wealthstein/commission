import programsData from "@/content/programs.json";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * Programs content (industries and companies for the /programs pages) is
 * curated marketing copy, not user-generated data - the same reasoning
 * that already put lib/industryPages.js, lib/comparisons.js, and
 * lib/siteSections.js in static files instead of a database table. This
 * used to live in the seo_keyword_targets table; moving it to a plain JSON
 * file removes a database round trip entirely (faster than even a cached
 * query) and keeps every one of Commission's curated content types
 * consistent: one pattern, not two.
 *
 * The one real tradeoff: claiming a program for a real business that joins
 * (claimedBusinessSlug) now requires editing content/programs.json and
 * redeploying, rather than flipping one field on a live database row. For
 * how infrequently that happens, that trade is worth the simplicity - but
 * it is a real trade, not a free win.
 */

/**
 * All program entries, for the /programs index page and the internal-links
 * footer column. Returns the OLD snake_case shape (route_slug,
 * display_name, ...) as its public interface on purpose -
 * components/marketing/InternalLinksSection.js consumes this directly and
 * cannot be updated right now, so this function's output shape is a
 * contract that has to stay stable even though the underlying JSON storage
 * uses camelCase internally.
 */
export function listPrograms() {
  return [...programsData]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.displayName.localeCompare(b.displayName);
    })
    .map((p) => ({
      route_slug: p.routeSlug,
      type: p.type,
      keyword_slug: p.keywordSlug,
      display_name: p.displayName,
      industry_slug: p.industrySlug,
      industry_category: p.industryCategory,
      claimed_business_slug: p.claimedBusinessSlug,
      meta_description: p.metaDescription,
    }));
}

async function fetchLiveProducts(industryCategory) {
  // Live campaigns are not shown publicly yet - re-enable by removing this
  // early return once ready. Left the real query below intact rather than
  // deleting it, so turning this back on is a one-line change.
  return [];
  // eslint-disable-next-line no-unreachable
  if (!industryCategory) return [];
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("campaigns")
    .select("name, slug, price_naira, businesses(name, slug)")
    .eq("category", industryCategory)
    .eq("status", "active")
    .limit(6);
  return data || [];
}

/**
 * An INDUSTRY program page - /programs/[industrySlug]. Affiliate-facing:
 * "browse programs you can promote in this industry," distinct from
 * /industries/[slug] (business-facing: "list your product in this
 * industry"). Returns the industry entry itself, every company nested
 * under it, and any live products in the matching product category.
 */
export async function getIndustryProgram(industrySlug) {
  const industry = programsData.find((p) => p.type === "industry" && p.keywordSlug === industrySlug);
  if (!industry) return { industry: null, companies: [], liveProducts: [] };

  const companies = programsData
    .filter((p) => p.type === "company" && p.industrySlug === industrySlug)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const liveProducts = await fetchLiveProducts(industry.industryCategory);

  return { industry, companies, liveProducts };
}

/**
 * A COMPANY program page - /programs/[industrySlug]/[companySlug].
 * Affiliate-facing: "does this specific company have a program yet."
 */
export async function getCompanyProgram(industrySlug, companySlug) {
  const company = programsData.find(
    (p) => p.type === "company" && p.industrySlug === industrySlug && p.keywordSlug === companySlug
  );
  if (!company) return { company: null, industry: null, liveProducts: [] };

  const industry = programsData.find((p) => p.type === "industry" && p.keywordSlug === industrySlug) || null;
  const liveProducts = await fetchLiveProducts(company.industryCategory);

  return { company, industry, liveProducts };
}

/**
 * Looks up a program entry by its OLD flat keyword (from before the nested
 * /programs/[industry]/[company] structure existed) so app/[slug]/page.js
 * can 301-redirect an old link like /gtbank-affiliate-program to its new
 * nested home, without needing to know the industry up front.
 */
export function findProgramRouteByLegacyKeyword(type, keywordSlug) {
  const match = programsData.find((p) => p.type === type && p.keywordSlug === keywordSlug);
  return match?.routeSlug ?? null;
}
