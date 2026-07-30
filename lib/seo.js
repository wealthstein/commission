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

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://commission.ng";

const BILLING_LABEL = {
  one_time: "one-time",
  monthly: "per month",
  quarterly: "per quarter",
  annual: "per year",
};

/** Metadata for a single product/affiliate-program page. */
export function buildProductMetadata({ product, business }) {
  const title = `${product.name} Affiliate Program \u2014 Earn Commission Promoting ${business.name} | Commission`;
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
  const title = `${business.name} Affiliate Programs \u2014 Promote & Earn Commission | Commission`;
  const description = `Browse every affiliate program ${business.name} runs on Commission and start earning commission on referred sales.`;
  const canonical = `${SITE_URL}/businesses/${business.slug}`;
  return { title, description, alternates: { canonical } };
}

/** Metadata for a category hub page (the highest-volume pSEO surface). */
export function buildCategoryMetadata({ categoryLabel, categorySlug, page }) {
  const pageSuffix = page > 1 ? ` \u2014 Page ${page}` : "";
  const title = `${categoryLabel} Affiliate Programs in Nigeria${pageSuffix} | Commission`;
  const description = `Find ${categoryLabel} affiliate programs in Nigeria and start earning commission. Browse businesses actively recruiting affiliates on Commission.`;
  const canonical = `${SITE_URL}/categories/${categorySlug}${page > 1 ? `?page=${page}` : ""}`;
  return { title, description, alternates: { canonical } };
}

export function billingLabel(frequency) {
  return BILLING_LABEL[frequency] || frequency;
}

/**
 * Route pattern for the two "high ranking keyword" page types requested:
 *   /gtbank-affiliate-program        -> { type: 'company', keywordSlug: 'gtbank' }
 *   /fintech-affiliate-programs      -> { type: 'industry', keywordSlug: 'fintech' }
 * Returns null if the slug matches neither suffix — the catch-all route
 * treats that as a 404 rather than inventing a page for it.
 */
const INDUSTRY_SUFFIX = "-affiliate-programs";
const COMPANY_SUFFIX = "-affiliate-program";

export function parseSeoRouteSlug(slug) {
  if (slug.endsWith(INDUSTRY_SUFFIX)) {
    return { type: "industry", keywordSlug: slug.slice(0, -INDUSTRY_SUFFIX.length) };
  }
  if (slug.endsWith(COMPANY_SUFFIX)) {
    return { type: "company", keywordSlug: slug.slice(0, -COMPANY_SUFFIX.length) };
  }
  return null;
}

/** Metadata for a company or industry keyword-target page. */
export function buildSeoTargetMetadata(target) {
  const canonical = `${SITE_URL}/${target.route_slug}`;
  const title =
    target.type === "company"
      ? `${target.display_name} Affiliate Program — Is There One? | Commission`
      : `${target.display_name} Affiliate Programs in Nigeria | Commission`;
  const description =
    target.meta_description ||
    (target.type === "company"
      ? `Looking for the ${target.display_name} affiliate program? See what's currently available and get notified the moment one launches on Commission.`
      : `Browse ${target.display_name} affiliate programs in Nigeria and start earning commission with Commission.`);

  return { title, description, alternates: { canonical } };
}

/** FAQ-style JSON-LD for a company page — matches how these pages are actually written (a question, honestly answered). */
export function buildSeoTargetFaqJsonLd(target, hasLiveProducts) {
  const answer = hasLiveProducts
    ? `Yes — ${target.display_name} has an active listing on Commission. See the live affiliate program for details.`
    : `Not yet on Commission. You can get notified the moment ${target.display_name} (or a similar ${target.industry_category || "business"}) launches an affiliate program here.`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Does ${target.display_name} have an affiliate program?`,
        acceptedAnswer: { "@type": "Answer", text: answer },
      },
    ],
  };
}
