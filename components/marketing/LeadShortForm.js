"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";

export default function LeadShortForm({ programId, productName, businessName, logoUrl, checkoutStyle = false }) {
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
            onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
            helperText={form.phone && form.phone.length !== 11 ? `${form.phone.length}/11 digits` : checkoutStyle ? "11 digits, no +234 needed" : undefined}
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
            sx={checkoutStyle ? { py: 1.5, borderRadius: "12px" } : undefined}
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