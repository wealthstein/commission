import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";
import { industryPages } from "@/lib/industryPages";
import { comparisons } from "@/lib/comparisons";
import { conversions, locations, challenges, campaignTypes, features, solutions, integrations } from "@/lib/siteSections";
import { urls } from "@/lib/urls";
import { listPrograms } from "@/lib/programs";

// Search engines and the sitemaps spec cap a single sitemap file at 50,000
// URLs. Staying comfortably under that lets us add a bit of headroom
// without immediately needing to re-chunk.
const PAGE_SIZE = 45000;

// Regenerate each chunk at most hourly rather than on every crawl request.
export const revalidate = 3600;

/** Builds an index-page + one detail-page entry per item for one of the six site-section categories. */
function buildSectionSitemapEntries(indexUrl, buildItemUrl, items) {
  return [
    { url: `${SITE_URL}${indexUrl}`, changeFrequency: "weekly", priority: 0.6 },
    ...items.map((item) => ({ url: `${SITE_URL}${buildItemUrl(item.slug)}`, changeFrequency: "monthly", priority: 0.55 })),
  ];
}

async function countActiveProducts(supabase) {
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active");
  return count || 0;
}

/**
 * Tells Next.js how many sitemap files to build. IDs 0..N-1 each hold up to
 * PAGE_SIZE product URLs. The final ID (N) holds every other URL type
 * (marketing pages, businesses, category hubs) — these are far lower
 * volume, so one extra file comfortably fits all of them.
 *
 * Next serves each chunk at /sitemap/<id>.xml. See
 * app/sitemap-index.xml/route.js for the index file that lists them all —
 * that is the single URL you submit to Google Search Console / Bing Webmaster Tools.
 */
export async function generateSitemaps() {
  const supabase = createAdminSupabaseClient();
  const productCount = await countActiveProducts(supabase);
  const productPages = Math.max(1, Math.ceil(productCount / PAGE_SIZE));
  const staticPageId = productPages; // one extra id for everything else

  // ids 0..productPages-1 => product chunks, id productPages => static/business/category chunk
  return Array.from({ length: productPages + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }) {
  const supabase = createAdminSupabaseClient();
  const productCount = await countActiveProducts(supabase);
  const productPages = Math.max(1, Math.ceil(productCount / PAGE_SIZE));
  const staticPageId = productPages;

  // The final chunk: marketing pages, every business, every category hub,
  // and every curated company/industry keyword-target page.
  if (id === staticPageId) {
    const { data: businesses } = await supabase.from("businesses").select("slug, updated_at");
    const seoTargets = listPrograms();

    const entries = [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}${urls.industriesIndex()}`, changeFrequency: "weekly", priority: 0.9 },
      { url: `${SITE_URL}${urls.comparisonsIndex()}`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${SITE_URL}${urls.programsIndex()}`, changeFrequency: "daily", priority: 0.8 },
      { url: `${SITE_URL}${urls.calculator()}`, changeFrequency: "weekly", priority: 0.75 },
      ...buildSectionSitemapEntries(urls.conversionsIndex(), urls.conversion, conversions),
      ...buildSectionSitemapEntries(urls.locationsIndex(), urls.location, locations),
      ...buildSectionSitemapEntries(urls.challengesIndex(), urls.challenge, challenges),
      ...buildSectionSitemapEntries(urls.campaignsIndex(), urls.campaign, campaignTypes),
      ...buildSectionSitemapEntries(urls.featuresIndex(), urls.feature, features),
      ...buildSectionSitemapEntries(urls.solutionsIndex(), urls.solution, solutions),
      ...buildSectionSitemapEntries(urls.integrationsIndex(), urls.integration, integrations),
      ...industryPages.map((p) => ({
        url: `${SITE_URL}${urls.industry(p.slug)}`,
        changeFrequency: "weekly",
        priority: 0.85,
      })),
      ...comparisons.map((c) => ({
        url: `${SITE_URL}${urls.comparison(c.slug)}`,
        changeFrequency: "monthly",
        priority: 0.7,
      })),
      ...CATEGORIES.map((c) => ({
        url: `${SITE_URL}${urls.category(c.slug)}`,
        changeFrequency: "daily",
        priority: 0.8,
      })),
      ...(businesses || []).map((b) => ({
        url: `${SITE_URL}${urls.business(b.slug)}`,
        lastModified: b.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
      // Once claimed, /programs/[slug] permanently redirects to the real
      // business page — no point listing the placeholder URL too.
      ...(seoTargets || [])
        .filter((t) => !t.claimed_business_slug)
        .map((t) => ({
          url: `${SITE_URL}${urls.program(t.route_slug)}`,
          changeFrequency: "monthly",
          priority: 0.5,
        })),
      { url: `${SITE_URL}${urls.about()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.contact()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.careers()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.corporateIndex()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.terms()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.privacy()}`, changeFrequency: "yearly", priority: 0.3 },
      { url: `${SITE_URL}${urls.security()}`, changeFrequency: "yearly", priority: 0.3 },
    ];
    return entries;
  }

  // A product chunk: PAGE_SIZE product/affiliate-program pages, offset by id.
  const from = id * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at, businesses(slug)")
    .eq("status", "active")
    .order("id", { ascending: true }) // stable order so pagination does not skip/duplicate rows as data changes
    .range(from, to);

  return (products || [])
    .filter((p) => p.businesses?.slug)
    .map((p) => ({
      url: `${SITE_URL}${urls.product(p.businesses.slug, p.slug)}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
}
