/**
 * Every comparison page and industry page needs two CTA buttons - one for
 * businesses, one for affiliates - and the wording should not be identical
 * across every single page (repetitive copy reads as templated and hurts
 * both conversion and how these pages are perceived by search engines).
 * pickCta() is deterministic per slug (same page always shows the same
 * pair on reload) rather than random, using a simple string hash.
 */
/**
 * Every comparison page and industry page needs two CTA buttons - one for
 * businesses, one for affiliates - and the wording should not be identical
 * across every single page (repetitive copy reads as templated and hurts
 * both conversion and how these pages are perceived by search engines).
 * pickCta() is deterministic per slug (same page always shows the same
 * pair on reload) rather than random, using a simple string hash.
 *
 * The dashboard is not open for general signup yet, so every variant below
 * is framed as requesting an account rather than joining a waitlist - that
 * word never appears anywhere user-facing.
 */
const BUSINESS_CTAS = [
  "Request your business account",
  "Get early access",
  "Reserve your spot",
  "Claim your business account",
  "Get started early",
  "Secure your account",
];

const AFFILIATE_CTAS = [
  "Request your affiliate account",
  "Get early access",
  "Reserve your spot",
  "Claim your affiliate account",
  "Start earning early",
  "Secure your spot",
];

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
