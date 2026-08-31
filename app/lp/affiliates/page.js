import AffiliateLandingContent from "@/components/marketing/AffiliateLandingContent";

export const metadata = {
  title: "Get paid for the referrals you're already making • Commission",
  description:
    "Join affiliate programs from real Nigerian businesses. No follower minimum, no cost to join, paid automatically via Paystack.",
  // Not meant to be organically discovered or indexed - Meta Ads traffic
  // only, so it shouldn't compete with or duplicate the site's real
  // /signup or /affiliates pages in search results.
  robots: { index: false, follow: false },
};

export default function AffiliatesLandingPage() {
  return <AffiliateLandingContent />;
}
