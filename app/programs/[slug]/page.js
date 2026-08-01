import { notFound, redirect } from "next/navigation";
import { Box } from "@mui/material";
import { getProgramBySlug } from "@/lib/programs";
import { buildSeoTargetMetadata } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ProgramPageContent from "@/components/marketing/ProgramPageContent";

export const revalidate = 3600;

// DB-driven and potentially large - not pre-rendered at build time.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { target } = await getProgramBySlug(params.slug);
  if (!target) return { title: "Not found | Commission" };
  return buildSeoTargetMetadata(target);
}

export default async function ProgramDetailPage({ params }) {
  const { target, liveProducts } = await getProgramBySlug(params.slug);

  // Only ever renders a seeded row (see supabase/seed_seo_targets.sql) -
  // never an arbitrary user-typed slug.
  if (!target) notFound();

  // Once a real business matching this identity joins Commission, this
  // permanently redirects to the real, live business page instead.
  if (target.claimed_business_slug) {
    redirect(`/businesses/${target.claimed_business_slug}`);
  }

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <ProgramPageContent target={target} liveProducts={liveProducts} />
    </MarketingPageShell>
  );
}
