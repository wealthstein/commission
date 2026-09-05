"use client";

import { Box, Typography, Stack, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";
import { JOURNEY_NODES } from "@/components/marketing/InboxJourneyMap";
import {
  AffiliateReferralStage, MessagesYouStage, NewLeadStage,
  ContactedStage, QualifiedStage, NegotiationStage, WonStage,
} from "@/components/marketing/InboxPipelineStageIllustrations";

const ILLUSTRATIONS = [
  AffiliateReferralStage, MessagesYouStage, NewLeadStage,
  ContactedStage, QualifiedStage, NegotiationStage, WonStage,
];

export default function InboxJourneyDetail({ selectedIndex }) {
  const node = JOURNEY_NODES[selectedIndex];
  const Illustration = ILLUSTRATIONS[selectedIndex];

  return (
    <Paper variant="outlined" sx={{ mt: 4, borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ p: 3, borderBottom: `1px solid ${tokens.border}` }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: "50%", bgcolor: tokens.brand, color: tokens.brandInk,
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}
          >
            {selectedIndex + 1}
          </Box>
          <Typography variant="h6" fontWeight={700}>{node.label}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: tokens.muted }}>{node.body}</Typography>
      </Box>

      <Illustration />
    </Paper>
  );
}
