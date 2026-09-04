"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useMessageSearch(businessId, query) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!businessId || query.trim().length < 3) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const supabase = createClient();

    const timeout = setTimeout(async () => {
      const { data, error } = await supabase.rpc("inbox_search_messages", {
        search_business_id: businessId,
        search_query: query,
      });
      if (!cancelled) {
        if (!error) setResults(data || []);
        setSearching(false);
      }
    }, 250); // small debounce - avoids firing on every keystroke

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [businessId, query]);

  return { results, searching };
}
