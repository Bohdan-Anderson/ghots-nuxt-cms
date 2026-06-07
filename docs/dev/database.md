# Database

## Location

Migrations in [`packages/nuxt-cms/supabase/migrations/`](../../packages/nuxt-cms/supabase/migrations/) (copied in [`demo/supabase/migrations/`](../../demo/supabase/migrations/) for convenience):

| File | Purpose |
| ---- | ------- |
| `001_pages_fields.sql` | Templates, pages, fields (v1) |
| `002_slices_meta_globals.sql` | Meta columns, slices, globals, field ownership |
| `003_rls_hardening.sql` | Re-affirm RLS on all tables; ensure `fields` policies |
| `004_field_types_link_richtext.sql` | `link` + `richtext` field types |
| `005_images_arrays_storage.sql` | `image` + `array` types; `cms-media` storage bucket |
| `006_pages_delete.sql` | Authenticated page delete policy |
| `007_sites.sql` | Multi-site: `sites`, `site_members`, `site_id` columns, membership-gated writes |

Apply in order via Supabase SQL editor or CLI. See [`demo/supabase/README.md`](../../demo/supabase/README.md).

Design rationale: [ADR 002](./adr-002-content-model-v2.md).

## Multi-site model

One Supabase project can host multiple logical sites. Each Nuxt deployment declares **`CMS_SITE_KEY`** (runtime `cmsSiteKey`), which maps to `sites.key`.

| Table | Role |
| ----- | ---- |
| `sites` | Tenant registry (`key`, `label`) |
| `site_members` | Which auth users may edit which sites |

Content tables (`templates`, `pages`, `globals`) have a **`site_id`** FK. Slugs and template/global keys are unique **per site**, not globally.

Editors are granted access via manual SQL into `site_members` (see [supabase.md](../supabase.md)).

## Tables

### `sites`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `key` | text | Unique; matches `CMS_SITE_KEY` in each deployment |
| `label` | text | Human label |
| `created_at` | timestamptz | |

### `site_members`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `site_id` | uuid | FK → `sites` |
| `user_id` | uuid | FK → `auth.users` |

Primary key `(site_id, user_id)`. Authenticated users can read their own memberships; writes are manual (SQL dashboard) or service role.

### `templates`

Defines page types and **page-level field schema** (`field_schema`).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `site_id` | uuid | FK → `sites` |
| `key` | text | Unique per site; maps to Vue template (`default`, `slice-demo`, …) |
| `label` | text | Human label |
| `field_schema` | jsonb | Page-level field tree |

### `pages`

One row per site URL (within a CMS site).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `site_id` | uuid | FK → `sites` |
| `slug` | text | Unique per site; e.g. `/`, `/demo` |
| `template_id` | uuid | FK → `templates` |
| `title` | text | Internal / nav label |
| `meta_title` | text | `<title>` / OG (falls back to `title`) |
| `meta_description` | text | `<meta name="description">` |
| `og_image` | text | OG image URL |
| `noindex` | boolean | Default `false` |
| `created_at`, `updated_at` | timestamptz | |

### `page_slices`

Ordered slice instances on a page.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `page_id` | uuid | FK → `pages` (cascade delete) |
| `slice_type_key` | text | Maps to code registry |
| `sort_order` | int | Render / sidebar order |

### `globals`

Shared content regions (nav, footer, …).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `site_id` | uuid | FK → `sites` |
| `key` | text | Unique per site; maps to code registry |
| `label` | text | Human label |
| `created_at` | timestamptz | |

Note: global key `site` is the **site settings** region (nav label), not the tenancy table.

### `fields`

Content values. Each row belongs to **one owner**: page-level, slice instance, or global.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `page_id` | uuid | FK → `pages`; null for global fields |
| `slice_id` | uuid | FK → `page_slices`; null for page-level / global |
| `global_id` | uuid | FK → `globals`; null for page fields |
| `parent_id` | uuid | FK → `fields`; null = root within owner |
| `name` | text | Unique per `(page_id, slice_id, parent_id)` or `(global_id, parent_id)` |
| `type` | text | `section` \| `plain_text` \| `link` \| `richtext` \| `image` \| `array` |
| `value` | text | String for `plain_text`; JSON text for structured types |
| `sort_order` | int | Ordering among siblings |

**Constraints:** exactly one of `page_id` or `global_id` set; `slice_id` requires `page_id`.

## Seed data (after `007`)

Migration `007` truncates CMS data and re-seeds:

- Site **`demo`**: templates `default` + `slice-demo`, pages `/` + `/demo`, global `site`, demo slices/fields
- Site **`minimal`**: template `default`, page `/`

## Row Level Security

RLS enabled on all tables.

- **Read:** public (`using (true)`) on content tables and `sites`
- **Write:** requires `auth.uid()` in `site_members` for the row's site (via `cms_user_can_edit_site()` helper)
- **`fields` / `page_slices`:** site resolved through owning `pages` or `globals` row
- **Storage (`cms-media`):** public read; authenticated insert/update/delete (unchanged from `005`)

## Storage paths

CMS images: `{siteId}/{fieldId}/{uuid}{ext}` in bucket `cms-media`.

## TypeScript mirror

Domain types in `packages/nuxt-cms/app/types/cms.ts`. Site resolution in `useSite.ts`.

## Queries in the app

All site-owned reads/inserts filter by `site_id` from `useSite()` / `resolveSiteId()`.

| Composable / function | Query | Guest static cache |
| -------------------- | ----- | ------------------ |
| `usePageList` | `pages` → `slug, title` (scoped) | Yes |
| `usePageContent` | `pages` + `templates`, `page_slices`, `fields` (scoped) | Yes |
| `useGlobalData` | `globals` + `fields` (scoped) | Yes |
| `fetchTemplates` | `templates` (scoped) | Yes |
| `updateFieldValue` | `fields` UPDATE | Editor only |
| `uploadCmsImage` | Storage upload with site-prefixed path | Editor only |

See [Static generation](./static-generation.md) for `getCachedData` behavior.
