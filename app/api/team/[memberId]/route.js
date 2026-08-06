import { NextResponse } from "next/server";

/**
 * PATCH/DELETE /api/team/[memberId]
 *
 * Team Management is currently disabled sitewide - see
 * app/api/team/invite/route.js for the full explanation. Original working
 * implementation preserved in git history if this comes back later.
 */
export async function PATCH() {
  return NextResponse.json({ error: "Team management is not currently available." }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Team management is not currently available." }, { status: 403 });
}
