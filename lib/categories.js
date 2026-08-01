/**
 * Single source of truth for product categories, tagged by product type.
 * Used by:
 *  - the "New product" form dropdown (filtered to match the chosen Product Type)
 *  - app/categories/[category]/page.js (pSEO category hub pages)
 *  - the sitemap generator, so category URLs never drift out of sync
 *    with what is actually in the database.
 *
 * Product type drives the entire payment/fee flow (see lib/pricingPlans.js
 * and the Paystack webhook) — DIGITAL products are paid for through
 * Commission via Paystack; PHYSICAL products are paid for directly to the
 * business, with sales reported manually (see app/api/sales/report).
 */
export const CATEGORIES = [
  // --- Digital: paid via Paystack through Commission, subscription + platform fee ---
  { slug: "hmo", label: "HMO", productType: "digital" },
  { slug: "hr-software", label: "HR Software", productType: "digital" },
  { slug: "saas", label: "SaaS", productType: "digital" },
  { slug: "fintech", label: "Fintech", productType: "digital" },
  { slug: "insurance", label: "Insurance", productType: "digital" },
  { slug: "internet-service-provider", label: "Internet Service Provider", productType: "digital" },
  { slug: "online-courses", label: "Online Courses", productType: "digital" },
  { slug: "memberships", label: "Memberships", productType: "digital" },
  { slug: "software-licenses", label: "Software Licenses", productType: "digital" },
  { slug: "logistics", label: "Logistics", productType: "digital" },

  // --- Physical: paid directly to the business, subscription-only revenue for Commission ---
  { slug: "electronics", label: "Electronics", productType: "physical" },
  { slug: "furniture", label: "Furniture", productType: "physical" },
  { slug: "cars", label: "Cars", productType: "physical" },
  { slug: "real-estate", label: "Real Estate", productType: "physical" },
  { slug: "fashion", label: "Fashion", productType: "physical" },
  { slug: "beauty-products", label: "Beauty Products", productType: "physical" },
  { slug: "home-appliances", label: "Home Appliances", productType: "physical" },

  // --- Applies to either type ---
  { slug: "other", label: "Other", productType: null },
];

export function categoriesForType(productType) {
  return CATEGORIES.filter((c) => c.productType === productType || c.productType === null);
}

export function categoryLabelFromSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? null;
}

export function slugFromCategoryLabel(label) {
  return CATEGORIES.find((c) => c.label === label)?.slug ?? "other";
}
