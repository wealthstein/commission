/**
 * The two Commission-hosted campaign pages (Interest Form on the product page,
 * Intent Form at app/leads/[whatsappRef]/continue) show a business's own
 * logo when they've set one via Account -> Business.
 *
 * This used to be plan-gated (Custom Branding was a paid-tier feature),
 * but that feature was cut - this now reads from businesses.logo_url (the
 * general logo every business can upload regardless of plan), not the old
 * landing_logo_url column, which had no UI to ever set it once Custom
 * Branding was removed. No plan check anymore - a real business identity
 * on the landing page isn't a premium feature, it's a trust signal that
 * matters for every business.
 */
export function resolveLandingBranding(business) {
  return {
    logoUrl: business?.logo_url || null,
    primaryColor: null,
  };
}