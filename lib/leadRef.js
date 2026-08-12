/**
 * Generates a short, human-typeable reference code for a new lead. Used
 * to identify a specific lead in the Intent Form URL
 * (/leads/[ref]/continue) without exposing the raw database id.
 */
export function generateLeadRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let ref = "LD-";
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}
