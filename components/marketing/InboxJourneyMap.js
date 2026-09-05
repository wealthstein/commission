"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FiberNewRoundedIcon from "@mui/icons-material/FiberNewRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { tokens } from "@/lib/theme";

// Node copy is deliberately careful about what "affiliate as the source"
// actually means here: it's the traffic origin (how the customer found
// the business and ended up messaging them), not a claim that winning a
// deal in Inbox's pipeline automatically triggers an affiliate commission
// payout - those are two separate systems in this product, and this
// component shouldn't imply a wiring that doesn't exist.
const NODES = [
  { key: "affiliate", label: "Affiliate referral", detail: "Customer finds you via an affiliate's link", icon: Diversity3RoundedIcon },
  { key: "inbox", label: "Messages you", detail: "Reaches out on WhatsApp with a question", icon: WhatsAppIcon },
  { key: "new", label: "New Lead", detail: "Conversation added to the pipeline", icon: FiberNewRoundedIcon },
  { key: "contacted", label: "Contacted", detail: "First reply sent, follow-up set", icon: PhoneInTalkRoundedIcon },
  { key: "qualified", label: "Qualified", detail: "Budget and need confirmed", icon: VerifiedRoundedIcon },
  { key: "negotiation", label: "Negotiation", detail: "Price and terms discussed", icon: HandshakeRoundedIcon },
  { key: "won", label: "Won", detail: "Deal closed", icon: EmojiEventsRoundedIcon },
];

const STEP_MS = 850;
const LOOP_PAUSE_MS = 2200;

export default function InboxJourneyMap() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    function run() {
      setActiveIndex(0);
      NODES.forEach((_, i) => {
        timers.push(setTimeout(() => !cancelled && setActiveIndex(i), i * STEP_MS));
      });
      timers.push(setTimeout(() => !cancelled && run(), NODES.length * STEP_MS + LOOP_PAUSE_MS));
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <Box sx={{ overflowX: { xs: "auto", md: "visible" }, pb: { xs: 1, md: 0 } }} aria-hidden="true">
      <Stack
        direction="row"
        alignItems="flex-start"
        sx={{ minWidth: { xs: 760, md: "auto" }, position: "relative" }}
      >
        {NODES.map((node, i) => {
          const reached = i <= activeIndex;
          const isCurrent = i === activeIndex;
          const isWon = node.key === "won";
          const Icon = node.icon;

          return (
            <Box key={node.key} sx={{ flex: 1, position: "relative", textAlign: "center", px: 0.5 }}>
              {i > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 22,
                    left: "-50%",
                    width: "100%",
                    height: 3,
                    bgcolor: i <= activeIndex ? tokens.brand : tokens.border,
                    transition: "background-color 300ms ease-out",
                    zIndex: 0,
                  }}
                />
              )}

              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  width: 44,
                  height: 44,
                  mx: "auto",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isWon && reached ? tokens.success : reached ? tokens.brand : tokens.canvas,
                  border: `2px solid ${reached ? "transparent" : tokens.border}`,
                  transform: isCurrent ? "scale(1.15)" : "scale(1)",
                  transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <Icon sx={{ fontSize: 20, color: reached ? "#fff" : tokens.muted }} />
              </Box>

              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ display: "block", mt: 1, fontSize: 12, color: reached ? tokens.ink : tokens.muted }}
              >
                {node.label}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", fontSize: 10.5, color: tokens.muted, px: 0.5 }}>
                {node.detail}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
