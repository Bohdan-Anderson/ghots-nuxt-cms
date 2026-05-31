# Supabase setup

High-level checklist. You keep your Supabase project; the CMS uses Postgres, Auth, and Storage.

## 1. Create a project

Use the [Supabase dashboard](https://supabase.com/dashboard). Note the **Project URL** and **anon/public key**.

## 2. Run migrations

Apply the SQL files from the CMS package **`supabase/migrations/`** in numeric order (`001` → `005`). They create:

- Pages, templates, fields, slices, globals
- Row Level Security (public read, authenticated write)
- Storage bucket for images (later migrations)

Use the SQL editor or Supabase CLI — whichever you already use.

## 3. Environment variables

In your Nuxt app `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Nuxt reads these via `runtimeConfig.public` (see [Getting started](./getting-started.md)).

## 4. Auth for editors

Create at least one **email + password** user in Supabase Auth. That user can edit content when logged in at `/login`.

There is no roles system in v1 — any authenticated user can edit.

## 5. Storage (images)

If you use **image** fields, migrations configure a public `cms-media` bucket. No extra setup unless you change policies.

## What you do not need

- Custom API server — browser and build talk to Supabase directly
- Edge functions for basic editing
- Separate CMS database

## Security model (summary)

| Operation | Guest | Authenticated |
| --------- | ----- | ------------- |
| Read content | Yes (via anon key + RLS) | Yes |
| Write content | No | Yes |
| Static guest site | Uses prerender at build time — no runtime DB | — |

For table-level detail, see [contributor database notes](./dev/database.md).

## Next

[Getting started](./getting-started.md) — wire the Nuxt app.
