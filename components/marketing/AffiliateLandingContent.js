"use client";

import { useState } from "react";
import { Box, Container, Typography, Button, Stack, Slider, Grid } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import { tokens } from "@/lib/theme";
import { triggerGoogleAuth } from "@/lib/googleAuth";

// Matches the same share used in HeroCalculatorTeaser.js and the full
// calculator page - this page's numbers should never imply a better deal
// than what the rest of the site actually promises.
const AFFILIATE_SHARE_PERCENT = 50;
const SALE_MIN_NAIRA = 5000;
const SALE_MAX_NAIRA = 200000;

const SOURCE_PAGE = "/lp/affiliates";

const STEPS = [
  {
    icon: GoogleIcon,
    title: "Sign in and join a program",
    body: "Browse real Nigerian businesses looking for affiliates - insurance, real estate, SaaS, and more.",
  },
  {
    icon: LinkRoundedIcon,
    title: "Share your link",
    body: "Every affiliate gets a unique tracked link. Post it anywhere - WhatsApp, Instagram, your own audience.",
  },
  {
    icon: PaymentsRoundedIcon,
    title: "Get paid automatically",
    body: "When someone buys through your link, your commission is calculated and paid to your bank via Paystack.",
  },
];

const BENEFITS = [
  { icon: BlockRoundedIcon, title: "No follower minimum", body: "Share with the people who already trust you - that's the whole requirement." },
  { icon: PaymentsRoundedIcon, title: "Free to join", body: "No cost to sign up or promote a program. You only ever earn, never pay in." },
  { icon: GroupsRoundedIcon, title: "Earn 3 tiers deep", body: "Bring another affiliate in, and earn a share of their sales too - automatically." },
  { icon: LinkRoundedIcon, title: "One link, every channel", body: "Share on WhatsApp, Instagram, your blog, or by email - Commission tracks it all." },
];

const FAQ = [
  { q: "Do I need a large following?", a: "No follower minimum at all. Some of the strongest affiliates on Commission have small, trusted audiences rather than huge ones." },
  { q: "Does it cost anything to join?", a: "No. Joining a program and sharing your link is free. Commission only ever pays you - there's no fee to become an affiliate." },
  { q: "How do I actually get paid?", a: "Commissions are calculated automatically and paid straight to your bank account via Paystack once they clear a program's minimum payout." },
  { q: "What can I promote?", a: "Real Nigerian businesses across insurance, real estate, HR software, SaaS, and internet providers - browse live programs after you sign in." },
];

export default function AffiliateLandingContent() {
  const [saleAmount, setSaleAmount] = useState(50000);
  const earnings = Math.round(saleAmount * (AFFILIATE_SHARE_PERCENT / 100));

  async function handleSignup() {
    await triggerGoogleAuth({ role: "affiliate", sourcePage: SOURCE_PAGE, flow: "signup" });
  }

  return (
    <Box sx={{ bgcolor: tokens.canvas, minHeight: "100vh" }}>
      {/* Hero */}
      <Box component="section" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 5 }}>Commission</Typography>

          <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 700, lineHeight: 1.08, mb: 3 }}>
            Share a link. Get paid when it converts.
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5 }}>
            Join affiliate programs from real Nigerian businesses. No follower minimum, no cost to join, paid
            automatically.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleSignup}
            sx={{
              bgcolor: tokens.ink,
              color: "#fff",
              "&:hover": { bgcolor: "#000" },
              fontWeight: 700,
              fontSize: 16,
              px: 4,
              py: 1.75,
              mb: 6,
            }}
          >
            Continue with Google
          </Button>

          {/* Signature element: a real, live earnings calculation - the
              actual mechanism this page exists to sell, not a decorative
              stat. */}
          <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 4, p: { xs: 3, md: 4 }, bgcolor: tokens.paper, textAlign: "left" }}>
            <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
              SEE WHAT A SINGLE REFERRAL PAYS
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                A customer you refer spends
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                ₦{saleAmount.toLocaleString()}
              </Typography>
            </Stack>
            <Slider
              value={saleAmount}
              onChange={(_, v) => setSaleAmount(v)}
              min={SALE_MIN_NAIRA}
              max={SALE_MAX_NAIRA}
              step={5000}
              sx={{ color: tokens.brand, mb: 3 }}
            />
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: tokens.brand, textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: tokens.brandInk }}>
                You earn
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: tokens.brandInk }}>
                ₦{earnings.toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 1.5 }}>
              Based on a {AFFILIATE_SHARE_PERCENT}% tier-1 commission share. Every program sets its own rate - this is
              a representative example.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* How it works */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: tokens.paper }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} sx={{ textAlign: "center", mb: 5 }}>
            How it works
          </Typography>
          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid item xs={12} md={4} key={step.title}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      bgcolor: tokens.brand,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <step.icon sx={{ color: tokens.brandInk }} />
                  </Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {i + 1}. {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {step.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} sx={{ textAlign: "center", mb: 5 }}>
            Why affiliates use Commission
          </Typography>
          <Grid container spacing={3}>
            {BENEFITS.map((b) => (
              <Grid item xs={12} sm={6} key={b.title}>
                <Box sx={{ display: "flex", gap: 2, p: 3, borderRadius: 3, bgcolor: tokens.paper, border: `1px solid ${tokens.border}` }}>
                  <b.icon sx={{ color: tokens.brandInk, flexShrink: 0 }} />
                  <Box>
                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                      {b.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {b.body}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: tokens.paper }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={700} sx={{ textAlign: "center", mb: 5 }}>
            Common questions
          </Typography>
          <Stack spacing={3}>
            {FAQ.map((item) => (
              <Box key={item.q}>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                  {item.q}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {item.a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            Your link is one sign-in away.
          </Typography>
          <Typography sx={{ color: tokens.muted, mb: 4 }}>
            No follower minimum, no cost to join, paid automatically.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleSignup}
            sx={{
              bgcolor: tokens.ink,
              color: "#fff",
              "&:hover": { bgcolor: "#000" },
              fontWeight: 700,
              fontSize: 16,
              px: 4,
              py: 1.75,
            }}
          >
            Continue with Google
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
