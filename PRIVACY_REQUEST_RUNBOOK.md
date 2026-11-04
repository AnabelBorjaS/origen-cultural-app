# ORIGEN Cultural — Privacy Request & Account Deletion Runbook

Status: **controlled-beta operational baseline**
Last reviewed: 8 October 2026
Public contact: `info.origencultural@gmail.com`

## Purpose

This runbook defines a safe manual process for access, correction and account-deletion requests during the controlled beta.

ORIGEN does **not** expose a destructive browser-side "delete my account now" action during this beta. Account deletion requires privileged Auth administration and must coordinate Supabase Storage, public cultural-profile data and database cascades.

This process is operational guidance, not jurisdiction-specific legal advice. Final retention periods, verification requirements and statutory response deadlines require proportional legal/privacy review before public launch.

## Public request route

A user may request:
- access to their personal data;
- correction of inaccurate personal data;
- account deletion / erasure;
- clarification about data held by ORIGEN.

Public channel:
`info.origencultural@gmail.com`

Where practical, ask the requester to write from the email associated with the ORIGEN account.

Do not ask users to publish identity documents, account evidence or personal information in GitHub issues or public community channels.

## Case handling

Maintain only the minimum case record needed to process and evidence the request.

The case record must not be committed to the public ORIGEN GitHub repository.

Record privately:
- request date/time;
- request type;
- account email / user ID after verification;
- verification method;
- actions taken;
- data intentionally retained and reason, if any;
- completion date;
- responder.

## Identity verification

Before disclosing, correcting or deleting account data:

1. confirm the request relates to an ORIGEN account;
2. prefer verification through the email already associated with the account;
3. if that is not possible, use a proportionate alternative without collecting unnecessary identity material;
4. escalate ambiguous/high-risk cases instead of guessing.

Never reveal whether unrelated third-party accounts exist.

## Account deletion sequence

### 1. Contain active access

Before deletion:
- ask the user to sign out where practical;
- invalidate/revoke active sessions through approved Auth administration when available;
- remember that deleting an Auth user does not necessarily invalidate an already-issued JWT immediately; tokens can remain valid until expiry.

### 2. Inventory the user's data

Identify the user ID and review:
- `profiles`;
- owned `cultural_profiles`;
- `cultural_posts`;
- `post_comments`;
- `post_likes`;
- `post_saves`;
- `follows`;
- `favorites`;
- `legal_acceptances`;
- `profile_claims`;
- `moderation_reports`;
- Storage objects in `avatars`, `covers` and `post-media`.

Do not copy personal records into public GitHub issues.

### 3. Delete owned Storage objects first

Supabase Auth user deletion can fail while the user still owns Storage objects.

Use the Supabase Storage API or approved dashboard tools—not direct SQL mutation of `storage.objects`—to remove user-owned files.

Verify:
- avatar objects removed;
- cover objects removed;
- post-media objects removed;
- no user-owned object remains in the managed buckets.

### 4. Review the Cultural Agent profile separately

Current schema behavior:
- `cultural_profiles.owner_id` becomes `NULL` when the owning `profiles` row is deleted.

Therefore deletion of Auth/profile does **not** by itself guarantee removal of public cultural-profile content.

Before deleting the Auth user, decide what happens to an owned Cultural Agent profile:

**Default privacy-safe choice for a personal/sole profile:** unpublish/remove personal contact/story data and delete the profile when appropriate.

**Reference-profile choice:** only preserve/revert a profile as an unclaimed reference when ORIGEN has an independent legitimate/editorial basis to keep non-personal cultural reference information. Remove account-derived personal contact data and do not imply continued endorsement/ownership.

**Organisational/community profile:** escalate for manual review when ownership may transfer to another authorised representative.

Record the decision privately.

### 5. Preserve only justified records

Do not retain personal data "just in case."

Some records may require limited retention when justified for:
- security/fraud investigation;
- active disputes;
- legal obligations;
- abuse/moderation evidence;
- establishment/exercise/defence of legal claims.

Retention decisions must be proportionate and reviewed under applicable legal/privacy requirements.

### 6. Delete the Supabase Auth user

Use approved Supabase Auth administration.

The current ORIGEN schema is designed so deletion of `auth.users` cascades to `profiles`, and downstream account-owned social data generally cascades through `profiles` / posts.

Current notable behavior:
- `profiles.id -> auth.users(id) ON DELETE CASCADE`;
- posts/comments/likes/saves/follows/favorites/legal acceptances/claims are cascaded through user/profile relationships;
- `moderation_reports.reporter_user_id` becomes `NULL`;
- `cultural_profiles.owner_id` becomes `NULL`, hence Step 4 is mandatory.

### 7. Verify deletion

After deletion, verify:
- Auth user no longer exists;
- public `profiles` row is gone;
- owned posts/comments/likes/saves/follows/favorites are gone as expected;
- claims tied to the claimant are gone as expected;
- legal-acceptance rows are gone as expected;
- moderation report content does not expose requester identity;
- managed Storage objects are gone;
- cultural profile outcome matches the Step 4 decision;
- public search/profile URLs no longer expose deleted personal data.

### 8. Confirm completion

Send the requester a concise completion confirmation through the verified private contact channel.

Do not include internal security details, other users' information or unnecessary retained evidence.

## Access / correction requests

For access:
- verify identity;
- export only data relating to the requester;
- exclude other users' private data and internal security/admin information;
- use a secure private delivery method.

For correction:
- correct user-editable profile data through the normal account flow where possible;
- privileged verification/ownership fields require ORIGEN admin review;
- log significant privileged corrections privately.

## Storage / backup caveat

Database backups do not restore or contain the physical Storage objects themselves.

A historical backup may contain data that was validly present when the backup was created. Any retention/deletion obligations for backups must be defined in the final legal/privacy retention policy before public launch.

## Security incident overlap

If a deletion/privacy request is connected to a suspected breach, fraud case or active security incident:
- follow `INCIDENT_RECOVERY_RUNBOOK.md`;
- preserve necessary evidence lawfully;
- do not destroy incident evidence simply because a deletion request exists;
- obtain legal/privacy advice where obligations conflict.

## Release test

Before Public Beta, run one controlled test-account lifecycle:

1. create test user;
2. upload avatar/cover/post media;
3. create allowed social interactions;
4. submit a claim/report where relevant;
5. process the deletion runbook;
6. verify Storage cleanup;
7. delete Auth user;
8. verify cascades and cultural-profile handling;
9. confirm no personal test data remains publicly visible.

Public Beta remains **NO-GO** if this controlled deletion lifecycle reveals a Critical/High privacy issue.
