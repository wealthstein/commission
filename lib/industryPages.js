import industriesData from "@/content/industries.json";

/**
 * Content for the business-facing /industries pages now lives in
 * content/industries.json - this file just re-exports it plus the lookup
 * helper, so every existing import site (`import { industryPages } from
 * "@/lib/industryPages"`) keeps working unchanged.
 */
export const DEFAULT_PPQL_NAIRA = industriesData.defaultPpqlNaira;
export const industryPages = industriesData.industries;

export function getIndustryPageBySlug(slug) {
  return industryPages.find((p) => p.slug === slug) || null;
}
