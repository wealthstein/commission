"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Chip, Checkbox, Avatar } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { tokens } from "@/lib/theme";
import { avatarColorForName } from "@/components/marketing/inboxAvatarColors";

function StageCard({ children, height = 240 }) {
  return (
    <Box sx={{ height, p: 2.5, display: "flex", flexDirection: "column", justifyContent: "center" }} aria-hidden="true">
      {children}
    </Box>
  );
}

function useLoop(delays, totalMs) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setStep(0);
      delays.forEach((delay, i) => timers.push(setTimeout(() => !cancelled && setStep(i + 1), delay)));
      timers.push(setTimeout(() => !cancelled && run(), totalMs));
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return step;
}

export function AffiliateReferralStage() {
  // 0 idle, 1 affiliate shares link, 2 customer clicks through
  const step = useLoop([300, 1500], 4000);

  return (
    <StageCard>
      <Stack spacing={2.5} alignItems="center">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ opacity: step >= 1 ? 1 : 0, transition: "opacity 250ms" }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColorForName("Kemi").bg, color: avatarColorForName("Kemi").text, fontWeight: 700, fontSize: 13 }}>K</Avatar>
          <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>Kemi (affiliate) shared</Typography>
            <Typography variant="body2" fontWeight={600}>commission.ng/r/kemi-a4f2</Typography>
          </Box>
        </Stack>

        <Box sx={{ minHeight: 32, textAlign: "center" }}>
          {step >= 2 && (
            <Chip
              label="Customer clicked through"
              size="small"
              sx={{ bgcolor: tokens.canvas, fontWeight: 700, fontSize: 11, animation: "stagePop 220ms ease-out", "@keyframes stagePop": { from: { opacity: 0, transform: "scale(0.9)" }, to: { opacity: 1, transform: "scale(1)" } } }}
            />
          )}
        </Box>
      </Stack>
    </StageCard>
  );
}

export function MessagesYouStage() {
  // 0 idle, 1 message sent, 2 arrives in Inbox
  const step = useLoop([300, 1500], 4000);

  return (
    <StageCard>
      <Stack spacing={2.5} alignItems="center">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(-6px)", transition: "all 250ms" }}
        >
          <WhatsAppIcon sx={{ color: tokens.success, fontSize: 20 }} />
          <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1, bgcolor: tokens.canvas }}>
            <Typography variant="body2" fontWeight={600}>&quot;Hi, is this still available?&quot;</Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            width: "100%", border: `2px solid ${step >= 2 ? tokens.brand : "transparent"}`, borderRadius: 2, px: 1.5, py: 1,
            bgcolor: step >= 2 ? "#FFF9E5" : "transparent",
            opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "scale(1)" : "scale(0.95)",
            transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ color: tokens.brandInk }}>Arrived in Inbox</Typography>
          <Typography variant="caption" sx={{ color: tokens.muted }}>Visible to your whole team</Typography>
        </Box>
      </Stack>
    </StageCard>
  );
}

export function NewLeadStage() {
  const step = useLoop([300, 1300, 1900], 4000);

  return (
    <StageCard>
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            opacity: step >= 1 ? 1 : 0, transition: "opacity 250ms",
            border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1, width: "100%", bgcolor: tokens.canvas,
          }}
        >
          <Typography variant="caption" sx={{ color: tokens.muted }}>Amaka Okafor</Typography>
          <Typography variant="body2" fontWeight={600}>&quot;Is this still available?&quot;</Typography>
        </Box>

        <Box sx={{ position: "relative", height: 28, width: "100%", display: "flex", justifyContent: "center" }}>
          <Typography
            variant="caption"
            sx={{
              opacity: step === 2 ? 1 : 0, transition: "opacity 200ms",
              bgcolor: tokens.ink, color: "#fff", px: 1, py: 0.4, borderRadius: 3, fontWeight: 700,
            }}
          >
            + Add to pipeline
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%", border: `2px solid ${step >= 3 ? tokens.brand : "transparent"}`, borderRadius: 2, px: 1.5, py: 1,
            bgcolor: step >= 3 ? "#FFF9E5" : "transparent",
            opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "scale(1)" : "scale(0.95)",
            transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk }}>NEW LEAD</Typography>
          <Typography variant="body2" fontWeight={600}>Amaka Okafor</Typography>
        </Box>
      </Stack>
    </StageCard>
  );
}

