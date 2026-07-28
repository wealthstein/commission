import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, Container, Typography, Grid, Paper, Stack, Button } from "@mui/material";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { categoryLabelFromSlug, CATEGORIES } from "@/lib/categories";
import { buildCategoryMetadata } from "@/lib/seo";
import { tokens } from "@/lib/theme";

export const revalidate = 3600;

const PAGE_SIZE = 24;

// Pre-render page 1 of every category at build/deploy time — a small,
// fixed number of pages (one per category) — while deeper pages and every
// individual product page are generated on demand via ISR.
export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const categoryLabel = categoryLabelFromSlug(params.category);
  if (!categoryLabel) return { title: "Category not found | Commission" };
  const page = Number(searchParams?.page) || 1;
  return buildCategoryMetadata({ categoryLabel, categorySlug: params.category, page });
}

export default async function CategoryPage({ params, searchParams }) {
  const categoryLabel = categoryLabelFromSlug(params.category);
  if (!categoryLabel) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createAdminSupabaseClient();
  const { data: products, count } = await supabase
    .from("products")
    .select("*, businesses(name, slug)", { count: "exact" })
    .eq("category", categoryLabel)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 38 }, mb: 1.5 }}>
          {categoryLabel} affiliate programs in Nigeria
        </Typography>
        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
          {count || 0} active {categoryLabel} affiliate program{count === 1 ? "" : "s"} recruiting affiliates on Commission.
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {(products || []).map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Paper
                component={Link}
                href={`/products/${p.businesses.slug}/${p.slug}`}
                variant="outlined"
                sx={{ display: "block", p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%", "&:hover": { borderColor: tokens.ink } }}
              >
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                  {p.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {p.businesses.name} · ₦{Number(p.price_naira).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {totalPages > 1 && (
          <Stack direction="row" spacing={1.5} justifyContent="center">
            {page > 1 && (
              <Button variant="outlined" component={Link} href={`/categories/${params.category}?page=${page - 1}`}>
                Previous
              </Button>
            )}
            <Typography variant="body2" sx={{ color: tokens.muted, alignSelf: "center" }}>
              Page {page} of {totalPages}
            </Typography>
            {page < totalPages && (
              <Button variant="outlined" component={Link} href={`/categories/${params.category}?page=${page + 1}`}>
                Next
              </Button>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
