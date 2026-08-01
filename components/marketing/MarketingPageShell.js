"use client";

import { useState } from "react";
import Navbar from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/CTAAndFooter";
import GoToTopButton from "@/components/marketing/GoToTopButton";
import SignInModal from "@/components/marketing/SignInModal";

/**
 * Shared shell for every marketing page (industries, comparisons, programs,
 * their indexes, and the small corporate pages). `internalLinks` is passed
 * in as an already-rendered element from the page's own Server Component
 * (e.g. `<InternalLinksSection />`) rather than imported here directly,
 * because that component does async Supabase data-fetching - a pattern
 * only Server Components can do. Client Components can render a Server
 * Component that is handed to them as a prop/children, just not import and
 * instantiate one themselves.
 */
export default function MarketingPageShell({ children, internalLinks }) {
  const [audience, setAudience] = useState("business");
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      <Navbar audience={audience} onAudienceChange={setAudience} onSignIn={() => setSignInOpen(true)} />
      {children}
      {internalLinks}
      <Footer />
      <GoToTopButton />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
