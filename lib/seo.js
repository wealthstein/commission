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
