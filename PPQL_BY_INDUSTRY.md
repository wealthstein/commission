# Cost per Intent Qualified Lead (PPQL), by industry

**Purpose:** the PPQL shown on each industry page (`content/industries.json`) should reflect what a business would *rationally* pay for one qualified lead, given typical deal size and commission economics in that industry — not an arbitrary number. This file documents the reasoning so future changes stay grounded, not guessed.

**General rule of thumb used below:** a business can typically justify paying somewhere around 2-8% of an average deal's expected value (or first-year customer value) per lead, adjusted for how many leads convert. Higher-ticket, higher-conversion-value industries support meaningfully higher PPQL.

---

## Revised values

| Industry | Old PPQL | Revised PPQL | Reasoning |
|---|---|---|---|
| **Real Estate** | ₦5,000 | **₦20,000** | Deal sizes are large — rentals ₦500k-5M/year, purchases ₦5M-200M+. Agent commissions typically 5-10% of transaction value. Even a modest lead-to-deal conversion rate easily justifies a much higher lead cost than most other verticals. ₦5,000 was too low to reflect this. |
| **Banking** | ₦4,000 | **₦6,000** | Wide range depending on product — a loan or investment-product referral carries real lifetime value; basic account-opening leads are worth less. ₦6,000 is a defensible blended midpoint. |
| **Healthcare** | ₦3,000 | **₦5,000** | HMO annual premiums often run ₦50k-300k+. This also aligns with the existing dashboard example data (CareLink HMO Plan), which already used ₦5,000 — the industries page number should match what the product examples elsewhere already assume. |
| **Insurance** | ₦2,500 | **₦4,000** | Policies (life, health, auto) carry meaningful premium + renewal value over multiple years, supporting a higher lead cost than a single-transaction business. |
| **Fintech** | ₦2,000 | **₦3,500** | Highly product-dependent (loans, investment platforms, payments) — ₦3,500 is a reasonable blended figure without assuming the highest-value product type. |
| **Education** | ₦1,500 | **₦2,500** | Course/school fees vary, but a single enrolled student typically represents a full-term or full-year commitment, supporting a modest increase. |
| **Logistics** | ₦1,200 | **₦1,500** | Lower-ticket, high-frequency, thin margins — this was already reasonably calibrated; a small bump reflects typical delivery-contract value better. |
| **Default (unlisted industries)** | ₦1,000 | **₦1,200** | Conservative fallback for any industry without a specific figure. |

---

## How to add a new industry's PPQL

1. Estimate a typical single-transaction or first-year customer value for that industry
2. Apply roughly 2-8% of that value as a starting PPQL, weighted toward the lower end for low-conversion or highly competitive verticals, higher end for high-conversion or high-LTV ones
3. Sanity-check against the table above — a new figure should sit logically between its closest neighbors, not be dramatically out of line
4. Update both this file and `content/industries.json` together, so the reasoning and the live number never drift apart
