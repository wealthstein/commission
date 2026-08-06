import { NextResponse } from "next/server";

/**
 * POST /api/team/accept
 *
 * Team Management is currently disabled sitewide - see
 * app/api/team/invite/route.js for the full explanation. Original working
 * implementation preserved in git history if this comes back later.
 */
export async function POST() {
  return NextResponse.json({ error: "Team management is not currently available." }, { status: 403 });
}
