"use client";

import { Box, Typography, Stack } from "@mui/material";
import { tokens } from "@/lib/theme";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: 26 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: tokens.muted, mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
