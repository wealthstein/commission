"use client";

import { useEffect, useRef, useState } from "react";
import { Box, IconButton, InputBase, Avatar, Typography, Stack, Tooltip, Menu, MenuItem } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { tokens } from "@/lib/theme";
import { useMessages } from "@/lib/inbox/useMessages";
import { createClient } from "@/lib/supabaseClient";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ conversation, businessId, currentUsersId, onBack }) {
  const { messages } = useMessages(conversation?.id ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conversation) {
    return (
      <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "center", bgcolor: tokens.canvas }}>
        <Typography sx={{ color: tokens.muted }}>Select a conversation to start replying</Typography>
      </Box>
    );
  }

  const name = conversation.contact?.name || conversation.contact?.wa_number || "Unknown";

  async function handleSend() {
    const text = draft.trim();
    if (!text || !conversation) return;
    setSending(true);
    setDraft("");

    const supabase = createClient();
    // Optimistic path: insert a pending row. The worker service, subscribed
    // to inbox_messages via Realtime, picks up status='pending' rows, sends
    // them through the linked WhatsApp session, then flips status to
    // sent/delivered/failed.
    const { error } = await supabase.from("inbox_messages").insert({
      business_id: businessId,
      conversation_id: conversation.id,
      direction: "outbound",
      sender_user_id: currentUsersId,
      type: "text",
      content: text,
      status: "pending",
    });

    setSending(false);
    if (error) console.error("Failed to queue message", error);
  }

  async function convertToLead() {
    const supabase = createClient();
    const { data: stages } = await supabase
      .from("inbox_pipeline_stages")
      .select("id")
      .eq("business_id", businessId)
      .order("position")
      .limit(1);

    await supabase.from("inbox_leads").insert({
      business_id: businessId,
      contact_id: conversation.contact_id,
      conversation_id: conversation.id,
      stage_id: stages?.[0]?.id ?? null,
      source: "whatsapp",
      title: name,
    });
    setMenuAnchor(null);
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Box
        sx={{
          height: 64, px: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: tokens.paper, borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={onBack} aria-label="Back to conversations" sx={{ display: { xs: "inline-flex", md: "none" }, ml: -1 }}>
            <ArrowBackRoundedIcon sx={{ color: tokens.ink }} />
          </IconButton>
          <Avatar src={conversation.contact?.avatar_url ?? undefined} sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight={600}>{name}</Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              {conversation.contact?.wa_number}
              {conversation.connection?.label ? ` · ${conversation.connection.label}` : ""}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Add to pipeline">
            <IconButton onClick={convertToLead} aria-label="Add to pipeline">
              <PersonAddRoundedIcon sx={{ color: tokens.ink }} />
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="More options" aria-haspopup="true" aria-expanded={!!menuAnchor}>
            <MoreVertRoundedIcon sx={{ color: tokens.ink }} />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => setMenuAnchor(null)}>Assign to teammate</MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)}>Mark as closed</MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)}>Add task / follow-up</MenuItem>
          </Menu>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: tokens.canvas, py: 2 }}>
        {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ px: 2, py: 1.5, bgcolor: tokens.paper, borderTop: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton aria-label="Attach file">
          <AttachFileRoundedIcon sx={{ color: tokens.muted }} />
        </IconButton>
        <InputBase
          placeholder="Type a message"
          aria-label="Type a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          multiline
          maxRows={5}
          fullWidth
          sx={{ bgcolor: tokens.canvas, border: `1px solid ${tokens.border}`, borderRadius: 3, px: 2, py: 1, fontSize: 14 }}
        />
        <IconButton
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          sx={{ bgcolor: tokens.brand, color: tokens.brandInk, "&:hover": { bgcolor: "#E6B800" }, "&.Mui-disabled": { bgcolor: tokens.border } }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
