import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import { solutions } from "@/lib/siteSections";
import { buildSectionItemMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import SolutionPageContent from "@/components/marketing/SolutionPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return solutions.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const item = solutions.find((i) => i.slug === params.slug);
  if (!item) return { title: "Not found | Commission" };
  return buildSectionItemMetadata("solutions", item);
}

export default function SolutionsDetailPage({ params }) {
  const item = solutions.find((i) => i.slug === params.slug);
  if (!item) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <SolutionPageContent item={item} sourcePage={`/solutions/${item.slug}`} />
      </Box>
    </MarketingPageShell>
  );
}
