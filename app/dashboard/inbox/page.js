"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import ConversationList from "@/components/dashboard/inbox/ConversationList";
import ChatWindow from "@/components/dashboard/inbox/ChatWindow";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { useConversations } from "@/lib/inbox/useConversations";
import { usePresence } from "@/lib/inbox/usePresence";
import { tokens } from "@/lib/theme";
import PageHeader from "@/components/dashboard/PageHeader";

function DeepLinkResolver({ conversations, onResolve }) {
  // useSearchParams() opts a page out of static prerendering unless
  // isolated behind its own Suspense boundary - split out just for that,
  // rather than the whole page.
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");

  useEffect(() => {
    if (!requestedConversationId || !conversations.length) return;
    const match = conversations.find((c) => c.id === requestedConversationId);
    if (match) onResolve(match);
  }, [requestedConversationId, conversations, onResolve]);

  return null;
}

export default function InboxPage() {
  const { loading, business, usersId } = useCurrentBusiness();
  const [active, setActive] = useState(null);
  const { conversations } = useConversations(business?.id); // also fetched inside ConversationList; small duplicate request, simplest way to resolve a deep-linked id without lifting that whole list's state up
  usePresence(business?.id, usersId); // tracks this agent as online

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!business) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          You need a business set up before you can use Inbox.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <PageHeader title="Inbox" subtitle="Reply to customers on WhatsApp, all in one place." />
      <Suspense fallback={null}>
        <DeepLinkResolver conversations={conversations} onResolve={setActive} />
      </Suspense>
      {/* A contained, bordered panel (fixed height, internal scroll per pane) —
          matches the Paper-card visual language the rest of the dashboard
          uses, rather than fighting the shared layout's content padding to
          force an edge-to-edge chat app. Below md, shows list OR chat full-
          width at a time (WhatsApp's own mobile pattern) instead of
          squeezing both into a screen too narrow for either. */}
      <Box sx={{ display: "flex", height: { xs: 560, md: 640 }, border: `1px solid ${tokens.border}`, borderRadius: 2, overflow: "hidden" }}>
        <ConversationList
          businessId={business.id}
          activeId={active?.id ?? null}
          onSelect={setActive}
          hideOnMobile={!!active}
        />
        <ChatWindow
          conversation={active}
          businessId={business.id}
          currentUsersId={usersId}
          onBack={() => setActive(null)}
        />
      </Box>
    </>
  );
}
