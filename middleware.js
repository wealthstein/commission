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
    .select("access_granted")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userRowError) {
    console.error("middleware: failed to fetch user row", userRowError.message);
  }

  if (!userRow?.access_granted) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};