import Link from "next/link";
import { Box, Container, Typography, Stack, Button, Breadcrumbs } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";
import { tokens } from "@/lib/theme";
import { urls } from "@/lib/urls";
import siteConfig from "@/content/site.json";

export const metadata = {
  title: `Page not found • ${siteConfig.name}`,
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 8 }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Box component={Link} href="/" sx={{ display: "inline-block", mb: 4 }}>
          <CardMedia sx={{ height: 32, width: 32, borderRadius: "9px" }} image="/circle.svg" alt={siteConfig.name} />
        </Box>

        <Typography
          sx={{
            fontSize: { xs: 28, sm: 38, md: 48 },
            lineHeight: { xs: "36px", sm: "46px", md: "58px" },
            fontWeight: 800,
            mb: 1.5,
          }}
        >
          This page took a different path
        </Typography>
        <Typography variant="h6" sx={{ color: tokens.muted, fontWeight: 400, maxWidth: 520, mx: "auto" }}>
          The page you are looking for does not exist, or may have moved. Head back to the homepage, or request
          early access if you are ready to get started.
        </Typography>

        <Stack
          spacing={1.5}
          direction={{ xs: "column", sm: "row" }}
          mt={4}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            component={Link}
            href="/"
            size="large"
            variant="contained"
            sx={{ py: 1.75, px: 4, width: { xs: "100%", sm: "auto" } }}
          >
            Back to homepage
          </Button>
          <Button
            component={Link}
            href={urls.signup()}
            size="large"
            variant="outlined"
            sx={{ py: 1.75, px: 4, width: { xs: "100%", sm: "auto" } }}
          >
            Get started
          </Button>
        </Stack>

        <Breadcrumbs
          separator="•"
          aria-label="breadcrumb"
          sx={{ mt: 8, "& ol": { justifyContent: "center", fontSize: "12px", margin: "auto" } }}
        >
          <Typography sx={{ color: tokens.muted, fontSize: 11 }}>
            © {new Date().getFullYear()} {siteConfig.name}
          </Typography>
          <Typography sx={{ color: tokens.muted, fontSize: 11 }}>Built with ❤️ in Wilmington, Delaware</Typography>
        </Breadcrumbs>
      </Container>
    </Box>
  );
}
