/**
 * Plan-based platform fee.
 * -------------------------------------------------------------
 * Commission's fee is a percentage of the AFFILIATE COMMISSION (never the
 * sale) and is determined by the business's subscription plan at the
 * moment a charge is processed — NOT by whatever value happens to be
 * stored on the affiliate_programs row. See app/api/paystack/webhook for
 * where this is applied.
 *
 * This ONLY applies to DIGITAL products. PHYSICAL products (customer pays
 * the business directly; Commission never touches the money) generate
 * revenue for Commission through the subscription plan ALONE — the
 * platform fee is always 0%, regardless of plan, for a physical product.
 */
export const PLAN_FEE_PERCENT = {
  free: 20,
  pro: 15,
  plus: 10,
};

/**
 * @param {string} plan - 'free' | 'pro' | 'plus'
 * @param {string} productType - 'digital' | 'physical'
 * @returns {number} platform fee percent to apply to the affiliate commission
 */
export function feePercentForPlan(plan, productType = "digital") {
  if (productType === "physical") return 0;
  return PLAN_FEE_PERCENT[plan] ?? PLAN_FEE_PERCENT.free;
}

/**
 * Pricing table content — shown on the marketing site's Pricing section.
 * The plan price and feature list are the same regardless of product type;
 * only the platform fee differs (0% for physical products, always).
 * Prices are illustrative; wire these to real Paystack plan codes before
 * launch (see businesses.plan / businesses.plan_renews_at in the schema).
 */
export const pricingPlans = [
  {
    id: "free",
    name: "Small",
    priceNaira: 25000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.free,
    tagline: "For small businesses just getting started with affiliate sales.",
    cta: "Start on Small",
    features: [
      "1 active product",
      "1 affiliate program",
      "Up to 3 commission tiers",
      "Referral link tracking",
      "Automatic commission payouts (digital products)",
      "Digital products: Commission keeps 20% of affiliate commission",
      "Physical products: subscription only, 0% platform fee",
    ],
  },
  {
    id: "pro",
    name: "Medium",
    priceNaira: 50000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.pro,
    tagline: "For mid-sized businesses running an active affiliate program.",
    cta: "Upgrade to Medium",
    highlighted: true,
    features: [
      "Up to 10 active products",
      "Unlimited affiliate programs",
      "Up to 3 commission tiers",
      "Marketing asset uploads",
      "Priority affiliate recruiting placement",
      "Digital products: Commission keeps 15% of affiliate commission",
      "Physical products: subscription only, 0% platform fee",
    ],
  },
  {
    id: "plus",
    name: "Large",
    priceNaira: 75000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.plus,
    tagline: "For large businesses scaling a serious affiliate channel.",
    cta: "Upgrade to Large",
    features: [
      "Unlimited active products",
      "Unlimited affiliate programs",
      "Up to 3 commission tiers",
      "Dedicated settlement subaccount",
      "Priority support",
      "Digital products: Commission keeps only 10% of affiliate commission",
      "Physical products: subscription only, 0% platform fee",
    ],
  },
];