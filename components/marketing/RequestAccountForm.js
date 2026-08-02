"use client";

import { useEffect, useState } from "react";
import { Paper, Box, Typography, TextField, Button, Grid, ToggleButtonGroup, ToggleButton, Alert } from "@mui/material";
import { tokens } from "@/lib/theme";

const SUBTEXT = {
  business: "List your first product free and start reaching customers through affiliates who already have their trust.",
  affiliate: "See what real affiliates are earning and get matched with programs the moment they go live.",
};

const HEADLINE = {
  business: "Claim your business account",
  affiliate: "Claim your affiliate account",
};

/**
 * The real pre-launch conversion mechanism, embedded on every industry,
 * program, and comparison page. Never call this a waitlist in user-facing
 * copy - it is framed as claiming/requesting an account, with confident,
 * forward-looking copy rather than an apologetic "we are not open yet."
 *
 * Pass fixedRole="business" or fixedRole="affiliate" on a page that only
 * makes sense for one audience (e.g. /industries speaks to businesses,
 * /programs speaks to affiliates) - this hides the toggle entirely and
 * shows only the copy relevant to that audience. Omit fixedRole on
 * dual-audience pages (the homepage, /calculator, /conversions) to keep
 * the toggle.
 *
 * TwoAudienceCta's two buttons both scroll to this same form (anchor
 * id="request-account") and dispatch a "commission:preselect-role" event
 * that this form listens for to preselect the matching toggle - a no-op
 * when fixedRole is set, since there is nothing to preselect.
 */
export default function RequestAccountForm({ sourcePage, fixedRole }) {
  const [role, setRole] = useState(fixedRole || "business");
  const [form, setForm] = useState({ firstName: "", email: "", phone: "" });
  const [state, setState] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    if (fixedRole) return;
    function handlePreselect(e) {
      if (e.detail === "business" || e.detail === "affiliate") setRole(e.detail);
    }
    window.addEventListener("commission:preselect-role", handlePreselect);
    return () => window.removeEventListener("commission:preselect-role", handlePreselect);
  }, [fixedRole]);

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
      <Paper
        id="request-account"
        variant="outlined"
        sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, borderColor: tokens.border, bgcolor: "#E7F5EE", textAlign: "center" }}
      >
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
    <Paper
      id="request-account"
      variant="outlined"
      sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, borderColor: tokens.border, scrollMarginTop: 96, textAlign: "center" }}
    >
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        {fixedRole ? HEADLINE[fixedRole] : "Claim your account"}
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2, maxWidth: 440, mx: "auto" }}>
        {SUBTEXT[role]}
      </Typography>

      {!fixedRole && (
        <ToggleButtonGroup
          value={role}
          exclusive
          size="small"
          onChange={(_, v) => v && setRole(v)}
          sx={{
            mb: 3,
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
      )}

      {state.error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 440, mx: "auto", textAlign: "left" }}>
          {state.error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 440, mx: "auto" }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              label="First name"
              fullWidth
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone number"
              fullWidth
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" size="large" fullWidth disabled={state.loading}>
              {state.loading ? "Submitting…" : role === "business" ? "Claim your business account" : "Claim your affiliate account"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
