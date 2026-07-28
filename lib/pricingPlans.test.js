const test = require("node:test");
const assert = require("node:assert/strict");
const { feePercentForPlan, PLAN_FEE_PERCENT } = require("./pricingPlans");

test("free plan keeps 20% platform fee", () => {
  assert.equal(feePercentForPlan("free"), 20);
});

test("pro plan keeps 15% platform fee", () => {
  assert.equal(feePercentForPlan("pro"), 15);
});

test("plus plan keeps 10% platform fee", () => {
  assert.equal(feePercentForPlan("plus"), 10);
});

test("unknown/missing plan falls back to free-tier fee", () => {
  assert.equal(feePercentForPlan(undefined), PLAN_FEE_PERCENT.free);
  assert.equal(feePercentForPlan("nonexistent"), PLAN_FEE_PERCENT.free);
});
