"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

// A ₦50,000/month SaaS subscription with a 10% recurring commission —
// matching the earnings example already used elsewhere on the affiliate
// side. Rather than a static row breakdown, this animates cumulative
// earnings climbing month over month, because the whole point of a
// recurring commission is that it keeps growing for as long as the
// customer stays subscribed — motion communicates that better than a
// single static split ever could.
const MONTHLY_COMMISSION = 5000;
const MONTHS = 6;

export default function AffiliateEarningsVisual() {
  const [visibleMonths, setVisibleMonths] = useState(0);

  useEffect(() => {
    setVisibleMonths(0);
    const timers = [];
    for (let i = 1; i <= MONTHS; i++) {
      timers.push(setTimeout(() => setVisibleMonths(i), i * 260));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const maxHeight = 120;
  const cumulativeAt = (month) => MONTHLY_COMMISSION * month;
  const runningTotal = cumulativeAt(visibleMonths);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 440,
        border: `1px solid ${tokens.border}`,
        borderRadius: 4,
        p: 3,
        bgcolor: tokens.paper,
        boxShadow: "0 24px 48px -24px rgba(11,11,12,0.18)",
      }}
    >
      <Typography variant="overline" sx={{ color: tokens.muted, letterSpacing: 1.2 }}>
        One referral, paid every month
      </Typography>

      <Typography variant="body2" sx={{ color: tokens.muted, mt: 1, mb: 3 }}>
        A ₦50,000/month subscription at 10% recurring commission — you promote it once.
      </Typography>

      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ height: maxHeight, mb: 1.5 }}>
        {Array.from({ length: MONTHS }).map((_, i) => {
          const month = i + 1;
          const active = month <= visibleMonths;
          const heightPct = (month / MONTHS) * 100;
          return (
            <Box key={month} sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <Box
                sx={{
                  width: 22,
                  height: active ? `${heightPct}%` : "4px",
                  borderRadius: 1.5,
                  bgcolor: month === visibleMonths ? tokens.brand : "#FFE280",
                  transition: "height 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              <Typography variant="caption" sx={{ color: tokens.muted, mt: 1, fontSize: 11 }}>
                M{month}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F7F6F2", textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          Earned so far
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ transition: "opacity 200ms ease" }}>
          ₦{runningTotal.toLocaleString()}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mt: 2 }}>
        As long as the customer stays subscribed, that ₦5,000 keeps landing — no extra work from you.
      </Typography>
    </Box>
  );
}
