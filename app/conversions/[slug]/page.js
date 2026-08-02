import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { conversions } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ConversionPageContent from "@/components/marketing/ConversionPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return conversions.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = conversions.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found | Commission" };
  return buildSectionItemMetadata("conversions", item);
}

export default function ConversionsDetailPage({ params }) {
  const item = conversions.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <ConversionPageContent item={item} />
      </Box>
    </MarketingPageShell>
  );
}
