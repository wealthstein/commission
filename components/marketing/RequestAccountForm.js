"use client";

import { useEffect, useState } from "react";
import { Paper, Box, Typography, TextField, Button, Stack, ToggleButtonGroup, ToggleButton, Alert } from "@mui/material";
import { tokens } from "@/lib/theme";

/**
 * The dashboard is not open for general signup yet, so this is the real
 * pre-launch conversion mechanism, embedded on every industry, program, and
 * comparison page. Never call this a waitlist in user-facing copy - it is
 * framed as requesting early account access instead.
 *
 * TwoAudienceCta's two buttons both scroll to this same form (anchor
 * id="request-account") and dispatch a "commission:preselect-role" event
 * that this form listens for to preselect the matching toggle.
 */
export default function RequestAccountForm({ sourcePage }) {
  const [role, setRole] = useState("business");
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [state, setState] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    function handlePreselect(e) {
      if (e.detail === "business" || e.detail === "affiliate") setRole(e.detail);
    }
    window.addEventListener("commission:preselect-role", handlePreselect);
    return () => window.removeEventListener("commission:preselect-role", handlePreselect);
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null, success: false });
    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, sourcePage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setState({ loading: false, error: null, success: true });
    } catch (err) {
      setState({ loading: false, error: err.message, success: false });
    }
  }

  if (state.success) {
    return (
      <Paper id="request-account" variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, bgcolor: "#E7F5EE" }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          You are in
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          We will email you the moment your account is ready.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper id="request-account" variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, scrollMarginTop: 96 }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        Request early access
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        Commission is not fully open yet - tell us who you are and we will reach out the moment your account is ready.
      </Typography>

      <ToggleButtonGroup
        value={role}
        exclusive
        size="small"
        onChange={(_, v) => v && setRole(v)}
        sx={{
          mb: 2,
          bgcolor: "#F1EFE7",
          borderRadius: 999,
          p: 0.4,
          "& .MuiToggleButton-root": { border: "none", borderRadius: 999, textTransform: "none", fontWeight: 600, px: 2 },
          "& .Mui-selected": { bgcolor: `${tokens.paper} !important`, color: `${tokens.ink} !important` },
        }}
      >
        <ToggleButton value="business">I am a business</ToggleButton>
        <ToggleButton value="affiliate">I am an affiliate</ToggleButton>
      </ToggleButtonGroup>

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField label="First name" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          <TextField label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          <TextField label="Phone number" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <Button type="submit" variant="contained" size="large" disabled={state.loading}>
            {state.loading ? "Submitting…" : role === "business" ? "Request your business account" : "Request your affiliate account"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
