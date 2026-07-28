"use client";

import { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import CardGridSection from "@/components/marketing/CardGridSection";
import HowItWorks from "@/components/marketing/HowItWorks";
import Comparison from "@/components/marketing/Comparison";
import EarningsExample from "@/components/marketing/EarningsExample";
import FAQ from "@/components/marketing/FAQ";
import { CTASection, Footer } from "@/components/marketing/CTAAndFooter";
import SignInModal from "@/components/marketing/SignInModal";
import { audienceContent, faqByAudience } from "@/components/marketing/content";

export default function Home() {
  const [audience, setAudience] = useState("business");
  const [signInOpen, setSignInOpen] = useState(false);

  const content = audienceContent[audience];
  const faq = faqByAudience[audience];

  return (
    <>
      <Navbar audience={audience} onAudienceChange={setAudience} onSignIn={() => setSignInOpen(true)} />

      <Hero content={content} onPrimaryCta={() => setSignInOpen(true)} />

      <CardGridSection id="benefits" title="Why Commission" items={content.benefits} columns={4} />

      <CardGridSection title="What you get" items={content.features} columns={4} />

      <HowItWorks steps={content.howItWorks} />

      {audience === "business" ? (
        <Comparison data={content.comparison} />
      ) : (
        <EarningsExample data={content.earningsExample} />
      )}

      <FAQ items={faq} />

      <CTASection
        content={{
          headline: audience === "business" ? "List your first product free" : "Join your first program today",
          subhead:
            audience === "business"
              ? "Start on the Free plan. Upgrade to Pro or Plus as your affiliate program grows."
              : "Discover products, share your link, and start earning — no separate application needed.",
          primaryCta: content.primaryCta,
        }}
        onPrimaryCta={() => setSignInOpen(true)}
      />

      <Footer />

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
