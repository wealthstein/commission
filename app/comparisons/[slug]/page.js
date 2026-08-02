import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { getComparisonBySlug, comparisons } from "@/lib/comparisons";
import { buildComparisonMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ComparisonPageContent from "@/components/marketing/ComparisonPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const comparison = getComparisonBySlug(params.slug);
  if (!comparison) return { title: "Not found • Commission" };
  return buildComparisonMetadata(comparison);
}

export default function ComparisonDetailPage({ params }) {
  const comparison = getComparisonBySlug(params.slug);
  if (!comparison) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <ComparisonPageContent comparison={comparison} />
      </Box>
    </MarketingPageShell>
  );
}
