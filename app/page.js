import HomeClient from "@/components/marketing/HomeClient";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import { Footer } from "@/components/marketing/CTAAndFooter";

export default function Home({ searchParams }) {
  return (
    <>
      <HomeClient searchParams={searchParams} />
      <InternalLinksSection />
      <Footer />
    </>
  );
}
