/**
 * Content for /conversions/[slug] - explains the two conversion goals a
 * campaign can be set up for. Matches the "Conversions" column in the
 * internal-links sketch. Genuinely useful content, not just a link target:
 * this is the single biggest decision a business makes when listing a
 * campaign (see lib/checkout.js vs lib/wallet.js for how differently the
 * two are actually paid for under the hood).
 */
export const conversionPages = [
  {
    slug: "qualified-lead",
    name: "Qualified Lead",
    headline: "Pay only when a real prospect is qualified",
    body: "A lead-goal campaign never charges anything for a click or a form submission alone. A prospect moves through a Short Form and Long Form - either Commission's hosted pages, or your own site via the custom integration - checked against the referring affiliate's track record and a set of invisible signals along the way. Only once the Long Form is complete and the lead is marked qualified does anything get charged, straight from your Campaign Wallet.",
    bestFor: "HMO enrollments, insurance quotes, course inquiries, property viewings - anything where a human follow-up, not an instant checkout, closes the deal.",
  },
  {
    slug: "direct-sales",
    name: "Direct Sales",
    headline: "Customers check out, affiliates get paid automatically",
    body: "A sale-goal campaign routes the customer to pay on your own website. Paystack splits the payment the moment it happens - your own proceeds land in your connected settlement account, and the affiliate commission is paid out automatically, no manual step required.",
    bestFor: "Anything sold online at a fixed price where a customer can complete the purchase themselves in one sitting.",
  },
];

export function getConversionPageBySlug(slug) {
  return conversionPages.find((c) => c.slug === slug) || null;
}
