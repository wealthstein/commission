"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Stack, Avatar, Chip, Select, MenuItem } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CircleIcon from "@mui/icons-material/Circle";
import { tokens } from "@/lib/theme";

// Full names + a real avatar (colored initial) on every person, both
// customers and agents - see the AVATAR NOTE at the bottom of this file
// for exactly where to change these if you want real photos instead.
const AGENTS = {
  chidinma: { name: "Chidinma Eze", initial: "C", color: "#8E5CE8" },
  tunde: { name: "Tunde Bakare", initial: "T", color: "#2F8AE0" },
  bisi: { name: "Bisi Adeyemi", initial: "B", color: tokens.success },
};

// Two connections (numbers), each with its own customer list and real
// conversations - this is the actual feature being demonstrated: pick a
// number, see who messaged that number, open a real thread. Every contact
// has a full conversation (not just the ones that happen to be "active")
// so clicking around never dead-ends into an empty state.
const CONNECTIONS = {
  sales: {
    label: "Sales line",
    contacts: [
      {
        id: "amaka", name: "Amaka Okafor", preview: "Perfect, I'll take it...", time: "2:41 PM", unread: 1,
        messages: [
          { dir: "in", text: "Hi! Is the Ankara set in navy still available in size M?", time: "2:35 PM" },
          { dir: "out", agent: "chidinma", text: "Yes it is! \u20a628,500, ready to ship today \ud83d\ude0a", time: "2:36 PM" },
          { dir: "in", text: "Perfect, I'll take it. Can I pay on delivery?", time: "2:39 PM" },
          { dir: "out", agent: "tunde", text: "We do POD within Lagos - I've moved you to Sales, they'll confirm your address now", time: "2:41 PM" },
        ],
      },
      {
        id: "david", name: "David Adeyemi", preview: "Invoice sent \u2713", time: "1:15 PM", unread: 0,
        messages: [
          { dir: "in", text: "Good afternoon, do you have the grey office chairs in stock? Need 6 of them.", time: "1:10 PM" },
          { dir: "out", agent: "tunde", text: "We do - \u20a645,000 each, or \u20a6250,000 for 6. I'll send the invoice now.", time: "1:12 PM" },
          { dir: "in", text: "Great, please send it to this number.", time: "1:14 PM" },
        ],
      },
      {
        id: "ngozi", name: "Ngozi Umeh", preview: "Do you deliver to Ibadan?", time: "Yesterday", unread: 2,
        messages: [
          { dir: "in", text: "Do you deliver to Ibadan?", time: "4:02 PM" },
          { dir: "in", text: "And how long does it usually take?", time: "4:03 PM" },
        ],
      },
    ],
  },
  support: {
    label: "Support line",
    contacts: [
      {
        id: "femi", name: "Femi Okonkwo", preview: "Thank you so much!", time: "11:02 AM", unread: 0,
        messages: [
          { dir: "in", text: "My order arrived but the size is wrong - I ordered L, got M.", time: "10:58 AM" },
          { dir: "out", agent: "bisi", text: "So sorry about that Femi! I've raised a free exchange - courier will pick up the wrong item tomorrow.", time: "11:00 AM" },
          { dir: "in", text: "Thank you so much!", time: "11:02 AM" },
        ],
      },
      {
        id: "blessing", name: "Blessing Nwachukwu", preview: "Still not resolved...", time: "Mon", unread: 3,
        messages: [
          { dir: "in", text: "I was charged twice for the same order, reference #4471.", time: "9:15 AM" },
          { dir: "out", agent: "bisi", text: "Checking this now - can you confirm the last 4 digits of the card used?", time: "9:20 AM" },
          { dir: "in", text: "Still not resolved, it's been 2 days", time: "9:32 AM" },
        ],
      },
    ],
  },
};

function TickIcon({ status }) {
  if (status === "read") return <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb" }} />;
  if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 14, color: tokens.muted }} />;
  return <DoneIcon sx={{ fontSize: 14, color: tokens.muted }} />;
}

