-- Staging egujmptgnrpajgfpjjxu ONLY. Executed 9 Nov 2026: 11/11 PASS.
-- Evaluates the installed pure consent hook; creates no Auth users or receipts.
-- Administrative invocation does NOT prove Auth service role execution,
-- hook activation, email delivery or signup API end-to-end behavior.
BEGIN READ ONLY;
WITH cases(name,event,expected_allowed) AS (
VALUES
 ('email_boolean_consent', '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,true),
 ('missing_consent','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{},"is_anonymous":false}}'::jsonb,false),
 ('false_consent','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":false},"is_anonymous":false}}'::jsonb,false),
 ('string_consent','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":"true"},"is_anonymous":false}}'::jsonb,false),
 ('numeric_consent','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":1},"is_anonymous":false}}'::jsonb,false),
 ('null_consent','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":null},"is_anonymous":false}}'::jsonb,false),
 ('anonymous_signup','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":true}}'::jsonb,false),
 ('missing_anonymous_flag','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true}}}'::jsonb,false),
 ('oauth_signup','{"user":{"app_metadata":{"provider":"google"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,false),
 ('missing_provider','{"user":{"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,false),
 ('empty_event','{}'::jsonb,false)), evaluated AS MATERIALIZED (SELECT name,expected_allowed,public.origen_before_user_created(event) AS response FROM cases) SELECT name, CASE WHEN expected_allowed THEN response='{}'::jsonb ELSE response #>> '{error,http_code}'='403' END AS pass FROM evaluated ORDER BY name;
ROLLBACK;
