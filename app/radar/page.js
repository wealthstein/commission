import { Box } from "@mui/material";
import { SITE_URL } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import RadarPageContent from "@/components/marketing/RadarPageContent";

export const metadata = {
  title: "Radar - Commission's Affiliate Trust Layer • Commission",
  description:
    "Radar tracks every affiliate's real qualification history and automatically decides when a lead needs extra verification - cutting down fake leads without slowing down real ones.",
  alternates: { canonical: `${SITE_URL}/radar` },
};

export default function RadarPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box>
        <RadarPageContent />
      </Box>
    </MarketingPageShell>
  );
}
