"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Avatar, Chip, Divider } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { tokens } from "@/lib/theme";

// Small enough (fixed height, no scroll container of its own, no refs) that
// looping this in the background is safe - it's the InboxDemoIllustration's
// old perpetual-loop + scrollIntoView combination that caused the page-
// scroll bug, not looping itself. This widget never calls scrollIntoView
// or holds a ref to anything, so it has no way to affect the page around it.
const STEPS = {
  MESSAGE_IN: 300,
  TYPING: 1000,
  REPLY_SENT: 1900,
  TICK_DELIVERED: 2450,
  TICK_READ: 3000,
  PIPELINE_CHIP: 3500,
};
const LOOP_MS = 5200;

export default function InboxHeroDemo() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setPhase(0);
      Object.values(STEPS).forEach((delay, i) => {
        timers.push(setTimeout(() => !cancelled && setPhase(i + 1), delay));
      });
      timers.push(setTimeout(() => !cancelled && run(), LOOP_MS));
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const showMessage = phase >= 1;
  const showTyping = phase === 2;
  const showReply = phase >= 3;
  const tickState = phase >= 5 ? "read" : phase >= 4 ? "delivered" : "sent";
  const showPipelineChip = phase >= 6;

  return (
    <Box sx={{ p: 3, minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "center" }} aria-hidden="true">
      <Stack spacing={1.25}>
        <Box sx={{ minHeight: 44, opacity: showMessage ? 1 : 0, transform: showMessage ? "translateY(0)" : "translateY(6px)", transition: "all 250ms ease-out" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Avatar sx={{ width: 24, height: 24, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 11 }}>A</Avatar>
            <Box sx={{ bgcolor: tokens.paper, border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.75, maxWidth: "80%" }}>
              <Typography variant="body2" sx={{ fontSize: 13 }}>Is this still available?</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ minHeight: 44 }}>
          {showTyping && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.9, display: "flex", gap: 0.5 }}>
                {[0, 1, 2].map((d) => (
                  <Box
                    key={d}
                    sx={{
                      width: 4, height: 4, borderRadius: "50%", bgcolor: tokens.muted,
                      animation: "heroTyping 1s ease-in-out infinite",
                      animationDelay: `${d * 0.15}s`,
                      "@keyframes heroTyping": { "0%, 60%, 100%": { opacity: 0.3 }, "30%": { opacity: 1 } },
                    }}
                  />
                ))}
              </Box>
            </Stack>
          )}
          {showReply && (
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="flex-end">
              <Box
                sx={{
                  bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.75, maxWidth: "80%",
                  animation: "heroPop 220ms ease-out",
                  "@keyframes heroPop": { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: 13 }}>Yes! Ready to ship today.</Typography>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.25 }}>
                  {tickState === "read" ? (
                    <DoneAllIcon sx={{ fontSize: 13, color: "#53bdeb" }} />
                  ) : tickState === "delivered" ? (
                    <DoneAllIcon sx={{ fontSize: 13, color: tokens.muted }} />
                  ) : (
                    <DoneIcon sx={{ fontSize: 13, color: tokens.muted }} />
                  )}
                </Stack>
              </Box>
              <Avatar sx={{ width: 24, height: 24, bgcolor: "#8E5CE8", color: "#fff", fontWeight: 700, fontSize: 11 }}>C</Avatar>
            </Stack>
          )}
        </Box>

        <Box sx={{ minHeight: 26, textAlign: "center" }}>
          {showPipelineChip && (
            <Chip
              label="Added to Pipeline · New Lead"
              size="small"
              sx={{
                bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 11,
                animation: "heroPop 220ms ease-out",
              }}
            />
          )}
        </Box>
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      <Stack spacing={1.5}>
        {[
          { icon: GroupsRoundedIcon, title: "Whole team, one inbox", body: "Every teammate sees every conversation" },
          { icon: BoltRoundedIcon, title: "Instant routing", body: "New chats assigned the moment they land" },
          { icon: WhatsAppIcon, title: "No API, no waiting", body: "Connect like WhatsApp Web - live in minutes" },
        ].map((f) => (
          <Stack key={f.title} direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ bgcolor: tokens.brand, borderRadius: 2, p: 0.75, display: "flex", flexShrink: 0 }}>
              <f.icon sx={{ fontSize: 16, color: tokens.brandInk }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ fontSize: 13 }}>{f.title}</Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>{f.body}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
