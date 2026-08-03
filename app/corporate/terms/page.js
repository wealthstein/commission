import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import LegalPageContent from "@/components/marketing/LegalPageContent";

export const metadata = {
  title: "Terms of Service • Commission",
  description: "Terms governing use of Commission by businesses and affiliates.",
};

const sections = [
  {
    heading: "What Commission is",
    body: "Commission is a Nigerian affiliate marketplace. Businesses list a campaign and set what they are willing to pay for a Intent Qualified Lead or a verified sale; affiliates share a unique referral link and earn a tracked commission automatically when it converts. These Terms govern use of Commission by both businesses and affiliates.",
  },
  {
    heading: "Accounts",
    body: [
      "There is a single account type on Commission - the same account can list products as a business, promote products as an affiliate, or both.",
      "You are responsible for the accuracy of the information on your account and for any activity that happens under it.",
    ],
  },
  {
    heading: "Businesses listing a campaign",
    body: [
      "A business is responsible for the products and services it lists, and for honoring the commission structure it sets for each campaign.",
      "For qualified-lead campaigns, a business commits to funding its Campaign Wallet and confirming leads in good faith. For direct-sale campaigns, payment is processed and split automatically at checkout.",
    ],
  },
  {
    heading: "Affiliates promoting a campaign",
    body: [
      "An affiliate is responsible for how they promote a campaign, and must not misrepresent a product, make claims a business has not authorized, or use misleading or spammy promotion tactics.",
      "Commission may suspend an affiliate's access to a program for fraudulent referral activity, including self-referrals or fabricated leads.",
    ],
  },
  {
    heading: "Fees and payments",
    body: "Amounts on the platform are in Nigerian Naira. Payments are processed through Paystack, subject to Paystack's own terms. Commission's platform fee is set out in the pricing plan a business subscribes to, and is deducted as described on the relevant campaign type before any affiliate commission is calculated.",
  },
  {
    heading: "Prohibited conduct",
    body: "Using Commission to list illegal products or services, to fabricate leads or sales, to circumvent the commission structure of a program, or to attempt to access another account's data is prohibited and may result in suspension.",
  },
  {
    heading: "Termination",
    body: "Either party may stop using Commission at any time. Commission may suspend or terminate an account for violating these Terms, with amounts already owed settled according to the normal payout schedule.",
  },
  {
    heading: "Changes to these Terms",
    body: "These Terms may be updated as Commission's product changes. Material changes will be communicated to active accounts before taking effect.",
  },
  {
    heading: "Contact",
    body: "Questions about these Terms can be sent to legal@commission.ng.",
  },
];

export default function TermsPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <LegalPageContent
        eyebrow="Legal"
        title="Terms of Service"
        lastUpdated="August 2026"
        intro="This is a working draft, not a final legal document - Commission's full Terms of Service will be reviewed and published in full before the platform opens for general use. It is shared here so businesses and affiliates evaluating Commission know what to expect."
        sections={sections}
      />
    </MarketingPageShell>
  );
}
