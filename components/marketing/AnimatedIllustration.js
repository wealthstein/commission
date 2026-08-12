"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Grid, Fade } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { tokens } from "@/lib/theme";

const SCENE_MS = 4200;

function BrowserFrame({ url, children }) {
  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: tokens.paper,
        boxShadow: "0 12px 40px -12px rgba(11,11,12,0.18), 0 0 0 1px rgba(11,11,12,0.06)",
        textAlign: "left",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.25, bgcolor: "#F3F1EA", borderBottom: `1px solid ${tokens.border}` }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#E5A2A2" }} />
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#E8CB9A" }} />
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#A8CDB0" }} />
        <Box sx={{ ml: 1, px: 1.5, py: 0.4, borderRadius: 999, bgcolor: "#fff" }}>
          <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11 }}>
            {url}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 3, md: 4 }, minHeight: 340 }}>{children}</Box>
    </Box>
  );
}

function Pill({ label, selected, dim }) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 0.75,
        borderRadius: 999,
        border: `1.5px solid ${selected ? tokens.brand : tokens.border}`,
        bgcolor: selected ? tokens.brand : "transparent",
        opacity: dim ? 0.4 : 1,
        transition: "all 0.3s ease",
      }}
    >
      <Typography variant="caption" fontWeight={700} sx={{ color: selected ? tokens.brandInk : tokens.muted }}>
        {label}
      </Typography>
    </Box>
  );
}

function FieldGroup({ label, options, selectedIndex }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {options.map((opt, i) => (
          <Pill key={opt} label={opt} selected={i === selectedIndex} />
        ))}
      </Stack>
    </Box>
  );
}

function DataRow({ label, value, done = true }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: done ? "#FBF9F2" : "transparent", opacity: done ? 1 : 0.3 }}>
      <Typography variant="caption" sx={{ color: tokens.muted }}>
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  );
}

function ProgressDots({ count, active }) {
  return (
    <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 2.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ width: i === active ? 18 : 6, height: 6, borderRadius: 999, bgcolor: i === active ? tokens.brand : tokens.border, transition: "all 0.3s ease" }} />
      ))}
    </Stack>
  );
}

// ---------------------------------------------------------------- BUSINESS

