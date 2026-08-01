import { Box } from "@mui/material";
import { locations } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SectionIndexContent from "@/components/marketing/SectionIndexContent";

export const metadata = buildSectionIndexMetadata("locations", "Commission by Location", "See how businesses and affiliates in each city use Commission.");

export default function LocationsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SectionIndexContent title="Commission by Location" description="See how businesses and affiliates in each city use Commission." basePath="locations" items={locations} relatedLinks={[{ label: "Browse industries", href: "/industries" }, { label: "Browse programs", href: "/programs" }]} />
      </Box>
    </MarketingPageShell>
  );
}
