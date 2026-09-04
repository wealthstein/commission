"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Paper, Stack, Chip, CircularProgress, IconButton } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

export default function PipelinePage() {
  const { business } = useCurrentBusiness();
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();

    const [{ data: stageRows }, { data: leadRows }] = await Promise.all([
      supabase.from("inbox_pipeline_stages").select("*").eq("business_id", business.id).order("position"),
      supabase
        .from("inbox_leads")
        .select("*, contact:inbox_contacts(name, wa_number)")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
    ]);

    setStages(stageRows || []);
    setLeads(leadRows || []);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  async function moveToNextStage(lead) {
    const currentIndex = stages.findIndex((s) => s.id === lead.stage_id);
    const next = stages[currentIndex + 1];
    if (!next) return;
    const supabase = createClient();
    await supabase.from("inbox_leads").update({ stage_id: next.id }).eq("id", lead.id);
    await supabase.from("inbox_lead_activities").insert({
      business_id: business.id,
      lead_id: lead.id,
      type: "stage_change",
      body: `Moved to ${next.name}`,
    });
    load();
  }

  if (loading || !business) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Track WhatsApp conversations through to a closed deal." />
      <Box sx={{ overflowX: "auto" }}>
        <Stack direction="row" spacing={2} sx={{ pb: 2 }}>
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage_id === stage.id);
            const totalValue = stageLeads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);
            return (
              <Paper
                key={stage.id}
                elevation={0}
                sx={{ width: 260, flexShrink: 0, bgcolor: tokens.canvas, border: `1px solid ${tokens.border}` }}
              >
                <Box sx={{ p: 1.5, borderBottom: `1px solid ${tokens.border}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700}>{stage.name}</Typography>
                    <Chip label={stageLeads.length} size="small" />
                  </Stack>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>${totalValue.toLocaleString()}</Typography>
                </Box>

                <Stack spacing={1} sx={{ p: 1, minHeight: 80 }}>
                  {stageLeads.map((lead) => (
                    <Paper key={lead.id} elevation={0} sx={{ p: 1.25, border: `1px solid ${tokens.border}`, bgcolor: tokens.paper }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {lead.contact?.name || lead.contact?.wa_number || lead.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            ${Number(lead.value ?? 0).toLocaleString()} · {lead.source}
                          </Typography>
                        </Box>
                        {!stage.is_won && !stage.is_lost && (
                          <IconButton size="small" onClick={() => moveToNextStage(lead)} aria-label={`Move ${lead.contact?.name || lead.contact?.wa_number || "lead"} to next stage`}>
                            <ArrowForwardRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </>
  );
}
