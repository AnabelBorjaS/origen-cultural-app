-- Staging egujmptgnrpajgfpjjxu ONLY. Executed 9 Nov 2026: 10/10 PASS.
-- Effective table/column grants, including inherited privileges.
-- Read/delete grants here do NOT prove row ownership enforcement or a real
-- two-account lifecycle. No table data or privileges are modified.
BEGIN READ ONLY;
WITH checks(name,pass) AS (
VALUES
 ('authenticated_no_table_insert',NOT has_table_privilege('authenticated','public.cultural_posts','INSERT')),
 ('authenticated_no_column_insert',NOT has_any_column_privilege('authenticated','public.cultural_posts','INSERT')),
 ('authenticated_no_table_update',NOT has_table_privilege('authenticated','public.cultural_posts','UPDATE')),
 ('authenticated_no_column_update',NOT has_any_column_privilege('authenticated','public.cultural_posts','UPDATE')),
 ('anonymous_no_post_insert',NOT has_any_column_privilege('anon','public.cultural_posts','INSERT')),
 ('anonymous_no_post_update',NOT has_any_column_privilege('anon','public.cultural_posts','UPDATE')),
 ('authenticated_read_retained',has_table_privilege('authenticated','public.cultural_posts','SELECT')),
 ('authenticated_delete_retained',has_table_privilege('authenticated','public.cultural_posts','DELETE')),
 ('server_update_retained',has_table_privilege('service_role','public.cultural_posts','UPDATE')),
 ('client_cannot_create_legal_receipt',NOT has_any_column_privilege('authenticated','public.legal_acceptances','INSERT'))) SELECT name,pass FROM checks ORDER BY name;
ROLLBACK;
