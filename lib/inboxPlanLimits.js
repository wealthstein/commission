/**
 * Inbox plan limits - the numbers here MUST match the "Inbox:" bullets in
 * content/pricingPlans.json exactly. Kept as a separate small config
 * (rather than folding into pricingPlans.json itself) because this file is
 * read by API routes that need machine-readable numbers, while
 * pricingPlans.json's `features` array is display copy (plain strings) for
 * the pricing table - the two are consumed differently, but must never
 * drift apart. If you change a limit here, update the matching bullet in
 * content/pricingPlans.json in the same commit.
 */
export const INBOX_PLAN_LIMITS = {
  free: { maxConnections: 0, maxSeats: 0 }, // Small: no Inbox access at all - paid-plan-exclusive feature
  pro: { maxConnections: 2, maxSeats: 4 },
  plus: { maxConnections: 3, maxSeats: 8 },
};

export function inboxLimitsForPlan(plan) {
  return INBOX_PLAN_LIMITS[plan] ?? INBOX_PLAN_LIMITS.free;
}
