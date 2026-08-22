/**
 * Suggested attribution_days per product category - a smart default
 * shown at campaign creation, never a hard limit. The business can always
 * adjust it; the plan-based ceiling (see
 * supabase/migration_attribution_window_ceiling.sql) is the only actual
 * enforcement, applied server-side regardless of what this suggests.
 *
 * Grouped by real sales-cycle length, not by digital/physical - a fast
 * impulse category and a slow considered-purchase category can both be
 * digital or both be physical.
 */
const FAST_DECISION = 14; // impulse/simple purchases - most conversions happen same-day to ~2 weeks
const MODERATE_DECISION = 30; // some comparison shopping, but resolves within a month
const SLOW_DECISION = 90; // real consideration cycles - B2B evaluation, high-ticket, long research

export const ATTRIBUTION_DAYS_BY_CATEGORY = {
  "internet-service-provider": FAST_DECISION,
  electronics: FAST_DECISION,
  fashion: FAST_DECISION,
  "beauty-products": FAST_DECISION,
  "home-appliances": FAST_DECISION,
  memberships: FAST_DECISION,
  "online-courses": FAST_DECISION,

  hmo: MODERATE_DECISION,
  insurance: MODERATE_DECISION,
  saas: MODERATE_DECISION,
  fintech: MODERATE_DECISION,
  "software-licenses": MODERATE_DECISION,
  furniture: MODERATE_DECISION,
  logistics: MODERATE_DECISION,

  "hr-software": SLOW_DECISION, // B2B enterprise evaluation cycle
  "real-estate": SLOW_DECISION,
  cars: SLOW_DECISION,

  other: MODERATE_DECISION,
};

export const ATTRIBUTION_DAYS_CEILING_BY_PLAN = {
  free: 30, // Small
  pro: 90, // Medium
  plus: 90, // Large
};

/**
 * The actual value to pre-fill in the campaign form - the category's
 * suggested default, clamped to whatever the business's plan allows. If
 * their plan doesn't support the industry's typical window, this returns
 * the plan's ceiling instead, not a value the trigger would just silently
 * override anyway.
 */
export function suggestedAttributionDays(categorySlug, plan) {
  const suggested = ATTRIBUTION_DAYS_BY_CATEGORY[categorySlug] ?? MODERATE_DECISION;
  const ceiling = ATTRIBUTION_DAYS_CEILING_BY_PLAN[plan] ?? ATTRIBUTION_DAYS_CEILING_BY_PLAN.free;
  return Math.min(suggested, ceiling);
}
