-- Run this directly in Supabase's SQL Editor.
--
-- Adds a place to record WHY a business marked a lead invalid. status
-- already allows 'rejected' in the original schema - this was always
-- reachable in principle, but nothing in the real app has ever been able
-- to set it since manual qualification was removed. Not PII - this is
-- the business's own categorization of the lead (wrong number, spam,
-- duplicate), not information about the customer.

alter table leads add column if not exists rejected_reason text;
