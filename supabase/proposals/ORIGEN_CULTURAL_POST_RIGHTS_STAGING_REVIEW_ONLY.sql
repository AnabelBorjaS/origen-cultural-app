-- ORIGEN Cultural — cultural publication rights, staged backend proposal
-- P0 #7. REVIEW ONLY FOR PRODUCTION. Already APPLIED IN ISOLATED STAGING
-- on 2026-10-09 under migration name staging_cultural_post_rights_atomic_record_test_only.
-- DO NOT REAPPLY to the same Staging project: this candidate is not idempotent.
-- Target used: ISOLATED Supabase Staging egujmptgnrpajgfpjjxu.
-- No Production application; pending independent Auth/RLS/Storage and legal review.
-- Do not put this under supabase/migrations until approved and staging-tested.
-- Drafted against read-only public.cultural_posts audit of 2026-10-09.
--
-- Contract: browser sends two explicit booleans in cultural_posts INSERT:
-- rights_acknowledged = true; cultural_acknowledged = true.
-- These represent USER DECLARATIONS, not independently verified cultural authority.
-- For non-editorial posts, both must be true, and a server-stamped, private
-- attestation event must be created in the same transaction.
--
-- Rollout dependency: Supabase staging schema must receive this proposal BEFORE
-- testing beta client posting; Production currently lacks these columns.
-- Do not roll out beta JS to production against the old schema.
--
-- Unresolved before approval:
-- * legal approval of exact v1.2 wording and data-retention/deletion period;
-- * legacy posts/editorial rules and moderation admin edit operations;
-- * separate staging + two-account adversarial tests + backups;
-- * full RLS/GRANT/storage safety and rollback review;
-- * future edit-and-reattest workflow (currently edits fail closed).
--
-- ARCHIVED STAGING-ONLY SQL CANDIDATE (already applied once; DO NOT RE-RUN):
begin;

-- Existing editorial content is exempt from USER attestation, not from rights
-- and moderation policies. New non-editorial posts must affirm both values.
alter table public.cultural_posts
  add column rights_acknowledged boolean not null default false,
  add column cultural_acknowledged boolean not null default false;

alter table public.cultural_posts
  add constraint origen_user_post_rights_explicit
  check (
    is_editorial is true
    or (rights_acknowledged is true and cultural_acknowledged is true)
  );

-- Internal evidence only; no personal images/ID cards or secret cultural
-- knowledge stored. post_id is intentionally not a foreign key so that a
-- removed post can still be referenced in a restricted audit event. Decide
-- lawful retention and erasure in privacy review before adopting.
create table private.cultural_post_rights_events (
  id bigint generated always as identity primary key,
  post_id uuid not null,
  actor_id uuid not null,
  event_type text not null check (event_type in ('declared')),
  rights_statement_version text not null,
  cultural_statement_version text not null,
  declared_at timestamptz not null default now()
);

alter table private.cultural_post_rights_events enable row level security;
revoke all on table private.cultural_post_rights_events
  from public, anon, authenticated;
revoke all on sequence private.cultural_post_rights_events_id_seq
  from public, anon, authenticated;
-- No browser policies or grants: only the private audited trigger writes.

create or replace function private.record_cultural_post_rights()
returns trigger
language plpgsql
security definer
set search_path = ''
as $origen_rights_record$
begin
  if new.is_editorial is false then
    -- Author identity comes from the authenticated JWT, not from user JSON.
    -- Admin/service-side non-editorial imports must have a separate
    -- reviewed, identity-attributed procedure (do not bypass this check).
    if auth.uid() is null or new.author_id is distinct from auth.uid() then
      raise exception 'ORIGEN cannot attest a publication for another user'
        using errcode = '42501';
    end if;

    if new.rights_acknowledged is distinct from true
       or new.cultural_acknowledged is distinct from true then
      raise exception 'ORIGEN requires both cultural publication declarations'
        using errcode = '23514';
    end if;

    -- Legal versions are server-owned constants, NEVER copied from the user.
    -- Failure inserting this private record aborts the originating post too.
    insert into private.cultural_post_rights_events (
      post_id, actor_id, event_type,
      rights_statement_version, cultural_statement_version
    ) values (
      new.id, new.author_id, 'declared', 'v1.2', 'v1.2'
    );
  end if;
  return new;
end;
$origen_rights_record$;

revoke all on function private.record_cultural_post_rights()
  from public, anon, authenticated;

create trigger origen_post_rights_after_insert
after insert on public.cultural_posts
for each row execute function private.record_cultural_post_rights();

-- Fail-closed pending reviewed edit/re-attestation mechanics.
-- Engagement counter updates and is_published moderation changes remain
-- permissible because these do not alter post content/attestation claims.
create or replace function private.protect_cultural_post_rights_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $origen_rights_update$
begin
  if old.is_editorial is false
     and (
       new.rights_acknowledged is distinct from old.rights_acknowledged
       or new.cultural_acknowledged is distinct from old.cultural_acknowledged
       or new.title is distinct from old.title
       or new.body is distinct from old.body
       or new.post_type is distinct from old.post_type
       or new.image_url is distinct from old.image_url
       or new.media_urls is distinct from old.media_urls
       or new.category is distinct from old.category
       or new.tags is distinct from old.tags
       or new.territory is distinct from old.territory
       or new.content_purpose is distinct from old.content_purpose
       or new.cultural_profile_id is distinct from old.cultural_profile_id
     )
  then
    raise exception 'ORIGEN content edits require reviewed re-attestation; republish instead'
      using errcode = '42501';
  end if;
  return new;
end;
$origen_rights_update$;

revoke all on function private.protect_cultural_post_rights_on_update()
  from public, anon, authenticated;

create trigger origen_post_rights_before_update
before update on public.cultural_posts
for each row execute function private.protect_cultural_post_rights_on_update();

-- Preserve existing creator-only INSERT RLS, author/profile-ownership checks
-- and spam guard; do not loosen existing grants to anon/authenticated.
-- Review owners, privileges, triggers, legal retention and Security Advisor.
commit;

-- EXPECTED STAGING NEGATIVE TESTS (must execute with real Auth user tokens):
-- 1. Agent INSERT missing rights fields => 23514, 0 posts, 0 events.
-- 2. Agent INSERT false/null/one-only => rejected, 0 posts, 0 events.
-- 3. Agent INSERT both true => 1 post + 1 private event in one transaction.
-- 4. Forge author_id of user B while logged in as A => RLS rejection.
-- 5. Explorer INSERT both true => RLS rejection, 0 events.
-- 6. Agent swaps content/media after declaration via UPDATE => rejected.
-- 7. Attempt browser SELECT/INSERT/UPDATE/DELETE of private events => denied.
-- 8. Break audit insert deliberately within rollback-only staging transaction:
--    whole post INSERT must fail, without orphan post.
-- 9. Increment likes/comments and toggle is_published => still works.
-- 10. Delete own post => UI warns if public Storage files remain reachable;
--     private evidence retained only per approved retention/deletion policy.
-- 11. Existing editorial creation/imports and admin moderation operations
--     must be manually tested and reviewed before any real migration.
-- 12. Security Advisor, pg_policies, grants, exposed schemas and 2-user
--     cross-account RLS checks must all pass; production remains unchanged.
