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

export function getStaticInternalLinkColumns() {
  return [
    {
      title: "Programs",
      indexHref: "/programs",
      links: [{ label: "Browse all programs", href: "/programs" }],
    },
    {
      title: "Industries",
      indexHref: "/industries",
      links: industryPages.map((p) => ({ label: p.industryName, href: `/industries/${p.slug}` })),
    },
    {
      // Bare root URLs on purpose (e.g. /google-ads) - see app/[slug]/page.js.
      title: "Comparison",
      indexHref: "/comparisons",
      links: comparisons.map((c) => ({ label: c.channelName, href: `/${c.slug}` })),
    },
    {
      title: "Solutions",
      indexHref: "/solutions",
      links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}` })),
    },
    {
      title: "Campaigns",
      indexHref: "/campaigns",
      links: campaignTypes.map((c) => ({ label: c.name, href: `/campaigns/${c.slug}` })),
    },
    {
      title: "Features",
      indexHref: "/features",
      links: features.map((f) => ({ label: f.name, href: `/features/${f.slug}` })),
    },
    {
      title: "Businesses",
      indexHref: "/?for=business",
      links: [
        { label: "How it Works", href: "/?for=business#how-it-works" },
        { label: "Pricing", href: "/?for=business#pricing" },
        { label: "Benefits", href: "/?for=business#benefits" },
        { label: "FAQ", href: "/?for=business#faq" },
        { label: "Direct Sales", href: "/conversions/direct-sales" },
        { label: "Data Analytics", href: "/features/data-analytics" },
      ],
    },
    {
      title: "Affiliates",
      indexHref: "/?for=affiliate",
      links: [
        { label: "How it Works", href: "/?for=affiliate#how-it-works" },
        { label: "FAQ", href: "/?for=affiliate#faq" },
        { label: "Benefits", href: "/?for=affiliate#benefits" },
        { label: "Overview", href: "/?for=affiliate" },
        { label: "Multi-tier Payout", href: "/features/multi-tier-payout" },
        { label: "Qualified Leads", href: "/conversions/qualified-leads" },
      ],
    },
    {
      title: "Locations",
      indexHref: "/locations",
      links: locations.map((l) => ({ label: l.name, href: `/locations/${l.slug}` })),
    },
    {
      title: "Conversions",
      indexHref: "/conversions",
      links: conversions.map((c) => ({ label: c.name, href: `/conversions/${c.slug}` })),
    },
    {
      title: "Integrations",
      indexHref: "/integrations",
      links: integrations.map((i) => ({ label: i.name, href: `/integrations/${i.slug}` })),
    },
    {
      title: "Corporate",
      indexHref: "/corporate",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Careers", href: "/careers" },
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Security", href: "/security" },
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

/** Merges the static columns with the live, DB-driven Programs list (capped and rotated the same way). */
export function buildInternalLinkColumns({ programLinks }) {
  const columns = getStaticInternalLinkColumns();
  if (programLinks?.length) {
    const programsColumn = columns.find((c) => c.title === "Programs");
    programsColumn.links = [...programsColumn.links, ...programLinks];
  }
  return columns.map((c) => ({ ...c, links: rotateLinks(c.links) }));
}
