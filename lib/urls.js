/**
 * Every URL on the site, in ONE place. Nowhere else should ever write out
 * a path like `/comparisons/${slug}` by hand - import the matching
 * function from here instead. Changing where a content type lives (like
 * moving comparisons between a bare URL and a nested one, which happened
 * more than once) becomes a one-line edit here instead of a hunt through
 * every route file, index page, form, sitemap entry, and internal-link
 * column that happened to hardcode the old path.
 */

export const urls = {
  home: () => "/",

  industry: (slug) => `/industries/${slug}`,
  industriesIndex: () => "/industries",

  comparison: (slug) => `/comparisons/${slug}`,
  comparisonsIndex: () => "/comparisons",

  program: (routeSlug) => `/programs/${routeSlug}`,
  programsIndex: () => "/programs",
  // Explicit two-arg forms for the nested /programs/[industry]/[company]
  // structure - use these when you have the two slugs separately rather
  // than a pre-joined route_slug.
  programIndustry: (industrySlug) => `/programs/${industrySlug}`,
  programCompany: (industrySlug, companySlug) => `/programs/${industrySlug}/${companySlug}`,

  conversion: (slug) => `/conversions/${slug}`,
  conversionsIndex: () => "/conversions",

  location: (slug) => `/locations/${slug}`,
  locationsIndex: () => "/locations",

  challenge: (slug) => `/challenges/${slug}`,
  challengesIndex: () => "/challenges",

  campaign: (slug) => `/campaigns/${slug}`,
  campaignsIndex: () => "/campaigns",

  feature: (slug) => `/features/${slug}`,
  featuresIndex: () => "/features",

  solution: (slug) => `/solutions/${slug}`,
  solutionsIndex: () => "/solutions",

  integration: (slug) => `/integrations/${slug}`,
  integrationsIndex: () => "/integrations",

  corporateIndex: () => "/corporate",
  about: () => "/corporate/about",
  contact: () => "/corporate/contact",
  careers: () => "/corporate/careers",
  terms: () => "/corporate/terms",
  privacy: () => "/corporate/privacy",
  security: () => "/corporate/security",

  calculator: (audience) => `/calculator${audience ? `?for=${audience}` : ""}`,

  signin: () => "/signin",
  signup: () => "/signup",
  welcome: () => "/welcome",
  dashboard: () => "/dashboard",

  business: (slug) => `/businesses/${slug}`,
  product: (businessSlug, productSlug) => `/products/${businessSlug}/${productSlug}`,
  category: (slug) => `/categories/${slug}`,

  audienceHome: (audience, anchor) => `/?for=${audience}${anchor ? `#${anchor}` : ""}`,
};
