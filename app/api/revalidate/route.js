import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/revalidate
 * body: { secret, businessSlug, productSlug?, categorySlug? }
 *
 * Call this right after creating/updating a product or business (see the
 * comment in app/dashboard/campaigns/new/page.js) so the new page and its
 * relevant category hub go live immediately instead of waiting out the
 * revalidate=3600 window. The sitemap chunk itself will pick up the new
 * URL on its own next revalidation (or immediately if you also revalidate
 * "/sitemap-index.xml" and the affected "/sitemap/[id].xml" path here).
 */
export async function POST(req) {
  const { secret, businessSlug, productSlug, categorySlug } = await req.json();

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const revalidated = [];

  if (businessSlug) {
    revalidatePath(`/businesses/${businessSlug}`);
    revalidated.push(`/businesses/${businessSlug}`);
  }
  if (businessSlug && productSlug) {
    revalidatePath(`/products/${businessSlug}/${productSlug}`);
    revalidated.push(`/products/${businessSlug}/${productSlug}`);
  }
  if (categorySlug) {
    revalidatePath(`/categories/${categorySlug}`);
    revalidated.push(`/categories/${categorySlug}`);
  }

  return NextResponse.json({ revalidated });
}
