"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Avatar, Paper, Checkbox } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { tokens } from "@/lib/theme";

// Shared card shell so all four feature demos read as one family rather
// than four differently-styled widgets.
function DemoCard({ title, children, height = 220 }) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden", height: "100%" }}
      aria-hidden="true"
    >
      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${tokens.border}`, bgcolor: "#FAFAF8" }}>
        <Typography variant="body2" fontWeight={700}>{title}</Typography>
      </Box>
      <Box sx={{ height, p: 2, bgcolor: tokens.paper, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </Box>
    </Paper>
  );
}

function useLoop(steps, totalMs) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setStep(0);
      steps.forEach((delay, i) => {
        timers.push(setTimeout(() => !cancelled && setStep(i + 1), delay));
      });
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

const AGENTS = [
  { name: "Chidinma", color: "#8E5CE8" },
  { name: "Tunde", color: "#2F8AE0" },
  { name: "Bisi", color: tokens.success },
];

export function LeadRoutingDemo() {
  // steps: 0 idle, 1 message arrives, 2 routing pulses, 3 assigned
  const step = useLoop([300, 1400, 2200], 4200);
  const assignedTo = AGENTS[1];

  return (
    <DemoCard title="Smart lead routing">
      <Stack spacing={1.5}>
        <Box
          sx={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(-6px)",
            transition: "all 300ms ease-out",
            border: `1px solid ${tokens.border}`,
            borderRadius: 2,
            px: 1.5, py: 1,
            bgcolor: tokens.canvas,
          }}
        >
          <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>New conversation</Typography>
          <Typography variant="body2" fontWeight={600}>&quot;Do you still have this in stock?&quot;</Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={2} sx={{ py: 0.5 }}>
          {AGENTS.map((a) => {
            const isTarget = a.name === assignedTo.name;
            const active = step >= 2 && isTarget;
            return (
              <Box key={a.name} sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 34, height: 34, mx: "auto", bgcolor: a.color, color: "#fff", fontWeight: 700, fontSize: 13,
                    outline: active ? `3px solid ${tokens.brand}` : "3px solid transparent",
                    outlineOffset: 2,
                    transform: step === 2 && isTarget ? "scale(1.12)" : "scale(1)",
                    transition: "all 300ms ease-out",
                  }}
                >
                  {a.name.charAt(0)}
                </Avatar>
                <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 10 }}>{a.name}</Typography>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ textAlign: "center", height: 22 }}>
          {step >= 3 && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.brandInk, fontWeight: 700, bgcolor: tokens.brand, px: 1, py: 0.25, borderRadius: 3,
                animation: "featurePop 220ms ease-out",
                "@keyframes featurePop": { from: { opacity: 0, transform: "scale(0.9)" }, to: { opacity: 1, transform: "scale(1)" } },
              }}
            >
              Assigned to {assignedTo.name} - online now
            </Typography>
          )}
        </Box>
      </Stack>
    </DemoCard>
  );
}

const TASK = { text: "Follow up with Amaka about the invoice", due: "Tomorrow, 10:00 AM" };

export function TasksDemo() {
  // 0 idle, 1 task appears, 2 checked off
  const step = useLoop([300, 2400], 4200);
  const checked = step >= 2;

  return (
    <DemoCard title="Tasks & follow-ups">
      <Box
        sx={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "translateY(0)" : "translateY(6px)",
          transition: "all 300ms ease-out",
          border: `1px solid ${tokens.border}`,
          borderRadius: 2,
          px: 1.5, py: 1.25,
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
        }}
      >
        <Checkbox checked={checked} size="small" sx={{ p: 0, mt: 0.25 }} readOnly />
        <Box>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ textDecoration: checked ? "line-through" : "none", color: checked ? tokens.muted : tokens.ink, transition: "color 200ms" }}
          >
            {TASK.text}
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.muted }}>Due {TASK.due}</Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: tokens.muted, mt: 1.5, display: "block", textAlign: "center" }}>
        {checked ? "Nothing falls through the cracks." : "Set a reminder tied to any conversation."}
      </Typography>
    </DemoCard>
  );
}

export function CsvImportDemo() {
  const TOTAL = 247;
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setCount(0);
      for (let pct = 1; pct <= 10; pct++) {
        timers.push(setTimeout(() => !cancelled && setCount(Math.round((TOTAL * pct) / 10)), 200 + pct * 220));
      }
      timers.push(setTimeout(() => !cancelled && run(), 4200));
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const pct = Math.round((count / TOTAL) * 100);
  const done = count === TOTAL;

  return (
    <DemoCard title="CSV lead import">
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="body2" sx={{ color: tokens.muted }}>customers.csv</Typography>
        <Box sx={{ width: "100%", height: 8, borderRadius: 4, bgcolor: tokens.canvas, overflow: "hidden" }}>
          <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: done ? tokens.success : tokens.brand, transition: "width 200ms linear" }} />
        </Box>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {done && <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tokens.success }} />}
          <Typography variant="body2" fontWeight={700}>
            {count} / {TOTAL} contacts imported
          </Typography>
        </Stack>
      </Stack>
    </DemoCard>
  );
}

const SEARCH_QUERY = "refund policy";
const SEARCH_RESULT = { name: "Ngozi Umeh", snippet: "...yes, our", match: "refund policy", after: "is 7 days from delivery" };

export function MessageSearchDemo() {
  const [typed, setTyped] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setTyped(0);
      setShowResult(false);
      for (let i = 1; i <= SEARCH_QUERY.length; i++) {
        timers.push(setTimeout(() => !cancelled && setTyped(i), 400 + i * 70));
      }
      timers.push(setTimeout(() => !cancelled && setShowResult(true), 400 + SEARCH_QUERY.length * 70 + 300));
      timers.push(setTimeout(() => !cancelled && run(), 4200));
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <DemoCard title="Full-text message search">
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ border: `1px solid ${tokens.border}`, borderRadius: 3, px: 1.5, py: 0.75, bgcolor: tokens.canvas }}
        >
          <SearchRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
          <Typography variant="body2" sx={{ minHeight: 20 }}>
            {SEARCH_QUERY.slice(0, typed)}
            <Box component="span" sx={{ opacity: typed < SEARCH_QUERY.length ? 1 : 0, borderRight: `1px solid ${tokens.ink}` }} />
          </Typography>
        </Stack>

        <Box sx={{ minHeight: 52, opacity: showResult ? 1 : 0, transform: showResult ? "translateY(0)" : "translateY(4px)", transition: "all 250ms ease-out" }}>
          {showResult && (
            <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: 2, px: 1.5, py: 1 }}>
              <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{SEARCH_RESULT.name}</Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {SEARCH_RESULT.snippet}{" "}
                <Box component="mark" sx={{ bgcolor: "#FFF3B0", color: "inherit", px: 0.25 }}>{SEARCH_RESULT.match}</Box>{" "}
                {SEARCH_RESULT.after}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </DemoCard>
  );
}
