import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, Container, Typography, Grid, Paper, Chip } from "@mui/material";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { buildBusinessMetadata } from "@/lib/seo";
import { tokens } from "@/lib/theme";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

async function getBusinessWithProducts(slug) {
  const supabase = createAdminSupabaseClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!business) return { business: null, products: [] };

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return { business, products: products || [] };
}

export async function generateMetadata({ params }) {
  const { business } = await getBusinessWithProducts(params.slug);
  if (!business) return { title: "Business not found | Commission" };
  return buildBusinessMetadata({ business });
}

export default async function BusinessPage({ params }) {
  const { business, products } = await getBusinessWithProducts(params.slug);
  if (!business) notFound();

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="md">
        {business.industry && <Chip label={business.industry} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600, mb: 2 }} />}
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, mb: 2 }}>
          {business.name} Affiliate Programs
        </Typography>
        {business.description && (
          <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
            {business.description}
          </Typography>
        )}

        <Grid container spacing={2.5}>
          {products.map((p) => (
            <Grid item xs={12} sm={6} key={p.id}>
              <Paper
                component={Link}
                href={`/products/${business.slug}/${p.slug}`}
                variant="outlined"
                sx={{
                  display: "block",
                  p: 3,
                  borderRadius: 3,
                  borderColor: tokens.border,
                  "&:hover": { borderColor: tokens.ink },
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                  {p.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  ₦{Number(p.price_naira).toLocaleString()} · {p.category}
                </Typography>
              </Paper>
            </Grid>
          ))}
          {products.length === 0 && (
            <Typography sx={{ color: tokens.muted, px: 1 }}>
              No active affiliate programs from {business.name} right now.
            </Typography>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
