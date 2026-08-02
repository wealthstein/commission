"use client";

import { useState } from "react";
import { Box, Stack, Button } from "@mui/material";
import { pickCtaPair } from "@/lib/ctaVariants";
import { triggerGoogleAuth } from "@/lib/googleAuth";

export default function TwoAudienceCta({ slug }) {
  const { businessCta, affiliateCta } = pickCtaPair(slug);
  const [loadingRole, setLoadingRole] = useState(null);

  async function handleClick(role) {
    setLoadingRole(role);
    await triggerGoogleAuth({ role, sourcePage: `/${slug}` });
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button variant="contained" size="large" onClick={() => handleClick("business")} disabled={loadingRole === "business"}>
          {loadingRole === "business" ? "Redirecting…" : businessCta}
        </Button>
        <Button variant="outlined" size="large" onClick={() => handleClick("affiliate")} disabled={loadingRole === "affiliate"}>
          {loadingRole === "affiliate" ? "Redirecting…" : affiliateCta}
        </Button>
      </Stack>
    </Box>
  );
}
