import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

/**
 * GET /r/:code — an affiliate's shareable referral link.
 * commission.ng/r/ABC123
 *
 * Records a click, sets a long-lived attribution cookie scoped to the
 * program's configured attribution window, then redirects the visitor
 * to the product's purchase page with the code carried in the query
 * string as a fallback for environments that drop cookies.
 */
export async function GET(req, { params }) {
  const code = params.code;
  const supabase = createAdminSupabaseClient();

  const { data: enrollment } = await supabase
    .from("affiliate_enrollments")
    .select("id, program_id, affiliate_programs(attribution_days, product_id, products(product_url, status))")
    .eq("referral_code", code)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment || enrollment.affiliate_programs?.products?.status !== "active") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const attributionDays = enrollment.affiliate_programs.attribution_days || 30;
  const destination = enrollment.affiliate_programs.products.product_url;

  let visitorId = req.cookies.get("cmn_visitor")?.value;
  if (!visitorId) visitorId = randomUUID();

  const expiresAt = new Date(Date.now() + attributionDays * 24 * 60 * 60 * 1000);

  await supabase.from("referral_clicks").insert({
    enrollment_id: enrollment.id,
    visitor_id: visitorId,
    landed_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    user_agent: req.headers.get("user-agent") ?? null,
  });

  const redirectUrl = new URL(destination);
  redirectUrl.searchParams.set("ref", code);

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("cmn_ref", code, { expires: expiresAt, path: "/" });
  res.cookies.set("cmn_visitor", visitorId, { expires: expiresAt, path: "/" });
  return res;
}
