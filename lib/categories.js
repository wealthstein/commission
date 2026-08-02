import CATEGORIES from "@/content/categories.json";

/**
 * Single source of truth for product categories, tagged by product type.
 * Content now lives in content/categories.json - this file re-exports it
 * plus the lookup helpers, so every existing import site keeps working
 * unchanged. Used by:
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
export { CATEGORIES };

export function categoriesForType(productType) {
  return CATEGORIES.filter((c) => c.productType === productType || c.productType === null);
}

export function categoryLabelFromSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? null;
}

export function slugFromCategoryLabel(label) {
  return CATEGORIES.find((c) => c.label === label)?.slug ?? "other";
}
