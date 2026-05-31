# Database

## Location

Migrations in [`packages/nuxt-cms/supabase/migrations/`](../../packages/nuxt-cms/supabase/migrations/) (copied in [`demo/supabase/migrations/`](../../demo/supabase/migrations/) for convenience):

| File | Purpose |
| ---- | ------- |
| `001_pages_fields.sql` | Templates, pages, fields (v1) |
| `002_slices_meta_globals.sql` | Meta columns, slices, globals, field ownership |
| `003_rls_hardening.sql` | Re-affirm RLS on all tables; ensure `fields` policies |

Apply in order via Supabase SQL editor or CLI. See [`demo/supabase/README.md`](../../demo/supabase/README.md).

Design rationale: [ADR 002](./adr-002-content-model-v2.md).

## Tables

### `templates`

Defines page types and **page-level field schema** (`field_schema`).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `key` | text | Unique; maps to Vue template (`default`, `slice-demo`, …) |
| `label` | text | Human label |
| `field_schema` | jsonb | Page-level field tree |

### `pages`

One row per site URL.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `slug` | text | Unique; e.g. `/`, `/demo` |
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
| `key` | text | Unique; maps to code registry |
| `label` | text | Human label |
| `created_at` | timestamptz | |

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
| `type` | text | `section` \| `plain_text` \| `link` \| `richtext` |
| `value` | text | String for `plain_text`; JSON text for `link` / `richtext` (see [field-types.md](./field-types.md)) |
| `sort_order` | int | Ordering among siblings |

**Constraints:** exactly one of `page_id` or `global_id` set; `slice_id` requires `page_id`.

## Seed data

After both migrations:

- Template **`default`** + home **`/`** (unchanged from v1)
- Template **`slice-demo`** + demo **`/demo`** with two **`hero`** slices
- Global **`site`** with `nav_label` field

## Row Level Security

RLS enabled on all tables. Public **anon** read; **authenticated** write on pages, fields, page_slices, globals.

## TypeScript mirror

Domain types in `app/types/cms.ts`. Slice/global definitions in `app/slices/registry.ts`, `app/globals/registry.ts`.

## Queries in the app

| Composable / function | Query | Guest static cache |
| -------------------- | ----- | ------------------ |
| `usePageList` | `pages` → `slug, title` | Yes |
| `usePageContent` | `pages` + `templates`, `page_slices`, `fields` | Yes |
| `useGlobalData` | `globals` + `fields` | Yes |
| `updateFieldValue` | `fields` UPDATE | Editor only |
| `insertPageSlice` | `page_slices` INSERT + field seed | Editor only |
| `seedFieldsFromSchema` | `fields` INSERT | Editor only |

See [Static generation](./static-generation.md) for `getCachedData` behavior.
