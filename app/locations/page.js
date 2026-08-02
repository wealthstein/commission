import { Box } from "@mui/material";
import { locations } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import LocationsIndexContent from "@/components/marketing/LocationsIndexContent";

export const metadata = buildSectionIndexMetadata("locations", "Commission by Location", "See how businesses and affiliates in each city use Commission.");

export default function LocationsIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <LocationsIndexContent title="Commission by Location" description="See how businesses and affiliates in each city use Commission." buildHref={urls.location} items={locations} relatedLinks={[{ label: "Browse industries", href: urls.industriesIndex() }, { label: "Browse programs", href: urls.programsIndex() }]} />
      </Box>
    </MarketingPageShell>
  );
}
