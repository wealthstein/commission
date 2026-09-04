-- ============================================================================
-- ROLLBACK for migration_rename_core_tables.sql
--
-- Only needed if something goes wrong AFTER that migration has already
-- committed (if it fails mid-way, its own transaction wrapper rolls back
-- automatically - see the "begin;"/"commit;" in that file - and you'd
-- never need this at all).
--
-- Reverses every rename with the same ALTER TABLE ... RENAME TO mechanism
-- - metadata-only, all data/FKs/indexes/RLS move back with it. Does NOT
-- attempt to reverse the function/policy redefinitions from that
-- migration (business_has_active_campaign, fn_charge_wallet, etc.) -
-- those still reference the NEW names after this rollback runs, which
-- means they'd be broken again (same class of issue the original
-- migration fixed). If you actually need to roll back, you're restoring
-- from the backup you took beforehand (per that file's safety note #1),
-- not relying on this alone - this script gets your table NAMES back to
-- a known state quickly if you need the app unblocked immediately while
-- you sort out next steps, not a complete undo of every side effect.
-- ============================================================================

begin;

alter table if exists core_users rename to users;
alter table if exists core_businesses rename to businesses;
alter table if exists core_business_team_members rename to business_team_members;

alter table if exists affiliate_campaigns rename to campaigns;
alter table if exists affiliate_marketing_assets rename to marketing_assets;
alter table if exists affiliate_referral_clicks rename to referral_clicks;
alter table if exists affiliate_customers rename to customers;
alter table if exists affiliate_campaign_custom_fields rename to campaign_custom_fields;
alter table if exists affiliate_leads rename to leads;
alter table if exists affiliate_manual_sale_confirmations rename to manual_sale_confirmations;

alter table if exists billing_transactions rename to transactions;
alter table if exists billing_commissions rename to commissions;
alter table if exists billing_payouts rename to payouts;
alter table if exists billing_payout_commissions rename to payout_commissions;
alter table if exists billing_wallet_transactions rename to wallet_transactions;
alter table if exists billing_user_referral_rewards rename to user_referral_rewards;
alter table if exists billing_wallet_funding_nudges rename to wallet_funding_nudges;

alter table if exists growth_cold_outreach_contacts rename to cold_outreach_contacts;

commit;

-- After running this, the app code in this repo (which queries the NEW
-- names) will be broken against the now-reverted OLD names, same
-- cutover-timing issue as the forward migration - you need the PREVIOUS
-- app deployment live again too, not just this rollback alone.
