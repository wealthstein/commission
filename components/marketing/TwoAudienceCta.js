"use client";

import { Box, Stack, Button } from "@mui/material";
import { pickCtaPair } from "@/lib/ctaVariants";

function goToForm(role) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("commission:preselect-role", { detail: role }));
  document.getElementById("request-account")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function TwoAudienceCta({ slug }) {
  const { businessCta, affiliateCta } = pickCtaPair(slug);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button variant="contained" size="large" onClick={() => goToForm("business")}>
          {businessCta}
        </Button>
        <Button variant="outlined" size="large" onClick={() => goToForm("affiliate")}>
          {affiliateCta}
        </Button>
      </Stack>
    </Box>
  );
}
