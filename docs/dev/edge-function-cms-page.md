# CMS edge functions

Supabase Edge Functions for scripted CMS operations: list/create/delete pages and templates, fetch page JSON, edit locally, push changes back with curl or wget (no separate login step).

Canonical source: [`packages/nuxt-cms/supabase/functions/`](../../packages/nuxt-cms/supabase/functions/).

Functions: **`cms-page`** (single page content), **`cms-pages`** (page list + create/delete), **`cms-templates`** (template list + create/delete).

## Prerequisites

- Migrations applied through `011` (see [Supabase setup](../supabase.md))
- An editor user in Supabase Auth (email + password)
- That user in `site_members` for the target site:

```sql
insert into site_members (site_id, user_id)
select s.id, 'USER-UUID-HERE'
from sites s
where s.key = 'demo';
```

## Deploy

The edge functions ship inside the **`ghots-nuxt-cms`** package under `supabase/` (migrations + `functions/` + `config.toml`). Deploy them to **your** Supabase project — the same project your Nuxt app uses.

### Install the Supabase CLI

`supabase` in the commands below is **not** an npm dependency of `ghots-nuxt-cms`. It is [Supabase’s standalone CLI](https://supabase.com/docs/guides/cli) — a terminal program you install once on your machine to talk to your hosted Supabase project (deploy functions, run migrations, etc.).

**macOS (Homebrew):**

```bash
brew install supabase/tap/supabase
supabase --version   # should print a version, e.g. 2.x
```

**Other install options:** [Supabase CLI docs](https://supabase.com/docs/guides/cli/getting-started) (npm, Linux packages, etc.).

You do **not** need Docker for deploying these edge functions. Docker is only required if you run a full local Supabase stack (`supabase start`).

Then log in (opens a browser once):

```bash
supabase login
```

### Requirements

- Supabase CLI installed (see above)
- Logged in: `supabase login`
- Migrations already applied (function reads/writes the same tables as the CMS)

### From an installed app (`node_modules`)

After `npm install ghots-nuxt-cms`, run from your Nuxt app root:

```bash
# Link your Supabase project (once per machine / repo)
supabase link --project-ref YOUR_PROJECT_REF \
  --workdir node_modules/ghots-nuxt-cms

# Deploy (or redeploy after package updates)
npm run deploy:edge-functions --prefix node_modules/ghots-nuxt-cms
```

Or deploy individually: `deploy:cms-page`, `deploy:cms-pages`, `deploy:cms-templates`.

Add the same script to your app's `package.json` if you deploy often:

```json
{
  "scripts": {
    "deploy:edge-functions": "supabase functions deploy cms-page cms-pages cms-templates --workdir node_modules/ghots-nuxt-cms --use-api"
  }
}
```

Then: `npm run deploy:edge-functions` from your app root (after `supabase link` as above).

### From the monorepo / package source

If you develop against the repo directly:

```bash
cd packages/nuxt-cms
supabase link --project-ref YOUR_PROJECT_REF --workdir .
npm run deploy:edge-functions
```

Or without the npm script:

```bash
supabase functions deploy cms-page cms-pages cms-templates --workdir packages/nuxt-cms --use-api
```

### Notes

- **`YOUR_PROJECT_REF`** — the subdomain in `https://YOUR_PROJECT_REF.supabase.co` (Dashboard → Project Settings → General).
- Re-run deploy after upgrading `ghots-nuxt-cms` if the function source changed.
- `verify_jwt` is disabled for these functions so GET works without a user session. Writes authenticate via `email` + `password` in the request body.
- The editor user must be in `site_members` for the target site (e.g. a site-specific Auth user for `recipes` vs `demo`).

**Invocation header:** `Authorization: Bearer <SUPABASE_ANON_KEY>` — required by the Supabase gateway. This is **not** user auth.

**User auth (writes only):** `email` and `password` inside the JSON body (including `DELETE` requests).

## API

### List pages — `cms-pages`

**Base URL:** `{SUPABASE_URL}/functions/v1/cms-pages`

| Method | Query params | Body | Behavior |
| ------ | ------------ | ---- | -------- |
| `GET` | `site_key` | — | Return array of page rows for the site (no fields) |
| `POST` | `site_key` | `{ email, password, slug, template_key, title? }` | Create page (fields ensured lazily on first editor visit) |
| `DELETE` | `site_key`, `page` | `{ email, password }` | Delete page by slug (home page `/` cannot be deleted) |

**Example response:**

```json
[
  {
    "id": "...",
    "site_id": "...",
    "slug": "/",
    "template_id": "...",
    "title": "Home",
    "meta_title": null,
    "meta_description": null,
    "og_image": null,
    "noindex": false,
    "created_at": "2026-06-10T04:16:34.581784+00:00",
    "updated_at": "2026-06-10T04:16:34.581784+00:00"
  },
  {
    "id": "...",
    "site_id": "...",
    "slug": "/demo",
    "template_id": "...",
    "title": "Sections demo page",
    "meta_title": "Sections demo — ghots-cms",
    "meta_description": null,
    "og_image": null,
    "noindex": false,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

```bash
curl -s "$SUPABASE_URL/functions/v1/cms-pages?site_key=demo" \
  -H "Authorization: Bearer $ANON_KEY"
```

**Create page response:** created `PageRow` (HTTP `201`).

**Delete page response:**

```json
{ "deleted": true, "id": "...", "slug": "/my-page" }
```

### Templates — `cms-templates`

**Base URL:** `{SUPABASE_URL}/functions/v1/cms-templates`

| Method | Query params | Body | Behavior |
| ------ | ------------ | ---- | -------- |
| `GET` | `site_key` | — | Return array of template rows for the site |
| `POST` | `site_key` | `{ email, password, key, label }` | Create template (`field_schema` set to `[]`) |
| `DELETE` | `site_key`, `template_key` | `{ email, password }` | Delete template (fails with `409` if pages reference it) |

**Example response (GET):**

```json
[
  {
    "id": "...",
    "site_id": "...",
    "key": "recipe",
    "label": "Recipe",
    "field_schema": [],
    "created_at": "..."
  }
]
```

Creating a template via API only inserts the DB row. You must still add a matching Vue component and register it in `TEMPLATE_MAP` — otherwise the app shows "Unknown template."

**Delete template response:**

```json
{ "deleted": true, "id": "...", "key": "my-template" }
```

```bash
curl -s "$SUPABASE_URL/functions/v1/cms-templates?site_key=demo" \
  -H "Authorization: Bearer $ANON_KEY"
```

### Single page — `cms-page`

**Base URL:** `{SUPABASE_URL}/functions/v1/cms-page`

| Method | Query params | Body | Behavior |
| ------ | ------------ | ---- | -------- |
| `GET` | `site_key`, `page` | — | Return page JSON with nested `fields` tree |
| `PUT` | `site_key`, `page` | `{ email, password, content }` | Merge: update page meta; upsert fields by `id`; keep fields not in body |
| `POST` | `site_key`, `page` | `{ email, password, content }` | Replace: update page meta; delete all fields; insert from `content.fields` |

- `site_key` — row in `sites.key` (same as `CMS_SITE_KEY`, e.g. `demo`)
- `page` — page slug (e.g. `/`, `/demo`, `/about`)
- `content` — `{ page, template, fields }` from GET (same shape on write)

Note: `cms-page` `POST` replaces field content on an **existing** page. To create a new page row, use `cms-pages` `POST`.

## Response shape

```json
{
  "page": { "id", "slug", "template_id", "title", "meta_title", "meta_description", "og_image", "noindex", "created_at", "updated_at" },
  "template": { "id", "key", "label", "field_schema" },
  "fields": [
    {
      "id": "...",
      "name": "heading",
      "kind": null,
      "plain_text": "Surprisingly Good AI Recipes",
      "richtext": null,
      "link": null,
      "image": null,
      "sort_order": 0
    },
    {
      "id": "...",
      "name": "hero1",
      "kind": "section",
      "plain_text": null,
      "richtext": null,
      "link": null,
      "image": null,
      "sort_order": 1,
      "children": [
        {
          "id": "...",
          "name": "headline",
          "kind": null,
          "plain_text": "First hero headline",
          "sort_order": 0
        }
      ]
    },
    {
      "id": "...",
      "name": "team",
      "kind": "section",
      "sort_order": 4,
      "children": [
        { "id": "...", "name": "heading", "plain_text": "Our team", "sort_order": 0 },
        {
          "id": "...",
          "name": "members",
          "kind": "array",
          "sort_order": 1,
          "children": [
            {
              "id": "...",
              "name": "item_0",
              "kind": "section",
              "sort_order": 0,
              "children": [
                { "id": "...", "name": "name", "plain_text": "Alex Example", "sort_order": 0 },
                { "id": "...", "name": "photo", "image": "{\"url\":...}", "sort_order": 1 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

- **`fields`** — ordered array of root nodes. Each node is a full field row (`id`, `name`, `kind`, value columns, `sort_order`). No `parent_id` — tree position is implicit.
- **Sections / arrays** — include `children: [...]` (siblings ordered by `sort_order`).
- **Array items** — named `item_0`, `item_1`, … inside the array node's `children`.
- **Leaves** — omit `children`.

This shape is **edge-function only**. The Nuxt app (`useCmsPage`) still uses flat fields internally.

Writable page meta (from `content.page`): `title`, `meta_title`, `meta_description`, `og_image`, `noindex`. Do not change `slug`, `template_id`, or `id` via this API.

## Examples

Set env vars:

```bash
export SUPABASE_URL=https://xxx.supabase.co
export ANON_KEY=eyJ...
```

### curl

```bash
# GET page (no credentials)
curl -s "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo" \
  -H "Authorization: Bearer $ANON_KEY" -o page.json

# Edit page.json locally

# Build write payload (used by PUT/POST below)
jq -n \
  --arg email "editor@example.com" \
  --arg password "your-password" \
  --slurpfile content page.json \
  '{ email: $email, password: $password, content: $content[0] }' \
  > payload.json

# PUT — merge (update + add fields)
curl -s -X PUT "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d @payload.json -o response.json

# POST — full replace field content on existing page
curl -s -X POST "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d @payload.json -o response.json

# Create page
curl -s -X POST "$SUPABASE_URL/functions/v1/cms-pages?site_key=demo" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"your-password","slug":"/about","template_key":"default","title":"About"}'

# Delete page
curl -s -X DELETE "$SUPABASE_URL/functions/v1/cms-pages?site_key=demo&page=/about" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"your-password"}'

# List templates
curl -s "$SUPABASE_URL/functions/v1/cms-templates?site_key=demo" \
  -H "Authorization: Bearer $ANON_KEY"

# Create template
curl -s -X POST "$SUPABASE_URL/functions/v1/cms-templates?site_key=demo" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"your-password","key":"my-template","label":"My Template"}'

# Delete template
curl -s -X DELETE "$SUPABASE_URL/functions/v1/cms-templates?site_key=demo&template_key=my-template" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"your-password"}'
```

### wget

```bash
# GET page (no credentials)
wget -qO page.json \
  --header="Authorization: Bearer $ANON_KEY" \
  "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo"

# Edit page.json locally, then build payload.json (same jq one-liner as curl)

# PUT — merge
wget -qO response.json \
  --method=PUT \
  --header="Authorization: Bearer $ANON_KEY" \
  --header="Content-Type: application/json" \
  --body-file=payload.json \
  "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo"

# POST — full replace
wget -qO response.json \
  --method=POST \
  --header="Authorization: Bearer $ANON_KEY" \
  --header="Content-Type: application/json" \
  --body-file=payload.json \
  "$SUPABASE_URL/functions/v1/cms-page?site_key=demo&page=/demo"
```

## Errors

JSON `{ "error": "message" }` with HTTP status:

| Status | Meaning |
| ------ | ------- |
| `400` | Missing params, invalid JSON, invalid slug/key/field tree, delete home page |
| `401` | Wrong email or password |
| `403` | User not in `site_members` for the site |
| `404` | Unknown `site_key`, page, or template |
| `409` | Duplicate slug/key, template in use |
| `405` | Unsupported HTTP method |
| `500` | Unexpected database error |

## Out of scope

- Globals (`global_id` fields)
- Changing `template_id` on existing pages via `cms-page` PUT
- Image uploads to Storage
- Vue `TEMPLATE_MAP` auto-registration
