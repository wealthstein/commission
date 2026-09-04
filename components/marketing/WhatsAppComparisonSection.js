"use client";

import { Box, Container, Typography, Grid, Paper, Stack } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { tokens } from "@/lib/theme";

// Figures below are widely-cited industry benchmarks (Meta/Twilio business
// messaging reports, Mailchimp/Campaign Monitor email benchmarks,
// Mobilesquared WhatsApp research) - not a single rigorously independent
// study, and flagged as such rather than presented as precise proprietary
// data. Deliberately honest about where WhatsApp's real edge is: SMS opens
// are genuinely comparable, so the comparison leans on conversation
// quality, cost, and reach rather than overclaiming on every axis.
const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", highlight: true },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "call", label: "Phone calls" },
  { key: "social", label: "Social DMs" },
];

const ROWS = [
  {
    label: "Typically read within minutes",
    values: { whatsapp: true, email: false, sms: true, call: null, social: false },
  },
  {
    label: "Real two-way conversation",
    values: { whatsapp: true, email: true, sms: false, call: true, social: true },
  },
  {
    label: "Photos, docs & voice notes",
    values: { whatsapp: true, email: true, sms: false, call: false, social: true },
  },
  {
    label: "Doesn't need both sides free at once",
    values: { whatsapp: true, email: true, sms: true, call: false, social: true },
  },
  {
    label: "Reaches customers without an algorithm gatekeeping it",
    values: { whatsapp: true, email: true, sms: true, call: true, social: false },
  },
  {
    label: "One thread your whole team can see and reply from",
    values: { whatsapp: true, email: null, sms: false, call: false, social: false },
  },
];

function Cell({ value }) {
  if (value === true) return <CheckRoundedIcon sx={{ fontSize: 20, color: tokens.success }} />;
  if (value === false) return <CloseRoundedIcon sx={{ fontSize: 20, color: tokens.muted, opacity: 0.5 }} />;
  return <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 12 }}>Depends</Typography>;
}

export function WhatsAppComparisonTable() {
  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 640 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1.6fr repeat(5, 1fr)", bgcolor: "#F7F6F2", px: 2, py: 1.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted }}>CAPABILITY</Typography>
            {CHANNELS.map((c) => (
              <Typography
                key={c.key}
                variant="caption"
                fontWeight={700}
                sx={{ color: c.highlight ? tokens.brandInk : tokens.muted, textAlign: "center" }}
              >
                {c.label.toUpperCase()}
              </Typography>
            ))}
          </Box>
          {ROWS.map((row) => (
            <Box
              key={row.label}
              sx={{ display: "grid", gridTemplateColumns: "1.6fr repeat(5, 1fr)", px: 2, py: 1.75, borderTop: `1px solid ${tokens.border}`, alignItems: "center" }}
            >
              <Typography variant="body2" fontWeight={600}>{row.label}</Typography>
              {CHANNELS.map((c) => (
                <Box key={c.key} sx={{ display: "flex", justifyContent: "center" }}>
                  <Cell value={row.values[c.key]} />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

const STATS = [
  { stat: "98%", label: "WhatsApp messages are typically opened", note: "vs ~21% for email (Mailchimp/Campaign Monitor benchmarks)" },
  { stat: "45–60%", label: "Reply rate on WhatsApp business messages", note: "vs 6–8% on email (Twilio Business Messaging Report)" },
  { stat: "Minutes", label: "Typical time to first read", note: "vs 6+ hours average for email" },
];

export function WhatsAppStatsRow() {
  return (
    <Grid container spacing={2}>
      {STATS.map((s) => (
        <Grid item xs={12} sm={4} key={s.label}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: { xs: 32, md: 40 }, fontWeight: 700, color: tokens.brandInk, lineHeight: 1 }}>
              {s.stat}
            </Typography>
            <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>{s.note}</Typography>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
}

export default function WhatsAppComparisonSection({ bgcolor = tokens.paper, ctaButton }) {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 5, maxWidth: 620 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1.5 }}>
            Why WhatsApp wins the conversation
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.muted }}>
            SMS gets opened fast too — but it can't hold a real back-and-forth, send a photo, or let two teammates
            pick up the same thread. Email is searchable and async, but customers leave it unread for hours. WhatsApp
            is the one channel that's fast, two-way, rich, and already open on their phone.
          </Typography>
        </Box>

        <Box sx={{ mb: 5 }}>
          <WhatsAppStatsRow />
        </Box>

        <WhatsAppComparisonTable />

        {ctaButton && <Box sx={{ mt: 4, textAlign: "center" }}>{ctaButton}</Box>}
      </Container>
    </Box>
  );
}
