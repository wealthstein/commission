"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useConversations(businessId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!businessId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inbox_conversations")
      .select("*, contact:inbox_contacts(*), connection:inbox_whatsapp_connections(id, label, phone_number)")
      .eq("business_id", businessId)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (!error) setConversations(data || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!businessId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-conversations:${businessId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbox_conversations", filter: `business_id=eq.${businessId}` },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [businessId, load]);

  return { conversations, loading, reload: load };
}
