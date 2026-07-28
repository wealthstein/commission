/**
 * Single source of truth for product categories. Used by:
 *  - the "New product" form dropdown
 *  - app/categories/[category]/page.js (pSEO category hub pages)
 *  - the sitemap generator, so category URLs never drift out of sync
 *    with what's actually in the database.
 */
export const CATEGORIES = [
  { slug: "hmo", label: "HMO" },
  { slug: "hr-software", label: "HR Software" },
  { slug: "saas", label: "SaaS" },
  { slug: "insurance", label: "Insurance" },
  { slug: "internet-service-provider", label: "Internet Service Provider" },
  { slug: "other", label: "Other" },
];

export function categoryLabelFromSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? null;
}

export function slugFromCategoryLabel(label) {
  return CATEGORIES.find((c) => c.label === label)?.slug ?? "other";
}
