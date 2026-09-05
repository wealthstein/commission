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
    .from("core_users")
    .select("access_granted, active_session_token")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userRowError) {
    console.error("middleware: failed to fetch user row", userRowError.message);
  }

  if (!userRow?.access_granted) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // Single active session per account: every login (app/api/auth/callback)
  // overwrites active_session_token and sets the same value as this
  // cookie. A mismatch means a more recent login happened somewhere else
  // since this cookie was set - sign this (now-stale) session out rather
  // than let two devices stay logged in simultaneously. Only enforced
  // when active_session_token is actually set (not null) - see
  // migration_single_session.sql for why a null value is deliberately
  // let through rather than force-logging out every already-logged-in
  // person the moment this ships.
  const sessionCookie = req.cookies.get("commission_session_token")?.value;
  if (userRow.active_session_token && sessionCookie !== userRow.active_session_token) {
    await supabase.auth.signOut();
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("message", "logged_out_elsewhere");
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};
