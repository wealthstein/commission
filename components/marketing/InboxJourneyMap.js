"use client";

import { Box, Typography, Stack } from "@mui/material";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FiberNewRoundedIcon from "@mui/icons-material/FiberNewRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { tokens } from "@/lib/theme";

export const JOURNEY_NODES = [
  { key: "affiliate", label: "Affiliate referral", detail: "Customer finds you via an affiliate's link", icon: Diversity3RoundedIcon, body: "An affiliate shares your product with their own audience. Someone clicks through and, instead of checking out immediately, decides to ask a question first." },
  { key: "inbox", label: "Messages you", detail: "Reaches out on WhatsApp with a question", icon: WhatsAppIcon, body: "They message your WhatsApp number directly. It arrives in Inbox like any other conversation - visible to your whole team, not sitting in one person's personal phone." },
  { key: "new", label: "New Lead", detail: "Conversation added to the pipeline", icon: FiberNewRoundedIcon, body: "A conversation gets added to the pipeline with one click, right from the chat - no separate form to fill in." },
  { key: "contacted", label: "Contacted", detail: "First reply sent, follow-up set", icon: PhoneInTalkRoundedIcon, body: "You've replied. Set a follow-up reminder in the same click so the conversation doesn't go quiet on your end." },
  { key: "qualified", label: "Qualified", detail: "Budget and need confirmed", icon: VerifiedRoundedIcon, body: "Need and budget are confirmed - this is a real deal, not just a question." },
  { key: "negotiation", label: "Negotiation", detail: "Price and terms discussed", icon: HandshakeRoundedIcon, body: "Price and terms get worked out in the same WhatsApp thread you've been replying from the whole time." },
  { key: "won", label: "Won", detail: "Deal closed", icon: EmojiEventsRoundedIcon, body: "Deal closed. It shows up in Insights as real, attributed pipeline value." },
];

// No auto-play - this previously animated through all 7 nodes on a timer
// and kept looping, which read as the pipeline moving on its own even
// when nobody had touched it. selectedIndex is owned entirely by the
// parent (InboxPageContent) and only ever changes when a node is clicked.
export default function InboxJourneyMap({ selectedIndex, onSelect }) {
  return (
    <Box sx={{ overflowX: { xs: "auto", md: "visible" }, pb: { xs: 1, md: 0 } }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        sx={{ minWidth: { xs: 760, md: "auto" }, position: "relative" }}
      >
        {JOURNEY_NODES.map((node, i) => {
          const reached = i <= selectedIndex;
          const isCurrent = i === selectedIndex;
          const isWon = node.key === "won";
          const Icon = node.icon;

          return (
            <Box
              key={node.key}
              onClick={() => onSelect(i)}
              sx={{ flex: 1, position: "relative", textAlign: "center", px: 0.5, cursor: "pointer" }}
            >
              {i > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 22,
                    left: "-50%",
                    width: "100%",
                    height: 3,
                    bgcolor: i <= selectedIndex ? tokens.brand : tokens.border,
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
                  outline: isCurrent ? `3px solid ${tokens.ink}` : "none",
                  outlineOffset: 2,
                  transition: "all 200ms ease-out",
                  "&:hover": { transform: "scale(1.08)" },
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

      <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: tokens.muted, mt: 2 }}>
        Click any step to explore it
      </Typography>
    </Box>
  );
}
