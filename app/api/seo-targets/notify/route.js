import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * POST /api/seo-targets/notify
 * body: { routeSlug, email }
 *
 * Captures a "notify me" signup from a company/industry keyword-target page
 * (app/[slug]/page.js). Write-only from the client's perspective — see the
 * notify_requests RLS policy in supabase/schema.sql.
 */
export async function POST(req) {
  const { routeSlug, email } = await req.json();
  if (!routeSlug || !email) {
    return NextResponse.json({ error: "routeSlug and email are required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: target } = await supabase.from("growth_seo_keyword_targets").select("id").eq("route_slug", routeSlug).maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "Unknown page" }, { status: 404 });
  }

  const { error } = await supabase
    .from("growth_notify_requests")
    .upsert({ seo_target_id: target.id, email }, { onConflict: "seo_target_id,email" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
