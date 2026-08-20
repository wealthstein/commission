import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  if (!req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const { data: userRow, error: userRowError } = await supabase
    .from("users")
    .select("access_granted, phone_verified")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userRowError) {
    // Making this loud on purpose - a silently-swallowed query error here
    // is exactly what made the missing phone_verified column confusing to
    // diagnose. Falls through to the same access_granted check below,
    // which already handles a null userRow safely.
    console.error("middleware: failed to fetch user row", userRowError.message);
  }

  if (!userRow?.access_granted) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // Phone verification gate - same shape as access_granted above. The
  // Account page itself is exempt, otherwise there would be no way to
  // ever reach the page that lets someone actually verify.
  //
  // TEMPORARILY DISABLED via env var - Termii's account needs country/DND
  // activation from their support team before OTPs can send at all
  // ("Country Inactive" error). Nothing about the feature itself changed -
  // the UI, the OTP routes, the schema are all still there. Remove
  // DISABLE_PHONE_VERIFICATION_GATE from the environment (or set it to
  // anything other than "true") to turn this back on once Termii confirms
  // activation.
  const gateDisabled = process.env.DISABLE_PHONE_VERIFICATION_GATE === "true";
  if (!gateDisabled && !userRow?.phone_verified && req.nextUrl.pathname !== "/dashboard/account") {
    return NextResponse.redirect(new URL("/dashboard/account", req.url));
  }

  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};
