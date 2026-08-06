import { NextResponse } from "next/server";

/**
 * POST /api/team/invite
 *
 * Team Management is currently disabled sitewide - cut when subscriptions
 * were removed (flat 20% platform fee, no more plan tiers to gate this
 * behind). The original working implementation (session-scoped insert into
 * business_team_members, RLS-enforced ownership check, invite email) is
 * preserved in git history and in the earlier turns of this build's
 * conversation if this needs to come back later - not duplicated here to
 * avoid confusing dead code sitting alongside the live route.
 */
export async function POST() {
  return NextResponse.json({ error: "Team management is not currently available." }, { status: 403 });
}
