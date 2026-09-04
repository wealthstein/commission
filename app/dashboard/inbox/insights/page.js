"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

function StatCard({ label, value }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${tokens.border}` }}>
      <Typography variant="body2" sx={{ color: tokens.muted }}>{label}</Typography>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

export default function InboxInsightsPage() {
  const { business } = useCurrentBusiness();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();

    const [{ count: openConvos }, { data: leads }, { data: stages }, { count: openTasks }] = await Promise.all([
      supabase.from("inbox_conversations").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "open"),
      supabase.from("inbox_leads").select("value, stage_id").eq("business_id", business.id),
      supabase.from("inbox_pipeline_stages").select("id, name, is_won").eq("business_id", business.id).order("position"),
      supabase.from("inbox_tasks").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "open"),
    ]);

    const wonStageIds = new Set((stages || []).filter((s) => s.is_won).map((s) => s.id));
    const wonValue = (leads || []).filter((l) => wonStageIds.has(l.stage_id)).reduce((s, l) => s + Number(l.value ?? 0), 0);
    const pipelineValue = (leads || []).reduce((s, l) => s + Number(l.value ?? 0), 0);

    const byStage = (stages || []).map((stage) => ({
      name: stage.name,
      value: (leads || []).filter((l) => l.stage_id === stage.id).reduce((s, l) => s + Number(l.value ?? 0), 0),
    }));

    setData({
      openConvos: openConvos ?? 0,
      openTasks: openTasks ?? 0,
      totalLeads: (leads || []).length,
      wonValue,
      pipelineValue,
      byStage,
    });
    setLoading(false);
  }, [business]);

  useEffect(() => { load(); }, [load]);

  if (loading || !business || !data) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  const maxBar = Math.max(1, ...data.byStage.map((s) => s.value));

  return (
    <>
      <PageHeader title="Insights" subtitle="How the pipeline is moving." />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Open conversations" value={data.openConvos} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Total leads" value={data.totalLeads} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Pipeline value" value={`$${data.pipelineValue.toLocaleString()}`} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Won value" value={`$${data.wonValue.toLocaleString()}`} /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Value by stage</Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, height: 200 }}>
          {data.byStage.map((stage) => (
            <Box key={stage.name} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <Typography variant="caption" sx={{ color: tokens.muted, mb: 0.5 }}>${stage.value.toLocaleString()}</Typography>
              <Box sx={{ width: "70%", height: `${Math.max(4, (stage.value / maxBar) * 100)}%`, bgcolor: tokens.brand, borderRadius: "4px 4px 0 0" }} />
              <Typography variant="caption" sx={{ mt: 1, textAlign: "center" }}>{stage.name}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </>
  );
}
