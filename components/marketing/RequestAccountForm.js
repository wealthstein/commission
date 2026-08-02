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
 * The account-request CTA embedded on every industry, program, and
 * comparison page. No manual form anymore - clicking Google auth directly
 * registers a real account (see lib/googleAuth.js), which lands on
 * /welcome rather than the dashboard until dashboard_access_granted is set.
 *
 * Pass fixedRole="business" or fixedRole="affiliate" on a page that only
 * makes sense for one audience - this hides the toggle and encodes that
 * role straight into the auth request. Omit fixedRole on dual-audience
 * pages (the homepage, /calculator, /conversions) to keep the toggle.
 */
export default function RequestAccountForm({ sourcePage, fixedRole }) {
  const [role, setRole] = useState(fixedRole || "business");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fixedRole) return;
    function handlePreselect(e) {
      if (e.detail === "business" || e.detail === "affiliate") setRole(e.detail);
    }
    window.addEventListener("commission:preselect-role", handlePreselect);
    return () => window.removeEventListener("commission:preselect-role", handlePreselect);
  }, [fixedRole]);

  async function handleClick() {
    setLoading(true);
    await triggerGoogleAuth({ role, sourcePage });
  }

  return (
    <Box id="request-account" sx={{ textAlign: "center", scrollMarginTop: 96 }}>
      {!fixedRole && (
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
      )}

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
