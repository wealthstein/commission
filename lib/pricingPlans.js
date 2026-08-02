import pricingData from "../content/pricingPlans.json" with { type: "json" };

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
 *
 * Content (the fee percentages and the pricing table copy) now lives in
 * content/pricingPlans.json - this file keeps the actual calculation logic
 * plus re-exports the data, so every existing import site keeps working.
 */
export const PLAN_FEE_PERCENT = pricingData.planFeePercent;
export const pricingPlans = pricingData.plans;

/**
 * @param {string} plan - 'free' | 'pro' | 'plus' (displayed as Small/Medium/Large)
 * @returns {number} platform fee percent applied when the business tops up their wallet
 */
export function feePercentForPlan(plan) {
  return PLAN_FEE_PERCENT[plan] ?? PLAN_FEE_PERCENT.free;
}
