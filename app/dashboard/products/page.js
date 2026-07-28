import Link from "next/link";
import { Paper, Box, Typography, Chip, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleProducts } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: supabase.from("products").select("*").eq("business_id", myBusinessId)

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="My Products"
        subtitle="Products and services you list and run affiliate programs for."
        action={
          <Button component={Link} href="/dashboard/products/new" variant="contained" startIcon={<AddIcon />}>
            New product
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "hidden" }}>
        {sampleProducts.map((p, i) => (
          <Box
            key={p.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 2,
              borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ minWidth: 180 }}>
              <Typography fontWeight={700}>{p.name}</Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {p.category} · ₦{p.price.toLocaleString()} / {p.billing}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: tokens.muted, display: "block" }}>
                  Affiliates
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {p.affiliates}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={p.status}
                sx={{
                  textTransform: "capitalize",
                  bgcolor: p.status === "active" ? "#E7F5EE" : "#F1EFE7",
                  color: p.status === "active" ? tokens.success : tokens.muted,
                  fontWeight: 700,
                }}
              />
            </Stack>
          </Box>
        ))}
        {sampleProducts.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: tokens.muted }}>
              No products yet. List your first product to launch an affiliate program.
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
}
