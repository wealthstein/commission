/**
 * Shared SEO helpers for Commission's programmatic pages
 * (app/products/[businessSlug]/[productSlug], app/businesses/[slug],
 * app/categories/[category]).
 *
 * Keeping this logic in one place means every one of the (potentially
 * hundreds of thousands of) generated pages gets consistent, correct
 * title/description/canonical/JSON-LD without each page file having to
 * reimplement it.
 */
import { industryPages } from "@/lib/industryPages";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://commission.ng";

const BILLING_LABEL = {
  one_time: "one-time",
  monthly: "per month",
  quarterly: "per quarter",
  annual: "per year",
};

/** Metadata for a single product/affiliate-program page. */
export function buildProductMetadata({ product, business }) {
  const title = `${product.name} Affiliate Program \u2014 Earn Commission Promoting ${business.name} • Commission`;
  const description = `Promote ${product.name} by ${business.name} and earn commission on every sale. ${
    product.description ? product.description.slice(0, 120) : `${product.category || "Product"} available in Nigeria.`
  }`.trim();
  const canonical = `${SITE_URL}/products/${business.slug}/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

/** JSON-LD for a product page: Product + Offer. */
export function buildProductJsonLd({ product, business }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image_url || undefined,
    brand: { "@type": "Brand", name: business.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: product.price_naira,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/products/${business.slug}/${product.slug}`,
    },
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Metadata for a business profile page. */
export function buildBusinessMetadata({ business }) {
  const title = `${business.name} Affiliate Programs \u2014 Promote & Earn Commission • Commission`;
  const description = `Browse every affiliate program ${business.name} runs on Commission and start earning commission on referred sales.`;
  const canonical = `${SITE_URL}/businesses/${business.slug}`;
  return { title, description, alternates: { canonical } };
}

/** Metadata for a category hub page (the highest-volume pSEO surface). */
export function buildCategoryMetadata({ categoryLabel, categorySlug, page }) {
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : "";
  const title = `${categoryLabel} Affiliate Programs in Nigeria${pageSuffix} • Commission`;
  const description = `Find ${categoryLabel} affiliate programs in Nigeria and start earning commission. Browse businesses actively recruiting affiliates on Commission.`;
  const canonical = `${SITE_URL}/categories/${categorySlug}${page > 1 ? `?page=${page}` : ""}`;
  return { title, description, alternates: { canonical } };
}

export function billingLabel(frequency) {
  return BILLING_LABEL[frequency] || frequency;
}

/**
 * Parses the OLD flat-slug URL patterns this site used before pages moved
 * to nested folders. Used ONLY by app/[slug]/page.js for legacy redirects:
 *   /commission-and-google-ads   -> redirects to /comparisons/google-ads
 *   /real-estate                 -> redirects to /industries/real-estate
 *   /gtbank-affiliate-program    -> redirects to /programs/gtbank-affiliate-program
 *   /fintech-affiliate-programs  -> redirects to /programs/fintech-affiliate-programs
 * Returns null if the slug matches none of these — app/[slug]/page.js
 * treats that as a normal 404 rather than inventing a page for it.
 */
const COMPARISON_PREFIX = "commission-and-";
const INDUSTRY_SUFFIX = "-affiliate-programs";
const COMPANY_SUFFIX = "-affiliate-program";

export function parseSeoRouteSlug(slug) {
  if (slug.startsWith(COMPARISON_PREFIX)) {
    return { type: "comparison", keywordSlug: slug.slice(COMPARISON_PREFIX.length) };
  }
  if (industryPages.some((p) => p.slug === slug)) {
    return { type: "industry-landing", keywordSlug: slug };
  }
  if (slug.endsWith(INDUSTRY_SUFFIX)) {
    return { type: "industry", keywordSlug: slug.slice(0, -INDUSTRY_SUFFIX.length) };
  }
  if (slug.endsWith(COMPANY_SUFFIX)) {
    return { type: "company", keywordSlug: slug.slice(0, -COMPANY_SUFFIX.length) };
  }
  return null;
}

/** Metadata for a /comparisons/[channel] comparison page. */
export function buildComparisonMetadata(comparison) {
  const canonical = `${SITE_URL}/comparisons/${comparison.slug}`;
  const title = `${comparison.headline} • Commission`;
  const description = comparison.intro.slice(0, 155);
  return { title, description, alternates: { canonical } };
}

export function buildComparisonsIndexMetadata() {
  return {
    title: "Commission vs Every Other Marketing Channel • Commission",
    description: "See how Commission compares to Google Ads, Facebook Ads, cold email, SEO agencies, and influencer marketing on cost, speed, and risk.",
    alternates: { canonical: `${SITE_URL}/comparisons` },
  };
}

/** Metadata for an /industries/[slug] persuasion page. */
export function buildIndustryLandingMetadata(industryPage) {
  const canonical = `${SITE_URL}/industries/${industryPage.slug}`;
  const title = `${industryPage.industryName} Affiliate Marketing in Nigeria • Commission`;
  const description = industryPage.headline;
  return { title, description, alternates: { canonical } };
}

export function buildIndustriesIndexMetadata() {
  return {
    title: "Affiliate Marketing by Industry in Nigeria • Commission",
    description: "See how businesses in real estate, healthcare, fintech, education, logistics, and insurance use Commission to acquire customers through affiliates.",
    alternates: { canonical: `${SITE_URL}/industries` },
  };
}

export function buildProgramsIndexMetadata() {
  return {
    title: "Affiliate Programs on Commission • Commission",
    description: "Browse every business and industry program live on Commission, and request early access to programs not yet launched.",
    alternates: { canonical: `${SITE_URL}/programs` },
  };
}

/** Generic metadata builder shared by the six section categories (Conversions, Locations, Campaigns, Features, Solutions, Integrations). */
export function buildSectionItemMetadata(basePath, item) {
  const canonical = `${SITE_URL}/${basePath}/${item.slug}`;
  return { title: `${item.headline} • Commission`, description: item.intro.slice(0, 155), alternates: { canonical } };
}

export function buildSectionIndexMetadata(basePath, label, description) {
  return {
    title: `${label} on Commission • Commission`,
    description,
    alternates: { canonical: `${SITE_URL}/${basePath}` },
  };
}

/** FAQ-style JSON-LD for a company program page — matches how these pages are actually written (a question, honestly answered). */
export function buildSeoTargetFaqJsonLd(target, hasLiveProducts) {
  const answer = hasLiveProducts
    ? `Yes — ${target.displayName} has an active program on Commission. See it for details.`
    : `Not yet on Commission. You can request early access and get notified the moment ${target.displayName} (or a similar ${target.industryCategory || "business"}) launches a program here.`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Does ${target.displayName} have a program on Commission?`,
        acceptedAnswer: { "@type": "Answer", text: answer },
      },
    ],
  };
}
