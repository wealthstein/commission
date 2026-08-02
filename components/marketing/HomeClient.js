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
import RequestAccountForm from "@/components/marketing/RequestAccountForm";
import { CTASection } from "@/components/marketing/CTAAndFooter";
import SignInModal from "@/components/marketing/SignInModal";
import GoToTopButton from "@/components/marketing/GoToTopButton";
import { audienceContent, faqByAudience } from "@/components/marketing/content";
import { Box, Container } from "@mui/material";
import { dotPatternSx, altSectionBg } from "@/lib/patterns";

// Scrolls to the Request Access form and preselects the matching role -
// same mechanism TwoAudienceCta uses on every other page (see
// components/marketing/TwoAudienceCta.js). None of the buttons below open
// the Google sign-in modal anymore - the dashboard is not open for general
// signup yet, so "sign in" is not the right action for a first-time visitor.
function goToRequestForm(role) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("commission:preselect-role", { detail: role }));
  document.getElementById("request-account")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function HomeClient({ searchParams }) {
  const initialAudience = searchParams?.for === "affiliate" ? "affiliate" : "business";
  const [audience, setAudience] = useState(initialAudience);
  const [signInOpen, setSignInOpen] = useState(false);

  const content = audienceContent[audience];
  const faq = faqByAudience[audience];

  return (
    <>
      <Navbar audience={audience} onAudienceChange={setAudience} onSignIn={() => setSignInOpen(true)} />

      <Hero content={content} audience={audience} onPrimaryCta={() => goToRequestForm(audience)} />

      <CardGridSection id="benefits" title="Why Commission" items={content.benefits} columns={4} bgcolor={altSectionBg} />

      <CardGridSection title="What you get" items={content.features} columns={4} />

      <HowItWorks steps={content.howItWorks} bgcolor={altSectionBg} />

      {audience === "business" && <Comparison data={content.comparison} />}
      {audience === "affiliate" && <EarningsExample data={content.earningsExample} bgcolor={altSectionBg} />}

      {/* Pricing (business only), FAQ, and the Request Access form form one
          continuous closing zone with a shared dot-texture background,
          matching the reference site - no divider lines between them. */}
      <Box sx={dotPatternSx}>
        {audience === "business" && <Pricing onSelectPlan={() => goToRequestForm("business")} bgcolor="transparent" />}

        <FAQ items={faq} />

        <Box sx={{ py: { xs: 6, md: 9 } }}>
          <Container maxWidth="lg">
            <Box sx={{ maxWidth: 480, mx: "auto" }}>
              <RequestAccountForm sourcePage="/" />
            </Box>
          </Container>
        </Box>
      </Box>

      <CTASection
        content={{
          headline: audience === "business" ? "List your first product free" : "Join your first program today",
          subhead:
            audience === "business"
              ? "Start on Small. Upgrade to Medium or Large as your affiliate program grows."
              : "Discover products, share your link, and start earning — no separate application needed.",
          primaryCta: content.primaryCta,
        }}
        onPrimaryCta={() => goToRequestForm(audience)}
      />

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <GoToTopButton />
    </>
  );
}
