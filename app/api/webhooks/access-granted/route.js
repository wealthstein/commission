import { NextResponse } from "next/server";
import { sendApprovalEmail } from "@/lib/email";
import { urls } from "@/lib/urls";

/**
 * POST /api/webhooks/access-granted
 * Called by the Postgres trigger in
 * supabase/migration_access_granted_webhook.sql the moment
 * users.access_granted flips to true - including a manual edit in
 * Table Editor, which is the current workflow for granting access.
 *
 * Protected by DB_WEBHOOK_SECRET (a shared secret, not user auth - this
 * is Postgres calling out to the app, not a signed-in person) so nobody
 * else can hit this route and trigger fake approval emails.
 */
export async function POST(req) {
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.DB_WEBHOOK_SECRET || secret !== process.env.DB_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, fullName } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const firstName = fullName ? fullName.split(" ")[0] : "there";

  await sendApprovalEmail({
    to: email,
    firstName,
    dashboardUrl: `${req.nextUrl.origin}${urls.dashboard()}`,
  });

  return NextResponse.json({ ok: true });
}