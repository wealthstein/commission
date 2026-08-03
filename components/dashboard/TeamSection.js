"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  MenuItem,
  Select,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { tokens } from "@/lib/theme";
import { createClient } from "@/lib/supabaseClient";

const STATUS_STYLE = {
  active: { bg: "#E7F5EE", fg: tokens.success, label: "Active" },
  invited: { bg: "#FFF3C4", fg: tokens.brandInk, label: "Invited" },
  revoked: { bg: "#F1EFE7", fg: tokens.muted, label: "Removed" },
};

export default function TeamSection({ businessId, plan }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [state, setState] = useState({ loading: false, error: null, success: null });

  const gated = plan === "free";

  useEffect(() => {
    if (!businessId) return;
    const supabase = createClient();
    supabase
      .from("business_team_members")
      .select("*")
      .eq("business_id", businessId)
      .neq("status", "revoked")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, [businessId]);

  async function handleInvite(e) {
    e.preventDefault();
    setState({ loading: true, error: null, success: null });
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setMembers((m) => [...m, data.member]);
      setInviteEmail("");
      setState({ loading: false, error: null, success: `Invite sent to ${data.member.email}` });
    } catch (err) {
      setState({ loading: false, error: err.message, success: null });
    }
  }

  async function handleRoleChange(memberId, role) {
    setMembers((m) => m.map((x) => (x.id === memberId ? { ...x, role } : x)));
    await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  }

  async function handleRemove(memberId) {
    setMembers((m) => m.filter((x) => x.id !== memberId));
    await fetch(`/api/team/${memberId}`, { method: "DELETE" });
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: tokens.border, mb: 3 }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        Team
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
        Invite teammates into this business account and control what each one can do.
      </Typography>

      {gated ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Team management is available on Medium and Large plans. Upgrade to invite teammates.
        </Alert>
      ) : (
        <>
          {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}
          {state.success && <Alert severity="success" sx={{ mb: 2 }}>{state.success}</Alert>}

          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {members.map((m) => {
                const style = STATUS_STYLE[m.status];
                return (
                  <Stack
                    key={m.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F1EFE7" }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {m.email}
                      </Typography>
                      <Chip size="small" label={style.label} sx={{ bgcolor: style.bg, color: style.fg, fontWeight: 700, height: 18, fontSize: 10 }} />
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Select
                        size="small"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        sx={{ fontSize: 13 }}
                      >
                        <MenuItem value="member">Member</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                      <IconButton size="small" onClick={() => handleRemove(m.id)}>
                        <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: tokens.muted }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                );
              })}
              {members.length === 0 && (
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  No teammates yet - invite one below.
                </Typography>
              )}
            </Stack>
          )}

          <Box component="form" onSubmit={handleInvite}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Email"
                type="email"
                size="small"
                fullWidth
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select size="small" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} sx={{ minWidth: 120 }}>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              <Button type="submit" variant="contained" disabled={state.loading} sx={{ flexShrink: 0 }}>
                {state.loading ? <CircularProgress size={20} /> : "Send invite"}
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Paper>
  );
}
