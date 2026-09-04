import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

const PAGE_SIZE = 45000; // must match app/sitemap.js

/**
 * GET /sitemap-index.xml
 *
 * next/sitemap's generateSitemaps() produces /sitemap/0.xml, /sitemap/1.xml,
 * etc, but does not publish an index of them. This route builds that index —
 * it is the one URL to hand to Google Search Console / Bing Webmaster Tools,
 * and the one referenced from robots.js. Search engines then discover and
 * crawl every chunk (and therefore every product page) from here, which is
 * how a site can get hundreds of thousands of pages indexed quickly without
 * waiting on internal-link discovery alone.
 */
export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { count } = await supabase.from("affiliate_campaigns").select("id", { count: "exact", head: true }).eq("status", "active");
  const campaignPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const totalChunks = campaignPages + 1; // + the static/business/category chunk

  const sitemapEntries = Array.from({ length: totalChunks }, (_, i) => `${SITE_URL}/sitemap/${i}.xml`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map((url) => `  <sitemap><loc>${url}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate",
    },
  });
}
