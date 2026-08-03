import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { qualifyLead } from "@/lib/leadQualification";

/**
 * POST /api/leads/[leadId]/qualify
 * body: { approve?: boolean, postbackToken?: string }
 *
 * For a business that qualifies leads on its own terms rather than sending
 * the prospect through Commission's hosted Long Form (see app/api/leads/continue
 * for that public path instead). Two ways to call this, both ending at the
 * same place:
 *   1. A business user, signed in, confirming a lead from their dashboard
 *      (see app/dashboard/transactions (Leads tab)) - normal session auth.
 *   2. A business's own CRM calling this directly with the program's
 *      postback_token instead of a human filling out a form - no session
 *      needed, for advanced integrations.
 *
 * The caller already has the lead's full details themselves (they are the
 * ones confirming it), so nothing needs forwarding here - unlike
 * app/api/leads/continue, which is where a prospect submits NEW information
 * Commission has to pass along to the business.
 */
export async function POST(req, { params }) {
  const body = await req.json();
  const admin = createAdminSupabaseClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", params.leadId).single();
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (lead.status !== "captured") {
    return NextResponse.json({ error: `Lead is already ${lead.status}` }, { status: 400 });
  }

  const { data: program } = await admin
    .from("affiliate_programs")
    .select("*, products(name, business_id, businesses(id, plan, wallet_balance_naira))")
    .eq("id", lead.program_id)
    .single();
  const business = program.products.businesses;

  // --- Authorization: either a signed-in owner of this business, or a valid postback token ---
  let authorized = body.postbackToken && body.postbackToken === program.postback_token;
  if (!authorized) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single();
      const { data: ownedBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", business.id)
        .eq("owner_id", userRow?.id)
        .maybeSingle();
      authorized = !!ownedBusiness;
    }
  }
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized to qualify this lead" }, { status: 401 });
  }

  if (body.approve === false) {
    await admin.from("leads").update({ status: "rejected" }).eq("id", lead.id);
    return NextResponse.json({ status: "rejected" });
  }

  try {
    const { chargeAmount, commissions } = await qualifyLead(admin, { lead, program, business });

    await admin
      .from("leads")
      .update({ status: "qualified", qualified_at: new Date().toISOString(), charge_amount_naira: chargeAmount })
      .eq("id", lead.id);

    return NextResponse.json({ status: "qualified", chargeAmount, commissions });
  } catch (err) {
    return NextResponse.json({ error: `Could not qualify: ${err.message}` }, { status: 402 });
  }
}
