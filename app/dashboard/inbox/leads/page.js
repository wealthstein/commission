"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Button } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import CsvImportModal from "@/components/dashboard/inbox/CsvImportModal";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

export default function InboxLeadsPage() {
  const { business } = useCurrentBusiness();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_leads")
      .select("*, contact:inbox_contacts(name, wa_number), inbox_pipeline_stages(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, [business]);

  useEffect(() => { load(); }, [load]);

  if (loading || !business) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Everyone who's reached out on WhatsApp, in one list."
        action={
          <Button startIcon={<UploadFileRoundedIcon />} variant="outlined" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
        }
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Stage</TableCell>
            <TableCell>Source</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} hover>
              <TableCell>{lead.contact?.name || "—"}</TableCell>
              <TableCell>{lead.contact?.wa_number}</TableCell>
              <TableCell><Chip size="small" label={lead.inbox_pipeline_stages?.name ?? "Unassigned"} /></TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>{lead.source}</TableCell>
              <TableCell align="right">${Number(lead.value ?? 0).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography sx={{ color: tokens.muted, py: 3, textAlign: "center" }}>
                  No leads yet. Add someone to the pipeline from a chat in Inbox, or import a CSV.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        businessId={business.id}
        onImported={load}
      />
    </>
  );
}
