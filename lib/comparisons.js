/**
 * Content for comparison pages, each at its own bare root URL - e.g.
 * /google-ads, not /commission-and-google-ads and not /comparisons/google-ads.
 * Curated, not database-driven - these are persuasive marketing pages that
 * need real editorial quality, not a scaled programmatic surface like the
 * category or company/industry keyword-target pages.
 *
 * Rendered directly by app/[slug]/page.js at the bare slug. The old
 * /commission-and-[channel] URL pattern still 301-redirects to the new bare
 * URL for anything already indexed or shared - see lib/seo.js's
 * parseSeoRouteSlug.
 */
export const comparisons = [
  {
    slug: "google-ads",
    channelName: "Google Ads",
    headline: "Commission vs Google Ads",
    intro:
      "Google Ads charges you for every click, whether or not it turns into anything. Commission only charges when a referral actually turns into a Intent Qualified Lead or a verified sale.",
    points: [
      {
        title: "You pay for outcomes, not clicks",
        body: "A Google Ads click can bounce instantly and still cost you money. On Commission, nothing leaves your Campaign Wallet until a lead is qualified or a sale is verified.",
      },
      {
        title: "No bidding wars",
        body: "Google Ads costs rise the more competitors bid on the same keywords. Commission's cost per Intent Qualified Lead is whatever you set - it does not fluctuate with an auction.",
      },
      {
        title: "Built-in distribution",
        body: "Google Ads reaches whoever searches. Commission's affiliates already have an audience that trusts them - a warmer introduction than a cold search result.",
      },
      {
        title: "No ad account, no learning curve",
        body: "Running Google Ads well takes real expertise. Listing a campaign on Commission takes minutes.",
      },
    ],
  },
  {
    slug: "meta-ads",
    channelName: "Meta Ads",
    headline: "Commission vs Facebook and Instagram Ads",
    intro:
      "Social ad platforms charge for impressions and clicks regardless of quality. Commission charges only for a Intent Qualified Lead or a verified sale, and Nigerian affiliates already know how to convert their own audience on WhatsApp and social media.",
    points: [
      {
        title: "Outcome-based, not impression-based",
        body: "Meta charges for reach whether or not anyone converts. Commission only debits your wallet on a Intent Qualified Lead or a verified sale.",
      },
      {
        title: "No creative fatigue to manage",
        body: "Ad creative on social platforms wears out and needs constant refreshing. An affiliate's personal recommendation does not decay the same way.",
      },
      {
        title: "Radar filters leads before they reach you",
        body: "Every lead is checked against the referring affiliate's real track record automatically - fewer wrong numbers, fewer denials, fewer wasted follow-ups.",
      },
    ],
  },
  {
    slug: "cold-emails",
    channelName: "Cold Emails",
    headline: "Commission vs Cold Emails",
    intro:
      "Cold email campaigns take real time to write, send, and follow up on, and open rates keep falling. Commission turns your existing affiliates into a distributed outreach team you only pay when they actually produce a result.",
    points: [
      {
        title: "No list to build or clean",
        body: "Cold email needs a list, and a good list is expensive and decays fast. Commission's affiliates bring their own audience.",
      },
      {
        title: "Warm introduction, not a stranger in an inbox",
        body: "A referral from someone a prospect already follows converts differently than an unsolicited email from a company they have never heard of.",
      },
      {
        title: "Pay for results, not effort",
        body: "A cold email campaign costs the same whether it converts or not. Commission only charges for a Intent Qualified Lead or a verified sale.",
      },
    ],
  },
  {
    slug: "seo-agencies",
    channelName: "SEO Agencies",
    headline: "Commission vs Hiring an SEO Agency",
    intro:
      "SEO agencies charge a retainer for months before results show up, if they show up at all. Commission gets your product in front of real audiences immediately, and you only pay for outcomes.",
    points: [
      {
        title: "Immediate distribution, not a 6-month ramp",
        body: "SEO takes time to compound. Affiliates can start sharing your campaign the same day you list it.",
      },
      {
        title: "No fixed monthly retainer",
        body: "An SEO agency gets paid whether your rankings move or not. Commission only charges a flat subscription plus a fee when you fund your Campaign Wallet - and nothing further unless a lead or sale actually happens.",
      },
      {
        title: "Complementary, not competing",
        body: "Nothing stops you from doing both - Commission's own product and category pages are themselves built for search visibility.",
      },
    ],
  },
  {
    slug: "influencer-marketing",
    channelName: "Influencer Marketing",
    headline: "Commission vs Traditional Influencer Marketing",
    intro:
      "Typical influencer deals are flat fees paid upfront regardless of results. Commission lets any number of affiliates - influencers included - promote your campaign, and you only pay for what actually converts.",
    points: [
      {
        title: "Pay for performance, not reach",
        body: "A flat influencer fee is due whether the post converts or not. Commission only debits your wallet on a Intent Qualified Lead or verified sale.",
      },
      {
        title: "Scales past one relationship",
        body: "A single influencer deal caps your reach at that one audience. Commission lets unlimited affiliates - including micro-influencers - promote the same campaign at once.",
      },
      {
        title: "Transparent attribution",
        body: "Every referral link is tracked automatically - no guessing which post actually drove a result.",
      },
    ],
  },
  {
    slug: "tiktok-ads",
    channelName: "TikTok Ads",
    headline: "Commission vs TikTok Ads",
    intro:
      "TikTok Ads charges for reach and views regardless of whether anyone converts, and creative burns out fast on the platform. Commission only charges for a Intent Qualified Lead or a verified sale, however the affiliate reaches their audience.",
    points: [
      {
        title: "Pay for outcomes, not views",
        body: "A TikTok campaign can rack up views and still convert nobody. Commission only debits your wallet on a real result.",
      },
      {
        title: "No constant creative refresh needed",
        body: "TikTok ad creative fatigues quickly. An affiliate's own audience relationship does not decay the same way.",
      },
      {
        title: "Works across every platform an affiliate uses",
        body: "Not limited to one app - affiliates can share a link on TikTok, WhatsApp, Instagram, or anywhere else their audience is.",
      },
    ],
  },
];

export function getComparisonBySlug(slug) {
  return comparisons.find((c) => c.slug === slug) || null;
}
