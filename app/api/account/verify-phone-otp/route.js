import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { verifyOtp } from "@/lib/sms";

/**
 * POST /api/account/verify-phone-otp
 * body: { pin }
 *
 * On success, sets phone_verified true - this is the gate middleware.js
 * checks before letting a user reach anything but the Account page.
 */
export async function POST(req) {
  const { pin } = await req.json();
  if (!pin) {
    return NextResponse.json({ error: "pin is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: userRow } = await supabase
    .from("core_users")
    .select("id, phone_otp_pin_id, phone_otp_expires_at")
    .eq("auth_user_id", authUser.id)
    .single();
  if (!userRow?.phone_otp_pin_id) {
    return NextResponse.json({ error: "No pending verification - request a new code first" }, { status: 400 });
  }
  if (new Date(userRow.phone_otp_expires_at) < new Date()) {
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  let verified;
  try {
    verified = await verifyOtp(userRow.phone_otp_pin_id, pin);
  } catch (err) {
    return NextResponse.json({ error: `Could not verify code: ${err.message}` }, { status: 502 });
  }
  if (!verified) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("core_users")
    .update({ phone_verified: true, phone_otp_pin_id: null, phone_otp_expires_at: null })
    .eq("id", userRow.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
