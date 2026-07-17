---
name: Social network architecture
description: localStorage DB keys and Supabase-swap contract for ORIGEN's social features
---

## localStorage keys (DB abstraction in app.js)

| Key | Type | Purpose |
|-----|------|---------|
| `oc-users` | `{ [id]: User }` | All registered users |
| `oc-session` | `User \| null` | Current session |
| `oc-posts` | `Post[]` | User-created posts |
| `oc-likes` | `{ [postId]: userId[] }` | Post likes |
| `oc-comments` | `{ [postId]: Comment[] }` | Post comments |
| `oc-saves` | `{ [userId]: postId[] }` | Saved posts per user |
| `oc-follows` | `{ [userId]: targetId[] }` | Social follows (user or creator) |
| `origen-favorites` | `string[]` | Legacy: saved creator profiles |
| `origen-following` | `string[]` | Legacy: followed creator profiles |
| `origen-lang` | `'es' \| 'en'` | Language preference |

## User object shape
```js
{
  id, email, password, name, accountType ('creator'|'explorer'),
  location, story, categories: [], links: { instagram, facebook, tiktok, youtube, linkedin, whatsapp, email, web },
  avatar (base64 jpeg), cover (base64 jpeg), createdAt
}
```

## Post object shape
```js
{
  id, authorId (userId or creatorId), type ('photo'|'carousel'|'video'|'text'),
  media: [base64 or url], title, description, category, territory, tags: [],
  timestamp (ISO), likes (seed number, not used once real likes exist)
}
```

## Supabase swap plan
- `DB.users()` → `supabase.from('users').select()`
- `DB.session()` → `supabase.auth.getSession()`
- Images: base64 → `supabase.storage.from('avatars').upload()`
- Each DB method maps 1:1 to a Supabase query; no app logic changes needed.

**Why:** Architecture was designed explicitly for this swap — no business logic in DB layer.
