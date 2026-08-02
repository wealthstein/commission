const test = require("node:test");
const assert = require("node:assert/strict");
const { splitPool, recurringTotals, projectMonthlyEarnings } = require("./earningsMath");

test("one-time scenario: 10000 pool split 50/30/20 matches the exact worked example", () => {
  const [tier1, tier2, tier3] = splitPool(10000);
  assert.equal(tier1.amountNaira, 5000); // Kemi, tier 1
  assert.equal(tier2.amountNaira, 3000); // Sadiku, tier 2
  assert.equal(tier3.amountNaira, 2000); // Amaka, tier 3
  assert.equal(tier1.amountNaira + tier2.amountNaira + tier3.amountNaira, 10000);
});

test("recurring scenario: 2000/month pool split 50/30/20 matches the exact worked example", () => {
  const [tier1, tier2, tier3] = splitPool(2000);
  assert.equal(tier1.amountNaira, 1000); // Kemi, tier 1
  assert.equal(tier2.amountNaira, 600); // Sadiku, tier 2
  assert.equal(tier3.amountNaira, 400); // Amaka, tier 3
});

test("recurring totals accumulate correctly over multiple months", () => {
  const totals = recurringTotals(2000, 6);
  assert.equal(totals[0].totalAfterMonthsNaira, 6000); // tier 1: 1000 x 6
  assert.equal(totals[1].totalAfterMonthsNaira, 3600); // tier 2: 600 x 6
  assert.equal(totals[2].totalAfterMonthsNaira, 2400); // tier 3: 400 x 6
});

test("projected monthly earnings combines all three tiers correctly", () => {
  const result = projectMonthlyEarnings({
    poolNaira: 10000,
    ownConversions: 10, // tier 1: 10 x 5000 = 50000
    referredAffiliateCount: 2,
    avgConversionsPerReferredAffiliate: 5, // tier 2: 2 x 5 x 3000 = 30000
    subReferredAffiliateCount: 4,
    avgConversionsPerSubReferredAffiliate: 3, // tier 3: 4 x 3 x 2000 = 24000
  });
  assert.equal(result.tier1Naira, 50000);
  assert.equal(result.tier2Naira, 30000);
  assert.equal(result.tier3Naira, 24000);
  assert.equal(result.totalNaira, 104000);
});

test("custom tier split percentages are respected", () => {
  const [tier1, tier2, tier3] = splitPool(1000, { tier1: 70, tier2: 20, tier3: 10 });
  assert.equal(tier1.amountNaira, 700);
  assert.equal(tier2.amountNaira, 200);
  assert.equal(tier3.amountNaira, 100);
});
