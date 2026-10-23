-- ORIGEN Cultural — staging QA for proposed signup consent hook
-- THIS FILE IS FOR A SEPARATE STAGING PROJECT AFTER HOOK INSTALLATION.
-- SELECT ONLY: no writes, no user creation, no real personal data.
-- It verifies the function's policy logic; it does NOT prove that Supabase Auth
-- has been configured to call the hook on incoming signup attempts.
--
-- Expected final result: all 8 rows PASS and overall_pass = true.
-- Do not run against ORIGEN Cultural Production.

with examples(label,event,should_accept) as (
  values
    ('valid email signup',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,
      true),
    ('missing legal flag',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{},"is_anonymous":false}}'::jsonb,
      false),
    ('legal explicitly false',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":false},"is_anonymous":false}}'::jsonb,
      false),
    ('string true is not a boolean',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":"true"},"is_anonymous":false}}'::jsonb,
      false),
    ('numeric one is not a boolean',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":1},"is_anonymous":false}}'::jsonb,
      false),
    ('JSON null is not accepted',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":null},"is_anonymous":false}}'::jsonb,
      false),
    ('unsupported OAuth provider',
      '{"user":{"app_metadata":{"provider":"google"},"user_metadata":{"accepted_legal":true},"is_anonymous":false}}'::jsonb,
      false),
    ('anonymous signup is disabled',
      '{"user":{"app_metadata":{"provider":"email"},"user_metadata":{"accepted_legal":true},"is_anonymous":true}}'::jsonb,
      false)
),
decisions as (
  select label, should_accept,
    public.origen_before_user_created(event) = '{}'::jsonb as was_accepted
  from examples
)
select label,
  should_accept,
  was_accepted,
  (should_accept = was_accepted) as pass,
  bool_and(should_accept = was_accepted) over () as overall_pass
from decisions order by label;

-- Additional authenticated end-to-end tests (NOT covered by this SQL):
-- 1. Turn Auth > Hooks on in staging after reviewing permissions.
-- 2. POST a real consented signup via ORIGEN with email confirmation.
-- 3. Attempt direct API signup without, false, string true, numeric one flags;
--    all must be rejected without persisting any auth.users/profile rows.
-- 4. Check a successful signup creates one legal_acceptances row and stores
--    server-owned versions v1.2 even if client supplied a fabricated version.
-- 5. Confirm login, recovery, expired link, invitation handling.
-- 6. Confirm rollback by disabling the hook and restoring prior reviewed
--    trigger code in staging. A rollback is not itself an approval to GO.
