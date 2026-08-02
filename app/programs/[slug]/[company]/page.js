import { notFound, redirect } from "next/navigation";
import { getCompanyProgram } from "@/lib/programs";
import { urls } from "@/lib/urls";
import { SITE_URL } from "@/lib/seo";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ProgramPageContent from "@/components/marketing/ProgramPageContent";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { company } = await getCompanyProgram(params.slug, params.company);
  if (!company) return { title: "Not found | Commission" };
  const title = `Does ${company.displayName} Have a Program? | Commission`;
  const description =
    company.metaDescription ||
    `Looking for a Commission program from ${company.displayName}? See what is currently available.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${urls.programCompany(params.slug, params.company)}` },
  };
}

export default async function CompanyProgramPage({ params }) {
  const { company, industry, liveProducts } = await getCompanyProgram(params.slug, params.company);
  if (!company) notFound();

  // Once a real business matching this identity joins Commission, this
  // permanently redirects to the real, live business page instead.
  if (company.claimedBusinessSlug) {
    redirect(`/businesses/${company.claimedBusinessSlug}`);
  }

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <ProgramPageContent target={company} industry={industry} liveProducts={liveProducts} />
    </MarketingPageShell>
  );
}
