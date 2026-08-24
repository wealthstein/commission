import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import { requiresAffiliateContactSharing } from "@/lib/leadForwarding";

/**
 * POST /api/leads/[leadId]/confirm-sale
 * body: { reportedSaleAmountNaira?, reportedCommissionNaira, notes? }
 *
 * Physical-closing industries only (real estate for now). This does NOT
 * move money - Commission never has custody of a sale that closed off-
 * platform (client paid the business directly, business paid the
 * affiliate directly), so there is nothing to disburse and no platform
 * fee is taken here. This creates an auditable record only, backing the
 * anti-circumvention clause in Terms - only the tier-1 (primary) affiliate
 * on the originating lead is credited, since tier 2/3 already earned
 * their share at the automatic IQL stage.
 */
export async function POST(req, { params }) {
  const { reportedSaleAmountNaira, reportedCommissionNaira, notes } = await req.json();
  if (!reportedCommissionNaira || reportedCommissionNaira <= 0) {
    return NextResponse.json({ error: "reportedCommissionNaira is required and must be positive" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  const { data: lead } = await admin
    .from("leads")
    .select("id, status, enrollment_id, affiliate_programs(campaigns(business_id, businesses(id, industry)))")
    .eq("id", params.leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (lead.status !== "qualified") {
    return NextResponse.json({ error: "Only a qualified (Intent Qualified) lead can have a sale confirmed against it." }, { status: 400 });
  }

  const business = lead.affiliate_programs.campaigns.businesses;
  if (!requiresAffiliateContactSharing(business)) {
    return NextResponse.json(
      { error: "Manual sale confirmation is only available for real estate campaigns." },
      { status: 403 }
    );
  }

  const { data: userRow } = await admin.from("users").select("id").eq("auth_user_id", authUser.id).single();

  // Tier-1 affiliate resolved from the lead's own enrollment - not
  // manually selected by the business, so there is no room to credit the
  // wrong person.
  const { data: enrollment } = await admin.from("affiliate_enrollments").select("affiliate_id").eq("id", lead.enrollment_id).single();
  if (!enrollment) {
    return NextResponse.json({ error: "Could not resolve the referring affiliate for this lead." }, { status: 500 });
  }

  // Inserted through the session-scoped client, not admin - RLS
  // (sale_confirmations_insert in schema.sql) enforces that only the
  // business owner or an active team admin can create this record.
  const { data: confirmation, error } = await supabase
    .from("manual_sale_confirmations")
    .insert({
      lead_id: lead.id,
      business_id: business.id,
      affiliate_id: enrollment.affiliate_id,
      reported_sale_amount_naira: reportedSaleAmountNaira || null,
      reported_commission_naira: reportedCommissionNaira,
      confirmed_by: userRow.id,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ confirmation });
}
