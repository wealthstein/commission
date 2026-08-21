import Link from "next/link";
import { Box, Container, Typography, Chip, Stack, Paper } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import SignUpButton from "@/components/marketing/SignUpButton";

/**
 * /programs/[industry] - the CHILD level under Programs. Speaks to
 * AFFILIATES ("browse programs you can promote"), never businesses -
 * compare to /industries/[slug], which pitches the same industry to
 * businesses instead. Deliberately does not list companies here (that
 * speculative content does not belong on a page meant to convert real
 * affiliates) - only real, live products.
 */
export default function IndustryProgramContent({ industry, liveProducts }) {
  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="md">
        <Chip label="For affiliates" size="small" sx={{ bgcolor: "#F7F6F2", fontWeight: 600, mb: 2 }} />

        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, mb: 2, maxWidth: 720 }}>
          {industry.displayName === "Real Estate"
            ? "Real Estate programs realtors can promote"
            : `${industry.displayName} programs you can promote`}
        </Typography>

        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 4, maxWidth: 640 }}>
          {industry.displayName === "Real Estate"
            ? "Share a unique link, and earn as a realtor two ways - automatically on every Intent Qualified Lead, and again when a deal you referred actually closes."
            : "Share a unique link, earn a commission automatically on every Intent Qualified Lead or sale - no application process, no waiting on approval."}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} sx={{ borderRadius: 3, overflow: "hidden", mb: 6 }}>
          <Box sx={{ flex: 1, bgcolor: tokens.ink, color: "#fff", p: 3 }}>
            <Typography variant="h4" fontWeight={700}>
              {liveProducts.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              live {industry.displayName.toLowerCase()} program{liveProducts.length === 1 ? "" : "s"} right now
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: tokens.brand, p: 3 }}>
            <Typography variant="h4" fontWeight={700} sx={{ color: tokens.brandInk }}>
              3 tiers
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.brandInk, opacity: 0.85 }}>
              earn on your own referrals, and on affiliates you bring in
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: "#F7F6F2", p: 3 }}>
            <Typography component={Link} href={urls.calculator("affiliate")} variant="h4" fontWeight={700} sx={{ display: "block", color: tokens.ink }}>
              Calculate →
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              see exactly what you could earn
            </Typography>
          </Box>
        </Stack>

        <SignUpButton role="affiliate" sourcePage={urls.programIndustry(industry.keywordSlug)} />

        {industry.displayName === "Real Estate" && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              Realtors: two ways to earn on every referral
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, mb: 3, maxWidth: 640 }}>
              You already refer clients to developers and agencies you trust. As a realtor on Commission, you get
              paid for that referral automatically - and paid again if you're the one who closes the deal.
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: tokens.brand, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <BoltRoundedIcon sx={{ color: tokens.brandInk, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    1. Per Intent Qualified Lead - paid automatically
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    The moment a client you referred completes the Intent Form, you're paid - whether or not that
                    lead ever turns into a closed sale. No chasing anyone, no waiting on a deal to close first.
                  </Typography>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: tokens.brand, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <HandshakeRoundedIcon sx={{ color: tokens.brandInk, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    2. Per sale - paid when the deal closes
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    If you're the realtor who referred that client, you earn again once the sale actually closes -
                    on top of what you already earned at the first stage.
                  </Typography>
                </Box>
              </Paper>
            </Stack>

            <Typography fontWeight={700} sx={{ mb: 1.5 }}>
              More reasons realtors are joining
            </Typography>
            <Stack spacing={1.25}>
              {[
                "No cost to join - share your link, only earn when it converts.",
                "Get paid for referrals you send but don't personally close - not every lead has to be yours to close for you to earn from it.",
                "Refer other realtors and earn a share of what they generate too, automatically, up to 3 tiers deep.",
                "This is what you already do informally - Commission just makes sure you actually get paid for it, tracked and automatic.",
              ].map((point) => (
                <Stack key={point} direction="row" spacing={1.25} alignItems="flex-start">
                  <CheckCircleRoundedIcon sx={{ color: tokens.brand, fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {point}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {liveProducts.length > 0 ? (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              Live {industry.displayName} programs
            </Typography>
            <Stack spacing={0} sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: "hidden" }}>
              {liveProducts.map((p, i) => (
                <Box
                  key={`${p.businesses.slug}-${p.slug}`}
                  component={Link}
                  href={urls.product(p.businesses.slug, p.slug)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 2.5,
                    borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": { bgcolor: "#FAFAF8" },
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>{p.name}</Typography>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {p.businesses.name} · ₦{Number(p.price_naira).toLocaleString()}
                    </Typography>
                  </Box>
                  <ArrowForwardRoundedIcon sx={{ color: tokens.muted }} />
                </Box>
              ))}
            </Stack>
          </>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: tokens.border, textAlign: "center" }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              New {industry.displayName} programs launch regularly
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Claim your affiliate account now so you are first in line to promote the next one - request early
              access above.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
