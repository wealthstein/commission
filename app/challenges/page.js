import { Box } from "@mui/material";
import { challenges } from "@/lib/siteSections";
import { buildSectionIndexMetadata } from "@/lib/seo";
import { urls } from "@/lib/urls";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import ChallengesIndexContent from "@/components/marketing/ChallengesIndexContent";

export const metadata = buildSectionIndexMetadata(
  "challenges",
  "Common Prospect Challenges",
  "The responses businesses hear most often when following up on a lead - and how Commission's Radar trust layer addresses each one."
);

export default function ChallengesIndexPage() {
  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <ChallengesIndexContent
          title="Common Prospect Challenges"
          description="The responses businesses hear most often when following up on a lead - and how Commission's Radar trust layer addresses each one."
          buildHref={urls.challenge}
          items={challenges}
          relatedLinks={[
            { label: "How Radar works", href: "/radar" },
            { label: "Browse industries", href: urls.industriesIndex() },
          ]}
        />
      </Box>
    </MarketingPageShell>
  );
}
