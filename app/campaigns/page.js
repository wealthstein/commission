import { Box, Container, Typography } from "@mui/material";
import { campaignTypes } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import { dotPatternSx, altSectionBg } from "@/lib/patterns";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import CampaignsIndexContent from "@/components/marketing/CampaignsIndexContent";
import SavingsCalculator from "@/components/marketing/SavingsCalculator";
import SignUpButton from "@/components/marketing/SignUpButton";

export const metadata = buildSectionIndexMetadata("campaigns", "Campaign Types", "See how different types of campaigns run on Commission, from health insurance to account opening.");

export default function CampaignsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <CampaignsIndexContent title="Campaign Types" description="See how different types of campaigns run on Commission, from health insurance to account opening." buildHref={urls.campaign} items={campaignTypes} relatedLinks={[{ label: "Browse industries", href: urls.industriesIndex() }, { label: "Intent Qualified Leads explained", href: urls.conversion("qualified-leads") }]} />
      </Box>
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: altSectionBg }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 3 }}>
            See what a campaign like this could cost
          </Typography>
          <SavingsCalculator />
        </Container>
      </Box>
      <Box sx={{ py: { xs: 6, md: 9 }, ...dotPatternSx }}>
        <Container maxWidth="md">
          <Box sx={{ maxWidth: 480, mx: "auto" }}>
            <SignUpButton role="business" sourcePage="/campaigns" />
          </Box>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
