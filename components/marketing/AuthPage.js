"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Breadcrumbs, Grid, Typography, Button, Avatar } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Link from "next/link";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";
import { triggerGoogleAuth } from "@/lib/googleAuth";
import { urls } from "@/lib/urls";
import teamData from "@/content/team.json";
import siteConfig from "@/content/site.json";

/**
 * One random team member's message, picked once per page load - reloading
 * /signin or /signup shows a different one.
 */
function pickRandomMember() {
  const members = teamData.members;
  return members[Math.floor(Math.random() * members.length)];
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const searchParams = useSearchParams();
  // Starts deterministic (always members[0]) so server and client render
  // the exact same thing on first paint - picking randomly during the
  // initial render itself produces a different result on the server vs.
  // during client hydration, which is what previously threw a hydration
  // mismatch error. The real random pick only happens after mount, in an
  // effect, which never runs during server rendering.
  const [member, setMember] = useState(teamData.members[0]);

  useEffect(() => {
    setMember(pickRandomMember());
  }, []);

  async function handleGoogleAuth() {
    // A CTA elsewhere on the site can link here with ?source=/wherever and
    // ?role=business|affiliate when it already knows the answer - both
    // preserved through to the account record instead of every signup
    // starting from a blank slate.
    const source = searchParams.get("source");
    const role = searchParams.get("role");
    await triggerGoogleAuth({
      sourcePage: source || (isSignup ? urls.signup() : urls.signin()),
      role: role || undefined,
      flow: isSignup ? "signup" : "signin",
    });
  }

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ maxWidth: 420, mx: "auto", px: 3, py: { xs: 8, md: 12 }, textAlign: "center" }}>
          <Box component={Link} href="/" sx={{ display: "inline-block", mb: 3 }}>
            <CardMedia sx={{ height: 32, width: 32, borderRadius: "9px" }} image="/circle.svg" alt={siteConfig.name} />
          </Box>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 4 }}>
            {isSignup ? "One account for launching & joining a campaign." : `Sign in to your ${siteConfig.name} account.`}
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

          <Typography variant="body2" sx={{ color: tokens.muted }}>
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

          <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 4 }}>
            By continuing, you agree to {siteConfig.name}&apos;s{" "}
            <Typography component={Link} href={urls.terms()} sx={{ color: tokens.muted, textDecoration: "underline", display: "inline" }}>
              Terms
            </Typography>{" "}
            and{" "}
            <Typography component={Link} href={urls.privacy()} sx={{ color: tokens.muted, textDecoration: "underline", display: "inline" }}>
              Policy
            </Typography>
            .
          </Typography>

          <Breadcrumbs
            marginTop="20px"
            separator="•"
            aria-label="breadcrumb"
            sx={{
              '& ol': {
                justifyContent: 'center',
                fontSize: '12px',
                margin: 'auto',
                textDecoration: 'none'
              }
            }}
          >
            <Typography sx={{ color: tokens.muted, fontSize: 11 }}>
              © {new Date().getFullYear()} {siteConfig.name}
            </Typography>
            <Typography sx={{ color: tokens.muted, fontSize: 11 }}>
              Built with ❤️ in Chicago, Illinois
            </Typography>
          </Breadcrumbs>

        </Box>
      </Grid>

      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          bgcolor: "#F7F6F2",
          borderLeft: `1px solid ${tokens.border}`,
          px: 8,
        }}
      >
        <Box sx={{ maxWidth: 420 }}>
          <Typography variant="h3" sx={{ color: tokens.muted, lineHeight: 1, mb: 1 }}>
            &ldquo;
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 4, lineHeight: 1.4 }}>
            {member.quote}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar src={member.photo} alt={member.name} sx={{ width: 44, height: 44 }}>
              {member.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography fontWeight={700} sx={{ fontSize: 14 }}>
                {member.name}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 13 }}>
                {member.role}, {member.business}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}
