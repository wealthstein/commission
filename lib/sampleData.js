/**
 * Placeholder data so the dashboard renders something meaningful before
 * it's wired to live Supabase queries. Replace each of these with a
 * real query (see the commented examples in each page) once your
 * Supabase project is connected.
 */

export const sampleOverview = {
  totalEarningsNaira: 284500,
  pendingPayoutNaira: 42000,
  totalSalesCount: 37,
  activeReferrals: 12,
  productsListed: 2,
  programsRunning: 2,
};

export const sampleProducts = [
  { id: "p1", name: "SwiftHR Payroll", category: "HR Software", price: 45000, billing: "monthly", status: "active", affiliates: 18 },
  { id: "p2", name: "CareLink HMO Plan", category: "HMO", price: 120000, billing: "annual", status: "active", affiliates: 9 },
];

export const sampleDiscoverPrograms = [
  { id: "d1", product: "Zenith Insure — SME Cover", business: "Zenith Insure", category: "Insurance", commission: "10% one-time", tiers: "1 tier" },
  { id: "d2", product: "NimbusNet Fibre", business: "NimbusNet", category: "Internet", commission: "8% / 5% / 2%", tiers: "3 tier" },
  { id: "d3", product: "Payroller SaaS", business: "Payroller", category: "SaaS", commission: "12% recurring", tiers: "1 tier" },
];

export const samplePromotions = [
  { id: "pr1", product: "Zenith Insure — SME Cover", code: "ABC123", clicks: 214, sales: 6, earnedNaira: 24000 },
  { id: "pr2", product: "Payroller SaaS", code: "XJ92LK", clicks: 89, sales: 3, earnedNaira: 15300 },
];

export const sampleNetwork = [
  { id: "n1", name: "Abu Bello", tier: 2, joined: "2026-03-02", salesGenerated: 14, earningsFromThemNaira: 18200 },
  { id: "n2", name: "Ola Fashina", tier: 3, joined: "2026-04-11", salesGenerated: 5, earningsFromThemNaira: 3400 },
  { id: "n3", name: "Chiamaka Okoye", tier: 2, joined: "2026-05-19", salesGenerated: 9, earningsFromThemNaira: 11100 },
];

export const sampleTransactions = [
  { id: "t1", date: "2026-07-21", product: "SwiftHR Payroll", customer: "kelechi@***.com", amountNaira: 45000, tier: 1, commissionNaira: 3600, feeNaira: 540, status: "paid" },
  { id: "t2", date: "2026-07-18", product: "CareLink HMO Plan", customer: "amaka@***.com", amountNaira: 120000, tier: 1, commissionNaira: 9600, feeNaira: 1440, status: "pending" },
  { id: "t3", date: "2026-07-12", product: "Zenith Insure — SME Cover", customer: "tunde@***.com", amountNaira: 60000, tier: 2, commissionNaira: 3000, feeNaira: 450, status: "paid" },
];
