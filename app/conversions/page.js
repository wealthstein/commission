import { Box } from "@mui/material";
import { conversions } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ConversionsIndexContent from "@/components/marketing/ConversionsIndexContent";

export const metadata = buildSectionIndexMetadata("conversions", "Conversion Goals", "See how qualified-lead and direct-sale campaigns work on Commission.");

export default function ConversionsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <ConversionsIndexContent title="Conversion Goals" description="See how qualified-lead and direct-sale campaigns work on Commission." buildHref={urls.conversion} items={conversions} relatedLinks={[{ label: "Browse programs", href: urls.programsIndex() }, { label: "Multi-tier Payout", href: urls.feature("multi-tier-payout") }, { label: "Performance Marketing", href: urls.solution("performance-marketing") }]} />
      </Box>
    </MarketingPageShell>
  );
}
