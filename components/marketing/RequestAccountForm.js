"use client";

import { useEffect, useState } from "react";
import { Box, Button, ToggleButtonGroup, ToggleButton } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { tokens } from "@/lib/theme";
import { triggerGoogleAuth } from "@/lib/googleAuth";

const LABEL = {
  business: "Continue with Google as a business",
  affiliate: "Continue with Google as an affiliate",
};

/**
 * The homepage's embedded account-request block - kept here only, per
 * request. Every other page uses SignUpButton.js instead (a plain link to
 * /signup), which is what the homepage's Hero/Pricing/CTASection buttons
 * scroll down to via the id="request-account" anchor below.
 */
export default function RequestAccountForm({ sourcePage }) {
  const [role, setRole] = useState("business");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handlePreselect(e) {
      if (e.detail === "business" || e.detail === "affiliate") setRole(e.detail);
    }
    window.addEventListener("commission:preselect-role", handlePreselect);
    return () => window.removeEventListener("commission:preselect-role", handlePreselect);
  }, []);

  async function handleClick() {
    setLoading(true);
    await triggerGoogleAuth({ role, sourcePage });
  }

  return (
    <Box id="request-account" sx={{ textAlign: "center", scrollMarginTop: 96 }}>
      <ToggleButtonGroup
        value={role}
        exclusive
        size="small"
        onChange={(_, v) => v && setRole(v)}
        sx={{
          mb: 2.5,
          bgcolor: "#F1EFE7",
          borderRadius: 999,
          p: 0.4,
          "& .MuiToggleButton-root": { border: "none", borderRadius: 999, textTransform: "none", fontWeight: 600, px: 2 },
          "& .Mui-selected": { bgcolor: `${tokens.paper} !important`, color: `${tokens.ink} !important` },
        }}
      >
        <ToggleButton value="business">I am a business</ToggleButton>
        <ToggleButton value="affiliate">I am an affiliate</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ maxWidth: 360, mx: "auto" }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Redirecting…" : LABEL[role]}
        </Button>
      </Box>
    </Box>
  );
}
