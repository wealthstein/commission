"use client";

import { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import CardGridSection from "@/components/marketing/CardGridSection";
import HowItWorks from "@/components/marketing/HowItWorks";
import Comparison from "@/components/marketing/Comparison";
import EarningsExample from "@/components/marketing/EarningsExample";
import Pricing from "@/components/marketing/Pricing";
import FAQ from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTAAndFooter";
import SignInModal from "@/components/marketing/SignInModal";
import GoToTopButton from "@/components/marketing/GoToTopButton";
import { audienceContent, faqByAudience } from "@/components/marketing/content";

export default function HomeClient({ searchParams }) {
  const initialAudience = searchParams?.for === "affiliate" ? "affiliate" : "business";
  const [audience, setAudience] = useState(initialAudience);
  const [signInOpen, setSignInOpen] = useState(false);

  const content = audienceContent[audience];
  const faq = faqByAudience[audience];

  return (
    <>
      <Navbar audience={audience} onAudienceChange={setAudience} onSignIn={() => setSignInOpen(true)} />

      <Hero content={content} audience={audience} onPrimaryCta={() => setSignInOpen(true)} />

      <CardGridSection id="benefits" title="Why Commission" items={content.benefits} columns={4} />

      <CardGridSection title="What you get" items={content.features} columns={4} />

      <HowItWorks steps={content.howItWorks} />

      {audience === "business" ? (
        <>
          <Comparison data={content.comparison} />
          <Pricing onSelectPlan={() => setSignInOpen(true)} />
        </>
      ) : (
        <EarningsExample data={content.earningsExample} />
      )}

      <FAQ items={faq} />

      <CTASection
        content={{
          headline: audience === "business" ? "List your first product free" : "Join your first program today",
          subhead:
            audience === "business"
              ? "Start on Small. Upgrade to Medium or Large as your affiliate program grows."
              : "Discover products, share your link, and start earning — no separate application needed.",
          primaryCta: content.primaryCta,
        }}
        onPrimaryCta={() => setSignInOpen(true)}
      />

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <GoToTopButton />
    </>
  );
}
