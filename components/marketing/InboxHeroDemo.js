"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Avatar } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { tokens } from "@/lib/theme";
import { avatarColorForName } from "@/components/marketing/inboxAvatarColors";

// Fixed height, no refs, no scroll container of its own - safe to loop in
// the background (see InboxDemoIllustration.js's history for why that
// combination specifically, not looping itself, was the actual bug).
const STAGES = ["New Lead", "Contacted", "Qualified", "Negotiation", "Won"];

// Each stage's caption explicitly ties it back to the conversation above -
// the whole point of this animation is showing the chat CAUSING the
// pipeline to move, not two separate things stacked on top of each other.
const STAGE_CAPTIONS = [
  "\u2192 Added to the pipeline from this chat",
  "\u2192 First reply logged automatically",
  "\u2192 Budget & need confirmed in this thread",
  "\u2192 Price agreed: \u20a628,500",
  "\u2192 Deal closed - tracked in Insights",
];

const STEPS = {
  MSG1_IN: 300,
  MSG1_TYPING: 1000,
  MSG1_REPLY: 1900,
  MSG1_DELIVERED: 2450,
  MSG1_READ: 3000,
  STAGE_NEW_LEAD: 3500,
  MSG2_IN: 4400,
  MSG2_TYPING: 5100,
  MSG2_REPLY: 5800,
  MSG2_DELIVERED: 6300,
  MSG2_READ: 6800,
  STAGE_CONTACTED: 7300,
  STAGE_QUALIFIED: 8900,
  STAGE_NEGOTIATION: 10500,
  STAGE_WON: 12100,
};
const LOOP_MS = 14800;

