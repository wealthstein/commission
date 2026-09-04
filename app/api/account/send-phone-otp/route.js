import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { sendOtp } from "@/lib/sms";

/**
 * POST /api/account/send-phone-otp
 * body: { phone }
 *
 * Sends a code to the phone number the user entered on their own Account
 * page. This is required before the dashboard is usable at all (see
 * middleware.js's phone_verified gate) - not just for leads.
 */
export async function POST(req) {
  const { phone } = await req.json();
  if (!phone || phone.length !== 11) {
    return NextResponse.json({ error: "A valid 11-digit phone number is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: userRow } = await supabase.from("core_users").select("id, full_name").eq("auth_user_id", authUser.id).single();
  if (!userRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let sent;
  try {
    sent = await sendOtp(phone, "Commission");
  } catch (err) {
    // TEMPORARY DIAGNOSTIC - remove once the provider switch is confirmed
    // working. This puts an unmistakable marker plus the live value of
    // SMS_PROVIDER directly in the response, so the next test tells us
    // definitively whether this exact code is even running at all, and
    // whether the environment variable is actually being read as
    // "sendchamp" - no more inferring this from dashboards or commit
    // hashes.
    return NextResponse.json(
      {
        error: `Could not send verification code: ${err.message}`,
        _diagnostic_marker: "SMS_PROVIDER_SWITCH_BUILD_2026_08_16",
        _diagnostic_sms_provider_env: process.env.SMS_PROVIDER || "(not set)",
      },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("core_users")
    .update({
      phone,
      phone_verified: false,
      phone_otp_pin_id: sent.pinId,
      phone_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .eq("id", userRow.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
