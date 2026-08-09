"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";

export default function LeadShortForm({ programId, productName, checkoutStyle = false }) {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [state, setState] = useState({ loading: false, error: null, whatsappLink: null, whatsappRef: null });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null, whatsappLink: null, whatsappRef: null });
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (checkoutStyle) {
        // No intermediate screen here - straight to WhatsApp the moment
        // this succeeds. The two-option card (WhatsApp or finish the
        // form) still exists below for the non-checkout affiliate-facing
        // form, since that wasn't what was being redesigned.
        window.location.href = data.whatsappLink;
        return;
      }
      setState({ loading: false, error: null, whatsappLink: data.whatsappLink, whatsappRef: data.whatsappRef });
    } catch (err) {
      setState({ loading: false, error: err.message, whatsappLink: null, whatsappRef: null });
    }
  }

  const centeredFieldSx = checkoutStyle ? { "& input": { textAlign: "center" } } : undefined;

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
        <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 2, textAlign: "center" }}>
          Your details
        </Typography>
      )}

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={checkoutStyle ? 2 : 1.5}>
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
            onChange={(e) => update("phone", e.target.value)}
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
            sx={checkoutStyle ? { py: 1.5 } : undefined}
          >
            {state.loading ? "Submitting…" : "Continue on WhatsApp"}
          </Button>
        </Stack>
      </Box>

      {checkoutStyle && (
        <Stack spacing={1} sx={{ mt: 4 }}>
          {[
            "Submit your details above",
            "You'll be taken straight to WhatsApp",
            "Chat with the business directly to get your questions answered",
          ].map((step, i) => (
            <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: "#F7F6F2",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  mt: 0.2,
                }}
              >
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: tokens.muted }}>{i + 1}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {step}
              </Typography>
            </Stack>
          ))}
        </Stack>
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