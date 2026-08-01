import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { locations } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import LocationPageContent from "@/components/marketing/LocationPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return locations.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = locations.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found | Commission" };
  return buildSectionItemMetadata("locations", item);
}

export default function LocationsDetailPage({ params }) {
  const item = locations.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <LocationPageContent item={item} sourcePage={`/locations/${item.slug}`} />
      </Box>
    </MarketingPageShell>
  );
}
