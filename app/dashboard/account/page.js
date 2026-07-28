"use client";

import { Paper, Box, Typography, TextField, Button, Grid, Divider, Stack, Avatar } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" subtitle="Profile, business information, payment details, and settings." />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: tokens.brand, color: tokens.brandInk, fontWeight: 700 }}>U</Avatar>
          <Box>
            <Typography fontWeight={700}>Signed in with Google</Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              you@example.com
            </Typography>
          </Box>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Full name" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone number" fullWidth defaultValue="" />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          Business profile
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Only needed if you're listing products. Every Commission account can act as a business, an affiliate, or both.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Business name" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Industry" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Website" fullWidth defaultValue="" />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          Payment details
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
          Where Paystack sends your affiliate commission payouts.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Bank name" fullWidth defaultValue="" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Account number" fullWidth defaultValue="" />
          </Grid>
        </Grid>
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large">
          Save changes
        </Button>
      </Stack>
    </>
  );
}
