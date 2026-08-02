import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import LegalPageContent from "@/components/marketing/LegalPageContent";

export const metadata = {
  title: "Security | Commission",
  description: "How Commission approaches data security and payment handling.",
};

const sections = [
  {
    heading: "Payment security",
    body: "All payments on Commission are processed through Paystack. Commission never receives or stores raw card numbers, CVVs, or bank credentials directly - that data stays with Paystack's own PCI-compliant infrastructure.",
  },
  {
    heading: "Data access controls",
    body: "The database enforces row-level security policies, meaning a business account can only ever query its own products, campaigns, and transactions, and an affiliate account can only ever query its own enrollments and earnings - enforced at the database layer, not just in application code.",
  },
  {
    heading: "Minimal data by design",
    body: "A qualified lead's identity (name, phone, email) is never stored in Commission's own database - it is forwarded directly to the business running that campaign and discarded from Commission's side. Data that is never stored cannot be part of a data breach.",
  },
  {
    heading: "Infrastructure",
    body: "Commission runs on Supabase (Postgres, authentication, and storage) and is hosted on Vercel. Both are widely used, actively maintained infrastructure providers with their own security programs.",
  },
  {
    heading: "Reporting a vulnerability",
    body: "If you believe you have found a security issue with Commission, email hello@commission.ng with details. Please do not publicly disclose a vulnerability before it has been addressed.",
  },
];

export default function SecurityPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <LegalPageContent
        eyebrow="Legal"
        title="Security"
        lastUpdated="August 2026"
        intro="A summary of how Commission is built, not a formal security audit or certification. If you need more detail for a vendor security review, contact hello@commission.ng."
        sections={sections}
      />
    </MarketingPageShell>
  );
}
