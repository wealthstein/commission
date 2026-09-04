"use client";

import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Stack, MenuItem, TextField, Alert, LinearProgress, Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import Papa from "papaparse";
import { createClient } from "@/lib/supabaseClient";

const MAPPABLE_FIELDS = ["wa_number", "name", "value", "source"];

export default function CsvImportModal({ open, onClose, businessId, onImported }) {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length) {
          setError(`Could not parse CSV: ${res.errors[0].message}`);
          return;
        }
        const cols = res.meta.fields ?? [];
        setHeaders(cols);
        setRows(res.data);

        const auto = {};
        for (const field of MAPPABLE_FIELDS) {
          const match = cols.find((c) => c.toLowerCase().replace(/[^a-z]/g, "") === field.replace("_", ""));
          if (match) auto[field] = match;
        }
        if (!auto.wa_number) auto.wa_number = cols.find((c) => /phone|whatsapp|number/i.test(c)) ?? "";
        if (!auto.name) auto.name = cols.find((c) => /name/i.test(c)) ?? "";
        setMapping(auto);
      },
    });
  }

  function normalizePhone(raw) {
    const digits = (raw || "").replace(/[^\d]/g, "");
    return digits.length >= 8 ? digits : null;
  }

  async function runImport() {
    if (!mapping.wa_number) {
      setError("Map a column to WhatsApp number before importing — it identifies the contact.");
      return;
    }

    setImporting(true);
    setProgress(0);
    setError(null);
    let created = 0;
    let skipped = 0;

    const supabase = createClient();
    const { data: firstStage } = await supabase
      .from("inbox_pipeline_stages")
      .select("id")
      .eq("business_id", businessId)
      .order("position")
      .limit(1)
      .single();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const waNumber = normalizePhone(row[mapping.wa_number]);
      if (!waNumber) {
        skipped++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      const name = mapping.name ? row[mapping.name] : null;
      const value = mapping.value ? Number(row[mapping.value]) || 0 : 0;

      const { data: contact, error: contactError } = await supabase
        .from("inbox_contacts")
        .upsert(
          { business_id: businessId, wa_number: waNumber, name: name || null },
          { onConflict: "business_id,wa_number" }
        )
        .select()
        .single();

      if (contactError || !contact) {
        skipped++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      const { data: existingLead } = await supabase
        .from("inbox_leads")
        .select("id")
        .eq("business_id", businessId)
        .eq("contact_id", contact.id)
        .maybeSingle();

      if (!existingLead) {
        await supabase.from("inbox_leads").insert({
          business_id: businessId,
          contact_id: contact.id,
          stage_id: firstStage?.id ?? null,
          source: "import",
          title: name || waNumber,
          value,
        });
        created++;
      } else {
        skipped++;
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setImporting(false);
    setResult({ created, skipped });
    onImported();
  }

  function handleClose() {
    setRows([]);
    setHeaders([]);
    setMapping({});
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Import leads from CSV</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Imported {result.created} new lead{result.created === 1 ? "" : "s"}
            {result.skipped > 0 ? ` (${result.skipped} skipped — missing/invalid phone or already imported)` : ""}.
          </Alert>
        )}

        {headers.length === 0 ? (
          <Box sx={{ py: 2 }}>
            <Button variant="outlined" component="label">
              Choose CSV file
              <input type="file" accept=".csv" hidden onChange={handleFile} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Needs at least a phone/WhatsApp number column. Name and deal value are optional.
            </Typography>
          </Box>
        ) : (
          <>
            <Stack spacing={2} sx={{ my: 2 }}>
              {MAPPABLE_FIELDS.map((field) => (
                <TextField
                  key={field}
                  select
                  size="small"
                  label={field === "wa_number" ? "WhatsApp number column *" : `${field} column`}
                  value={mapping[field] ?? ""}
                  onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">— Not mapped —</MenuItem>
                  {headers.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </TextField>
              ))}
            </Stack>

            <Typography variant="caption" color="text.secondary">Preview (first 3 rows)</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>{headers.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(0, 3).map((r, i) => (
                  <TableRow key={i}>{headers.map((h) => <TableCell key={h}>{r[h]}</TableCell>)}</TableRow>
                ))}
              </TableBody>
            </Table>

            {importing && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{result ? "Done" : "Cancel"}</Button>
        {headers.length > 0 && !result && (
          <Button variant="contained" onClick={runImport} disabled={importing}>
            {importing ? `Importing… ${progress}%` : `Import ${rows.length} rows`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
