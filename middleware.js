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

  const { data: userRow } = await supabase
    .from("users")
    .select("access_granted, phone_verified")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!userRow?.access_granted) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // Phone verification gate - same shape as access_granted above. The
  // Account page itself is exempt, otherwise there would be no way to
  // ever reach the page that lets someone actually verify.
  if (!userRow?.phone_verified && req.nextUrl.pathname !== "/dashboard/account") {
    return NextResponse.redirect(new URL("/dashboard/account", req.url));
  }

  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};