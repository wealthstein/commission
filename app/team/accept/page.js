"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Container, Typography, Button, CircularProgress } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";
import { triggerGoogleAuth } from "@/lib/googleAuth";

function AcceptInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState({ status: "checking", error: null });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", error: "This invite link is missing its token." });
      return;
    }

    async function run() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "needs-auth", error: null });
        return;
      }

      try {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to accept invite");
        setState({ status: "accepted", error: null });
      } catch (err) {
        setState({ status: "error", error: err.message });
      }
    }
    run();
  }, [token]);

  async function handleSignIn() {
    await triggerGoogleAuth({ next: `/team/accept?token=${token}` });
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 8 }}>
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Box sx={{ display: "inline-block", mb: 4 }}>
          <CardMedia sx={{ height: 32, width: 32, borderRadius: "9px" }} image="/circle.svg" alt="Commission" />
        </Box>

        {state.status === "checking" && <CircularProgress size={28} />}

        {state.status === "needs-auth" && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
              Sign in to accept this invite
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, mb: 3 }}>
              Use the Google account this invite was sent to.
            </Typography>
            <Button variant="contained" size="large" onClick={handleSignIn}>
              Continue with Google
            </Button>
          </>
        )}

        {state.status === "accepted" && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
              You&apos;re on the team
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, mb: 3 }}>
              Your access is active. Head to your dashboard to get started.
            </Typography>
            <Button variant="contained" size="large" href="/dashboard">
              Go to dashboard
            </Button>
          </>
        )}

        {state.status === "error" && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
              This invite couldn&apos;t be accepted
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.muted, mb: 3 }}>
              {state.error}
            </Typography>
            <Button variant="outlined" size="large" href="/">
              Back to Commission
            </Button>
          </>
        )}
      </Container>
    </Box>
  );
}

export default function AcceptTeamInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInner />
    </Suspense>
  );
}
