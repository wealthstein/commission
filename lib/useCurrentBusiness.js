"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

/**
 * Resolves the current auth user -> users row -> their business, the same
 * three-step lookup already repeated inline across most dashboard pages
 * (see app/dashboard/campaigns/page.js). Pulled into one hook here because
 * Inbox has several pages that all need it, but the underlying lookup is
 * unchanged - just centralized.
 *
 * Includes active team members (business_team_members), not just the
 * owner, since Inbox is a multi-user feature by design - the equivalent
 * inline lookups elsewhere in the dashboard mostly only check owner_id
 * today (team management is still being rolled out), but there is no
 * reason Inbox itself should be owner-only.
 */
export function useCurrentBusiness() {
  const [state, setState] = useState({ loading: true, business: null, usersId: null, role: null });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        if (!cancelled) setState({ loading: false, business: null, usersId: null, role: null });
        return;
      }

      const { data: userRow } = await supabase
        .from("core_users")
        .select("id")
        .eq("auth_user_id", authUser.id)
        .single();

      if (!userRow) {
        if (!cancelled) setState({ loading: false, business: null, usersId: null, role: null });
        return;
      }

      // Owned business first (the common case).
      const { data: owned } = await supabase
        .from("core_businesses")
        .select("id, name, plan")
        .eq("owner_id", userRow.id)
        .maybeSingle();

      if (owned) {
        if (!cancelled) setState({ loading: false, business: owned, usersId: userRow.id, role: "owner" });
        return;
      }

      // Otherwise, an active team membership on someone else's business.
      const { data: membership } = await supabase
        .from("core_business_team_members")
        .select("role, core_businesses(id, name, plan)")
        .eq("user_id", userRow.id)
        .eq("status", "active")
        .maybeSingle();

      if (!cancelled) {
        setState({
          loading: false,
          business: membership?.businesses ?? null,
          usersId: userRow.id,
          role: membership?.role ?? null,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
