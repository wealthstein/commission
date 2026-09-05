import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/waitlist/join
 * body: { firstName, email, phone, role, sourcePage }
 *
 * The lead-magnet form embedded on every industry, program, and comparison
 * page (components/marketing/RequestAccountForm.js). Framed to the user as
 * "Request an account" rather than a waitlist, since the dashboard is not
 * open for general signup yet.
 */
export async function POST(req) {
  const { firstName, email, phone, role, sourcePage } = await req.json();

  if (!firstName || !email || !phone || !role) {
    return NextResponse.json({ error: "firstName, email, phone, and role are required" }, { status: 400 });
  }
  if (!["business", "affiliate"].includes(role)) {
    return NextResponse.json({ error: "role must be business or affiliate" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("growth_waitlist_requests")
    .upsert(
      { first_name: firstName, email, phone, role, source_page: sourcePage ?? null },
      { onConflict: "email,role" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
