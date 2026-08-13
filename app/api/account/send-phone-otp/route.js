import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { sendOtp } from "@/lib/termii";

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

  const { data: userRow } = await supabase.from("users").select("id, full_name").eq("auth_user_id", authUser.id).single();
  if (!userRow) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let sent;
  try {
    sent = await sendOtp(phone, "Commission");
  } catch (err) {
    return NextResponse.json({ error: `Could not send verification code: ${err.message}` }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("users")
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