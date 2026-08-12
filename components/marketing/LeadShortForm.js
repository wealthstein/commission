"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";

export default function LeadShortForm({ programId, productName, businessName, logoUrl, checkoutStyle = false }) {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [state, setState] = useState({ loading: false, error: null, whatsappLink: null, whatsappRef: null, otpId: null });
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCaptureResult(data) {
    if (data.needsOtp) {
      // Inline, same page - no redirect, no new screen. To the customer
      // this reads as "one form with an extra field," not a third stop
      // in the journey.
      setState({ loading: false, error: null, whatsappLink: null, whatsappRef: null, otpId: data.otpId });
      return;
    }
    finishWithResult(data);
  }

  function finishWithResult(data) {
    if (checkoutStyle) {
      window.location.href = data.whatsappLink;
      return;
    }
    setState({ loading: false, error: null, whatsappLink: data.whatsappLink, whatsappRef: data.whatsappRef, otpId: null });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null, whatsappLink: null, whatsappRef: null, otpId: null });
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      handleCaptureResult(data);
    } catch (err) {
      setState({ loading: false, error: err.message, whatsappLink: null, whatsappRef: null, otpId: null });
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setOtpLoading(true);
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await fetch("/api/leads/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpId: state.otpId, pin: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setOtpLoading(false);
      finishWithResult(data);
    } catch (err) {
      setOtpLoading(false);
      setState((s) => ({ ...s, error: err.message }));
    }
  }

  const centeredFieldSx = checkoutStyle ? { "& input": { textAlign: "center", fontSize: 14 } } : undefined;

  if (state.otpId) {
    const otpContent = (
      <>
        <Typography fontWeight={700} sx={{ mb: 0.5, textAlign: checkoutStyle ? "center" : "left" }}>
          Enter the code we texted you
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2, textAlign: checkoutStyle ? "center" : "left" }}>
          We sent a 6-digit code to {form.phone} to confirm this is really you.
        </Typography>
        {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}
        <Box component="form" onSubmit={handleVerifyOtp}>
          <Stack spacing={checkoutStyle ? 1.25 : 1.5}>
            <TextField
              placeholder={checkoutStyle ? "6-digit code" : undefined}
              label={checkoutStyle ? undefined : "6-digit code"}
              required
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              sx={centeredFieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={otpLoading || otpCode.length !== 6}
              sx={checkoutStyle ? { py: 1.5, mt: 0.5, borderRadius: "12px", textTransform: "uppercase", fontSize: 13, letterSpacing: 0.5 } : undefined}
            >
              {otpLoading ? "Verifying…" : "Verify code"}
            </Button>
          </Stack>
        </Box>
      </>
    );
    if (checkoutStyle) return otpContent;
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
        {otpContent}
      </Paper>
    );
  }

  if (state.whatsappRef) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, bgcolor: "#E7F5EE" }}>
        <Typography fontWeight={700} sx={{ mb: 1 }}>
          You are on the list!
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Chat with us directly on WhatsApp, or go straight ahead and finish the quick details form below — either
          way gets you moving.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {state.whatsappLink && (
            <Button
              variant="contained"
              startIcon={<WhatsAppIcon />}
              href={state.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ bgcolor: "#25D366", color: "#fff", "&:hover": { bgcolor: "#1ebe57" } }}
            >
              Continue on WhatsApp
            </Button>
          )}
          <Button variant="outlined" endIcon={<ArrowForwardIcon />} component={Link} href={`/leads/${state.whatsappRef}/continue`}>
            Finish the details form
          </Button>
        </Stack>
      </Paper>
    );
  }

  const formContent = (
    <>
      {!checkoutStyle && (
        <>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Interested in {productName}?
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Tell us a bit about you and we will connect you directly on WhatsApp.
          </Typography>
        </>
      )}
      {checkoutStyle && (
        <>
          {logoUrl && (
            <Box sx={{ textAlign: "center", mb: 1.5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" style={{ height: 32, width: 32, borderRadius: 6, objectFit: "cover" }} />
            </Box>
          )}
          <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 2, textAlign: "center" }}>
            Get started with {businessName || "Commission"}
          </Typography>
        </>
      )}

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={checkoutStyle ? 1.25 : 1.5}>
          <TextField
            placeholder={checkoutStyle ? "Full name" : undefined}
            label={checkoutStyle ? undefined : "Full name"}
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            sx={centeredFieldSx}
          />
          <TextField
            placeholder={checkoutStyle ? "Phone number" : undefined}
            label={checkoutStyle ? undefined : "Phone number"}
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
            helperText={form.phone && form.phone.length !== 11 ? `${form.phone.length}/11 digits` : undefined}
            error={form.phone.length > 0 && form.phone.length !== 11}
            sx={centeredFieldSx}
          />
          <TextField
            placeholder={checkoutStyle ? "Email address" : undefined}
            label={checkoutStyle ? undefined : "Email address"}
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            sx={centeredFieldSx}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={state.loading}
            sx={checkoutStyle ? { py: 1.5, mt: 0.5, borderRadius: "12px", textTransform: "uppercase", fontSize: 13, letterSpacing: 0.5 } : undefined}
          >
            {state.loading ? "Submitting…" : "Continue on WhatsApp"}
          </Button>
        </Stack>
      </Box>

      {checkoutStyle && (
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", textAlign: "center", mt: 3 }}>
          Submit your details, you&apos;ll be taken straight to WhatsApp, and you can chat with {businessName || "the business"}{" "}
          directly.
        </Typography>
      )}
    </>
  );

  if (checkoutStyle) {
    return formContent;
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
      {formContent}
    </Paper>
  );
}