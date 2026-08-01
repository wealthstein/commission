import { Box } from "@mui/material";
import { features } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";
import Pricing from "@/components/marketing/Pricing";

export const metadata = buildSectionIndexMetadata("features", "Features", "See what Commission actually tracks and automates for you.");

export default function FeaturesIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Features" description="See what Commission actually tracks and automates for you." basePath="features" items={features} relatedLinks={[{ label: "Browse solutions", href: "/solutions" }, { label: "Browse integrations", href: "/integrations" }]} />
      </Box>
      {/* Custom Branding and API access - two of the features above - are
          plan-gated, so the real pricing table belongs right here. */}
      <Pricing />
    </MarketingPageShell>
  );
}
