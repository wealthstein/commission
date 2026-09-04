"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!conversationId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inbox_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error) setMessages(data || []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbox_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((old) => {
            if (payload.eventType === "INSERT") {
              if (old.some((m) => m.id === payload.new.id)) return old;
              return [...old, payload.new];
            }
            if (payload.eventType === "UPDATE") {
              return old.map((m) => (m.id === payload.new.id ? payload.new : m));
            }
            return old;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  return { messages, loading };
}
