import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/admin/outreach-contacts
 * body: { secret, contacts: [{ firstName, lastName, email, contactType }] }
 *
 * Replaces the manual "Supabase Table Editor -> CSV import" workflow
 * described in schema.sql's own comment - this is the actual form/upload
 * path that never existed before. Every inserted row starts at
 * sequence_step=0, status='active', audience='business' (the schema's own
 * defaults), which is exactly what the existing outreach cron
 * (app/api/cron/outreach) already looks for to send email 1 immediately
 * on its next run - no change needed there.
 *
 * Protected by a shared secret rather than real admin auth, since no
 * admin auth system exists in this app yet - reasonable for an internal
 * tool that's never linked from anywhere public, not reasonable if this
 * page's URL were ever shared outside the team.
 */
export async function POST(req) {
  const { secret, contacts } = await req.json();

  if (!process.env.ADMIN_OUTREACH_SECRET || secret !== process.env.ADMIN_OUTREACH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "contacts must be a non-empty array" }, { status: 400 });
  }

  const rows = contacts
    .filter((c) => c.email)
    .map((c) => ({
      email_address: c.email.trim().toLowerCase(),
      first_name: c.firstName?.trim() || null,
      last_name: c.lastName?.trim() || null,
      contact_type: c.contactType?.trim() || null,
    }));

  const supabase = createAdminSupabaseClient();

  // upsert with ignoreDuplicates rather than insert - email_address is
  // unique, and an admin pasting leads in small batches over time is
  // likely to accidentally overlap with a previous batch. A hard insert
  // would fail the entire request on the first duplicate; this silently
  // skips only the duplicate rows and still inserts everything new.
  const { data, error } = await supabase
    .from("cold_outreach_contacts")
    .upsert(rows, { onConflict: "email_address", ignoreDuplicates: true })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data.length, submitted: rows.length, skippedDuplicates: rows.length - data.length });
}
