const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateCommission,
  buildLineage,
  assertWithinMaxTiers,
} = require("./commissionEngine");

// Program from the TRD example: 8% / 5% / 2%, platform fee 15% of commission
const program = {
  tier1_percent: 8,
  tier2_percent: 5,
  tier3_percent: 2,
  platform_fee_percent: 15,
};

test("single-tier sale: only tier-1 affiliate, tiers 2/3 absent", () => {
  const tier1 = { id: "aff-1", tier: 1, referrer_enrollment_id: null };
  const result = calculateCommission({
    amountNaira: 100000,
    program,
    sellingEnrollment: tier1,
    lookupEnrollment: () => null,
  });

  assert.equal(result.lines.length, 1);
  assert.equal(result.lines[0].commissionNaira, 8000); // 8% of 100,000
  assert.equal(result.lines[0].platformFeeNaira, 1200); // 15% of 8,000
  assert.equal(result.lines[0].affiliatePayoutNaira, 6800);
  assert.equal(result.totalCommissionNaira, 8000);
  assert.equal(result.businessProceedsNaira, 92000);
});

test("full 3-tier lineage matches the TRD worked example (15% total)", () => {
  // Kemi makes the sale (tier 1). Abu referred Kemi into the program (tier 2,
  // upline of Kemi). Ola referred Abu into the program (tier 3, upline of Abu).
  const enrollments = {
    "kemi": { id: "kemi", tier: 1, referrer_enrollment_id: "abu" },
    "abu": { id: "abu", tier: 2, referrer_enrollment_id: "ola" },
    "ola": { id: "ola", tier: 3, referrer_enrollment_id: null },
  };
  const lookup = (id) => enrollments[id] || null;

  const result = calculateCommission({
    amountNaira: 100000,
    program,
    sellingEnrollment: enrollments["kemi"], // Kemi generated the sale
    lookupEnrollment: lookup,
  });

  assert.equal(result.lines.length, 3);
  assert.equal(result.totalCommissionPercent, 15);
  assert.equal(result.totalCommissionNaira, 15000);

  const [t1, t2, t3] = result.lines;
  assert.equal(t1.tier, 1);
  assert.equal(t1.commissionNaira, 8000);
  assert.equal(t2.tier, 2);
  assert.equal(t2.commissionNaira, 5000);
  assert.equal(t3.tier, 3);
  assert.equal(t3.commissionNaira, 2000);

  // Platform fee is 15% of EACH tier's commission, not of the sale
  assert.equal(t1.platformFeeNaira, 1200); // 15% of 8000
  assert.equal(t2.platformFeeNaira, 750); // 15% of 5000
  assert.equal(t3.platformFeeNaira, 300); // 15% of 2000
  assert.equal(result.totalPlatformFeeNaira, 2250);

  assert.equal(result.totalAffiliatePayoutNaira, 12750); // 15000 - 2250
  assert.equal(result.businessProceedsNaira, 85000); // 100000 - 15000
});

test("recurring commission: monthly cycle recalculates on each payment", () => {
  const tier1 = { id: "aff-1", tier: 1, referrer_enrollment_id: null };
  const recurringProgram = { tier1_percent: 10, tier2_percent: 0, tier3_percent: 0, platform_fee_percent: 15 };

  const monthly = calculateCommission({
    amountNaira: 50000,
    program: recurringProgram,
    sellingEnrollment: tier1,
    lookupEnrollment: () => null,
  });

  assert.equal(monthly.totalCommissionNaira, 5000); // 10% of 50,000/mo
  assert.equal(monthly.totalAffiliatePayoutNaira, 4250); // after 15% platform fee
});

test("buildLineage stops at 3 tiers even if the referrer chain is longer", () => {
  const enrollments = {
    a: { id: "a", tier: 1, referrer_enrollment_id: "b" },
    b: { id: "b", tier: 2, referrer_enrollment_id: "c" },
    c: { id: "c", tier: 3, referrer_enrollment_id: "d" },
    d: { id: "d", tier: 4, referrer_enrollment_id: null }, // should never legally exist, but engine is defensive
  };
  const lookup = (id) => enrollments[id] || null;
  const lineage = buildLineage(enrollments.a, lookup);
  assert.equal(lineage.length, 3);
});

test("assertWithinMaxTiers throws once parent is already tier 3", () => {
  assert.throws(() => assertWithinMaxTiers(3));
  assert.doesNotThrow(() => assertWithinMaxTiers(2));
});

test("zero-percent tiers produce zero commission lines without erroring", () => {
  const tier1 = { id: "aff-1", tier: 1, referrer_enrollment_id: null };
  const freeProgram = { tier1_percent: 0, tier2_percent: 0, tier3_percent: 0, platform_fee_percent: 15 };
  const result = calculateCommission({
    amountNaira: 20000,
    program: freeProgram,
    sellingEnrollment: tier1,
    lookupEnrollment: () => null,
  });
  assert.equal(result.totalCommissionNaira, 0);
  assert.equal(result.businessProceedsNaira, 20000);
});
