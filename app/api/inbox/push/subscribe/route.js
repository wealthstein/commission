import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/inbox/push/subscribe
 *
 * Note on why business membership is checked here even though it isn't
 * strictly exploitable without it: the worker's notifyNewMessage()
 * computes valid recipients independently from core_businesses/
 * core_business_team_members and never trusts this row's business_id
 * column, so an unvalidated business_id here can't actually leak another
 * business's notifications today. Checked anyway - storing an
 * unvalidated business_id would be a latent footgun for any future code
 * that queries this table by business_id directly instead of re-deriving
 * legitimate recipients each time.
 */
export async function POST(req) {
  const { businessId, subscription } = await req.json();
  if (!businessId || !subscription?.endpoint) {
    return NextResponse.json({ error: "businessId and subscription are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", authUser.id).single();
  if (!userRow) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: business } = await supabase.from("core_businesses").select("owner_id").eq("id", businessId).single();
  const { data: membership } = await supabase
    .from("core_business_team_members")
    .select("status")
    .eq("business_id", businessId)
    .eq("user_id", userRow.id)
    .eq("status", "active")
    .maybeSingle();

  const isMember = business?.owner_id === userRow.id || !!membership;
  if (!isMember) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

  const { error } = await supabase.from("inbox_push_subscriptions").upsert(
    { business_id: businessId, user_id: userRow.id, endpoint: subscription.endpoint, keys: subscription.keys },
    { onConflict: "endpoint" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
