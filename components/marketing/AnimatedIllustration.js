"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Fade } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { tokens } from "@/lib/theme";

const SCENARIOS = {
  business: {
    header: "Lead #4521",
    subheader: "Referred by an affiliate",
    steps: ["Checking affiliate track record", "Qualification rate: 82%", "Status: Trusted", "Delivered to your dashboard"],
  },
  affiliate: {
    header: "Referral tracked",
    subheader: "Someone clicked your link",
    steps: ["Interest Form submitted", "Intent Form completed", "Commission earned: \u20a612,000", "Paid to your account"],
  },
};

const STEP_INTERVAL_MS = 1100;
const PAUSE_AT_END_MS = 1800;

export default function AnimatedIllustration({ audience }) {
  const scenario = SCENARIOS[audience] || SCENARIOS.business;
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    function tick(count) {
      if (cancelled) return;
      if (count > scenario.steps.length) {
        timeoutId = setTimeout(() => {
          setVisibleCount(0);
          tick(0);
        }, PAUSE_AT_END_MS);
        return;
      }
      setVisibleCount(count);
      timeoutId = setTimeout(() => tick(count + 1), STEP_INTERVAL_MS);
    }
    tick(0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  return (
    <Box
      sx={{
        maxWidth: 420,
        mx: "auto",
        p: 3,
        borderRadius: 3,
        bgcolor: tokens.paper,
        border: `1px solid ${tokens.border}`,
        textAlign: "left",
      }}
    >
      <Typography fontWeight={700} sx={{ fontSize: 15 }}>
        {scenario.header}
      </Typography>
      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 2.5 }}>
        {scenario.subheader}
      </Typography>

      <Stack spacing={1.5}>
        {scenario.steps.map((step, i) => {
          const isDone = visibleCount > i + 1;
          const isActive = visibleCount === i + 1;
          const isPending = visibleCount <= i;
          return (
            <Stack key={step} direction="row" spacing={1.25} alignItems="center" sx={{ opacity: isPending ? 0.35 : 1, transition: "opacity 0.3s" }}>
              {isActive ? (
                <CircularProgress size={16} thickness={5} sx={{ color: tokens.brandInk, flexShrink: 0 }} />
              ) : isDone ? (
                <Fade in>
                  <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#1D9E75", flexShrink: 0 }} />
                </Fade>
              ) : (
                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: tokens.border, flexShrink: 0 }} />
              )}
              <Typography variant="body2" sx={{ color: isPending ? tokens.muted : tokens.ink, fontWeight: isDone ? 600 : 400 }}>
                {step}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
