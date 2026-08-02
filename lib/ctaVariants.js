import ctaData from "@/content/ctaVariants.json";

/**
 * Every comparison page and industry page needs two CTA buttons - one for
 * businesses, one for affiliates - and the wording should not be identical
 * across every single page (repetitive copy reads as templated and hurts
 * both conversion and how these pages are perceived by search engines).
 * pickCtaPair() is deterministic per slug (same page always shows the same
 * pair on reload) rather than random, using a simple string hash.
 *
 * The dashboard is not open for general signup yet, so every variant in
 * content/ctaVariants.json is framed as requesting an account rather than
 * joining a waitlist - that word never appears anywhere user-facing.
 */
const BUSINESS_CTAS = ctaData.businessCtas;
const AFFILIATE_CTAS = ctaData.affiliateCtas;

function hashSlug(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickCtaPair(slug) {
  const hash = hashSlug(slug);
  return {
    businessCta: BUSINESS_CTAS[hash % BUSINESS_CTAS.length],
    affiliateCta: AFFILIATE_CTAS[(hash >> 3) % AFFILIATE_CTAS.length],
  };
}
