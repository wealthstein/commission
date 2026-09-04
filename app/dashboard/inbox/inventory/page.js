"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, CircularProgress,
} from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { tokens } from "@/lib/theme";
import { useCurrentBusiness } from "@/lib/useCurrentBusiness";
import { createClient } from "@/lib/supabaseClient";

export default function InboxInventoryPage() {
  const { business } = useCurrentBusiness();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", quantity: "", sku: "" });

  const load = useCallback(async () => {
    if (!business) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_inventory_items")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [business]);

  useEffect(() => { load(); }, [load]);

  async function saveItem() {
    if (!form.name.trim() || !business) return;
    const supabase = createClient();
    await supabase.from("inbox_inventory_items").insert({
      business_id: business.id,
      name: form.name.trim(),
      sku: form.sku || null,
      price: form.price ? Number(form.price) : null,
      quantity: form.quantity ? Number(form.quantity) : 0,
    });
    setForm({ name: "", price: "", quantity: "", sku: "" });
    setOpen(false);
    load();
  }

  if (loading || !business) {
    return <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="What you're selling, so agents can reference it mid-chat."
        action={<Button variant="contained" onClick={() => setOpen(true)}>Add item</Button>}
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Quantity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.sku ?? "—"}</TableCell>
              <TableCell align="right">{item.price ? `$${Number(item.price).toLocaleString()}` : "—"}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography sx={{ color: tokens.muted, py: 3, textAlign: "center" }}>No items yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add inventory item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <TextField label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} fullWidth size="small" />
            <TextField label="Price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth size="small" />
            <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveItem}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
