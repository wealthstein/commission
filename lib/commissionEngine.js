/**
 * Commission Engine
 * ------------------------------------------------------------------
 * Given a transaction amount and an affiliate's enrollment chain,
 * calculates the up-to-3-tier commission split and Commission's
 * platform fee (taken from the affiliate commission, NOT the sale).
 *
 * This module has no I/O so it is easy to unit test. The Paystack
 * webhook handler is responsible for loading data from Supabase
 * and persisting the results this module returns.
 * ------------------------------------------------------------------
 */

// FIXED, platform-wide tier split - businesses cannot change this. For
// lead-goal campaigns this is the whole cost-per-lead pool (sums to 100%).
// For sale-goal campaigns, a business sets one total commission %, and it
// gets divided in these exact proportions - see app/dashboard/campaigns/new.
const TIER_RATIOS = { tier1: 50, tier2: 30, tier3: 20 };

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function pctOf(amountNaira, percent) {
  return round2((amountNaira * percent) / 100);
}

/**
 * Walk up an enrollment's referrer chain to build the tier lineage.
 * enrollment: the tier-1 enrollment (affiliate who generated the sale)
 * lookupEnrollment: (id) => enrollment row or null
 * returns ordered [{id, tier}] tier1 -> tier2 -> tier3
 */
function buildLineage(enrollment, lookupEnrollment) {
  const lineage = [{ id: enrollment.id, tier: 1 }];
  let current = enrollment;
  while (lineage.length < 3 && current.referrer_enrollment_id) {
    const parent = lookupEnrollment(current.referrer_enrollment_id);
    if (!parent) break;
    lineage.push({ id: parent.id, tier: lineage.length + 1 });
    current = parent;
  }
  return lineage;
}

/**
 * Calculate the full commission breakdown for one qualifying payment.
 * params: { amountNaira, program, sellingEnrollment, lookupEnrollment }
 */
function calculateCommission(params) {
  const amountNaira = params.amountNaira;
  const program = params.program;
  const sellingEnrollment = params.sellingEnrollment;
  const lookupEnrollment = params.lookupEnrollment;

  if (amountNaira < 0) throw new Error("amountNaira must be >= 0");

  const tierPercents = [
    program.tier1_percent || 0,
    program.tier2_percent || 0,
    program.tier3_percent || 0,
  ];

  const lineage = buildLineage(sellingEnrollment, lookupEnrollment);

  const lines = lineage.map(function (entry) {
    var id = entry.id;
    var tier = entry.tier;
    var commissionPercent = tierPercents[tier - 1] || 0;
    var commissionNaira = pctOf(amountNaira, commissionPercent);
    var platformFeeNaira = pctOf(commissionNaira, program.platform_fee_percent || 0);
    var affiliatePayoutNaira = round2(commissionNaira - platformFeeNaira);
    return {
      enrollmentId: id,
      tier: tier,
      commissionPercent: commissionPercent,
      commissionNaira: commissionNaira,
      platformFeePercent: program.platform_fee_percent || 0,
      platformFeeNaira: platformFeeNaira,
      affiliatePayoutNaira: affiliatePayoutNaira,
    };
  });

  var totalCommissionNaira = round2(lines.reduce(function (s, l) { return s + l.commissionNaira; }, 0));
  var totalPlatformFeeNaira = round2(lines.reduce(function (s, l) { return s + l.platformFeeNaira; }, 0));
  var totalAffiliatePayoutNaira = round2(lines.reduce(function (s, l) { return s + l.affiliatePayoutNaira; }, 0));

  return {
    totalCommissionPercent: round2(tierPercents.slice(0, lineage.length).reduce(function (s, p) { return s + p; }, 0)),
    totalCommissionNaira: totalCommissionNaira,
    totalPlatformFeeNaira: totalPlatformFeeNaira,
    totalAffiliatePayoutNaira: totalAffiliatePayoutNaira,
    businessProceedsNaira: round2(amountNaira - totalCommissionNaira),
    lines: lines,
  };
}

/**
 * Guard used before creating an affiliate_enrollments row — gives a
 * friendly error early, mirroring the DB trigger's own enforcement.
 */
function assertWithinMaxTiers(parentTier) {
  var MAX_TIERS = 3;
  if (parentTier >= MAX_TIERS) {
    throw new Error("Cannot enroll: maximum " + MAX_TIERS + "-tier affiliate depth reached");
  }
}

/**
 * Idempotency helper: a stable key so a Paystack webhook retry (or a
 * recurring charge on the same reference) never double-pays commissions.
 */
function commissionIdempotencyKey(paystackReference, tier) {
  return paystackReference + ":tier" + tier;
}

module.exports = {
  TIER_RATIOS: TIER_RATIOS,
  calculateCommission: calculateCommission,
  buildLineage: buildLineage,
  assertWithinMaxTiers: assertWithinMaxTiers,
  commissionIdempotencyKey: commissionIdempotencyKey,
  pctOf: pctOf,
  round2: round2,
};
