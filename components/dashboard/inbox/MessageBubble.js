"use client";

import { Box, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { tokens } from "@/lib/theme";

function StatusTick({ status }) {
  const sx = { fontSize: 16, ml: 0.5 };
  if (status === "pending") return <ScheduleIcon sx={{ ...sx, color: tokens.muted }} />;
  if (status === "sent") return <DoneIcon sx={{ ...sx, color: tokens.muted }} />;
  if (status === "delivered") return <DoneAllIcon sx={{ ...sx, color: tokens.muted }} />;
  if (status === "read") return <DoneAllIcon sx={{ ...sx, color: tokens.success }} />;
  return null;
}

export default function MessageBubble({ message }) {
  const isOutbound = message.direction === "outbound";

  return (
    <Box sx={{ display: "flex", justifyContent: isOutbound ? "flex-end" : "flex-start", px: 2, py: 0.4 }}>
      <Box
        sx={{
          maxWidth: "65%",
          bgcolor: isOutbound ? "#FFF4CC" : tokens.paper, // light tint of brand yellow for outgoing, paper white for incoming
          border: `1px solid ${tokens.border}`,
          borderRadius: 1.5,
          px: 1.5,
          py: 0.75,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {message.type === "text" || !message.media_url ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", pr: 5 }}>
            {message.content}
          </Typography>
        ) : (
          <Box sx={{ mb: message.content ? 0.5 : 0 }}>
            {message.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.media_url} alt="" style={{ maxWidth: "100%", borderRadius: 6, display: "block" }} />
            )}
            {message.type === "audio" && <audio controls src={message.media_url} style={{ maxWidth: 220 }} />}
            {message.type === "document" && (
              <a href={message.media_url} target="_blank" rel="noreferrer">Document attachment</a>
            )}
            {message.content && (
              <Typography variant="body2" sx={{ mt: 0.5, pr: 5 }}>{message.content}</Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 0.25 }}>
          <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11 }}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Typography>
          {isOutbound && <StatusTick status={message.status} />}
        </Box>
      </Box>
    </Box>
  );
}
