import { unstable_cache } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";

/**
 * All seeded program rows, for the /programs index page AND the internal
 * links section rendered on EVERY marketing page. Without caching, that
 * meant a fresh Supabase round trip on every single page navigation just
 * to render one footer column - noticeably slowing down clicks across the
 * whole site. Cached for an hour, matching the revalidate window used
 * elsewhere on these pages.
 */
export const listPrograms = unstable_cache(
  async () => {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("seo_keyword_targets")
      .select("*")
      .order("type", { ascending: true })
      .order("display_name", { ascending: true });
    return data || [];
  },
  ["list-programs"],
  { revalidate: 3600 }
);

/** One program by its route slug, plus any live products in its industry category. */
export async function getProgramBySlug(slug) {
  const supabase = createAdminSupabaseClient();
  const { data: target } = await supabase.from("seo_keyword_targets").select("*").eq("route_slug", slug).maybeSingle();
  if (!target) return { target: null, liveProducts: [] };

  let liveProducts = [];
  if (target.industry_category) {
    const { data } = await supabase
      .from("products")
      .select("name, slug, price_naira, businesses(name, slug)")
      .eq("category", target.industry_category)
      .eq("status", "active")
      .limit(6);
    liveProducts = data || [];
  }
  return { target, liveProducts };
}
