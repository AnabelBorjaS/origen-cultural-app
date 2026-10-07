# ORIGEN Cultural — Database State

Production Supabase project: **ORIGEN Cultural Production**
Region: **ap-southeast-2 (Sydney)**
Status verified 7 October 2026: **ACTIVE_HEALTHY**

## Applied migrations

Production reports these migrations:

1. `20261006053729_initial_origen_beta_schema`
2. `20261006053813_harden_security_and_indexes`
3. `20261006072529_align_webapp_social_beta_model`
4. `20261006072749_record_legal_acceptance_at_signup`
5. `20261006080924_allow_personal_social_posts_and_video_media`
6. `20261006082339_abuse_prevention_rate_limits_and_content_bounds`
7. `20261007003848_add_cultural_post_purpose`
8. `20261007125206_protect_cultural_profile_privileged_fields`

## Security verification

As of 7 October 2026:
- Supabase Security Advisor: **0 active security lints**.
- RLS is enabled on ORIGEN public application tables.
- Storage ownership/type/size policies are present.
- Privileged cultural-profile fields are protected from owner self-modification.

## Repository sync rule

Database changes made in Production must be represented in GitHub before release. The newest privileged-field migration is stored under `supabase/migrations/`.

Older migrations predate this repository migration folder and remain recorded in Supabase's migration history. They should be pulled/reconstructed into repository migration files before the project moves to a mature multi-environment deployment workflow.

Do not treat the legacy root `schema.sql` as a complete representation of current Production.
