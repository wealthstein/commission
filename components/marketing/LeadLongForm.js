"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paper, Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function LeadLongForm({ whatsappRef, productName }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", details: "" });
  const [state, setState] = useState({ loading: false, error: null });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      const res = await fetch("/api/leads/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappRef, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/leads/${whatsappRef}/thank-you`);
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        A few more details for {productName}
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        This goes straight to the business so they can follow up properly.
      </Typography>

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField label="Full name" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          <TextField label="Phone number" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <TextField label="Email (optional)" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <TextField
            label="Anything else worth sharing (optional)"
            multiline
            minRows={3}
            value={form.details}
            onChange={(e) => update("details", e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={state.loading}>
            {state.loading ? "Submitting…" : "Submit"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
