/**
 * Content for /locations/[slug] - matches the "Locations" column in the
 * internal-links sketch. Lightweight on purpose: full location x industry
 * pSEO scaling (e.g. /industries/real-estate-in-lagos) is future work, not
 * built in this pass - these are single, real pages for the four cities in
 * the sketch.
 */
export const locationPages = [
  { slug: "lagos", cityName: "Lagos" },
  { slug: "abuja", cityName: "Abuja" },
  { slug: "port-harcourt", cityName: "Port Harcourt" },
  { slug: "asaba", cityName: "Asaba" },
];

export function getLocationPageBySlug(slug) {
  return locationPages.find((l) => l.slug === slug) || null;
}
