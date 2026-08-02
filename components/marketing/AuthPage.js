"use client";

import { Box, Grid, Typography, Button, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Link from "next/link";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";
import { triggerGoogleAuth } from "@/lib/googleAuth";
import { urls } from "@/lib/urls";

const VALUE_POINTS = {
  signup: {
    headline: "Every conversion tracked. Every commission paid automatically.",
    points: [
      { stat: "3", label: "commission tiers, paid automatically" },
      { stat: "0", label: "leads stored on our side - forwarded straight to you" },
      { stat: "100%", label: "of your affiliate commission tracked from click to payout" },
    ],
  },
  signin: {
    headline: "Your campaigns, your commissions, right where you left them.",
    points: [
      { stat: "24/7", label: "your dashboard reflects every click and conversion live" },
      { stat: "1", label: "account for listing products, promoting them, or both" },
      { stat: "0", label: "spreadsheets needed to track who is owed what" },
    ],
  },
};

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";

  async function handleGoogleAuth() {
    await triggerGoogleAuth({ sourcePage: mode === "signup" ? urls.signup() : urls.signin() });
  }

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ maxWidth: 420, mx: "auto", px: 3, py: { xs: 8, md: 12 } }}>
          <Stack component={Link} href="/" direction="row" alignItems="center" spacing={1} sx={{ mb: 6, textDecoration: "none" }}>
            <CardMedia sx={{ height: 28, width: 28, borderRadius: "8px" }} image="/circle.svg" alt="Commission" />
            <Typography fontWeight={700} sx={{ color: tokens.ink, fontSize: 18 }}>
              Commission
            </Typography>
          </Stack>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.muted, mb: 4 }}>
            {isSignup
              ? "One account for listing products, promoting them, or both."
              : "Sign in to your Commission account."}
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleAuth}
            sx={{ borderColor: tokens.border, color: tokens.ink, py: 1.5, mb: 3 }}
          >
            Continue with Google
          </Button>

          <Typography variant="body2" sx={{ color: tokens.muted, textAlign: "center" }}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Typography component={Link} href={urls.signin()} sx={{ color: tokens.ink, fontWeight: 600, display: "inline" }}>
                  Sign in
                </Typography>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Typography component={Link} href={urls.signup()} sx={{ color: tokens.ink, fontWeight: 600, display: "inline" }}>
                  Sign up
                </Typography>
              </>
            )}
          </Typography>

          <Typography variant="caption" sx={{ color: tokens.muted, display: "block", textAlign: "center", mt: 4 }}>
            By continuing, you agree to Commission&apos;s{" "}
            <Typography component={Link} href={urls.terms()} sx={{ color: tokens.muted, textDecoration: "underline", display: "inline" }}>
              Terms of Service
            </Typography>{" "}
            and{" "}
            <Typography component={Link} href={urls.privacy()} sx={{ color: tokens.muted, textDecoration: "underline", display: "inline" }}>
              Privacy Policy
            </Typography>
            .
          </Typography>
        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          bgcolor: "#F1EFE7",
          borderLeft: `1px solid ${tokens.border}`,
          px: 8,
        }}
      >
        <Box sx={{ maxWidth: 420 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 4, lineHeight: 1.3 }}>
            {VALUE_POINTS[mode].headline}
          </Typography>
          <Stack spacing={3}>
            {VALUE_POINTS[mode].points.map((v) => (
              <Stack key={v.label} direction="row" spacing={2} alignItems="baseline">
                <Typography variant="h4" fontWeight={800} sx={{ minWidth: 64 }}>
                  {v.stat}
                </Typography>
                <Typography variant="body1" sx={{ color: tokens.muted }}>
                  {v.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
