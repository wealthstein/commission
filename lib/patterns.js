import { tokens } from "@/lib/theme";

/**
 * A subtle repeating dot texture, applied via CSS background-image rather
 * than an actual image asset (no file to load, scales infinitely, easy to
 * recolor). Used to visually group the bottom "closing" zone of a page
 * (Pricing -> FAQ -> final CTA) as one continuous region, matching the
 * reference site's pattern.
 */
export const dotPatternSx = {
  backgroundImage: `radial-gradient(${tokens.border} 1px, transparent 1px)`,
  backgroundSize: "18px 18px",
};

/** Alternating light section background - used to separate sections by
 * color instead of a border line. */
export const altSectionBg = "#F7F6F2";