export function ContactedStage() {
  const step = useLoop([300, 1200, 1900], 4000);

  return (
    <StageCard>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="flex-end">
          <Box
            sx={{
              opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(6px)", transition: "all 250ms",
              bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1, maxWidth: "80%",
            }}
          >
            <Typography variant="body2">Yes it&apos;s available! ₦28,500, ready today</Typography>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.25 }}>
              {step >= 2 ? <DoneAllIcon sx={{ fontSize: 13, color: "#53bdeb" }} /> : <DoneIcon sx={{ fontSize: 13, color: tokens.muted }} />}
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ textAlign: "center", minHeight: 32 }}>
          {step >= 3 && (
            <Chip
              label="Follow-up set · Tomorrow 10:00 AM"
              size="small"
              sx={{ bgcolor: tokens.canvas, fontWeight: 700, fontSize: 11, animation: "stagePop 220ms ease-out", "@keyframes stagePop": { from: { opacity: 0, transform: "scale(0.9)" }, to: { opacity: 1, transform: "scale(1)" } } }}
            />
          )}
        </Box>
      </Stack>
    </StageCard>
  );
}

export function QualifiedStage() {
  const step = useLoop([300, 1100, 1900], 4000);
  const items = [
    { label: "Need confirmed", at: 1 },
    { label: "Budget confirmed", at: 2 },
  ];

  return (
    <StageCard>
      <Stack spacing={1.5}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" spacing={1} alignItems="center">
            <Checkbox checked={step >= item.at} size="small" sx={{ p: 0 }} readOnly />
            <Typography variant="body2" fontWeight={600} sx={{ color: step >= item.at ? tokens.ink : tokens.muted }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
        <Box sx={{ textAlign: "center", minHeight: 32, mt: 1 }}>
          {step >= 3 && (
            <Chip
              label="Deal value: ₦28,500"
              size="small"
              sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 11, animation: "stagePop 220ms ease-out", "@keyframes stagePop": { from: { opacity: 0, transform: "scale(0.9)" }, to: { opacity: 1, transform: "scale(1)" } } }}
            />
          )}
        </Box>
      </Stack>
    </StageCard>
  );
}

export function NegotiationStage() {
  const step = useLoop([400, 1700], 4000);

  return (
    <StageCard>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="flex-start" sx={{ opacity: step >= 1 ? 1 : 0, transition: "opacity 250ms" }}>
          <Box sx={{ bgcolor: tokens.paper, border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1, maxWidth: "75%" }}>
            <Typography variant="body2">Any chance of ₦25,000 if I take two?</Typography>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" sx={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(6px)", transition: "all 250ms" }}>
          <Box sx={{ bgcolor: "#FFF4CC", border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1, maxWidth: "75%" }}>
            <Typography variant="body2">I can do ₦26,000 each for two - deal?</Typography>
          </Box>
        </Stack>
      </Stack>
    </StageCard>
  );
}

export function WonStage() {
  const step = useLoop([300, 1400], 4200);

  return (
    <StageCard>
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: "100%", border: `2px solid ${step >= 1 ? tokens.success : tokens.border}`, borderRadius: 2, px: 1.5, py: 1,
            bgcolor: step >= 1 ? "#EAF6F1" : "transparent",
            transition: "all 300ms ease-out",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: step >= 1 ? tokens.success : tokens.muted }}>WON</Typography>
              <Typography variant="body2" fontWeight={600}>Amaka Okafor</Typography>
            </Box>
            {step >= 1 && (
              <EmojiEventsRoundedIcon sx={{ color: tokens.success, animation: "stagePop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)", "@keyframes stagePop": { from: { opacity: 0, transform: "scale(0.5)" }, to: { opacity: 1, transform: "scale(1)" } } }} />
            )}
          </Stack>
        </Box>

        <Box sx={{ textAlign: "center", minHeight: 30 }}>
          {step >= 2 && (
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: tokens.success, animation: "stagePop 250ms ease-out", "@keyframes stagePop": { from: { opacity: 0 }, to: { opacity: 1 } } }}
            >
              +₦28,500 added to Insights
            </Typography>
          )}
        </Box>
      </Stack>
    </StageCard>
  );
}
