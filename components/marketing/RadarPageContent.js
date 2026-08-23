import Link from "next/link";
import { Container, Typography, Grid, Box, Stack, Chip, Button } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

const LIFECYCLE_STAGES = [
  {
    title: "Referral click",
    body: "Every click through an affiliate's link carries that affiliate's own track record with it - before a prospect ever sees a form.",
    points: ["Which affiliate is sending this", "Their platform-wide qualification rate", "Whether that rate is enough to skip extra friction"],
  },
  {
    title: "Interest Form",
    body: "For leads from an affiliate who hasn't yet proven themselves, Radar adds a quick check right here - on the same page, no redirect.",
    points: ["Confirms a real, reachable prospect", "Trusted affiliates' leads skip this entirely", "Adds seconds, not minutes"],
  },
  {
    title: "Qualification",
    body: "Only a prospect who completes the Intent Form themselves ever becomes billable - no business self-report, no manual override.",
    points: ["One objective, system-recorded trigger", "The same result feeds back into Radar", "Trust compounds or decays automatically"],
  },
];

const CONCEPT_CARDS = [
  {
    icon: TimelineRoundedIcon,
    title: "Affiliate trust scoring",
    body: "Every affiliate has one live number - qualified leads divided by everything they've ever referred, platform-wide. Not per-campaign, not a one-time badge. Recalculated fresh every single time.",
  },
  {
    icon: BoltRoundedIcon,
    title: "Verification only where it's needed",
    body: "Affiliates with a proven track record never see any added step. Unproven affiliates trigger a quick verification before their lead reaches you - automatically, invisibly, without you setting a single rule.",
  },
  {
    icon: VerifiedRoundedIcon,
    title: "Trust that can be lost, not just earned",
    body: "There is no permanent status. An affiliate's standing is checked live on every lead - if their real performance drops, the extra check comes right back, without anyone having to notice and intervene.",
  },
];

const SIGNAL_LAYER_CARDS = [
  {
    icon: SpeedRoundedIcon,
    title: "Timing patterns",
    body: "How quickly a form gets filled in, and how long someone actually spends on the page before submitting - a real person reading and considering leaves a different pattern than a fabricated submission.",
  },
  {
    icon: HubRoundedIcon,
    title: "Cross-campaign detection",
    body: "The same phone number or network showing up across multiple unrelated campaigns in a short window is a pattern only Commission can see platform-wide - no single business's own site ever could, even with full technical access.",
  },
  {
    icon: VisibilityOffRoundedIcon,
    title: "Runs on every single lead, no exceptions",
    body: "Unlike the verification step above, this layer doesn't skip Trusted affiliates - it's silent, it's always on, and it never asks the customer to do anything at all.",
  },
];

const INDUSTRIES = [
  { slug: "real-estate", name: "Real Estate" },
  { slug: "fintech", name: "Fintech" },
  { slug: "healthcare", name: "Healthcare" },
  { slug: "banking", name: "Banking" },
  { slug: "insurance", name: "Insurance" },
  { slug: "education", name: "Education" },
];

const FAQS = [
  {
    q: "What is Radar?",
    a: "Radar is Commission's trust layer for affiliate-driven leads. It tracks every affiliate's real qualification history platform-wide, and uses that to decide - automatically, lead by lead - whether an extra verification step is needed before a prospect reaches you.",
  },
  {
    q: "Does Radar slow down my leads?",
    a: "Not the ones that matter. An affiliate with a proven track record has their leads pass straight through, exactly as fast as before Radar existed. Only leads from affiliates who haven't yet earned that trust see any added step.",
  },
  {
    q: "How does Radar actually verify a lead?",
    a: "Two layers, working together. For leads from an unproven affiliate, a short verification step is built directly into the Interest Form itself - no redirect, no separate app. Underneath that, a separate signal layer runs on every single lead regardless of trust status, checking timing and cross-campaign patterns silently. We don't publish the exact mechanics of either layer publicly, the same way most fraud and trust systems don't - but the outcome is what matters: fewer wrong numbers, fewer denials, fewer wasted follow-ups.",
  },
  {
    q: "Does Radar replace my own follow-up process?",
    a: "No. Radar filters out the leads that were never going to convert - the wrong numbers, the never-submitted-anything, the flatly-not-interested. It doesn't replace judgment on the leads that are genuinely real but not a fit for other reasons, like budget or location - that's what campaign-specific custom questions on the Intent Form are for.",
  },
  {
    q: "How is this different from just asking more form questions?",
    a: "Form questions can be answered dishonestly by anyone, real or not - we heard this directly from businesses who tried exactly that and still got a wall of fake responses on follow-up. Radar works at the affiliate level instead of the form level, using a track record that's much harder to fake than a text field.",
  },
];

