"use client";

import { Modal, Box, Typography, Button, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GoogleIcon from "@mui/icons-material/Google";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

export default function SignInModal({ open, onClose }) {
  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 400 },
          bgcolor: tokens.paper,
          borderRadius: 4,
          p: 4,
          outline: "none",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Continue to Commission
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
          One account, whether you&apos;re listing a product, promoting one, or both.
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          sx={{ borderColor: tokens.border, color: tokens.ink, py: 1.25 }}
        >
          Continue with Google
        </Button>
      </Box>
    </Modal>
  );
}
