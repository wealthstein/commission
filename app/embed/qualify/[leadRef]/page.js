"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, TextField, Button, Stack, Alert, CircularProgress } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * Meant to be iframed by public/commission-track.js into a placeholder
 * div on a business's own site - see the tracking script's doc comment
 * for the embed snippet. The URL bar still shows the business's domain;
 * this document itself is served by, and only by, Commission.
 *
 * Deliberately asks nothing except the OTP code - the phone number was
 * already captured by the business's own form and staged server-side
 * (external_lead_pending), never re-asked here. The only reason this has
 * to be a real Commission-hosted frame at all, rather than something the
 * tracking script renders itself, is so this submission comes from
 * Commission's own document - not from code the business (or a
 * self-dealing affiliate) controls.
 */
export default function EmbedQualifyPage() {
  const params = useParams();
  const [header, setHeader] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [state, setState] = useState({ loading: true, error: null, done: false });

  useEffect(() => {
    fetch("/api/leads/embed-send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadRef: params.leadRef }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Something went wrong");
        setHeader(data);
        setState({ loading: false, error: null, done: false });
      })
      .catch((err) => setState({ loading: false, error: err.message, done: false }));
  }, [params.leadRef]);

  async function handleVerify(e) {
    e.preventDefault();
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/leads/embed-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadRef: params.leadRef, pin: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setState({ loading: false, error: null, done: true });
      window.parent.postMessage({ source: "commission-embed", event: "qualified" }, "*");
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }

  if (state.done) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="success">You&apos;re all set - thanks for confirming.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 380, mx: "auto" }}>
      {header && (
        <Typography fontWeight={700} sx={{ mb: 2, textAlign: "center" }}>
          Hi, {header.firstName}! Could you please confirm your interest in {header.businessName}?
        </Typography>
      )}
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}
      {!header && !state.error && (
        <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {header && (
        <Box component="form" onSubmit={handleVerify}>
          <Stack spacing={1.5} alignItems="center">
            <TextField
              placeholder="6-digit code"
              fullWidth
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              sx={{ "& input": { textAlign: "center" } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={state.loading || otpCode.length !== 6}>
              {state.loading ? "Verifying…" : "Confirm"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
