"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, TextField, Button, Stack, Alert, MenuItem, InputAdornment } from "@mui/material";
import { tokens } from "@/lib/theme";

function formatNaira(rawDigits) {
  if (!rawDigits) return "";
  return Number(rawDigits).toLocaleString("en-US");
}
function stripToDigits(value) {
  return value.replace(/[^0-9]/g, "");
}
function formatPhoneDigits(value) {
  return stripToDigits(value).slice(0, 11);
}

const centeredFieldSx = { "& input": { textAlign: "center" } };
const centeredSelectSx = {
  "& .MuiSelect-select": { textAlign: "center" },
  "& .MuiSelect-icon": { display: "none" },
};
const centeredMenuProps = {
  MenuProps: { PaperProps: { sx: { "& .MuiMenuItem-root": { justifyContent: "center" } } } },
};

export default function LeadLongForm({ whatsappRef, businessName, logoUrl, customFields = [], sharesContactWithAffiliate = false }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
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
    <>
      {logoUrl && (
        <Box sx={{ textAlign: "center", mb: 1.5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" style={{ height: 32, width: 32, borderRadius: 6, objectFit: "cover" }} />
        </Box>
      )}
      <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700, display: "block", mb: 2, textAlign: "center" }}>
        A few more details for {businessName || "Commission"}
      </Typography>

      {sharesContactWithAffiliate && (
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", textAlign: "center", mb: 2 }}>
          Your details will also be shared with the person who referred you, so they can help coordinate your visit.
        </Typography>
      )}

      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            placeholder="Full name"
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            sx={centeredFieldSx}
          />
          <TextField
            placeholder="Phone number"
            required
            value={form.phone}
            onChange={(e) => update("phone", formatPhoneDigits(e.target.value))}
            helperText={form.phone && form.phone.length !== 11 ? `${form.phone.length}/11 digits` : undefined}
            error={form.phone.length > 0 && form.phone.length !== 11}
            sx={centeredFieldSx}
          />
          <TextField
            placeholder="Email address"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            sx={centeredFieldSx}
          />

          {customFields.map((f) =>
            f.field_type === "select" ? (
              <TextField
                key={f.id}
                select
                placeholder={f.label}
                required={f.required}
                value={customAnswers[f.id] || ""}
                onChange={(e) => updateCustom(f.id, e.target.value)}
                sx={centeredSelectSx}
                SelectProps={{ IconComponent: () => null, displayEmpty: true, ...centeredMenuProps }}
              >
                <MenuItem value="" disabled>
                  {f.label}
                </MenuItem>
                {(f.options || []).map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            ) : f.field_type === "price" ? (
              <TextField
                key={f.id}
                placeholder={f.label}
                required={f.required}
                value={formatNaira(customAnswers[f.id] || "")}
                onChange={(e) => updateCustom(f.id, stripToDigits(e.target.value))}
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                sx={centeredFieldSx}
              />
            ) : f.field_type === "number" ? (
              <TextField
                key={f.id}
                placeholder={f.label}
                required={f.required}
                value={formatNaira(customAnswers[f.id] || "")}
                onChange={(e) => updateCustom(f.id, stripToDigits(e.target.value))}
                sx={centeredFieldSx}
              />
            ) : (
              <TextField
                key={f.id}
                placeholder={f.label}
                required={f.required}
                value={customAnswers[f.id] || ""}
                onChange={(e) => updateCustom(f.id, e.target.value)}
                sx={centeredFieldSx}
              />
            )
          )}

          <Button type="submit" variant="contained" size="large" disabled={state.loading} sx={{ py: 1.5, borderRadius: "12px" }}>
            {state.loading ? "Submitting…" : "Submit"}
          </Button>
        </Stack>
      </Box>
    </>
  );
}