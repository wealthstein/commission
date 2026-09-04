import InboxPageContent from "@/components/marketing/InboxPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Inbox — A WhatsApp Team Inbox for Your Business • Commission",
  description:
    "Connect your business WhatsApp number, add your whole team, and reply to every customer from one shared inbox with a built-in sales pipeline. No WhatsApp Business API required.",
  alternates: { canonical: `${SITE_URL}/inbox` },
  openGraph: {
    title: "Inbox — A WhatsApp Team Inbox for Your Business",
    description:
      "Reply to every customer from one shared WhatsApp inbox with a built-in pipeline, lead routing, and full-text search.",
    url: `${SITE_URL}/inbox`,
    type: "website",
  },
};

export default function InboxPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <InboxPageContent />
    </MarketingPageShell>
  );
}
