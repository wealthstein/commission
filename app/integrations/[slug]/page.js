import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { integrations } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import IntegrationPageContent from "@/components/marketing/IntegrationPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return integrations.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = integrations.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found • Commission" };
  return buildSectionItemMetadata("integrations", item);
}

export default function IntegrationsDetailPage({ params }) {
  const item = integrations.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <IntegrationPageContent item={item} />
      </Box>
    </MarketingPageShell>
  );
}
