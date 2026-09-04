"use client";

import { useEffect, useState, useCallback } from "react";
import { Box, Typography, List, ListItem, Checkbox, TextField, Button, Stack, CircularProgress } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

export default function InboxTasksPage() {
  const { business, usersId } = useCurrentBusiness();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_tasks")
      .select("*")
      .eq("business_id", business.id)
      .order("due_at", { ascending: true, nullsFirst: false });
    setTasks(data || []);
    setLoading(false);
  }, [business]);

  useEffect(() => { load(); }, [load]);

  async function addTask() {
    if (!title.trim() || !business) return;
    const supabase = createClient();
    await supabase.from("inbox_tasks").insert({
      business_id: business.id,
      title: title.trim(),
      due_at: dueAt || null,
      assigned_to: usersId,
    });
    setTitle("");
    setDueAt("");
    load();
  }

  async function toggleDone(task) {
    const supabase = createClient();
    await supabase.from("inbox_tasks").update({ status: task.status === "done" ? "open" : "done" }).eq("id", task.id);
    load();
  }

  if (loading || !business) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  return (
    <>
      <PageHeader title="Tasks & follow-ups" subtitle="Reminders tied to a chat, so nothing goes cold." />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" placeholder="Follow up with…" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField size="small" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        <Button variant="contained" onClick={addTask}>Add</Button>
      </Stack>

      <List>
        {tasks.map((task) => (
          <ListItem key={task.id} sx={{ borderBottom: `1px solid ${tokens.border}`, px: 0 }}>
            <Checkbox checked={task.status === "done"} onChange={() => toggleDone(task)} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ textDecoration: task.status === "done" ? "line-through" : "none" }}>
                {task.title}
              </Typography>
              {task.due_at && (
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Due {new Date(task.due_at).toLocaleString()}
                </Typography>
              )}
            </Box>
          </ListItem>
        ))}
        {tasks.length === 0 && (
          <Typography sx={{ color: tokens.muted, py: 3, textAlign: "center" }}>No tasks yet.</Typography>
        )}
      </List>
    </>
  );
}
