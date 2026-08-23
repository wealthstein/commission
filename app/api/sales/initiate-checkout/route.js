import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { initiateCheckoutForReferral } from "@/lib/checkout";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/sales/initiate-checkout
 * body: { referralCode }
 *
 * Called by Commission.initiateSaleCheckout() in public/commission-track.js,
 * from a business's own "Subscribe"/"Buy" button on their own site - not
 * from a commission.ng page. This is the piece that makes the
 * website-first sale flow real: app/r/[code] now just redirects to the
 * business's own site with ?ref= attached, and this endpoint is what
 * actually generates the Paystack checkout link once the customer decides
 * to buy there.
 *
 * Reuses initiateCheckoutForReferral - the exact same function
 * app/r/[code] used to call directly for the old commission.ng-hosted
 * checkout path - so the commission calculation and Paystack
 * initialization logic exists in exactly one place, not two slightly
 * different copies for the old and new flow.
 *
 * NOT YET IMPLEMENTED: attribution window expiry. This currently
 * attributes ANY referral_code found, regardless of how long ago the
 * click happened relative to program.attribution_days. Building real
 * expiry enforcement here surfaces an unresolved question worth deciding
 * deliberately rather than working around silently: Commission's platform
 * fee is calculated as a percentage OF the affiliate commission, so an
 * expired/unattributed sale has no commission to take a percentage of -
 * meaning Commission would earn nothing from it under the current fee
 * model. Worth a real decision (a flat fee on unattributed sales? Route
 * them through the business's own payment setup entirely, outside
 * Commission?) before building the expiry check itself.
 */
export async function POST(req) {
  const { referralCode } = await req.json();
  if (!referralCode) {
    return NextResponse.json({ error: "referralCode is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = createAdminSupabaseClient();

  const { data: enrollment } = await admin
    .from("affiliate_enrollments")
    .select("*, affiliate_programs(*, products(*, businesses(*)))")
    .eq("referral_code", referralCode)
    .eq("status", "active")
    .maybeSingle();

  const program = enrollment?.affiliate_programs;
  const product = program?.products;
  const business = product?.businesses;

  if (!enrollment || product?.status !== "active" || program.conversion_goal !== "sale") {
    return NextResponse.json({ error: "This referral link is no longer valid for a sale checkout" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const authorizationUrl = await initiateCheckoutForReferral(admin, {
      enrollment,
      program,
      product,
      business,
      referralCode,
    });
    return NextResponse.json({ authorizationUrl }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
