/**
 * The two Commission-hosted campaign pages (Short Form on the product page,
 * Long Form at app/leads/[whatsappRef]/continue) can carry a business's own
 * branding - gated by plan tier, same way most white-label features scale
 * with plan elsewhere in the product.
 */
export function brandingForPlan(plan) {
  switch (plan) {
    case "plus": // Large
      return { allowLogo: true, allowColor: true };
    case "pro": // Medium
      return { allowLogo: true, allowColor: false };
    case "free": // Small
    default:
      return { allowLogo: false, allowColor: false };
  }
}

/**
 * Resolves what a business's campaign pages should actually render, given
 * their plan and whatever branding fields they have set. Falls back to
 * Commission's own defaults for anything not allowed or not set.
 */
export function resolveLandingBranding(business) {
  const { allowLogo, allowColor } = brandingForPlan(business?.plan);
  return {
    logoUrl: allowLogo ? business?.landing_logo_url || null : null,
    primaryColor: allowColor ? business?.landing_primary_color || null : null,
  };
}
