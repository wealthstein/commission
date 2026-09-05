// Shared across every Inbox marketing illustration (InboxDemoIllustration,
// InboxHeroDemo, InboxFeatureIllustrations, InboxPipelineStageIllustrations)
// so a person's avatar color is consistent wherever they show up, rather
// than each file picking its own colors independently.
//
// Light-tinted background + a darker, matching text color per variant -
// deliberately not the solid/full-saturation hue with white text used
// before. bgcolor here is a pastel tint of the corresponding named color,
// not the brand yellow repeated for every avatar.
export const AVATAR_VARIANTS = [
  { bg: "#EDE9FE", text: "#7C3AED" }, // purple
  { bg: "#DBEAFE", text: "#2563EB" }, // blue
  { bg: "#D1FAE5", text: "#059669" }, // green
  { bg: "#FCE7F3", text: "#DB2777" }, // rose
  { bg: "#FFEDD5", text: "#EA580C" }, // orange
  { bg: "#CCFBF1", text: "#0D9488" }, // teal
  { bg: "#FEF3C7", text: "#92400E" }, // light amber (a tint of the brand yellow, not the solid color itself)
];

/**
 * Deterministic - the same name always resolves to the same variant, both
 * within one file's re-renders and across every other file that also
 * calls this for the same name (e.g. "Amaka Okafor" gets the same color
 * in the hero, the full demo, and the feature illustrations). Uses a
 * standard polynomial string hash rather than a plain character-code sum -
 * summing tends to cluster names into the same few buckets (most English
 * names sum to a similar range), which put contacts shown side by side in
 * the same conversation list on the identical color more than once when
 * this was first tried against the actual demo data.
 */
export function avatarColorForName(name) {
  let hash = 0;
  for (const ch of name || "") {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0; // >>> 0 keeps this an unsigned 32-bit int, avoiding negative modulo
  }
  return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
}
