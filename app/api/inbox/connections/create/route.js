import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { inboxLimitsForPlan } from "@/lib/inboxPlanLimits";

/**
 * POST /api/inbox/connections/create
 * body: { businessId, label }
 *
 * Creates the inbox_whatsapp_connections row, then asks the worker service
 * (a separate always-on process - see /worker in this repo - Vercel's
 * serverless functions can't hold the persistent socket a WhatsApp session
 * needs) to open a pairing session for it. The worker writes qr_data /
 * status / phone_number back onto this same row as pairing proceeds - the
 * Connections page polls for those updates.
 */
export async function POST(req) {
  const { businessId, label } = await req.json();
  if (!businessId || !label) {
    return NextResponse.json({ error: "businessId and label are required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Confirm the caller actually belongs to this business before writing
  // anything - RLS backs this up too, but this gives a clearer error.
  const { data: userRow } = await supabase.from("core_users").select("id").eq("auth_user_id", authUser.id).single();
  if (!userRow) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: business } = await supabase.from("core_businesses").select("id, owner_id, plan").eq("id", businessId).single();
  const { data: membership } = await supabase
    .from("core_business_team_members")
    .select("status")
    .eq("business_id", businessId)
    .eq("user_id", userRow.id)
    .eq("status", "active")
    .maybeSingle();

  const isMember = business?.owner_id === userRow.id || !!membership;
  if (!isMember) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

  const admin = createAdminSupabaseClient();

  const { count: existingCount } = await admin
    .from("inbox_whatsapp_connections")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .neq("status", "error");

  const { maxConnections } = inboxLimitsForPlan(business?.plan);
  if (typeof existingCount === "number" && existingCount >= maxConnections) {
    return NextResponse.json(
      {
        error: maxConnections === 0
          ? "Inbox isn't included on your plan. Upgrade to connect a WhatsApp number."
          : `Your plan includes ${maxConnections} WhatsApp number${maxConnections === 1 ? "" : "s"}. Upgrade to connect another.`,
      },
      { status: 402 }
    );
  }

  const { data: connection, error } = await admin
    .from("inbox_whatsapp_connections")
    .insert({ business_id: businessId, label, status: "pending" })
    .select()
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: error?.message ?? "Failed to create connection" }, { status: 500 });
  }

  try {
    await fetch(`${process.env.INBOX_WORKER_BASE_URL}/connections/${connection.id}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INBOX_WORKER_INTERNAL_TOKEN}`,
      },
    });
  } catch (workerError) {
    // Row still exists as 'pending' - the UI shows it until the worker
    // becomes reachable, and this is safe to retry without duplicating rows.
    console.error("Inbox worker unreachable", workerError);
  }

  return NextResponse.json({ connectionId: connection.id });
}
