const test = require("node:test");
const assert = require("node:assert/strict");
const { inboxLimitsForPlan, INBOX_PLAN_LIMITS } = require("./inboxPlanLimits");

test("small plan (free tier id) allows 1 WhatsApp number and 2 seats", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("free");
  assert.equal(maxConnections, 1);
  assert.equal(maxSeats, 2);
});

test("medium plan (pro tier id) allows 3 WhatsApp numbers and 10 seats", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("pro");
  assert.equal(maxConnections, 3);
  assert.equal(maxSeats, 10);
});

test("large plan (plus tier id) allows 10 WhatsApp numbers and unlimited seats", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("plus");
  assert.equal(maxConnections, 10);
  assert.equal(maxSeats, null); // null = unlimited, checked explicitly (not falsy-checked) in the enforcement routes
});

test("unknown/missing plan falls back to the free-tier (Small) limits", () => {
  assert.deepEqual(inboxLimitsForPlan(undefined), INBOX_PLAN_LIMITS.free);
  assert.deepEqual(inboxLimitsForPlan("nonexistent"), INBOX_PLAN_LIMITS.free);
});

test("limits stay in sync with the pricing table copy (content/pricingPlans.json)", () => {
  // Regression guard for the exact failure mode this file's own header
  // comment warns about: the enforced numbers silently drifting from what
  // the pricing page promises. If someone changes a number in one place
  // without the other, this test should be the thing that catches it.
  const pricingPlans = require("../content/pricingPlans.json").plans;

  const small = pricingPlans.find((p) => p.id === "free");
  const medium = pricingPlans.find((p) => p.id === "pro");
  const large = pricingPlans.find((p) => p.id === "plus");

  assert.match(small.features.find((f) => f.includes("WhatsApp number")), /1 WhatsApp number/);
  assert.match(medium.features.find((f) => f.includes("WhatsApp number")), /3 WhatsApp numbers/);
  assert.match(large.features.find((f) => f.includes("WhatsApp number")), /10 WhatsApp numbers/);

  assert.equal(INBOX_PLAN_LIMITS.free.maxConnections, 1);
  assert.equal(INBOX_PLAN_LIMITS.pro.maxConnections, 3);
  assert.equal(INBOX_PLAN_LIMITS.plus.maxConnections, 10);
});
