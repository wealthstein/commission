import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import LegalPageContent from "@/components/marketing/LegalPageContent";

export const metadata = {
  title: "Privacy Policy | Commission",
  description: "How Commission handles data for businesses, affiliates, and leads.",
};

const sections = [
  {
    heading: "The principle behind this policy",
    body: "Commission is deliberately built to store as little as possible. Account data for businesses and affiliates is kept because the platform cannot function without it. A lead's identity is not - see the section below on qualified leads, which is the part of this policy most worth reading in full.",
  },
  {
    heading: "What we collect for accounts",
    body: [
      "For businesses: company name, contact details, product listings, and payout/settlement information.",
      "For affiliates: name, email, phone, referral activity, and payout details.",
      "Both account types share a single unified account, so this data is collected once regardless of which role someone uses Commission in.",
    ],
  },
  {
    heading: "Qualified leads: the no-PII-storage principle",
    body: [
      "When a prospect completes a qualified-lead campaign's forms, their name, phone number, email, and any answers they give are forwarded directly to the business running that campaign - by email, or by a webhook the business controls - and Commission does not keep a copy on its own side once that forwarding happens.",
      "This means Commission genuinely cannot look up a lead's identity after the fact. The business that received the forward is the source of truth for that person's data, not Commission.",
    ],
  },
  {
    heading: "Payment data",
    body: "Commission does not handle raw card details. Payments are processed by Paystack, and Commission only receives transaction references, amounts, and status - never full card numbers.",
  },
  {
    heading: "How account data is used",
    body: "Account data is used to operate the platform: matching businesses and affiliates, calculating and paying commissions, and communicating about your account. It is not sold to third parties.",
  },
  {
    heading: "Data sharing",
    body: "Data is shared with Paystack (to process payments) and, for qualified leads specifically, with the business running that campaign (as described above). Commission does not share account data with advertisers or data brokers.",
  },
  {
    heading: "Your rights",
    body: "You can request a copy of the account data Commission holds about you, or request it be deleted, by contacting hello@commission.ng. Deleting a business or affiliate account does not retroactively recall lead data already forwarded to a business before deletion.",
  },
  {
    heading: "Changes to this policy",
    body: "This policy may be updated as the product changes. Material changes will be communicated to active accounts before taking effect.",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <LegalPageContent
        eyebrow="Legal"
        title="Privacy Policy"
        lastUpdated="August 2026"
        intro="This is a working draft, not a final legal document - Commission's full Privacy Policy will be reviewed and published in full before the platform opens for general use."
        sections={sections}
      />
    </MarketingPageShell>
  );
}
