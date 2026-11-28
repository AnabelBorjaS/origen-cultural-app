-- ORIGEN signup-consent proposal predicate only. READ-ONLY.
-- Test this against an isolated Supabase STAGING project. No users created.
-- This SQL reproduces the proposed hook decision but DOES NOT activate Auth.
-- NULL is an explicit FAIL instead of a silently skipped aggregate.
with cases(name,payload,expected) as (
 values
 ('email+true','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,true),
 ('missing','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{},"is_anonymous":false}}'::jsonb,false),
 ('false','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":false},"is_anonymous":false}}'::jsonb,false),
 ('string','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":"true"},"is_anonymous":false}}'::jsonb,false),
 ('numeric','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":1},"is_anonymous":false}}'::jsonb,false),
 ('null','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":null},"is_anonymous":false}}'::jsonb,false),
 ('oauth','{"user":{"app_metadata":{"provider":"google"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,false),
 ('anonymous','{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":true}}'::jsonb,false)
), results as (
 select name,expected,
  (payload #>> '{user,app_metadata,provider}' is not distinct from 'email'
   and payload #> '{user,user_metadata,accepted_legal}' is not distinct from 'true'::jsonb
   and payload #> '{user,is_anonymous}' is distinct from 'true'::jsonb) as actual
 from cases
)
select name,expected,actual,expected is not distinct from actual as pass,
bool_and(expected is not distinct from actual) over () as all_pass
from results order by name;
-- EXPECTED: 8 rows, all pass=true, all_pass=true.
-- This is only predicate semantics. Direct /auth/v1/signup negative tests are
-- mandatory after configuring the real Before User Created Auth hook.
