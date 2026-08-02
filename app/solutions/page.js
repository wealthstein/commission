import { Box } from "@mui/material";
import { solutions } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import { altSectionBg } from "@/lib/patterns";
import { audienceContent } from "@/components/marketing/content";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";
import Comparison from "@/components/marketing/Comparison";

export const metadata = buildSectionIndexMetadata("solutions", "Solutions", "See how Commission solves lead generation, revenue growth, and customer acquisition.");

export default function SolutionsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Solutions" description="See how Commission solves lead generation, revenue growth, and customer acquisition." buildHref={urls.solution} items={solutions} relatedLinks={[{ label: "Browse features", href: urls.featuresIndex() }, { label: "Browse industries", href: urls.industriesIndex() }]} />
      </Box>
      <Comparison data={audienceContent.business.comparison} bgcolor={altSectionBg} />
    </MarketingPageShell>
  );
}
