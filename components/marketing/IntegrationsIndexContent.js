import Link from "next/link";
import { Container, Typography, Grid, Box, Stack, Chip } from "@mui/material";
import { tokens } from "@/lib/theme";

const NATIVE_SLUGS = ["whatsapp", "email", "native", "paystack", "excel"];

export default function IntegrationsIndexContent({ title, description, buildHref, items, relatedLinks }) {
  return (
    <Container maxWidth="lg">
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 }, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, mb: 5, maxWidth: 640 }}>
        {description}
      </Typography>

      <Grid container spacing={2} sx={{ mb: relatedLinks?.length ? 6 : 0 }}>
        {items.map((item) => {
          const isNative = NATIVE_SLUGS.includes(item.slug);
          const isApi = item.slug === "api";
          return (
            <Grid item xs={6} sm={4} md={2} key={item.slug}>
              <Box
                component={Link}
                href={buildHref(item.slug)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 1,
                  p: 2.5,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 3,
                  textDecoration: "none",
                  color: "inherit",
                  height: "100%",
                  "&:hover": { borderColor: tokens.ink },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: tokens.brand,
                    color: tokens.brandInk,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {item.name.charAt(0)}
                </Box>
                <Typography fontWeight={700} sx={{ fontSize: 13 }}>
                  {item.name}
                </Typography>
                <Chip
                  label={isNative ? "Native" : isApi ? "Premium" : "Via API"}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 10,
                    bgcolor: isNative ? "#E7F5EE" : isApi ? tokens.brand : tokens.canvas,
                    color: isNative ? tokens.success : tokens.ink,
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {relatedLinks?.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={700} sx={{ color: tokens.muted, display: "block", mb: 1.5 }}>
            RELATED
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {relatedLinks.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2" fontWeight={600} sx={{ color: tokens.ink }}>
                {link.label} →
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
}