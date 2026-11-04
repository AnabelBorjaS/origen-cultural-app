drop policy if exists "claims own insert" on public.profile_claims;
create policy "claims own insert"
on public.profile_claims
for insert
to authenticated
with check (
  claimant_user_id = (select auth.uid())
  and authority_declaration = true
  and status = 'pending'::claim_status
  and reviewer_notes is null
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.cultural_profiles cp
    where cp.id = profile_claims.cultural_profile_id
      and cp.owner_id is null
      and cp.status = 'reference'::profile_status
  )
);

drop policy if exists "reports authenticated insert" on public.moderation_reports;
create policy "reports authenticated insert"
on public.moderation_reports
for insert
to authenticated
with check (
  reporter_user_id = (select auth.uid())
  and status = 'open'
  and resolved_at is null
);

revoke all on table public.profile_claims from anon;
revoke all on table public.moderation_reports from anon;
revoke all on table public.cultural_profiles from anon;
grant select on table public.cultural_profiles to anon;

revoke all on table public.profile_claims from authenticated;
grant select, insert, update on table public.profile_claims to authenticated;

revoke all on table public.moderation_reports from authenticated;
grant select, insert on table public.moderation_reports to authenticated;

revoke all on table public.cultural_profiles from authenticated;
grant select, insert, update, delete on table public.cultural_profiles to authenticated;
