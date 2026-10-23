-- ORIGEN Cultural — video audio rights attestation
-- APPLIED TO ISOLATED SUPABASE STAGING ONLY on 2026-10-20.
-- Archive copy for review/reproducibility; do not apply to Production.
-- Supabase project: egujmptgnrpajgfpjjxu.
-- Requires legal review and authenticated adversarial QA before public beta.
begin;

alter table public.cultural_posts
  add column audio_rights_acknowledged boolean not null default false,
  add column audio_rights_source text,
  add column audio_attribution text;

alter table public.cultural_posts
  add constraint cultural_posts_audio_rights_shape
  check (
    (
      post_type = 'video'
      and is_editorial is false
      and audio_rights_acknowledged is true
      and audio_rights_source is not null
      and audio_rights_source = any (array['no_music','original','licensed','community_permission']::text[])
      and (audio_attribution is null or char_length(audio_attribution) <= 240)
      and (
        audio_rights_source not in ('licensed','community_permission')
        or (audio_attribution is not null and length(btrim(audio_attribution)) > 0)
      )
    )
    or (
      (post_type <> 'video' or is_editorial is true)
      and audio_rights_acknowledged is false
      and audio_rights_source is null
      and audio_attribution is null
    )
  );

alter table private.cultural_post_rights_events
  add column audio_rights_acknowledged boolean not null default false,
  add column audio_rights_source text,
  add column audio_rights_statement_version text,
  add column audio_attribution text;

alter table private.cultural_post_rights_events
  add constraint cultural_post_rights_events_audio_shape
  check (
    (
      audio_rights_acknowledged is false
      and audio_rights_source is null
      and audio_rights_statement_version is null
      and audio_attribution is null
    )
    or (
      audio_rights_acknowledged is true
      and audio_rights_source is not null
      and audio_rights_source = any (array['no_music','original','licensed','community_permission']::text[])
      and audio_rights_statement_version = 'v1.0'
      and (audio_attribution is null or char_length(audio_attribution) <= 240)
    )
  );

create or replace function private.record_cultural_post_rights()
returns trigger
language plpgsql
security definer
set search_path = ''
as $origen_rights_record$
begin
  if new.is_editorial is false then
    if auth.uid() is null or new.author_id is distinct from auth.uid() then
      raise exception 'ORIGEN cannot attest a publication for another user'
        using errcode = '42501';
    end if;

    if new.rights_acknowledged is distinct from true
       or new.cultural_acknowledged is distinct from true then
      raise exception 'ORIGEN requires both cultural publication declarations'
        using errcode = '23514';
    end if;

    if new.post_type = 'video' then
      if new.audio_rights_acknowledged is distinct from true
         or coalesce(new.audio_rights_source, '') not in ('no_music','original','licensed','community_permission')
         or (
           new.audio_rights_source in ('licensed','community_permission')
           and (new.audio_attribution is null or length(btrim(new.audio_attribution)) = 0)
         )
      then
        raise exception 'ORIGEN requires video audio rights declaration and credit where applicable'
          using errcode = '23514';
      end if;
    elsif new.audio_rights_acknowledged is distinct from false
       or new.audio_rights_source is not null
       or new.audio_attribution is not null
    then
      raise exception 'ORIGEN accepts audio declarations only for video posts'
        using errcode = '23514';
    end if;

    insert into private.cultural_post_rights_events (
      post_id, actor_id, event_type,
      rights_statement_version, cultural_statement_version,
      audio_rights_acknowledged, audio_rights_source,
      audio_rights_statement_version, audio_attribution
    ) values (
      new.id, new.author_id, 'declared', 'v1.2', 'v1.2',
      new.post_type = 'video',
      case when new.post_type = 'video' then new.audio_rights_source else null end,
      case when new.post_type = 'video' then 'v1.0' else null end,
      case when new.post_type = 'video' then new.audio_attribution else null end
    );
  end if;
  return new;
end;
$origen_rights_record$;

revoke all on function private.record_cultural_post_rights()
  from public, anon, authenticated;

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
       or new.audio_rights_acknowledged is distinct from old.audio_rights_acknowledged
       or new.audio_rights_source is distinct from old.audio_rights_source
       or new.audio_attribution is distinct from old.audio_attribution
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

commit;