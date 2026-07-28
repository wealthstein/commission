import { Grid, Paper, Typography, Chip, Button, Stack, InputBase, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleDiscoverPrograms } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: products joined to their active affiliate_programs where status = 'active',
// e.g. supabase.from("products").select("*, affiliate_programs!inner(*)").eq("status","active")

export default function DiscoverPage() {
  return (
    <>
      <PageHeader title="Discover" subtitle="Find products and affiliate programs to promote." />

      <Paper
        variant="outlined"
        sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, mb: 3, borderRadius: 999, borderColor: tokens.border }}
      >
        <SearchIcon fontSize="small" sx={{ color: tokens.muted }} />
        <InputBase placeholder="Search products, categories, businesses…" fullWidth />
      </Paper>

      <Grid container spacing={2.5}>
        {sampleDiscoverPrograms.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Chip label={p.category} size="small" sx={{ bgcolor: "#F1EFE7", fontWeight: 600 }} />
                <Chip label={p.tiers} size="small" variant="outlined" />
              </Stack>
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                {p.product}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
                {p.business}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Commission
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {p.commission}
                </Typography>
              </Box>
              <Button fullWidth variant="contained">
                Join program
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
