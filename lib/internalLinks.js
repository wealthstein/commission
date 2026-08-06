/**
 * The internal-link section rendered right above the footer on every
 * marketing page (see components/marketing/InternalLinksSection.js).
 *
 * Column ORDER follows SEO best practice rather than the sketch's literal
 * left-to-right order: highest commercial intent and freshest content
 * first, trust/corporate content last (corporate pages carry little search
 * value themselves but matter for site trust signals).
 *   1. Programs    - live, freshest content, highest commercial intent
 *   2. Industries   - high commercial intent ("X affiliate marketing Nigeria")
 *   3. Comparison   - competitive differentiation, decent "X vs Y" volume
 *   4. Solutions    - benefit-led, mid-funnel
 *   5. Campaigns    - specific long-tail intent
 *   6. Features     - product-education, mid-funnel
 *   7. Businesses   - bottom-funnel conversion
 *   8. Affiliates   - bottom-funnel conversion
 *   9. Locations    - local SEO, narrower volume
 *  10. Conversions  - informational, lower search volume
 *  11. Integrations - niche/technical, lower volume
 *  12. Corporate    - lowest SEO value, kept for trust signals only
 *
 * Column LABELS/positions still match the sketch. All 12 now link to real
 * pages - see lib/siteSections.js for the six that used to be placeholders.
 */
import { industryPages } from "@/lib/industryPages";
import { comparisons } from "@/lib/comparisons";
import { conversions, locations, campaignTypes, features, solutions, integrations } from "@/lib/siteSections";
import { urls } from "@/lib/urls";
import programsData from "@/content/programs.json";

// Industries only - a company row (e.g. "GTBank") is a speculative,
// not-yet-real placeholder page, not the kind of substantive link that
// belongs in site-wide navigation. Built directly from the JSON here so
// this stays correct regardless of what InternalLinksSection.js (which
// merges in a broader programLinks list) passes in.
const PROGRAM_INDUSTRY_LINKS = programsData
  .filter((p) => p.type === "industry")
  .map((p) => ({ label: p.displayName, href: urls.program(p.routeSlug) }));

export function getStaticInternalLinkColumns() {
  return [
    {
      title: "Programs",
      indexHref: urls.programsIndex(),
      links: PROGRAM_INDUSTRY_LINKS,
    },
    {
      title: "Industries",
      indexHref: urls.industriesIndex(),
      links: industryPages.map((p) => ({ label: p.industryName, href: urls.industry(p.slug) })),
    },
    {
      title: "Comparison",
      indexHref: urls.comparisonsIndex(),
      links: comparisons.map((c) => ({ label: c.channelName, href: urls.comparison(c.slug) })),
    },
    {
      title: "Solutions",
      indexHref: urls.solutionsIndex(),
      links: solutions.map((s) => ({ label: s.name, href: urls.solution(s.slug) })),
    },
    {
      title: "Campaigns",
      indexHref: urls.campaignsIndex(),
      links: campaignTypes.map((c) => ({ label: c.name, href: urls.campaign(c.slug) })),
    },
    {
      title: "Features",
      indexHref: urls.featuresIndex(),
      links: features.map((f) => ({ label: f.name, href: urls.feature(f.slug) })),
    },
    {
      title: "Businesses",
      indexHref: urls.audienceHome("business"),
      links: [
        { label: "Overview", href: urls.audienceHome("business") },
        { label: "How it Works", href: urls.audienceHome("business", "how-it-works") },
        { label: "Benefits", href: urls.audienceHome("business", "benefits") },
        { label: "Savings Calculator", href: urls.calculator("business") },
        { label: "FAQ", href: urls.audienceHome("business", "faq") },
      ],
    },
    {
      title: "Affiliates",
      indexHref: urls.audienceHome("affiliate"),
      links: [
        { label: "Overview", href: urls.audienceHome("affiliate") },
        { label: "How it Works", href: urls.audienceHome("affiliate", "how-it-works") },
        { label: "Benefits", href: urls.audienceHome("affiliate", "benefits") },
        { label: "Earnings Calculator", href: urls.calculator("affiliate") },
        { label: "FAQ", href: urls.audienceHome("affiliate", "faq") },
      ],
    },
    {
      title: "Locations",
      indexHref: urls.locationsIndex(),
      links: locations.map((l) => ({ label: l.name, href: urls.location(l.slug) })),
    },
    {
      title: "Conversions",
      indexHref: urls.conversionsIndex(),
      links: conversions.map((c) => ({ label: c.name, href: urls.conversion(c.slug) })),
    },
    {
      title: "Integrations",
      indexHref: urls.integrationsIndex(),
      links: integrations.map((i) => ({ label: i.name, href: urls.integration(i.slug) })),
    },
    {
      title: "Corporate",
      indexHref: urls.corporateIndex(),
      links: [
        { label: "About", href: urls.about() },
        { label: "Contact", href: urls.contact() },
        { label: "Careers", href: urls.careers() },
        { label: "Terms", href: urls.terms() },
        { label: "Privacy", href: urls.privacy() },
        { label: "Security", href: urls.security() },
      ],
    },
  ];
}

// A whole week (in ms) - the rotation window advances once every 7 days.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LINKS_PER_COLUMN = 6;

/**
 * Deterministically rotates which up-to-6 links show in a column, advancing
 * once a week. Same column, same week -> same links for everyone (so it is
 * cacheable and consistent), but a link buried past position 6 still gets
 * indexed eventually as the window rotates through.
 */
export function rotateLinks(links) {
  if (links.length <= MAX_LINKS_PER_COLUMN) return links;
  const weekIndex = Math.floor(Date.now() / WEEK_MS);
  const offset = weekIndex % links.length;
  const rotated = [...links.slice(offset), ...links.slice(0, offset)];
  return rotated.slice(0, MAX_LINKS_PER_COLUMN);
}

/**
 * Builds the final columns. `programLinks` is accepted for backward
 * compatibility with callers that still pass it in, but is intentionally
 * UNUSED now - the Programs column above is already correct and
 * industries-only, built directly from content/programs.json rather than
 * from whatever a caller happens to pass (which may include companies).
 */
export function buildInternalLinkColumns({ programLinks } = {}) {
  void programLinks;
  const columns = getStaticInternalLinkColumns();
  return columns.map((c) => ({ ...c, links: rotateLinks(c.links) }));
}