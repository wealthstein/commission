import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { getIndustryPageBySlug, industryPages } from "@/lib/industryPages";
import { buildIndustryLandingMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import IndustryLandingContent from "@/components/marketing/IndustryLandingContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return industryPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const industryPage = getIndustryPageBySlug(params.slug);
  if (!industryPage) return { title: "Not found • Commission" };
  return buildIndustryLandingMetadata(industryPage);
}

export default function IndustryDetailPage({ params }) {
  const industryPage = getIndustryPageBySlug(params.slug);
  if (!industryPage) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <IndustryLandingContent industryPage={industryPage} />
      </Box>
    </MarketingPageShell>
  );
}
