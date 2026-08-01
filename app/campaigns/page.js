import { Box, Container, Typography } from "@mui/material";
import { campaignTypes } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { tokens } from "@/lib/theme";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";
import SavingsCalculator from "@/components/marketing/SavingsCalculator";

export const metadata = buildSectionIndexMetadata("campaigns", "Campaign Types", "See how different types of campaigns run on Commission, from health insurance to account opening.");

export default function CampaignsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Campaign Types" description="See how different types of campaigns run on Commission, from health insurance to account opening." basePath="campaigns" items={campaignTypes} relatedLinks={[{ label: "Browse industries", href: "/industries" }, { label: "Qualified Leads explained", href: "/conversions/qualified-leads" }]} />
      </Box>
      <Box sx={{ py: { xs: 6, md: 9 }, borderTop: `1px solid ${tokens.border}` }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 3 }}>
            See what a campaign like this could cost
          </Typography>
          <SavingsCalculator audience="business" />
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
