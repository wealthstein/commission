import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/seo";
import { CATEGORIES } from "@/lib/categories";

// Search engines and the sitemaps spec cap a single sitemap file at 50,000
// URLs. Staying comfortably under that lets us add a bit of headroom
// without immediately needing to re-chunk.
const PAGE_SIZE = 45000;

// Regenerate each chunk at most hourly rather than on every crawl request.
export const revalidate = 3600;

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
 * that's the single URL you submit to Google Search Console / Bing Webmaster Tools.
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
    const { data: seoTargets } = await supabase
      .from("seo_keyword_targets")
      .select("route_slug, created_at, claimed_business_slug");

    const entries = [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      ...CATEGORIES.map((c) => ({
        url: `${SITE_URL}/categories/${c.slug}`,
        changeFrequency: "daily",
        priority: 0.8,
      })),
      ...(businesses || []).map((b) => ({
        url: `${SITE_URL}/businesses/${b.slug}`,
        lastModified: b.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
      // Once claimed, the /[slug] route 301-redirects to the real business
      // page — no point listing the placeholder URL in the sitemap too.
      ...(seoTargets || [])
        .filter((t) => !t.claimed_business_slug)
        .map((t) => ({
          url: `${SITE_URL}/${t.route_slug}`,
          lastModified: t.created_at,
          changeFrequency: "monthly",
          priority: 0.5,
        })),
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
    .order("id", { ascending: true }) // stable order so pagination doesn't skip/duplicate rows as data changes
    .range(from, to);

  return (products || [])
    .filter((p) => p.businesses?.slug)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.businesses.slug}/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
}
