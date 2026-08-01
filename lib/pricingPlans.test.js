const test = require("node:test");
const assert = require("node:assert/strict");
const { feePercentForPlan, PLAN_FEE_PERCENT } = require("./pricingPlans");

test("small plan (free tier id) keeps 20%", () => {
  assert.equal(feePercentForPlan("free"), 20);
});

test("medium plan (pro tier id) keeps 15%", () => {
  assert.equal(feePercentForPlan("pro"), 15);
});

test("large plan (plus tier id) keeps 10%", () => {
  assert.equal(feePercentForPlan("plus"), 10);
});

test("fee is uniform regardless of what is being charged — same plan, same rate for a qualified lead or a verified sale", () => {
  // There is no second argument anymore: the wallet-charge mechanism is
  // identical either way, so the fee never varies by conversion goal or
  // product type — only by plan.
  assert.equal(feePercentForPlan("free"), feePercentForPlan("free"));
  assert.equal(feePercentForPlan("plus"), 10);
});

test("unknown/missing plan falls back to the free-tier fee", () => {
  assert.equal(feePercentForPlan(undefined), PLAN_FEE_PERCENT.free);
  assert.equal(feePercentForPlan("nonexistent"), PLAN_FEE_PERCENT.free);
});