export default function InboxHeroDemo() {
  const [phase, setPhase] = useState(0);
  const keys = Object.keys(STEPS);

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

  const at = (key) => phase >= keys.indexOf(key) + 1;
  const msg1Ticks = at("MSG1_READ") ? "read" : at("MSG1_DELIVERED") ? "delivered" : "sent";
  const msg2Ticks = at("MSG2_READ") ? "read" : at("MSG2_DELIVERED") ? "delivered" : "sent";

  const stageIndex = at("STAGE_WON") ? 4 : at("STAGE_NEGOTIATION") ? 3 : at("STAGE_QUALIFIED") ? 2 : at("STAGE_CONTACTED") ? 1 : at("STAGE_NEW_LEAD") ? 0 : -1;

  function TickIcon({ state }) {
    if (state === "read") return <DoneAllIcon sx={{ fontSize: 13, color: "#53bdeb" }} />;
    if (state === "delivered") return <DoneAllIcon sx={{ fontSize: 13, color: tokens.muted }} />;
    return <DoneIcon sx={{ fontSize: 13, color: tokens.muted }} />;
  }

  return (
    <Box sx={{ p: 3, height: "100%", minHeight: 400, display: "flex", flexDirection: "column", justifyContent: "center" }} aria-hidden="true">
      <Stack spacing={1}>
        <Box sx={{ minHeight: 40, opacity: at("MSG1_IN") ? 1 : 0, transform: at("MSG1_IN") ? "translateY(0)" : "translateY(6px)", transition: "all 250ms ease-out" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Avatar sx={{ width: 22, height: 22, bgcolor: avatarColorForName("Amaka Okafor").bg, color: avatarColorForName("Amaka Okafor").text, fontWeight: 700, fontSize: 10 }}>A</Avatar>
            <Box sx={{ bgcolor: tokens.paper, border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.7, maxWidth: "80%" }}>
              <Typography variant="body2" sx={{ fontSize: 12.5 }}>Is this still available?</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ minHeight: 40 }}>
          {phase >= keys.indexOf("MSG1_TYPING") + 1 && phase < keys.indexOf("MSG1_REPLY") + 1 && (
            <Stack direction="row" justifyContent="flex-end">
              <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.8, display: "flex", gap: 0.5 }}>
                {[0, 1, 2].map((d) => (
                  <Box key={d} sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: tokens.muted, animation: "heroTyping 1s ease-in-out infinite", animationDelay: `${d * 0.15}s`, "@keyframes heroTyping": { "0%, 60%, 100%": { opacity: 0.3 }, "30%": { opacity: 1 } } }} />
                ))}
              </Box>
            </Stack>
          )}
          {at("MSG1_REPLY") && (
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="flex-end">
              <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.7, maxWidth: "80%", animation: "heroPop 220ms ease-out", "@keyframes heroPop": { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } } }}>
                <Typography variant="body2" sx={{ fontSize: 12.5 }}>Yes! Ready to ship today.</Typography>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.25 }}><TickIcon state={msg1Ticks} /></Stack>
              </Box>
              <Avatar sx={{ width: 22, height: 22, bgcolor: avatarColorForName("Chidinma Eze").bg, color: avatarColorForName("Chidinma Eze").text, fontWeight: 700, fontSize: 10 }}>C</Avatar>
            </Stack>
          )}
        </Box>

        <Box sx={{ minHeight: 40, opacity: at("MSG2_IN") ? 1 : 0, transform: at("MSG2_IN") ? "translateY(0)" : "translateY(6px)", transition: "all 250ms ease-out" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Avatar sx={{ width: 22, height: 22, bgcolor: avatarColorForName("Amaka Okafor").bg, color: avatarColorForName("Amaka Okafor").text, fontWeight: 700, fontSize: 10 }}>A</Avatar>
            <Box sx={{ bgcolor: tokens.paper, border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.7, maxWidth: "80%" }}>
              <Typography variant="body2" sx={{ fontSize: 12.5 }}>Great, can I pay on delivery?</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ minHeight: 40 }}>
          {phase >= keys.indexOf("MSG2_TYPING") + 1 && phase < keys.indexOf("MSG2_REPLY") + 1 && (
            <Stack direction="row" justifyContent="flex-end">
              <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.8, display: "flex", gap: 0.5 }}>
                {[0, 1, 2].map((d) => (
                  <Box key={d} sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: tokens.muted, animation: "heroTyping2 1s ease-in-out infinite", animationDelay: `${d * 0.15}s`, "@keyframes heroTyping2": { "0%, 60%, 100%": { opacity: 0.3 }, "30%": { opacity: 1 } } }} />
                ))}
              </Box>
            </Stack>
          )}
          {at("MSG2_REPLY") && (
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="flex-end">
              <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.25, py: 0.7, maxWidth: "80%", animation: "heroPop2 220ms ease-out", "@keyframes heroPop2": { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } } }}>
                <Typography variant="body2" sx={{ fontSize: 12.5 }}>Yes, we deliver within Lagos.</Typography>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.25 }}><TickIcon state={msg2Ticks} /></Stack>
              </Box>
              <Avatar sx={{ width: 22, height: 22, bgcolor: avatarColorForName("Tunde Bakare").bg, color: avatarColorForName("Tunde Bakare").text, fontWeight: 700, fontSize: 10 }}>T</Avatar>
            </Stack>
          )}
        </Box>
      </Stack>

      <Box sx={{ mt: 2.5, opacity: stageIndex >= 0 ? 1 : 0, transition: "opacity 250ms" }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1, textAlign: "center" }}>
          PIPELINE
        </Typography>
        <Stack direction="row" alignItems="flex-start">
          {STAGES.map((label, i) => {
            const reached = i <= stageIndex;
            const isWon = label === "Won";
            return (
              <Box key={label} sx={{ flex: 1, position: "relative", textAlign: "center" }}>
                {i > 0 && (
                  <Box sx={{ position: "absolute", top: 9, left: "-50%", width: "100%", height: 2, bgcolor: i <= stageIndex ? tokens.brand : tokens.border, transition: "background-color 250ms", zIndex: 0 }} />
                )}
                <Box
                  sx={{
                    position: "relative", zIndex: 1, width: 18, height: 18, mx: "auto", borderRadius: "50%",
                    bgcolor: isWon && reached ? tokens.success : reached ? tokens.brand : tokens.canvas,
                    border: `2px solid ${reached ? "transparent" : tokens.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: i === stageIndex ? "scale(1.25)" : "scale(1)",
                    transition: "all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {isWon && reached && <EmojiEventsRoundedIcon sx={{ fontSize: 11, color: "#fff" }} />}
                </Box>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontSize: 9.5, fontWeight: 700, color: reached ? tokens.ink : tokens.muted }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ minHeight: 20, mt: 1.5, textAlign: "center" }}>
          {stageIndex >= 0 && (
            <Typography
              key={stageIndex}
              variant="caption"
              fontWeight={700}
              sx={{
                color: stageIndex === 4 ? tokens.success : tokens.ink,
                animation: "heroCaptionIn 220ms ease-out",
                "@keyframes heroCaptionIn": { from: { opacity: 0, transform: "translateY(-3px)" }, to: { opacity: 1, transform: "translateY(0)" } },
              }}
            >
              {STAGE_CAPTIONS[stageIndex]}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
