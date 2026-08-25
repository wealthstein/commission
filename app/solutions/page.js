import { Box } from "@mui/material";
import { solutions } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import { altSectionBg } from "@/lib/patterns";
import { audienceContent } from "@/components/marketing/content";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SolutionsIndexContent from "@/components/marketing/SolutionsIndexContent";
import Comparison from "@/components/marketing/Comparison";

export const metadata = buildSectionIndexMetadata("solutions", "Solutions", "See how Commission solves lead generation, revenue growth, and customer acquisition.");

export default function SolutionsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SolutionsIndexContent title="Solutions" description="See how Commission solves lead generation, revenue growth, and customer acquisition." buildHref={urls.solution} items={solutions} />
      </Box>
      <Comparison data={audienceContent.business.comparison} bgcolor={altSectionBg} />
    </MarketingPageShell>
  );
}
