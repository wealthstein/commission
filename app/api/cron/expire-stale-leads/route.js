import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

const EXPIRE_AFTER_DAYS = 30;
const SYSTEM_REJECTED_REASON = `Automatically expired - never completed qualification within ${EXPIRE_AFTER_DAYS} days`;

/**
 * GET/POST /api/cron/expire-stale-leads
 * Intended to run daily via an external scheduler (cron-job.org, same
 * pattern as /api/cron/outreach and /api/cron/wallet-nudge) - NOT added to
 * vercel.json's native crons array. Vercel's Hobby tier has a real limit
 * on how many native cron jobs are allowed, and /api/payouts/run already
 * occupies that slot; the other two jobs already work around this the
 * same way, so this follows the established pattern rather than
 * introducing a third approach.
 *
 * A lead that's been sitting in 'captured' status for EXPIRE_AFTER_DAYS
 * with no qualification is auto-rejected, using the same status/reason
 * mechanism app/api/leads/[leadId]/reject/route.js already uses for a
 * business's own manual rejections - this is just the system doing the
 * same thing on a timer, not a new mechanism.
 *
 * Deliberately does NOT touch Radar's trust scoring, for the identical
 * reason the manual reject route doesn't - lib/trustScore.js only counts
 * 'qualified' vs total captured, and an auto-expired lead still counts
 * toward "total captured" either way, so this doesn't quietly help or
 * hurt any affiliate's trust number by existing.
 */
export async function GET(req) {
  return runExpireBatch(req);
}
export async function POST(req) {
  return runExpireBatch(req);
}

async function runExpireBatch(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - EXPIRE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleLeads, error: fetchError } = await supabase
    .from("affiliate_leads")
    .select("id")
    .eq("status", "captured")
    .lt("created_at", cutoff);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!staleLeads || staleLeads.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const { error: updateError } = await supabase
    .from("affiliate_leads")
    .update({ status: "rejected", rejected_reason: SYSTEM_REJECTED_REASON })
    .in(
      "id",
      staleLeads.map((l) => l.id)
    );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ expired: staleLeads.length });
}