export default function RadarPageContent() {
  return (
    <>
      {/* Hero */}
      <Box sx={{ py: { xs: 7, md: 11 }, textAlign: "center" }}>
        <Container maxWidth="md">
          <Chip label="RADAR" size="small" sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, mb: 3 }} />
          <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 52 }, mb: 3, fontWeight: 800 }}>
            Stop fake leads without slowing down real ones.
          </Typography>
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 620, mx: "auto" }}>
            Radar is Commission&apos;s trust layer, built directly into every campaign. It tracks each affiliate&apos;s
            real track record to decide when extra verification is needed, and runs a completely separate, invisible
            layer of checks on every single lead - no exceptions, nothing the customer ever sees.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <SignUpButton sourcePage="/radar" />
            <Button variant="outlined" size="large" component={Link} href={urls.challengesIndex()}>
              See the problems it solves
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Problem framing */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: tokens.canvas }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 30 }, fontWeight: 700, mb: 2 }}>
            Bad leads don&apos;t announce themselves at checkout - they show up when you follow up
          </Typography>
          <Typography sx={{ color: tokens.muted, maxWidth: 560, mx: "auto" }}>
            &ldquo;I never submitted any form.&rdquo; &ldquo;That&apos;s not my number.&rdquo; &ldquo;I&apos;m not
            interested.&rdquo; These aren&apos;t rare - they&apos;re the single most common response businesses hear
            after chasing a lead that was never real to begin with. Radar exists specifically to cut down how often
            you hear them.
          </Typography>
        </Container>
      </Box>

      {/* Lifecycle stages */}
      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 1.5 }}>
            Radar protects every stage of the lead
          </Typography>
          <Typography sx={{ color: tokens.muted, textAlign: "center", mb: 6, maxWidth: 560, mx: "auto" }}>
            Not a single checkpoint - a decision made fresh at each step, using what&apos;s already known about the
            affiliate behind the click.
          </Typography>
          <Grid container spacing={3}>
            {LIFECYCLE_STAGES.map((stage, i) => (
              <Grid item xs={12} md={4} key={stage.title}>
                <Box sx={{ p: 3.5, borderRadius: 3, border: `1px solid ${tokens.border}`, height: "100%" }}>
                  <Typography variant="h3" sx={{ color: tokens.brand, WebkitTextStroke: `1.5px ${tokens.ink}`, fontSize: 28, mb: 1.5 }}>
                    {String(i + 1).padStart(2, "0")}
                  </Typography>
                  <Typography fontWeight={700} sx={{ mb: 1, fontSize: 18 }}>
                    {stage.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                    {stage.body}
                  </Typography>
                  <Stack spacing={0.75}>
                    {stage.points.map((p) => (
                      <Typography key={p} variant="caption" sx={{ color: tokens.muted }}>
                        · {p}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Concept cards */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: tokens.canvas }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 6 }}>
            Get protection across the whole funnel
          </Typography>
          <Grid container spacing={3}>
            {CONCEPT_CARDS.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Box sx={{ p: 3.5, borderRadius: 3, bgcolor: tokens.paper, height: "100%" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: tokens.brand, display: "grid", placeItems: "center", mb: 2 }}>
                    <card.icon sx={{ color: tokens.brandInk }} />
                  </Box>
                  <Typography fontWeight={700} sx={{ mb: 1, fontSize: 17 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {card.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Invisible signal layer - runs on every lead, no exceptions */}
      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 1.5 }}>
            A second layer, running silently underneath
          </Typography>
          <Typography sx={{ color: tokens.muted, textAlign: "center", mb: 6, maxWidth: 560, mx: "auto" }}>
            The verification step above only applies to unproven affiliates. This layer is different - it runs on
            every single lead, regardless of trust status, and the customer never sees any sign of it at all.
          </Typography>
          <Grid container spacing={3}>
            {SIGNAL_LAYER_CARDS.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Box sx={{ p: 3.5, borderRadius: 3, bgcolor: tokens.canvas, height: "100%" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: tokens.brand, display: "grid", placeItems: "center", mb: 2 }}>
                    <card.icon sx={{ color: tokens.brandInk }} />
                  </Box>
                  <Typography fontWeight={700} sx={{ mb: 1, fontSize: 17 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {card.body}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* MQL -> IQL -> SQL */}
      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 2 }}>
            Radar cleans up the step your sales team feels most
          </Typography>
          <Typography sx={{ color: tokens.muted, textAlign: "center", mb: 6, maxWidth: 600, mx: "auto" }}>
            Every lead your team ever works travels the same path - Radar is built specifically to strengthen the
            middle of it.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={0} alignItems="stretch" sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ flex: 1, p: 3.5, textAlign: "center" }}>
              <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
                MQL
              </Typography>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Marketing Qualified Lead
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                A prospect clicks an affiliate&apos;s link and shows initial interest - raw, unverified, the widest
                part of the funnel.
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 3.5, textAlign: "center", bgcolor: tokens.canvas, borderTop: { xs: `1px solid ${tokens.border}`, md: "none" }, borderBottom: { xs: `1px solid ${tokens.border}`, md: "none" }, borderLeft: { md: `1px solid ${tokens.border}` }, borderRight: { md: `1px solid ${tokens.border}` } }}>
              <Typography variant="overline" sx={{ color: tokens.brandInk, fontWeight: 700 }}>
                IQL - RADAR WORKS HERE
              </Typography>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Intent Qualified Lead
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                The prospect completes the Intent Form themselves - Radar has already filtered out what was never
                going to reach this point honestly.
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 3.5, textAlign: "center" }}>
              <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
                SQL
              </Typography>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Sales Qualified Lead
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                Your team follows up on a cleaner pool from the start - less time spent discovering a lead was never
                real in the first place.
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Industries */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: tokens.canvas }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 6 }}>
            Radar works across every industry on Commission
          </Typography>
          <Grid container spacing={2}>
            {INDUSTRIES.map((ind) => (
              <Grid item xs={6} sm={4} key={ind.slug}>
                <Box
                  component={Link}
                  href={urls.industry(ind.slug)}
                  sx={{
                    display: "block",
                    p: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${tokens.border}`,
                    textDecoration: "none",
                    color: "inherit",
                    textAlign: "center",
                    bgcolor: tokens.paper,
                    "&:hover": { borderColor: tokens.ink },
                  }}
                >
                  <Typography fontWeight={700}>{ind.name}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, textAlign: "center", mb: 6 }}>
            Frequently asked questions
          </Typography>
          <Stack spacing={0}>
            {FAQS.map((faq, i) => (
              <Box key={faq.q} sx={{ py: 3, borderTop: i === 0 ? "none" : `1px solid ${tokens.border}` }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  {faq.q}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {faq.a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box sx={{ py: { xs: 7, md: 10 }, textAlign: "center" }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, mb: 2 }}>
            Ready to see cleaner leads?
          </Typography>
          <Typography sx={{ color: tokens.muted, mb: 4 }}>
            Radar runs on every campaign automatically - there is nothing extra to set up.
          </Typography>
          <SignUpButton sourcePage="/radar" />
        </Container>
      </Box>
    </>
  );
}
