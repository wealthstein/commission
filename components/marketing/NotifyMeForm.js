"use client";

import { useState } from "react";
import { Stack, TextField, Button, Typography } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function NotifyMeForm({ routeSlug }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ loading: false, error: null, success: false });

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null, success: false });
    try {
      const res = await fetch("/api/seo-targets/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeSlug, email }),
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
      <Typography variant="body2" sx={{ color: tokens.success, fontWeight: 600 }}>
        You are on the list — we will email you as soon as there is news.
      </Typography>
    );
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <TextField
        type="email"
        required
        placeholder="you@example.com"
        size="small"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" variant="contained" disabled={state.loading} sx={{ flexShrink: 0 }}>
        {state.loading ? "Submitting…" : "Notify me"}
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: tokens.danger }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}
