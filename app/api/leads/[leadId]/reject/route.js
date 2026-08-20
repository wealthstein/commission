import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/leads/[leadId]/reject
 * body: { reason }
 *
 * Sets a captured lead's status to 'rejected' with a required reason -
 * this status has been in the schema's own check constraint from the
 * start, but nothing in the real app could ever reach it once manual
 * qualification was removed (see app/dashboard/transactions/page.js's
 * lead-management comment history). This is the replacement: a business
 * flagging an obviously fake or wrong-number lead, not a way to avoid
 * paying for a genuinely qualified one - only 'captured' leads can be
 * rejected, never 'qualified' ones, since qualification already means
 * the objective, system-recorded trigger already fired and billing
 * already happened.
 *
 * Deliberately does NOT touch Radar's trust scoring (lib/trustScore.js
 * reads directly from lead status/qualified counts, untouched by this
 * route) - purely a business-side bookkeeping action for now. Wiring
 * this into trust calculations later would reopen the same self-report
 * problem worked through earlier: a business could otherwise suppress an
 * affiliate's trust score by rejecting leads for reasons that have
 * nothing to do with whether the affiliate's traffic is genuine.
 */
export async function POST(req, { params }) {
  const { reason } = await req.json();
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  const { data: userRow } = await admin.from("users").select("id").eq("auth_user_id", authUser.id).single();
  if (!userRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: lead } = await admin
    .from("leads")
    .select("id, status, affiliate_programs(products(business_id))")
    .eq("id", params.leadId)
    .maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const businessId = lead.affiliate_programs?.products?.business_id;
  const { data: business } = await admin.from("businesses").select("owner_id").eq("id", businessId).maybeSingle();
  if (business?.owner_id !== userRow.id) {
    return NextResponse.json({ error: "This lead doesn't belong to your business" }, { status: 403 });
  }

  if (lead.status !== "captured") {
    return NextResponse.json({ error: `This lead is already ${lead.status} and can't be rejected` }, { status: 400 });
  }

  const { error } = await admin.from("leads").update({ status: "rejected", rejected_reason: reason.trim() }).eq("id", lead.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "rejected" });
}
