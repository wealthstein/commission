"use client";

import { useState } from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";
import { NewLeadStage, ContactedStage, QualifiedStage, NegotiationStage, WonStage } from "@/components/marketing/InboxPipelineStageIllustrations";

const STAGES = [
  {
    title: "New Lead",
    body: "A conversation gets added to the pipeline with one click, right from the chat - no separate form to fill in.",
    Illustration: NewLeadStage,
  },
  {
    title: "Contacted",
    body: "You've replied. Set a follow-up reminder in the same click so the conversation doesn't go quiet on your end.",
    Illustration: ContactedStage,
  },
  {
    title: "Qualified",
    body: "Need and budget are confirmed - this is a real deal, not just a question.",
    Illustration: QualifiedStage,
  },
  {
    title: "Negotiation",
    body: "Price and terms get worked out in the same WhatsApp thread you've been replying from the whole time.",
    Illustration: NegotiationStage,
  },
  {
    title: "Won",
    body: "Deal closed. It shows up in Insights as real, attributed pipeline value.",
    Illustration: WonStage,
  },
];

export default function PipelineStageExplorer() {
  const [selected, setSelected] = useState(0);
  const stage = STAGES[selected];
  const Illustration = stage.Illustration;

  return (
    <Paper
      variant="outlined"
      sx={{ mt: 6, borderColor: tokens.border, borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: { xs: "column", md: "row" } }}
    >
      <Box sx={{ width: { xs: "100%", md: 220 }, borderRight: { md: `1px solid ${tokens.border}` }, borderBottom: { xs: `1px solid ${tokens.border}`, md: "none" }, bgcolor: "#FAFAF8", flexShrink: 0 }}>
        {STAGES.map((s, i) => {
          const active = i === selected;
          return (
            <Stack
              key={s.title}
              direction="row"
              spacing={1.5}
              alignItems="center"
              onClick={() => setSelected(i)}
              sx={{
                px: 2, py: 1.5, cursor: "pointer",
                borderLeft: { md: `3px solid ${active ? tokens.brand : "transparent"}` },
                borderBottom: { xs: `3px solid ${active ? tokens.brand : "transparent"}`, md: `1px solid ${tokens.border}` },
                bgcolor: active ? tokens.paper : "transparent",
                "&:hover": { bgcolor: active ? tokens.paper : "#F0EEE8" },
              }}
            >
              <Box
                sx={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  bgcolor: active ? tokens.brand : tokens.canvas,
                  color: active ? tokens.brandInk : tokens.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12,
                }}
              >
                {i + 1}
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: active ? tokens.ink : tokens.muted }} noWrap>
                {s.title}
              </Typography>
            </Stack>
          );
        })}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${tokens.border}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 28, height: 28, borderRadius: "50%", bgcolor: tokens.brand, color: tokens.brandInk,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}
            >
              {selected + 1}
            </Box>
            <Typography variant="h6" fontWeight={700}>{stage.title}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: tokens.muted }}>{stage.body}</Typography>
        </Box>

        <Illustration />
      </Box>
    </Paper>
  );
}
