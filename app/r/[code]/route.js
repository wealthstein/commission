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
 *     capture the lead before it can go anywhere further into the funnel.
 *   'sale' -> the BUSINESS'S OWN WEBSITE, with ?ref= appended. Checkout no
 *     longer initiates from a commission.ng page at all - the business's
 *     own site calls Commission.initiateSaleCheckout() (see
 *     public/commission-track.js and app/api/sales/initiate-checkout) from
 *     their own "Subscribe"/"Buy" button, which is what actually generates
 *     the Paystack link. A website is required at campaign creation for
 *     any sale-goal campaign specifically because of this - a customer
 *     completing a real purchase, especially a recurring one, needs to
 *     feel like they're buying from the actual business, not a page on an
 *     unfamiliar third-party domain.
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
  } else if (business.website_url) {
    destination = new URL(business.website_url);
    destination.searchParams.set("ref", code);
  } else {
    // Data-integrity fallback only, not the intended path - a website is
    // required at campaign creation for sale-goal campaigns now (see
    // app/dashboard/campaigns/new), so this should only ever fire for a
    // campaign created before that requirement existed. Falls back to the
    // old Commission-hosted Paystack checkout rather than a dead end.
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
