"use client";

import { useMemo, useState } from "react";
import {
  Box, List, ListItemButton, ListItemAvatar, Avatar, ListItemText,
  Typography, InputBase, Badge, Stack, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { tokens } from "@/lib/theme";
import { useConversations } from "@/lib/inbox/useConversations";
import { useMessageSearch } from "@/lib/inbox/useMessageSearch";

function Highlighted({ text }) {
  // Server wraps matches with \x01...\x02 (see inbox_search_messages in
  // migration_inbox.sql) instead of HTML tags, specifically so this never
  // needs dangerouslySetInnerHTML on message content that came from an
  // external WhatsApp contact.
  const parts = text.split(/([\x01\x02])/);
  let on = false;
  return parts.map((part, i) => {
    if (part === "\x01") { on = true; return null; }
    if (part === "\x02") { on = false; return null; }
    return on ? <mark key={i} style={{ backgroundColor: "#FFF3B0", color: "inherit" }}>{part}</mark> : part;
  });
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function ConversationList({ businessId, activeId, onSelect, hideOnMobile }) {
  const { conversations, loading } = useConversations(businessId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) => (c.contact?.name ?? "").toLowerCase().includes(q) || (c.contact?.wa_number ?? "").includes(q)
    );
  }, [conversations, search]);

  const shouldSearchMessages = search.trim().length >= 3 && filtered.length === 0;
  const { results: messageResults, searching } = useMessageSearch(shouldSearchMessages ? businessId : null, search);

  function openFromSearchResult(conversationId) {
    const match = conversations.find((c) => c.id === conversationId);
    if (match) onSelect(match);
  }

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 360 },
        display: hideOnMobile ? { xs: "none", md: "flex" } : "flex",
        borderRight: `1px solid ${tokens.border}`,
        flexDirection: "column",
        bgcolor: tokens.paper,
        flexShrink: 0,
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle1" fontWeight={700}>Chats</Typography>
      </Box>

      <Box sx={{ px: 1.5, py: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", bgcolor: tokens.canvas, borderRadius: 3, px: 1.5, py: 0.5, border: `1px solid ${tokens.border}` }}>
          <SearchIcon sx={{ color: tokens.muted, fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ fontSize: 14 }}
          />
        </Box>
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", py: 0 }}>
        {loading && (
          <Typography variant="body2" sx={{ color: tokens.muted, px: 2, py: 2 }}>Loading conversations…</Typography>
        )}

        {!loading && shouldSearchMessages && (
          <>
            <Typography variant="caption" sx={{ color: tokens.muted, px: 2, py: 1, display: "block" }}>
              {searching ? "Searching messages…" : `Message matches for "${search}"`}
            </Typography>
            {messageResults.map((result) => (
              <ListItemButton
                key={result.message_id}
                onClick={() => openFromSearchResult(result.conversation_id)}
                sx={{ px: 2, py: 1, borderBottom: `1px solid ${tokens.border}` }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>
                    {(result.contact_name || result.contact_wa_number).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={600}>{result.contact_name || result.contact_wa_number}</Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: tokens.muted }} noWrap>
                      <Highlighted text={result.snippet} />
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
            {!searching && messageResults.length === 0 && (
              <Typography variant="body2" sx={{ color: tokens.muted, px: 2, py: 2 }}>
                No conversations or messages match &quot;{search}&quot;.
              </Typography>
            )}
            <Divider />
          </>
        )}

        {!loading && !shouldSearchMessages && filtered.length === 0 && (
          <Typography variant="body2" sx={{ color: tokens.muted, px: 2, py: 2 }}>
            No conversations yet. Once a customer messages your connected WhatsApp number, it shows up here.
          </Typography>
        )}

        {!shouldSearchMessages && filtered.map((conversation) => {
          const active = conversation.id === activeId;
          const name = conversation.contact?.name || conversation.contact?.wa_number || "Unknown";
          return (
            <ListItemButton
              key={conversation.id}
              selected={active}
              onClick={() => onSelect(conversation)}
              sx={{
                px: 2, py: 1.2, borderBottom: `1px solid ${tokens.border}`,
                "&.Mui-selected": { bgcolor: tokens.canvas },
              }}
            >
              <ListItemAvatar>
                <Avatar src={conversation.contact?.avatar_url ?? undefined} sx={{ bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>
                  {name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
                    {conversation.last_message_at && (
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{timeAgo(conversation.last_message_at)}</Typography>
                    )}
                  </Stack>
                }
                secondary={
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: tokens.muted }} noWrap style={{ maxWidth: 220 }}>
                      {conversation.last_message_preview ?? "No messages yet"}
                    </Typography>
                    {conversation.unread_count > 0 && (
                      <Badge badgeContent={conversation.unread_count} sx={{ "& .MuiBadge-badge": { bgcolor: tokens.brand, color: tokens.brandInk } }} />
                    )}
                  </Stack>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
