import { notFound } from "next/navigation";
import { getIndustryProgram } from "@/lib/programs";
import { urls } from "@/lib/urls";
import { SITE_URL } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import IndustryProgramContent from "@/components/marketing/IndustryProgramContent";

export const revalidate = 3600;

// DB-driven and potentially large - not pre-rendered at build time.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { industry } = await getIndustryProgram(params.slug);
  if (!industry) return { title: "Not found | Commission" };
  const title = `${industry.displayName} Affiliate Programs - For Affiliates | Commission`;
  const description =
    industry.metaDescription ||
    `Browse ${industry.displayName} affiliate programs on Commission and see what you could earn promoting them.`;
  return { title, description, alternates: { canonical: `${SITE_URL}${urls.programIndustry(params.slug)}` } };
}

export default async function IndustryProgramPage({ params }) {
  const { industry, liveProducts } = await getIndustryProgram(params.slug);
  if (!industry) notFound();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <IndustryProgramContent industry={industry} liveProducts={liveProducts} />
    </MarketingPageShell>
  );
}
