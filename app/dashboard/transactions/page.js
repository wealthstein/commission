import { Paper, Box, Typography, Chip, Stack, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import PageHeader from "@/components/dashboard/PageHeader";
import { sampleTransactions } from "@/lib/sampleData";
import { tokens } from "@/lib/theme";

// Production query: supabase.from("commissions").select("*, transactions(*), affiliate_enrollments(*)")
//   .in("enrollment_id", myEnrollmentIds).order("created_at", { ascending: false })

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" subtitle="Every sale, commission, and payout tied to your account." />

      <Paper variant="outlined" sx={{ borderColor: tokens.border, borderRadius: 3, overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F1EFE7" }}>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sale amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Platform fee</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sampleTransactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.product}</TableCell>
                <TableCell sx={{ color: tokens.muted }}>{t.customer}</TableCell>
                <TableCell>₦{t.amountNaira.toLocaleString()}</TableCell>
                <TableCell>Tier {t.tier}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>₦{t.commissionNaira.toLocaleString()}</TableCell>
                <TableCell sx={{ color: tokens.muted }}>₦{t.feeNaira.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={t.status}
                    sx={{
                      textTransform: "capitalize",
                      bgcolor: t.status === "paid" ? "#E7F5EE" : "#FFF3C4",
                      color: t.status === "paid" ? tokens.success : tokens.brandInk,
                      fontWeight: 700,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
