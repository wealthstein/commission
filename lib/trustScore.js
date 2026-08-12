/**
 * Radar - Commission's affiliate trust layer.
 *
 * A single live number per affiliate: qualified leads divided by total
 * captured leads, platform-wide and all-time (not per-campaign, not
 * per-business). Recalculated fresh every time this function is called -
 * there is deliberately no cached "trusted" flag stored anywhere. That
 * matters: an affiliate who earns trust with 10 good leads and then sends
 * 5,000 bad ones does not stay trusted, because their live rate drops
 * back below threshold the moment the math says so. There is no separate
 * decay mechanism needed - recalculating from raw totals on every check
 * IS the decay mechanism.
 *
 * Only two real outcomes exist: trusted or not. "New" and "Building" were
 * considered as separate labels early on and deliberately collapsed into
 * one, since they never actually behaved differently - only the trusted/
 * not-trusted distinction changes what happens for a given lead.
 */

const MIN_SAMPLE_SIZE = 10;
const TRUST_THRESHOLD = 0.7;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - admin client
 * @param {string} affiliateId - users.id
 * @returns {Promise<{trusted: boolean, totalLeads: number, qualifiedLeads: number, rate: number|null}>}
 */
export async function getAffiliateTrustStatus(supabase, affiliateId) {
  const { data: enrollments } = await supabase
    .from("affiliate_enrollments")
    .select("id")
    .eq("affiliate_id", affiliateId);

  const enrollmentIds = (enrollments || []).map((e) => e.id);
  if (enrollmentIds.length === 0) {
    return { trusted: false, totalLeads: 0, qualifiedLeads: 0, rate: null };
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("status")
    .in("enrollment_id", enrollmentIds);

  const totalLeads = leads?.length || 0;
  const qualifiedLeads = (leads || []).filter((l) => l.status === "qualified").length;

  if (totalLeads < MIN_SAMPLE_SIZE) {
    return { trusted: false, totalLeads, qualifiedLeads, rate: null };
  }

  const rate = qualifiedLeads / totalLeads;
  return { trusted: rate >= TRUST_THRESHOLD, totalLeads, qualifiedLeads, rate };
}
