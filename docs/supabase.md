# Supabase setup

High-level checklist. You keep your Supabase project; the CMS uses Postgres, Auth, and Storage.

## 1. Create a project

Use the [Supabase dashboard](https://supabase.com/dashboard). Note the **Project URL** and **anon/public key**.

## 2. Run migrations

Apply the SQL files from the CMS package **`supabase/migrations/`** in numeric order (`001` → `007`). They create:

- Pages, templates, fields, slices, globals
- Multi-site tables (`sites`, `site_members`) and `site_id` scoping (migration `007`)
- Row Level Security (public read; writes require site membership)
- Storage bucket for images (migration `005`)

Use the SQL editor or Supabase CLI — whichever you already use.

**Migration `007` clears existing CMS data** and re-seeds the `demo` and `minimal` sites.

## 3. Environment variables

In your Nuxt app `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
CMS_SITE_KEY=demo
```

- **`CMS_SITE_KEY`** — which row in the `sites` table this deployment serves. Must match a seeded or manually created site key.
- Nuxt reads these via `runtimeConfig.public` (see [Getting started](./getting-started.md)).

## 4. Auth for editors

Create at least one **email + password** user in Supabase Auth. That user can log in at `/login`.

Editors can only **write** content for sites they belong to. Grant access manually:

```sql
insert into site_members (site_id, user_id)
select s.id, 'USER-UUID-HERE'
from sites s
where s.key = 'demo';
```

Replace `USER-UUID-HERE` with the user's id from Supabase Auth (Users table).

## 5. Storage (images)

If you use **image** fields, migrations configure a public `cms-media` bucket. Upload paths are `{siteId}/{fieldId}/{uuid}{ext}`.

## What you do not need

- Custom API server — browser and build talk to Supabase directly
- Edge functions for basic editing
- Separate CMS database

## Security model (summary)

| Operation | Guest | Authenticated member |
| --------- | ----- | -------------------- |
| Read content | Yes (all sites via anon key + RLS) | Yes |
| Write content | No | Yes, only for sites in `site_members` |
| Static guest site | Uses prerender at build time — no runtime DB | — |

Each deployment scopes **reads in the app** to its `CMS_SITE_KEY` site. RLS still allows cross-site reads if the anon key is used directly against the API.

For table-level detail, see [contributor database notes](./dev/database.md).

## Next

[Getting started](./getting-started.md) — wire the Nuxt app.
