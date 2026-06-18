# ghots CMS edge function API reference

Canonical source in repo: `docs/dev/edge-function-cms-page.md`

## Functions

| Function | Reads | Writes |
| -------- | ----- | ------ |
| `cms-pages` | List pages | Create page, delete page |
| `cms-templates` | List templates | Create template, delete template |
| `cms-page` | Get page + nested fields | PUT merge, POST replace |

Base: `{SUPABASE_URL}/functions/v1/{function}`

Header: `Authorization: Bearer {ANON_KEY}`

Writes: `{ email, password, … }` in JSON body.

## cms-pages

| Method | Query | Body |
| ------ | ----- | ---- |
| GET | `site_key` | — |
| POST | `site_key` | `{ email, password, slug, template_key, title? }` |
| DELETE | `site_key`, `page` | `{ email, password }` |

## cms-templates

| Method | Query | Body |
| ------ | ----- | ---- |
| GET | `site_key` | — |
| POST | `site_key` | `{ email, password, key, label }` |
| DELETE | `site_key`, `template_key` | `{ email, password }` |

Creating a template only inserts the DB row — add a Vue component + `TEMPLATE_MAP` entry separately.

## cms-page

| Method | Query | Body |
| ------ | ----- | ---- |
| GET | `site_key`, `page` | — |
| PUT | `site_key`, `page` | `{ email, password, content }` |
| POST | `site_key`, `page` | `{ email, password, content }` |

`content` shape from GET:

```json
{
  "page": { "id", "slug", "template_id", "title", "meta_title", "meta_description", "og_image", "noindex" },
  "template": { "id", "key", "label", "field_schema" },
  "fields": [ { "id", "name", "kind", "plain_text", "richtext", "link", "image", "sort_order", "children?" } ]
}
```

Writable page meta: `title`, `meta_title`, `meta_description`, `og_image`, `noindex`. Do not change `slug`, `template_id`, or `id`.

Field tree rules:
- Root `fields` array ordered by `sort_order`
- Sections/arrays have `children`
- Array items named `item_0`, `item_1`, …
- Leaves omit `children`

## Deploy

```bash
npx supabase functions deploy cms-page cms-pages cms-templates \
  --workdir packages/nuxt-cms --use-api
```
