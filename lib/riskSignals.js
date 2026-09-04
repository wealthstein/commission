/**
 * Passive, invisible lead-qualification signals - computed silently at
 * capture time, from data the flow already produces, no customer-facing
 * action required. This is what makes it genuinely universal: it runs
 * identically whether a business uses Commission's hosted page or their
 * own site via the tracking script, and needs zero technical integration
 * work from the business either way.
 *
 * Deliberately produces a probability-flavored set of flags, not a
 * certainty the way OTP is. A patient, deliberate bad actor could still
 * fake plausible timing - this raises the bar above nothing, it doesn't
 * prove genuine interest the way an effortful action does.
 */
import crypto from "crypto";

const FAST_FILL_THRESHOLD_MS = 3000; // under 3 seconds from first interaction to submit
const LOW_TIME_ON_PAGE_THRESHOLD_MS = 2000; // under 2 seconds from page load to submit
const CROSS_CAMPAIGN_WINDOW_HOURS = 24;
const CROSS_CAMPAIGN_MIN_DISTINCT_PROGRAMS = 2; // same phone/IP across 2+ different campaigns in the window

/**
 * One-way hash, never reversible back to the original value - see the
 * migration's own comment for why this table stores hashes instead of
 * raw phone numbers/IPs.
 */
export function hashIdentifier(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/**
 * Timing-based flags - fully implemented, zero external dependency.
 * @param {object} timing - { pageLoadedAt, firstInteractionAt, submittedAt } as ISO strings or Date, all optional
 * @returns {string[]}
 */
export function computeTimingFlags(timing) {
  const flags = [];
  if (!timing) return flags;

  const submittedAt = timing.submittedAt ? new Date(timing.submittedAt) : new Date();

  if (timing.firstInteractionAt) {
    const fillDurationMs = submittedAt - new Date(timing.firstInteractionAt);
    if (fillDurationMs >= 0 && fillDurationMs < FAST_FILL_THRESHOLD_MS) {
      flags.push("fast_fill");
    }
  }

  if (timing.pageLoadedAt) {
    const timeOnPageMs = submittedAt - new Date(timing.pageLoadedAt);
    if (timeOnPageMs >= 0 && timeOnPageMs < LOW_TIME_ON_PAGE_THRESHOLD_MS) {
      flags.push("low_time_on_page");
    }
  }

  return flags;
}

/**
 * Cross-campaign pattern detection - fully implemented. Only Commission
 * itself can see this signal at all; no single business's own site could
 * ever detect it, even with full technical access, since it requires
 * visibility across every campaign platform-wide.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{phoneHash: string, ipHash: string|null, excludeProgramId: string}} params
 * @returns {Promise<string[]>}
 */
export async function computeCrossCampaignFlags(admin, { phoneHash, ipHash, excludeProgramId }) {
  const flags = [];
  const windowStart = new Date(Date.now() - CROSS_CAMPAIGN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: recentByPhone } = await admin
    .from("lead_risk_signals")
    .select("lead_id, affiliate_leads(program_id)")
    .eq("phone_hash", phoneHash)
    .gte("created_at", windowStart);

  const distinctProgramsByPhone = new Set(
    (recentByPhone || []).map((r) => r.leads?.program_id).filter((id) => id && id !== excludeProgramId)
  );
  if (distinctProgramsByPhone.size >= CROSS_CAMPAIGN_MIN_DISTINCT_PROGRAMS) {
    flags.push("cross_campaign_phone_match");
  }

  if (ipHash) {
    const { data: recentByIp } = await admin
      .from("lead_risk_signals")
      .select("lead_id, affiliate_leads(program_id)")
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart);

    const distinctProgramsByIp = new Set(
      (recentByIp || []).map((r) => r.leads?.program_id).filter((id) => id && id !== excludeProgramId)
    );
    if (distinctProgramsByIp.size >= CROSS_CAMPAIGN_MIN_DISTINCT_PROGRAMS) {
      flags.push("cross_campaign_ip_match");
    }
  }

  return flags;
}

/**
 * IP/geography plausibility - NOT YET IMPLEMENTED.
 *
 * This needs a real GeoIP lookup service, and none has been verified
 * against this codebase's actual needs yet - guessing at a third-party
 * API's field names/response shape without checking first has cost real
 * debugging time more than once this session (Termii, Sendchamp). Rather
 * than repeat that here, this is left as an explicit gap.
 *
 * Before implementing: decide on a provider (a free-tier option like
 * ip-api.com or ipapi.co, or a paid one with better reliability/rate
 * limits), verify its real request/response shape directly, and decide
 * the comparison granularity - country-level (is this even a Nigerian IP)
 * is a much simpler, more robust first pass than city-level matching,
 * which would also need a new "expected location" field on the campaign
 * itself that doesn't exist yet.
 */
export function computeGeoFlags() {
  return [];
}
