import { Box, Container, Typography, Grid } from "@mui/material";
import { tokens } from "@/lib/theme";
import { splitPool, recurringTotals } from "@/lib/earningsMath";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import InternalLinksSection from "@/components/marketing/InternalLinksSection";
import TierPayoutDiagram from "@/components/marketing/TierPayoutDiagram";
import AffiliateEarningsCalculator from "@/components/marketing/AffiliateEarningsCalculator";
import SavingsCalculator from "@/components/marketing/SavingsCalculator";
import SignUpButton from "@/components/marketing/SignUpButton";

export const metadata = {
  title: "Earnings & Savings Calculator • Commission",
  description: "See exactly how a 3-tier commission splits across affiliates, and what a business could save versus running ads.",
};

function buildOneTimeExample() {
  const parts = splitPool(10000);
  const labels = ["Kemi", "Sadiku", "Amaka"];
  const sublabels = ["Generated the Intent Qualified Lead (IQL)", "Referred Kemi to Commission", "Referred Sadiku to Commission"];
  return parts.map((p, i) => ({ tier: p.tier, label: labels[i], sublabel: sublabels[i], percent: p.percent, amountNaira: p.amountNaira }));
}

function buildRecurringExample() {
  const totals = recurringTotals(2000, 6);
  const labels = ["Kemi", "Sadiku", "Amaka"];
  return totals.map((t, i) => ({
    tier: t.tier,
    label: labels[i],
    sublabel: `₦${t.amountNaira.toLocaleString()} / month while the customer stays subscribed`,
    percent: t.percent,
    amountNaira: t.amountNaira,
  }));
}

export default function CalculatorPage({ searchParams }) {
  const audience = searchParams?.for === "business" ? "business" : "affiliate";
  const oneTimeExample = buildOneTimeExample();
  const recurringExample = buildRecurringExample();

  return (
    <MarketingPageShell internalLinks={<InternalLinksSection />}>
      <Box sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2 }}>
            {audience === "business" ? "See what you could save" : "See exactly how you get paid"}
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 6, maxWidth: 640 }}>
            {audience === "business"
              ? "Commission only charges you for a real Intent Qualified Lead (IQL) or a verified sale - never for reach, clicks, or impressions."
              : "Every Intent Qualified Lead (IQL) or sale pays up to 3 tiers of affiliates automatically. Here is exactly how the math works, with a real example."}
          </Typography>

          {audience === "affiliate" ? (
            <>
              <Grid container spacing={4} sx={{ mb: 7 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 1 }}>
                    Worked example: one-time commission
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                    Flipper pays a ₦10,000 commission pool per Intent Qualified Lead (IQL) or sale, split 50% / 30% /
                    20% across tiers. Amaka referred Sadiku, and Sadiku referred Kemi. Kemi joins Flipper&apos;s
                    program, shares her link, and gets one IQL.
                  </Typography>
                  <TierPayoutDiagram items={oneTimeExample} poolLabel="₦10,000 pool, one IQL" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 1 }}>
                    Worked example: recurring commission
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                    If Flipper instead pays ₦2,000 recurring commission every month per subscription, the same chain
                    keeps earning every month until the customer cancels.
                  </Typography>
                  <TierPayoutDiagram items={recurringExample} poolLabel="₦2,000/month, recurring" />
                </Grid>
              </Grid>

              <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 3 }}>
                Calculate your own potential
              </Typography>
              <Box sx={{ mb: 7 }}>
                <AffiliateEarningsCalculator />
              </Box>
            </>
          ) : (
            <Box sx={{ mb: 7, display: "flex", justifyContent: "center" }}>
              <SavingsCalculator />
            </Box>
          )}

          <Box sx={{ maxWidth: 480, mx: "auto" }}>
            <SignUpButton role={audience} sourcePage="/calculator" />
          </Box>
        </Container>
      </Box>
    </MarketingPageShell>
  );
}