function BusinessScene({ index }) {
  if (index === 0) {
    return (
      <BrowserFrame url="commission.ng/dashboard/campaigns">
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          My Campaigns
        </Typography>
        <Stack spacing={1} sx={{ mb: 2, opacity: 0.4 }}>
          <DataRow label="Lekki Waterfront Villas" value="Active" />
          <DataRow label="CareLink HMO Plan" value="Active" />
        </Stack>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 2, py: 1, borderRadius: 999, bgcolor: tokens.brand }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk }}>
            + Create Campaign
          </Typography>
        </Box>
      </BrowserFrame>
    );
  }
  if (index === 1) {
    return (
      <BrowserFrame url="commission.ng/dashboard/campaigns/new">
        <FieldGroup label="What do you want to acquire?" options={["Lead", "IQL", "SQL"]} selectedIndex={2} />
        <FieldGroup label="Industry" options={["Real Estate"]} selectedIndex={0} />
      </BrowserFrame>
    );
  }
  if (index === 2) {
    return (
      <BrowserFrame url="commission.ng/dashboard/campaigns/new">
        <Typography variant="overline" sx={{ color: tokens.brandInk, fontWeight: 700, display: "block", mb: 1 }}>
          BUILD QUALIFICATION FLOW
        </Typography>
        <FieldGroup label="Budget" options={["\u20a6400,000\u2013500,000", "\u20a6500,000\u2013800,000", "\u20a6800,000+"]} selectedIndex={1} />
        <FieldGroup label="Purchase timeline" options={["Immediately", "1\u20133 months", "3\u20136 months"]} selectedIndex={1} />
        <FieldGroup label="Preferred location" options={["Lekki", "Ikoyi", "Victoria Island"]} selectedIndex={0} />
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "#FBF9F2" }}>
          <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
            SQL criteria
          </Typography>
          {["Budget \u2265 \u20a6500,000", "Timeline \u2264 6 months", "Location = Lagos"].map((c) => (
            <Stack key={c} direction="row" spacing={0.75} alignItems="center">
              <CheckRoundedIcon sx={{ fontSize: 14, color: "#1D9E75" }} />
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {c}
              </Typography>
            </Stack>
          ))}
        </Box>
      </BrowserFrame>
    );
  }
  if (index === 3) {
    return (
      <BrowserFrame url="commission.ng/dashboard/campaigns/new">
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          Reward per SQL
        </Typography>
        <Typography fontWeight={800} sx={{ fontSize: 32, mb: 2.5 }}>
          ₦25,000
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1D9E75" }} />
          <Typography variant="caption" fontWeight={700}>
            Campaign status: Active
          </Typography>
        </Stack>
        <Box sx={{ display: "inline-flex", px: 2.5, py: 1.1, borderRadius: 999, bgcolor: tokens.ink }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "#fff" }}>
            Launch Campaign
          </Typography>
        </Box>
      </BrowserFrame>
    );
  }
  if (index === 4) {
    return (
      <BrowserFrame url="commission.ng/discover">
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
          Now visible to affiliates
        </Typography>
        <Box sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${tokens.border}`, maxWidth: 320 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            Luxury Property Campaign
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Earn ₦25,000 / SQL
          </Typography>
          <Box sx={{ display: "inline-flex", px: 2, py: 0.8, borderRadius: 999, bgcolor: tokens.brand }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk }}>
              Promote
            </Typography>
          </Box>
        </Box>
      </BrowserFrame>
    );
  }
  if (index === 5) {
    return (
      <BrowserFrame url="commission.ng/leads/8X72K/continue">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, color: tokens.muted }}>
          <Typography variant="caption" fontWeight={700}>WhatsApp</Typography>
          <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" fontWeight={700}>Prospect</Typography>
          <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" fontWeight={700}>Commission</Typography>
        </Stack>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <DataRow label="Budget" value="\u20a6500,000+" />
          <DataRow label="When buying" value="1\u20133 months" />
          <DataRow label="Location" value="Lekki" />
          <DataRow label="Phone" value="Verified \u2713" />
        </Stack>
        <Box sx={{ display: "inline-flex", px: 2, py: 0.8, borderRadius: 999, bgcolor: "#E7F5EE" }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "#1D9E75" }}>
            SQL ✓
          </Typography>
        </Box>
      </BrowserFrame>
    );
  }
  return (
    <BrowserFrame url="commission.ng/dashboard/transactions">
      <Typography fontWeight={700} sx={{ mb: 2 }}>
        New Sales Qualified Lead
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <DataRow label="Budget" value="\u20a6500,000+" />
        <DataRow label="Location" value="Lekki" />
        <DataRow label="Timeline" value="1\u20133 months" />
        <DataRow label="Phone" value="Verified \u2713" />
        <DataRow label="Source" value="Commission Affiliate" />
      </Stack>
      <Box sx={{ pt: 2, borderTop: `1px solid ${tokens.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" sx={{ color: tokens.muted }}>
          Affiliate reward
        </Typography>
        <Typography fontWeight={800} sx={{ fontSize: 20 }}>
          ₦25,000
        </Typography>
      </Box>
    </BrowserFrame>
  );
}

// --------------------------------------------------------------- AFFILIATE

const MARKETPLACE_CARDS = [
  { name: "Real Estate", rate: "\u20a625,000 / SQL" },
  { name: "HR Software", rate: "\u20a615,000 / SQL" },
  { name: "HMO", rate: "\u20a65,000 / IQL" },
  { name: "Business Internet", rate: "\u20a610,000 / IQL" },
];

function AffiliateScene({ index }) {
  if (index === 0) {
    return (
      <BrowserFrame url="commission.ng/discover">
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          Available Campaigns
        </Typography>
        <Grid container spacing={1.5}>
          {MARKETPLACE_CARDS.map((c) => (
            <Grid item xs={6} key={c.name}>
              <Box sx={{ p: 1.75, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
                <Typography variant="body2" fontWeight={700}>
                  {c.name}
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  {c.rate}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </BrowserFrame>
    );
  }
  if (index === 1) {
    return (
      <BrowserFrame url="commission.ng/discover/real-estate">
        <Typography variant="overline" sx={{ color: tokens.muted, fontWeight: 700 }}>
          REAL ESTATE
        </Typography>
        <Typography fontWeight={700} sx={{ fontSize: 20, mb: 1 }}>
          Earn ₦25,000 for every qualified buyer
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2.5 }}>
          Lekki, Ikoyi & Victoria Island listings
        </Typography>
        <Box sx={{ display: "inline-flex", px: 2.5, py: 1.1, borderRadius: 999, bgcolor: tokens.brand }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.brandInk }}>
            Join Campaign
          </Typography>
        </Box>
      </BrowserFrame>
    );
  }
  if (index === 2) {
    return (
      <BrowserFrame url="commission.ng/dashboard/promotions">
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1 }}>
          Your referral link
        </Typography>
        <Box sx={{ px: 2, py: 1.25, borderRadius: 2, bgcolor: "#FBF9F2", mb: 2.5 }}>
          <Typography fontWeight={700} sx={{ fontSize: 15 }}>
            commission.ng/r/8X72K
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {["Copy", "WhatsApp", "LinkedIn"].map((btn, i) => (
            <Box key={btn} sx={{ px: 1.75, py: 0.8, borderRadius: 999, border: `1.5px solid ${tokens.border}`, bgcolor: i === 1 ? tokens.brand : "transparent" }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: i === 1 ? tokens.brandInk : tokens.muted }}>
                {btn}
              </Typography>
            </Box>
          ))}
        </Stack>
      </BrowserFrame>
    );
  }
  if (index === 3) {
    return (
      <BrowserFrame url="commission.ng/dashboard/promotions">
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
          Live activity
        </Typography>
        <Stack spacing={1}>
          {["New referral", "Phone verified \u2713", "Qualification completed \u2713", "SQL"].map((n) => (
            <Box key={n} sx={{ px: 1.75, py: 1, borderRadius: 2, bgcolor: "#fff", border: `1px solid ${tokens.border}`, boxShadow: "0 2px 8px -4px rgba(0,0,0,0.15)" }}>
              <Typography variant="caption" fontWeight={700}>
                {n}
              </Typography>
            </Box>
          ))}
        </Stack>
      </BrowserFrame>
    );
  }
  if (index === 4) {
    return (
      <BrowserFrame url="commission.ng/dashboard/transactions">
        <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
          Commission earned
        </Typography>
        <Typography fontWeight={800} sx={{ fontSize: 32, mb: 2 }}>
          ₦25,000
        </Typography>
        <Stack direction="row" spacing={1}>
          <Box sx={{ px: 1.5, py: 0.6, borderRadius: 999, bgcolor: "#E7F5EE" }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#1D9E75" }}>
              Paid ✓
            </Typography>
          </Box>
        </Stack>
      </BrowserFrame>
    );
  }
  return (
    <BrowserFrame url="commission.ng/dashboard">
      <Typography variant="caption" sx={{ color: tokens.muted, display: "block", mb: 2 }}>
        Your earnings this month
      </Typography>
      <Stack spacing={1.25}>
        {[
          { sql: "1 SQL", amt: "\u20a625,000" },
          { sql: "2 SQLs", amt: "\u20a650,000" },
          { sql: "4 SQLs", amt: "\u20a6100,000" },
          { sql: "10 SQLs", amt: "\u20a6250,000" },
        ].map((row, i) => (
          <Stack key={row.sql} direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              {row.sql}
            </Typography>
            <Typography fontWeight={800} sx={{ fontSize: 14 + i * 3 }}>
              {row.amt}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </BrowserFrame>
  );
}

const SCENE_COUNTS = { business: 7, affiliate: 6 };

export default function AnimatedIllustration({ audience }) {
  const isBusiness = audience === "business";
  const total = SCENE_COUNTS[isBusiness ? "business" : "affiliate"];
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setScene(0);
  }, [audience]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setScene((s) => (s + 1) % total), SCENE_MS);
    return () => clearInterval(id);
  }, [audience, total, paused]);

  return (
    <Box sx={{ width: "100%" }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Fade in key={scene} timeout={400}>
        <Box>{isBusiness ? <BusinessScene index={scene} /> : <AffiliateScene index={scene} />}</Box>
      </Fade>
      <ProgressDots count={total} active={scene} />
    </Box>
  );
}