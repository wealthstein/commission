import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { challenges } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ChallengePageContent from "@/components/marketing/ChallengePageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return challenges.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = challenges.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found • Commission" };
  return buildSectionItemMetadata("challenges", item);
}

export default function ChallengeDetailPage({ params }) {
  const item = challenges.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <ChallengePageContent item={item} />
      </Box>
    </MarketingPageShell>
  );
}
