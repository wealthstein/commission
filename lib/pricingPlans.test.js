const test = require("node:test");
const assert = require("node:assert/strict");
const { feePercentForPlan, PLAN_FEE_PERCENT } = require("./pricingPlans");

test("free plan keeps 20% platform fee on a digital product", () => {
  assert.equal(feePercentForPlan("free", "digital"), 20);
});

test("pro plan keeps 15% platform fee on a digital product", () => {
  assert.equal(feePercentForPlan("pro", "digital"), 15);
});

test("plus plan keeps 10% platform fee on a digital product", () => {
  assert.equal(feePercentForPlan("plus", "digital"), 10);
});

test("productType defaults to digital when omitted", () => {
  assert.equal(feePercentForPlan("pro"), 15);
});

test("physical products are always 0% platform fee, regardless of plan", () => {
  assert.equal(feePercentForPlan("free", "physical"), 0);
  assert.equal(feePercentForPlan("pro", "physical"), 0);
  assert.equal(feePercentForPlan("plus", "physical"), 0);
});

test("unknown/missing plan falls back to free-tier fee (digital only)", () => {
  assert.equal(feePercentForPlan(undefined, "digital"), PLAN_FEE_PERCENT.free);
  assert.equal(feePercentForPlan("nonexistent", "digital"), PLAN_FEE_PERCENT.free);
});
