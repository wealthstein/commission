-- ============================================================================
-- SEED: seo_keyword_targets
-- ------------------------------------------------------------------------
-- This is STARTER/EXAMPLE data, not a complete list. Run it once against a
-- fresh database, then keep adding rows deliberately as you decide which
-- companies/industries to target — don't auto-generate these from a bulk
-- list of company names you haven't reviewed. Company entries ask a
-- question ("Does X have an affiliate program?") rather than asserting an
-- answer, specifically so this stays honest even before you know.
-- ============================================================================

insert into seo_keyword_targets (route_slug, type, keyword_slug, display_name, industry_category, meta_description)
values
  -- Industries (broader than the product-category taxonomy in lib/categories.js —
  -- these are top-of-funnel keyword targets, not necessarily tied to a live product category yet)
  ('fintech-affiliate-programs', 'industry', 'fintech', 'Fintech', 'Fintech',
   'Explore fintech affiliate programs in Nigeria and start earning commission promoting financial products.'),
  ('insurance-affiliate-programs', 'industry', 'insurance', 'Insurance', 'Insurance',
   'Explore insurance affiliate programs in Nigeria and start earning commission on every policy sold.'),
  ('real-estate-affiliate-programs', 'industry', 'real-estate', 'Real Estate', 'Real Estate',
   'Explore real estate affiliate programs in Nigeria and earn commission referring property buyers and renters.'),
  ('healthtech-affiliate-programs', 'industry', 'healthtech', 'Healthtech', 'HMO',
   'Explore healthtech and HMO affiliate programs in Nigeria and earn commission on every plan sold.'),
  ('edtech-affiliate-programs', 'industry', 'edtech', 'Edtech', 'Online Courses',
   'Explore edtech affiliate programs in Nigeria and earn commission promoting online courses and learning platforms.'),
  ('logistics-affiliate-programs', 'industry', 'logistics', 'Logistics', 'Logistics',
   'Explore logistics affiliate programs in Nigeria and earn commission referring shipping and delivery customers.'),

  -- these ask the question, they don't assert an affiliate program exists.
  ('gtbank-affiliate-program', 'company', 'gtbank', 'GTBank', 'Fintech',
   'Does GTBank have an affiliate program? Here''s what to know, and how to get notified if one launches on Commission.'),
  ('jumia-affiliate-program', 'company', 'jumia', 'Jumia', 'Fintech',
   'Does Jumia have an affiliate program? Here''s what to know, and how to get notified if one launches on Commission.')
on conflict (route_slug) do nothing;
