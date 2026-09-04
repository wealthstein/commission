"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function usePresence(businessId, usersId) {
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  useEffect(() => {
    if (!businessId || !usersId) return;
    const supabase = createClient();

    const channel = supabase.channel(`inbox-presence:${businessId}`, {
      config: { presence: { key: usersId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ users_id: usersId, online_at: new Date().toISOString() });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [businessId, usersId]);

  return onlineUserIds;
}
