-- Explorer composer preparation only.
-- This widens the purpose vocabulary; it does NOT grant INSERT/UPDATE access,
-- enable publication, or change the existing fail-closed staging RLS policy.
alter table public.cultural_posts
  drop constraint if exists cultural_posts_content_purpose_check;

alter table public.cultural_posts
  add constraint cultural_posts_content_purpose_check
  check (
    content_purpose is null
    or content_purpose = any (array[
      'education','history','technique','territory','language',
      'gastronomy','arts','heritage','community',
      'agent_discovery','explorer_experience'
    ])
  );