export default function InboxDemoIllustration() {
  const [connectionKey, setConnectionKey] = useState("sales");
  const [contactId, setContactId] = useState("amaka");
  const [visibleCount, setVisibleCount] = useState(0);

  const connection = CONNECTIONS[connectionKey];
  const contact = connection.contacts.find((c) => c.id === contactId) ?? connection.contacts[0];

  // Replays a quick staggered reveal whenever a different conversation is
  // opened - NOT a perpetual background loop. The earlier version kept a
  // timer running indefinitely and called scrollIntoView on every tick,
  // which had no properly scrollable container to target and ended up
  // scrolling the whole PAGE back to this widget - however far away the
  // visitor had since scrolled. A one-shot reveal tied to an actual click
  // removes that risk entirely: nothing changes in the background while
  // nobody's looking at it.
  useEffect(() => {
    setVisibleCount(0);
    const timers = contact.messages.map((_, i) => setTimeout(() => setVisibleCount(i + 1), 220 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [contact]);

  function selectConnection(key) {
    setConnectionKey(key);
    setContactId(CONNECTIONS[key].contacts[0].id);
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: 480,
        border: `1px solid ${tokens.border}`,
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 24px 48px -24px rgba(11,11,12,0.18)",
        bgcolor: tokens.paper,
      }}
    >
      <Box sx={{ width: { xs: 0, sm: 240 }, display: { xs: "none", sm: "flex" }, flexDirection: "column", borderRight: `1px solid ${tokens.border}`, bgcolor: "#FAFAF8" }}>
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${tokens.border}` }}>
          <Select
            value={connectionKey}
            onChange={(e) => selectConnection(e.target.value)}
            size="small"
            fullWidth
            sx={{ fontSize: 13, fontWeight: 700, bgcolor: tokens.paper, "& .MuiSelect-select": { py: 0.75 } }}
          >
            {Object.entries(CONNECTIONS).map(([key, c]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: 13 }}>{c.label}</MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ overflowY: "auto" }}>
          {connection.contacts.map((c) => {
            const active = c.id === contact.id;
            return (
              <Stack
                key={c.id}
                direction="row"
                spacing={1.25}
                alignItems="center"
                onClick={() => setContactId(c.id)}
                sx={{
                  px: 2, py: 1.1, borderBottom: `1px solid ${tokens.border}`,
                  bgcolor: active ? "#F0EEE8" : "transparent",
                  cursor: "pointer",
                  "&:hover": { bgcolor: active ? "#F0EEE8" : "#F5F3EE" },
                }}
              >
                <Avatar sx={{ width: 30, height: 30, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 13 }}>
                  {c.name.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13 }}>{c.name}</Typography>
                    <Typography variant="caption" noWrap sx={{ color: tokens.muted, fontSize: 10, flexShrink: 0, ml: 0.5 }}>{c.time}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" noWrap sx={{ color: tokens.muted, fontSize: 11, maxWidth: 120 }}>{c.preview}</Typography>
                    {c.unread > 0 && (
                      <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: tokens.brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 700, color: tokens.brandInk }}>{c.unread}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${tokens.border}` }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>{contact.name.charAt(0)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1" fontWeight={700} noWrap>{contact.name}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CircleIcon sx={{ fontSize: 7, color: tokens.success }} />
              <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11 }}>{connection.label}</Typography>
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ flex: 1, overflowY: "auto", bgcolor: tokens.canvas, px: 2.5, py: 1.75, display: "flex", flexDirection: "column", gap: 1 }}>
          {contact.messages.slice(0, visibleCount).map((msg, i) => {
            const isOut = msg.dir === "out";
            const agent = isOut ? AGENTS[msg.agent] : null;
            return (
              <Stack key={i} direction="row" spacing={1} justifyContent={isOut ? "flex-end" : "flex-start"} alignItems="flex-end">
                {!isOut && (
                  <Avatar sx={{ width: 26, height: 26, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700, fontSize: 12 }}>
                    {contact.name.charAt(0)}
                  </Avatar>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: isOut ? "flex-end" : "flex-start", maxWidth: "62%" }}>
                  {isOut && (
                    <Typography variant="caption" sx={{ color: agent.color, fontWeight: 700, fontSize: 11, mb: 0.25, mr: 0.5 }}>
                      {agent.name}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      bgcolor: isOut ? "#FFF4CC" : tokens.paper,
                      border: `1px solid ${tokens.border}`,
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      animation: "inboxDemoPop 220ms ease-out",
                      "@keyframes inboxDemoPop": {
                        from: { opacity: 0, transform: "translateY(6px) scale(0.97)" },
                        to: { opacity: 1, transform: "translateY(0) scale(1)" },
                      },
                    }}
                  >
                    <Typography variant="body2">{msg.text}</Typography>
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.4} sx={{ mt: 0.25 }}>
                      <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 10 }}>{msg.time}</Typography>
                      {isOut && (
                        <TickIcon status={i < visibleCount - 1 || visibleCount === contact.messages.length ? "read" : "delivered"} />
                      )}
                    </Stack>
                  </Box>
                </Box>
                {isOut && (
                  <Avatar sx={{ width: 26, height: 26, bgcolor: agent.color, color: "#fff", fontWeight: 700, fontSize: 12 }}>
                    {agent.initial}
                  </Avatar>
                )}
              </Stack>
            );
          })}
        </Box>

        <Box sx={{ px: 2.5, py: 1.25, borderTop: `1px solid ${tokens.border}`, bgcolor: "#FAFAF8" }}>
          <Chip
            label={`Pick a number from the dropdown, or click a customer \u00b7 ${connection.label}`}
            size="small"
            sx={{ bgcolor: tokens.canvas, fontSize: 11, fontWeight: 600 }}
          />
        </Box>
      </Box>
    </Box>
  );
}

// AVATAR NOTE - where to change the avatars:
// Every avatar in this file is a MUI <Avatar> rendering a colored circle
// with the person's first initial (bgcolor + a single-letter child, e.g.
// {contact.name.charAt(0)}). There are no image files involved.
//
// To use real photos instead, pass a `src` prop with an image URL - MUI's
// Avatar automatically shows the image when `src` loads, and falls back
// to the initial only if it's missing/fails to load, e.g.:
//   <Avatar src="/images/agents/chidinma.jpg" sx={{ ... }}>C</Avatar>
//
// Places that render an avatar in this file:
//   - AGENTS object (top of file) - add a `photo` field per agent, then
//     reference it wherever `agent.initial` is used as an Avatar's content
//   - Sidebar contact rows - {c.name.charAt(0)}
//   - Chat header - {contact.name.charAt(0)}
//   - Customer message avatar - {contact.name.charAt(0)}
//   - Agent message avatar - {agent.initial}
//
// The companion feature-demo file (InboxFeatureIllustrations.js) has its
// own separate AGENTS array with the same pattern, used only by
// LeadRoutingDemo - change avatars there independently if needed.
