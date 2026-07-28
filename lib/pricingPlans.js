/**
 * Plan-based platform fee.
 * -------------------------------------------------------------
 * Commission's fee is a percentage of the AFFILIATE COMMISSION (never the
 * sale) and is determined by the business's subscription plan at the
 * moment a charge is processed — NOT by whatever value happens to be
 * stored on the affiliate_programs row. See app/api/paystack/webhook for
 * where this is applied.
 */
export const PLAN_FEE_PERCENT = {
  free: 20,
  pro: 15,
  plus: 10,
};

export function feePercentForPlan(plan) {
  return PLAN_FEE_PERCENT[plan] ?? PLAN_FEE_PERCENT.free;
}

/**
 * Pricing table content — shown on the marketing site's Pricing section.
 * Prices are illustrative; wire these to real Paystack plan codes before
 * launch (see businesses.plan / businesses.plan_renews_at in the schema).
 */
export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    priceNaira: 0,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.free,
    tagline: "List your first product and see if affiliate sales work for you.",
    cta: "Start free",
    features: [
      "1 active product",
      "1 affiliate program",
      "Up to 3 commission tiers",
      "Referral link tracking",
      "Automatic commission payouts",
      "Commission keeps 20% of affiliate commission",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceNaira: 15000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.pro,
    tagline: "For growing businesses running an active affiliate program.",
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      "Up to 10 active products",
      "Unlimited affiliate programs",
      "Up to 3 commission tiers",
      "Marketing asset uploads",
      "Priority affiliate recruiting placement",
      "Commission keeps 15% of affiliate commission",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    priceNaira: 45000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.plus,
    tagline: "For businesses scaling a serious affiliate channel.",
    cta: "Upgrade to Plus",
    features: [
      "Unlimited active products",
      "Unlimited affiliate programs",
      "Up to 3 commission tiers",
      "Dedicated settlement subaccount",
      "Priority support",
      "Commission keeps only 10% of affiliate commission",
    ],
  },
];
