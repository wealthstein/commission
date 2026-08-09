"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paper, Box, Typography, TextField, Button, Stack, Alert, MenuItem, InputAdornment } from "@mui/material";
import { tokens } from "@/lib/theme";

// Same thousand-separator treatment as the campaign builder's naira
// fields - the answer stored/submitted is the raw digit string, this is
// display formatting only.
function formatNaira(rawDigits) {
  if (!rawDigits) return "";
  return Number(rawDigits).toLocaleString("en-US");
}
function stripToDigits(value) {
  return value.replace(/[^0-9]/g, "");
}
// Local Nigerian format only - 11 digits, e.g. 08012345678. No +234 typed
// here; that gets prepended wherever the number is actually used.
function formatPhoneDigits(value) {
  return stripToDigits(value).slice(0, 11);
}

export default function LeadLongForm({ whatsappRef, productName, customFields = [], sharesContactWithAffiliate = false }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", details: "" });
  const [customAnswers, setCustomAnswers] = useState({});
  const [state, setState] = useState({ loading: false, error: null });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateCustom(fieldId, value) {
    setCustomAnswers((a) => ({ ...a, [fieldId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      const res = await fetch("/api/leads/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappRef,
          ...form,
          customFieldAnswers: customFields.map((f) => ({
            fieldId: f.id,
            label: f.label,
            value: customAnswers[f.id] || "",
          })),
        }),
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
      <Typography variant="body2" sx={{ color: tokens.muted, mb: sharesContactWithAffiliate ? 1 : 2 }}>
        This goes straight to the business so they can follow up properly.
      </Typography>
      {sharesContactWithAffiliate && (
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Your details will also be shared with the person who referred you, so they can help coordinate your visit.
        </Typography>
      )}

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField label="Full name" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          <TextField
            label="Phone number"
            required
            placeholder="08012345678"
            value={form.phone}
            onChange={(e) => update("phone", formatPhoneDigits(e.target.value))}
            helperText={form.phone && form.phone.length !== 11 ? `${form.phone.length}/11 digits` : "11 digits, no +234 needed"}
            error={form.phone.length > 0 && form.phone.length !== 11}
          />
          <TextField label="Email (optional)" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <TextField
            label="Anything else worth sharing (optional)"
            multiline
            minRows={3}
            value={form.details}
            onChange={(e) => update("details", e.target.value)}
          />

          {customFields.map((f) =>
            f.field_type === "select" ? (
              <TextField
                key={f.id}
                select
                label={f.label}
                required={f.required}
                value={customAnswers[f.id] || ""}
                onChange={(e) => updateCustom(f.id, e.target.value)}
              >
                {(f.options || []).map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            ) : f.field_type === "price" ? (
              <TextField
                key={f.id}
                label={f.label}
                required={f.required}
                value={formatNaira(customAnswers[f.id] || "")}
                onChange={(e) => updateCustom(f.id, stripToDigits(e.target.value))}
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
              />
            ) : f.field_type === "number" ? (
              <TextField
                key={f.id}
                label={f.label}
                required={f.required}
                value={formatNaira(customAnswers[f.id] || "")}
                onChange={(e) => updateCustom(f.id, stripToDigits(e.target.value))}
              />
            ) : (
              <TextField
                key={f.id}
                label={f.label}
                required={f.required}
                value={customAnswers[f.id] || ""}
                onChange={(e) => updateCustom(f.id, e.target.value)}
              />
            )
          )}

          <Button type="submit" variant="contained" size="large" disabled={state.loading}>
            {state.loading ? "Submitting…" : "Submit"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
