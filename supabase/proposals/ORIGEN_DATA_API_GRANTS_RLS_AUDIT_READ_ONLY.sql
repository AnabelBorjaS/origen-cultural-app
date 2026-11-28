-- ORIGEN Cultural | Read-only Data API GRANT + RLS regression audit
-- Baseline captured: 2026-10-09 (Production); 11 public tables, no Auth users.
-- Uses SELECT only. No writes, test accounts, secrets, or table contents.
-- Run in Supabase SQL Editor AFTER schema/privilege changes and before release.
--
-- PASS means only: known tables exist; RLS enabled; observed table privileges
-- match the explicitly reviewed baseline for anon and authenticated.
-- Does NOT validate the actual RLS policy semantics, Storage, function EXECUTE,
-- Supabase Auth hooks, consent enforcement, or cross-account data isolation.
-- A REVIEW result requires human investigation; never blindly GRANT access.
--
-- Review explicit GRANT statements for every new table/function or migration:
-- https://supabase.com/docs/guides/api/securing-your-api

WITH expected(table_name, anon_select, authenticated_select, authenticated_insert, authenticated_update, authenticated_delete) AS (
  VALUES
    ('profiles', TRUE, TRUE, FALSE, TRUE, FALSE),
    ('cultural_profiles', TRUE, TRUE, TRUE, TRUE, TRUE),
    ('cultural_posts', TRUE, TRUE, TRUE, TRUE, TRUE),
    ('profile_claims', FALSE, TRUE, TRUE, TRUE, FALSE),
    ('follows', FALSE, TRUE, TRUE, FALSE, TRUE),
    ('favorites', FALSE, TRUE, TRUE, FALSE, TRUE),
    ('post_likes', FALSE, TRUE, TRUE, FALSE, TRUE),
    ('post_comments', TRUE, TRUE, TRUE, TRUE, TRUE),
    ('moderation_reports', FALSE, TRUE, TRUE, FALSE, FALSE),
    ('legal_acceptances', FALSE, TRUE, FALSE, FALSE, FALSE),
    ('post_saves', FALSE, TRUE, TRUE, FALSE, TRUE)
), actual AS (
  SELECT
    e.table_name,
    c.oid,
    COALESCE(c.relrowsecurity, FALSE) AS rls_enabled,
    has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
    has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
    has_table_privilege('authenticated', c.oid, 'INSERT') AS authenticated_insert,
    has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_update,
    has_table_privilege('authenticated', c.oid, 'DELETE') AS authenticated_delete,
    e.anon_select AS expected_anon_select,
    e.authenticated_select AS expected_authenticated_select,
    e.authenticated_insert AS expected_authenticated_insert,
    e.authenticated_update AS expected_authenticated_update,
    e.authenticated_delete AS expected_authenticated_delete
  FROM expected e
  LEFT JOIN pg_namespace n ON n.nspname = 'public'
  LEFT JOIN pg_class c
    ON c.relnamespace = n.oid
   AND c.relname = e.table_name
   AND c.relkind = 'r'
)
SELECT
  table_name,
  CASE
    WHEN oid IS NOT NULL
     AND rls_enabled
     AND anon_select IS NOT DISTINCT FROM expected_anon_select
     AND authenticated_select IS NOT DISTINCT FROM expected_authenticated_select
     AND authenticated_insert IS NOT DISTINCT FROM expected_authenticated_insert
     AND authenticated_update IS NOT DISTINCT FROM expected_authenticated_update
     AND authenticated_delete IS NOT DISTINCT FROM expected_authenticated_delete
    THEN 'PASS'
    ELSE 'REVIEW'
  END AS grants_rls_status
FROM actual
ORDER BY table_name;
