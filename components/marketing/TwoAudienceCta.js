"use client";

import Link from "next/link";
import { Box, Stack, Button } from "@mui/material";
import { pickCtaPair } from "@/lib/ctaVariants";
import { urls } from "@/lib/urls";

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
        {/* Affiliate CTAs route to the earnings calculator - it is the main
            conversion tool for affiliates, showing exactly what they could
            earn before asking them to request access. */}
        <Button variant="outlined" size="large" component={Link} href={urls.calculator("affiliate")}>
          {affiliateCta}
        </Button>
      </Stack>
    </Box>
  );
}
