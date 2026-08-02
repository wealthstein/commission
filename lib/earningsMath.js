/**
 * Pure calculation logic behind the calculator page (app/calculator).
 * Mirrors exactly how lib/commissionEngine.js actually splits a fixed
 * commission pool across up to 3 tiers - each tier's percentage is applied
 * directly to the pool, not chained/compounded, so the tier percentages
 * for a lead-goal campaign sum to 100% of the pool.
 *
 * Worked example this matches (the one used throughout the calculator UI):
 *   Flipper pays a 10000 naira pool per qualified lead or sale.
 *   Split 50% / 30% / 20% across tiers 1/2/3.
 *   Kemi (tier 1) generates the lead -> 5000
 *   Sadiku (tier 2, referred Kemi) -> 3000
 *   Amaka (tier 3, referred Sadiku) -> 2000
 */

export const DEFAULT_TIER_SPLIT_PERCENT = { tier1: 50, tier2: 30, tier3: 20 };

/**
 * @param {number} poolNaira - the total commission pool for one conversion
 * @param {{tier1: number, tier2: number, tier3: number}} splitPercent
 * @returns {Array<{tier: number, percent: number, amountNaira: number}>}
 */
export function splitPool(poolNaira, splitPercent = DEFAULT_TIER_SPLIT_PERCENT) {
  return [1, 2, 3].map((tier) => {
    const percent = splitPercent[`tier${tier}`] || 0;
    return {
      tier,
      percent,
      amountNaira: Math.round((poolNaira * percent) / 100),
    };
  });
}

/**
 * Recurring commission: the same per-cycle split repeats every month the
 * customer stays subscribed. Returns the running total after N months for
 * each tier.
 */
export function recurringTotals(monthlyPoolNaira, months, splitPercent = DEFAULT_TIER_SPLIT_PERCENT) {
  const perCycle = splitPool(monthlyPoolNaira, splitPercent);
  return perCycle.map((line) => ({ ...line, totalAfterMonthsNaira: line.amountNaira * months }));
}

/**
 * Projected monthly earnings for an affiliate operating across all three
 * tiers at once - their own direct conversions (tier 1), conversions from
 * affiliates they personally referred (tier 2), and conversions from that
 * next layer down (tier 3). This is what the interactive sliders on the
 * calculator page feed into.
 */
export function projectMonthlyEarnings(params) {
  const poolNaira = params.poolNaira;
  const ownConversions = params.ownConversions;
  const referredAffiliateCount = params.referredAffiliateCount;
  const avgConversionsPerReferredAffiliate = params.avgConversionsPerReferredAffiliate;
  const subReferredAffiliateCount = params.subReferredAffiliateCount;
  const avgConversionsPerSubReferredAffiliate = params.avgConversionsPerSubReferredAffiliate;
  const splitPercent = params.splitPercent || DEFAULT_TIER_SPLIT_PERCENT;

  const split = splitPool(poolNaira, splitPercent);
  const tier1Rate = split[0].amountNaira;
  const tier2Rate = split[1].amountNaira;
  const tier3Rate = split[2].amountNaira;

  const tier1Naira = tier1Rate * ownConversions;
  const tier2Naira = tier2Rate * referredAffiliateCount * avgConversionsPerReferredAffiliate;
  const tier3Naira = tier3Rate * subReferredAffiliateCount * avgConversionsPerSubReferredAffiliate;

  return {
    tier1Naira: tier1Naira,
    tier2Naira: tier2Naira,
    tier3Naira: tier3Naira,
    totalNaira: tier1Naira + tier2Naira + tier3Naira,
  };
}
