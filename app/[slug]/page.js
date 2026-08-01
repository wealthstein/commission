import { redirect, notFound } from "next/navigation";
import { Box } from "@mui/material";
import { parseSeoRouteSlug, buildComparisonMetadata } from "@/lib/seo";
import { getComparisonBySlug, comparisons } from "@/lib/comparisons";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ComparisonPageContent from "@/components/marketing/ComparisonPageContent";

export const revalidate = 3600;

// Comparisons live at a bare root URL on purpose (e.g. /google-ads) -
// shorter, cleaner, and reads better in search results and shared links
// than a nested /comparisons/google-ads would.
export async function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const comparison = getComparisonBySlug(params.slug);
  if (comparison) return buildComparisonMetadata(comparison);
  return { title: "Not found | Commission" };
}

export default function RootSlugPage({ params }) {
  // Primary path: a real comparison at its bare URL.
  const comparison = getComparisonBySlug(params.slug);
  if (comparison) {
    return (
      <MarketingPageShell internalLinks={<InternalLinksSection />}>
        <Box sx={{ py: { xs: 6, md: 9 } }}>
          <ComparisonPageContent comparison={comparison} />
        </Box>
      </MarketingPageShell>
    );
  }

  // Fallback: an old flat-slug link from before some pages moved to nested
  // folders. 301s to the new home so nothing already indexed or shared breaks.
  const parsed = parseSeoRouteSlug(params.slug);
  if (!parsed) notFound();

  if (parsed.type === "comparison") redirect(`/${parsed.keywordSlug}`);
  if (parsed.type === "industry-landing") redirect(`/industries/${params.slug}`);
  if (parsed.type === "company" || parsed.type === "industry") redirect(`/programs/${params.slug}`);

  notFound();
}
