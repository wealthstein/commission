import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function requireSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * PATCH /api/team/[memberId]
 * body: { role: "admin" | "member" }
 */
export async function PATCH(req, { params }) {
  const { role } = await req.json();
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
  }

  const { supabase, user } = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("business_team_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", params.memberId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ member: data });
}

/**
 * DELETE /api/team/[memberId]
 * Revokes rather than hard-deletes, so there is a record of who used to
 * have access. RLS still lets the owner/an admin do this - a plain
 * member cannot remove anyone, including themselves, through this route.
 */
export async function DELETE(_req, { params }) {
  const { supabase, user } = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { error } = await supabase
    .from("business_team_members")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", params.memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
