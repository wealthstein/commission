import { Box } from "@mui/material";
import { conversions } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";

export const metadata = buildSectionIndexMetadata("conversions", "Conversion Goals", "See how qualified-lead and direct-sale campaigns work on Commission.");

export default function ConversionsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Conversion Goals" description="See how qualified-lead and direct-sale campaigns work on Commission." basePath="conversions" items={conversions} relatedLinks={[{ label: "Browse programs", href: "/programs" }, { label: "Multi-tier Payout", href: "/features/multi-tier-payout" }, { label: "Performance Marketing", href: "/solutions/performance-marketing" }]} />
      </Box>
    </MarketingPageShell>
  );
}
