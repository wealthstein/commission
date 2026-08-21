"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import ProblemSolutionSection from "@/components/marketing/ProblemSolutionSection";
import CardGridSection from "@/components/marketing/CardGridSection";
import HowItWorks from "@/components/marketing/HowItWorks";
import DemoVideoSection from "@/components/marketing/DemoVideoSection";
import Comparison from "@/components/marketing/Comparison";
import EarningsExample from "@/components/marketing/EarningsExample";
import Pricing from "@/components/marketing/Pricing";
import FAQ from "@/components/marketing/FAQ";
import RequestAccountForm from "@/components/marketing/RequestAccountForm";
import { CTASection } from "@/components/marketing/CTAAndFooter";
import GoToTopButton from "@/components/marketing/GoToTopButton";
import { audienceContent, faqByAudience } from "@/components/marketing/content";
import { Box, Container, Typography } from "@mui/material";
import { dotPatternSx, altSectionBg } from "@/lib/patterns";
import { tokens } from "@/lib/theme";

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
  const router = useRouter();
  const initialAudience = searchParams?.for === "affiliate" ? "affiliate" : "business";
  const [audience, setAudience] = useState(initialAudience);
  // SignInModal retired in favor of the dedicated /signin page.

  const content = audienceContent[audience];
  const faq = faqByAudience[audience];

  return (
    <>
      <Navbar audience={audience} onAudienceChange={setAudience} onSignIn={() => router.push("/signin")} />

      <Hero content={content} audience={audience} onPrimaryCta={() => goToRequestForm(audience)} />

      <DemoVideoSection audience={audience} videoUrl={content.demoVideoUrl} />

      <Container maxWidth="md" sx={{ textAlign: "center", py: { xs: 2, md: 3 } }}>
        <Typography variant="h2" sx={{ fontSize: { xs: 24, md: 32 }, mb: 1.5 }}>
          We're Commission!
        </Typography>
        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400 }}>
          Commission is a performance-based customer acquisition platform that lets businesses in Nigeria set up
          commission-based affiliate programs, track referral sales, and pay out automatically via Paystack.
        </Typography>
      </Container>

      <ProblemSolutionSection
        items={content.problemsAndSolutions}
        eyebrow={audience === "business" ? "What businesses actually deal with" : "What affiliates actually deal with"}
      />

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
          <Container maxWidth="md">
            <Box sx={{ mx: "auto" }}>
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

      <GoToTopButton />
    </>
  );
}
