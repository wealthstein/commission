import { Box } from "@mui/material";
import { integrations } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";

export const metadata = buildSectionIndexMetadata("integrations", "Integrations", "See how Commission connects with the tools you already use.");

export default function IntegrationsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Integrations" description="See how Commission connects with the tools you already use." basePath="integrations" items={integrations} relatedLinks={[{ label: "Campaign Wallet feature", href: "/features/campaign-wallet" }, { label: "Wallet vs Checkout", href: "/conversions/wallet-vs-checkout" }]} />
      </Box>
    </MarketingPageShell>
  );
}
