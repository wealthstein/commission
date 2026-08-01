import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { campaignTypes } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import CampaignPageContent from "@/components/marketing/CampaignPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return campaignTypes.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = campaignTypes.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found | Commission" };
  return buildSectionItemMetadata("campaigns", item);
}

export default function CampaignsDetailPage({ params }) {
  const item = campaignTypes.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <CampaignPageContent item={item} sourcePage={`/campaigns/${item.slug}`} />
      </Box>
    </MarketingPageShell>
  );
}
