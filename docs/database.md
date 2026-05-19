# Database

## Location

Schema and seed data: [`supabase/migrations/001_pages_fields.sql`](../supabase/migrations/001_pages_fields.sql).

Apply via Supabase SQL editor or CLI. See [`supabase/README.md`](../supabase/README.md).

## Tables

### `templates`

Defines page types and the **field schema** used to seed `fields`.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `key` | text | Unique; maps to Vue template (`default`, …) |
| `label` | text | Human label |
| `field_schema` | jsonb | Tree of `FieldSchemaNode` |

### `pages`

One row per site URL.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `slug` | text | Unique; e.g. `/`, `/about` |
| `template_id` | uuid | FK → `templates` |
| `title` | text | Optional; used in nav |
| `created_at`, `updated_at` | timestamptz | |

### `fields`

Actual content values for a page. Hierarchical via `parent_id`.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `page_id` | uuid | FK → `pages` (cascade delete) |
| `parent_id` | uuid | FK → `fields`; null = root |
| `name` | text | Unique per `(page_id, parent_id)` |
| `type` | text | `section` \| `plain_text` |
| `value` | text | Content for `plain_text` |
| `sort_order` | int | Ordering among siblings |

## Seed data

Migration inserts:

- Template **`default`** with schema: `title`, section `main` → `body`
- Page **`/`** (Home) using that template

## Row Level Security

RLS is **enabled** on all three tables.

| Table | anon | authenticated |
| ----- | ---- | ------------- |
| `templates` | SELECT | SELECT |
| `pages` | SELECT | SELECT, INSERT, UPDATE |
| `fields` | SELECT | SELECT, INSERT, UPDATE, DELETE |

Public site visitors use the **anon** role via the publishable key. Editors authenticate and use the **authenticated** role for writes.

Adjust policies before production if you need draft/published splits or per-page ACLs.

## TypeScript mirror

Domain types in `app/types/cms.ts` align with these tables plus joined shapes (`PageContent`, `FieldSchemaNode`).

## Queries in the app

| Composable / function | Query | Guest static cache |
| -------------------- | ----- | ------------------ |
| `usePageList` | `pages` → `slug, title` | No — always runs at runtime |
| `usePageContent` | `pages` + `templates(*)`, then `fields` | Yes when `getCachedData` hits (see [Static generation](./static-generation.md)) |
| `updateFieldValue` | `fields` UPDATE by `id` | Editor only |
| `seedFieldsFromSchema` | `fields` INSERT from `field_schema` | Editor only (logged in, zero fields) |
