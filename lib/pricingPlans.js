/**
 * Plan-based platform fee.
 * -------------------------------------------------------------
 * Commission takes its fee ONCE, the moment a business tops up their
 * Campaign Wallet — a percentage of the amount being added. Every
 * qualified lead or verified sale afterward deducts its FULL commission
 * straight to affiliates, with no further fee skimmed at that point (see
 * app/api/paystack/webhook for where the fee is actually taken, and
 * app/api/leads/[leadId]/qualify / app/api/sales/[transactionId]/verify for
 * where the 100%-to-affiliate deduction happens).
 *
 * This is uniform regardless of product type (physical/digital) or
 * conversion goal (sale/lead) — customers always pay the business directly,
 * so there is no live customer payment for Commission to skim from at all;
 * the wallet top-up is the only money that ever flows to Commission besides
 * the flat subscription.
 */
export const PLAN_FEE_PERCENT = {
  free: 20,
  pro: 15,
  plus: 10,
};

/**
 * @param {string} plan - 'free' | 'pro' | 'plus' (displayed as Small/Medium/Large)
 * @returns {number} platform fee percent to apply to the affiliate commission
 */
export function feePercentForPlan(plan) {
  return PLAN_FEE_PERCENT[plan] ?? PLAN_FEE_PERCENT.free;
}

/**
 * Pricing table content — shown on the marketing site's Pricing section.
 * Every plan works the same way for every campaign type; only the platform
 * fee percentage and the subscription price change as you go up a tier.
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
      "1 affiliate campaign",
      "Up to 3 commission tiers",
      "Referral link tracking",
      "Automatic affiliate payouts",
      "Commission keeps 20% whenever you top up your Campaign Wallet",
      "Every qualified lead or verified sale then pays affiliates in full",
    ],
  },
  {
    id: "pro",
    name: "Medium",
    priceNaira: 50000,
    priceSuffix: "/mo",
    feePercent: PLAN_FEE_PERCENT.pro,
    tagline: "For mid-sized businesses running an active affiliate campaign.",
    cta: "Upgrade to Medium",
    highlighted: true,
    features: [
      "Up to 10 active products",
      "Unlimited affiliate campaigns",
      "Up to 3 commission tiers",
      "Marketing asset uploads",
      "Priority affiliate recruiting placement",
      "Custom logo on your campaign pages",
      "API access - route qualified leads anywhere",
      "Commission keeps 15% whenever you top up your Campaign Wallet",
      "Every qualified lead or verified sale then pays affiliates in full",
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
      "Unlimited affiliate campaigns",
      "Up to 3 commission tiers",
      "Priority support",
      "Custom logo and brand color on your campaign pages",
      "API access - route qualified leads anywhere",
      "Commission keeps only 10% whenever you top up your Campaign Wallet",
      "Every qualified lead or verified sale then pays affiliates in full",
    ],
  },
];
