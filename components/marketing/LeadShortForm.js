"use client";

import { useState } from "react";
import Link from "next/link";
import { Paper, Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/lib/theme";

export default function LeadShortForm({ programId, productName }) {
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
      setState({ loading: false, error: null, whatsappLink: data.whatsappLink, whatsappRef: data.whatsappRef });
    } catch (err) {
      setState({ loading: false, error: err.message, whatsappLink: null, whatsappRef: null });
    }
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

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        Interested in {productName}?
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        Tell us a bit about you and we will connect you directly on WhatsApp.
      </Typography>

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField label="Full name" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          <TextField label="Phone number" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <TextField label="Email (optional)" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <Button type="submit" variant="contained" size="large" disabled={state.loading}>
            {state.loading ? "Submitting…" : "Get connected on WhatsApp"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

