const test = require("node:test");
const assert = require("node:assert/strict");
const { inboxLimitsForPlan, INBOX_PLAN_LIMITS } = require("./inboxPlanLimits");

test("small plan (free tier id) has no Inbox access at all", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("free");
  assert.equal(maxConnections, 0);
  assert.equal(maxSeats, 0);
});

test("medium plan (pro tier id) allows 2 WhatsApp numbers and 4 seats", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("pro");
  assert.equal(maxConnections, 2);
  assert.equal(maxSeats, 4);
});

test("large plan (plus tier id) allows 3 WhatsApp numbers and 8 seats", () => {
  const { maxConnections, maxSeats } = inboxLimitsForPlan("plus");
  assert.equal(maxConnections, 3);
  assert.equal(maxSeats, 8);
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

  // Small has no Inbox access at all - the pricing page correctly has no
  // "Inbox:" bullet for it whatsoever, rather than an awkward "0 WhatsApp
  // numbers" bullet. Assert the absence, not a phrasing.
  assert.equal(small.features.some((f) => f.includes("WhatsApp number")), false);
  assert.match(medium.features.find((f) => f.includes("WhatsApp number")), /2 WhatsApp numbers/);
  assert.match(large.features.find((f) => f.includes("WhatsApp number")), /3 WhatsApp numbers/);

  assert.equal(INBOX_PLAN_LIMITS.free.maxConnections, 0);
  assert.equal(INBOX_PLAN_LIMITS.pro.maxConnections, 2);
  assert.equal(INBOX_PLAN_LIMITS.plus.maxConnections, 3);
});
