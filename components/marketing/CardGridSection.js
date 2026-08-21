"use client";

import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function CardGridSection({ id, title, items, columns = 4, bgcolor = tokens.paper }) {
  return (
    <Box component="section" id={id} sx={{ py: { xs: 6, md: 9 }, bgcolor }}>
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, mb: 4 }}>
          {title}
        </Typography>
        <Grid container spacing={1.5}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={12 / columns} key={item.title}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: "100%",
                  borderColor: tokens.border,
                  borderRadius: 3,
                  transition: "border-color 160ms ease, transform 160ms ease",
                  "&:hover": { borderColor: tokens.ink, transform: "translateY(-2px)" },
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {item.body}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
