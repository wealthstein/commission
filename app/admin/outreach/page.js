"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Alert,
  Stack,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { tokens } from "@/lib/theme";

/**
 * Parses pasted spreadsheet-style text into structured rows. Tries tab
 * separation first (what pasting from Google Sheets/Excel produces as
 * plain text), falling back to comma if a line doesn't have enough tabs -
 * covers both "pasted from a spreadsheet" and "pasted a CSV" without
 * requiring the admin to pick a format up front.
 *
 * Expected column order per line: first name, last name, email, contact type.
 */
function parseLeadsText(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let parts = line.split("\t").map((p) => p.trim());
      if (parts.length < 3) parts = line.split(",").map((p) => p.trim());
      const [firstName = "", lastName = "", email = "", contactType = ""] = parts;
      return { firstName, lastName, email, contactType };
    });
}

export default function AdminOutreachPage() {
  const [secret, setSecret] = useState("");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null, result: null });

  function handleParse() {
    setRows(parseLeadsText(rawText));
    setStatus({ loading: false, error: null, result: null });
  }

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setStatus({ loading: true, error: null, result: null });
    try {
      const res = await fetch("/api/admin/outreach-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, contacts: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus({ loading: false, error: null, result: data });
      setRows([]);
      setRawText("");
    } catch (err) {
      setStatus({ loading: false, error: err.message, result: null });
    }
  }

  const validRowCount = rows.filter((r) => r.email && r.email.includes("@")).length;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Add outreach contacts
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 4 }}>
        Paste leads below (first name, last name, email, contact type - tab or comma-separated, one per line). Submit
        in whatever batch size makes sense - there is no fixed limit here, so 25 now and 15 later works fine.
      </Typography>

      <TextField
        label="Admin secret"
        type="password"
        fullWidth
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TextField
        label="Paste leads here"
        placeholder={"Ada\tLovelace\tada@example.com\tCommercial Bank\nTunde\tBello\ttunde@example.com\tReal Estate Developer"}
        multiline
        minRows={6}
        fullWidth
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        sx={{ mb: 2, fontFamily: "monospace" }}
      />

      <Button variant="outlined" onClick={handleParse} disabled={!rawText.trim()} sx={{ mb: 4 }}>
        Parse into table
      </Button>

      {rows.length > 0 && (
        <>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 1.5 }}>
            {rows.length} row{rows.length === 1 ? "" : "s"} parsed, {validRowCount} with a valid-looking email. Edit
            any cell directly before submitting.
          </Typography>
          <Table size="small" sx={{ mb: 3, border: `1px solid ${tokens.border}` }}>
            <TableHead>
              <TableRow>
                <TableCell>First name</TableCell>
                <TableCell>Last name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Contact type</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {["firstName", "lastName", "email", "contactType"].map((field) => (
                    <TableCell key={field}>
                      <TextField
                        variant="standard"
                        fullWidth
                        value={row[field]}
                        onChange={(e) => updateRow(i, field, e.target.value)}
                        error={field === "email" && row.email && !row.email.includes("@")}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton size="small" onClick={() => removeRow(i)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={status.loading || !secret || validRowCount === 0}
            >
              {status.loading ? "Submitting…" : `Submit ${validRowCount} contact${validRowCount === 1 ? "" : "s"}`}
            </Button>
          </Stack>
        </>
      )}

      {status.error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {status.error}
        </Alert>
      )}
      {status.result && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Inserted {status.result.inserted} of {status.result.submitted} submitted
          {status.result.skippedDuplicates > 0 ? ` (${status.result.skippedDuplicates} already existed, skipped)` : ""}.
          They&apos;ll get the first email on the next cron run.
        </Alert>
      )}

      <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${tokens.border}` }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          Internal tool - not linked from anywhere on the public site. Protected only by the shared secret above, not
          real admin auth, so don&apos;t share this page&apos;s URL outside the team.
        </Typography>
      </Box>
    </Container>
  );
}
