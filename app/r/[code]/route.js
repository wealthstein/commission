import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { initiateCheckoutForReferral } from "@/lib/checkout";
import { randomUUID } from "crypto";

/**
 * GET /r/:code — an affiliate's shareable referral link.
 * commission.ng/r/ABC123
 *
 * Records a click, sets a long-lived attribution cookie scoped to the
 * program's configured attribution window, then redirects the visitor.
 *
 * WHERE it redirects depends on the campaign's conversion_goal:
 *   'lead' -> Commission's own Campaign Page (the product page), because
 *     that is where the Interest Form lives — Commission needs to actually
 *     capture the lead before any WhatsApp handoff happens.
 *   'sale' -> a Commission-hosted Paystack checkout (see lib/checkout.js),
 *     where the customer pays Commission directly and Paystack splits the
 *     payment automatically between the business's own settlement account
 *     and Commission's main account (which later pays out affiliates).
 */
export async function GET(req, { params }) {
  const code = params.code;
  const supabase = createAdminSupabaseClient();

  const { data: enrollment } = await supabase
    .from("affiliate_enrollments")
    .select(
      "*, affiliate_programs(*, products(*, businesses(*)))"
    )
    .eq("referral_code", code)
    .eq("status", "active")
    .maybeSingle();

  const program = enrollment?.affiliate_programs;
  const product = program?.products;
  const business = product?.businesses;
  if (!enrollment || product?.status !== "active") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  let destination;
  if (program.conversion_goal === "lead") {
    destination = new URL(`/products/${business.slug}/${product.slug}`, req.url);
    destination.searchParams.set("ref", code);
  } else {
    try {
      const authorizationUrl = await initiateCheckoutForReferral(supabase, {
        enrollment,
        program,
        product,
        business,
        referralCode: code,
      });
      destination = new URL(authorizationUrl);
    } catch (err) {
      console.error(`Checkout initialization failed for referral ${code}:`, err.message);
      // The business has not connected a settlement account yet, or Paystack
      // itself failed - fall back to the product page rather than a dead end.
      destination = new URL(`/products/${business.slug}/${product.slug}`, req.url);
    }
  }

  const attributionDays = program.attribution_days || 30;
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

  const res = NextResponse.redirect(destination);
  res.cookies.set("cmn_ref", code, { expires: expiresAt, path: "/" });
  res.cookies.set("cmn_visitor", visitorId, { expires: expiresAt, path: "/" });
  return res;
}
