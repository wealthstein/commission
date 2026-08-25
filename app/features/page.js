import { Box } from "@mui/material";
import { features } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import FeaturesIndexContent from "@/components/marketing/FeaturesIndexContent";

export const metadata = buildSectionIndexMetadata("features", "Features", "See what Commission actually tracks and automates for you.");

export default function FeaturesIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <FeaturesIndexContent title="Features" description="See what Commission actually tracks and automates for you." items={features} />
      </Box>
    </MarketingPageShell>
  );
}
