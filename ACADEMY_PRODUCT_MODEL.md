# Academia ORIGEN — Product Model

Status: future product architecture
Last updated: 6 October 2026

## Principle
Academia ORIGEN exists to strengthen Cultural Providers, not rank cultural authenticity. Training, credentials and institutional participation create professional development and trust without excluding providers who have not yet completed training.

## Actors

### Cultural Provider
A person, community, business or organisation that preserves, practices, teaches, shares or offers culture.

Public profile can include:
- identity and territory;
- cultural story and context;
- services / cultural offer;
- website and approved contact channels;
- social networks;
- cultural/educational photo and video feed;
- followers/following;
- verified training credentials and badges;
- links to credential verification pages.

### Educational / Impact Partner
University, school, institute, NGO, company or other approved institution participating as an ORIGEN Partner.

Public profile can include:
- institutional identity and verification;
- website and social networks;
- areas of expertise;
- courses, training, scholarships and programmes;
- cultural/educational/impact photo and video feed;
- followers/following;
- providers trained;
- programmes delivered;
- credentials issued;
- countries/communities reached;
- impact stories when authorised.

Partner impact metrics must be calculated from verified ORIGEN records and not manually self-declared.

### Cultural Explorer
A person who discovers, learns, follows, saves, contacts and, in future phases, may book or purchase cultural services.

## Social graph
ORIGEN uses one social graph across the ecosystem.

Allowed relationships:
- Explorer follows Cultural Provider.
- Explorer follows Partner.
- Cultural Provider follows another Cultural Provider.
- Cultural Provider follows Partner.
- Partner follows Cultural Provider.
- Partner follows another Partner where useful.

Following is mutual-capability, not automatically reciprocal.

## Feed rules

### Cultural Provider feed
The feed is primarily cultural and educational. Appropriate content includes:
- cultural knowledge and context;
- traditions, techniques and processes;
- photography and video;
- territory, language, history and identity;
- educational explanations;
- behind-the-scenes cultural work;
- responsible presentation of services within cultural context.

The feed should not become a generic discount/advertising channel.

### Partner feed
Partners may publish photos, videos, carousels and educational posts related to:
- training opportunities;
- cultural education and research;
- programme announcements;
- scholarships and access opportunities;
- educational resources;
- provider success stories with consent;
- community projects;
- institutional impact;
- cultural events and learning opportunities.

Partner feed content must still comply with ORIGEN Community Guidelines, Cultural Rights, consent and anti-spam rules.

## Academy flow
1. Partner has a verified institutional ORIGEN account.
2. Partner publishes a programme/course.
3. Cultural Provider submits an application.
4. Partner reviews and approves/rejects.
5. Approved provider receives a unique enrolment/access link or token.
6. Training may occur on the Partner's own LMS/platform or later inside ORIGEN.
7. Partner records completion.
8. Partner issues a credential/badge.
9. ORIGEN stores issuer, provider, title, issue date, status, evidence/reference and unique verification ID.
10. Credential appears on provider profile and can be independently verified.

## Credential integrity
Verification, training and cultural authority are distinct:
- Identity Verified = ORIGEN verified who controls the profile.
- Training Credential = a Partner verified completion of a programme.
- Cultural Authority = cannot be automatically granted by ORIGEN or a university.

Providers cannot self-issue training badges.
Partners cannot edit impact metrics directly.
Credentials may be active, expired or revoked with audit history.

## Future entities
- partner_profiles
- academy_programs
- academy_applications
- academy_enrolments
- academy_completions
- credentials
- credential_badges
- credential_issuers
- credential_events / audit log
- social_follows (actor-to-actor)
- partner_impact_metrics

## Design requirement
The same ORIGEN identity/account infrastructure should support web, PWA, Android and iOS. Academy features must reuse the same Supabase backend and must not create a second account system.
