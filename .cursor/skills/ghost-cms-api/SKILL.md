---
name: ghost-cms-api
description: >-
  CRUD for ghots CMS Supabase edge functions — list/create/delete pages and
  templates, fetch page JSON, merge (PUT) or replace (POST) page content.
  Use when scripting CMS content, calling cms-page/cms-pages/cms-templates,
  or when the user mentions ghots CMS API, edge functions, or site content ops.
---

# ghots CMS API

One skill for all edge-function operations. Use the bundled CLI — do not hand-roll curl/jq each time.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `scripts/cms-cli.mjs` | CLI — run this |
| `scripts/cms-api.mjs` | Importable client (`createCmsClient`, `buildWritePayload`, `formatJson`) |

Skill root: `.cursor/skills/ghost-cms-api/` (repo root)

```bash
CLI=.cursor/skills/ghost-cms-api/scripts/cms-cli.mjs
```

## Environment

Set in shell or pass `--env-file path/to/.env`:

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `VITE_SUPABASE_URL` or `SUPABASE_URL` | Yes | Project URL |
| `VITE_SUPABASE_ANON_KEY` or `ANON_KEY` | Yes | Gateway auth (not user auth) |
| `CMS_EDITOR_EMAIL` / `CMS_EDITOR_PASSWORD` | Writes | Site member in Supabase Auth |
| `E2E_EDITOR_EMAIL` / `E2E_EDITOR_PASSWORD` | Writes | Fallback aliases (ghots-cms demo) |
| `E2E_RECIPES_EDITOR_EMAIL` | Writes | Recipes-site editor email fallback |
| `CMS_SITE_KEY` | Default site | Override with `--site` |

**Site-specific editors:** use the email/password for a user in `site_members` for that site (e.g. `recipes` vs `demo`).

Edge functions must be deployed (`cms-page`, `cms-pages`, `cms-templates`). Full API reference: [reference.md](reference.md).

## Workflow

1. **Read skill + run CLI** — prefer `node $CLI …` over raw curl.
2. **GET needs no credentials** — list pages/templates, fetch page JSON.
3. **Writes need editor creds** — create/delete pages & templates; PUT/POST page content.
4. **Edit page content locally:**
   - `page get -o page.json`
   - Edit `page.json` (keep field `id`s for PUT merge)
   - `page put --file page.json` (merge) or `page post --file page.json` (replace all fields)
5. **Pretty JSON** — CLI always outputs formatted JSON; use `-o file.json` to save.

## Commands

```bash
# Pages
node $CLI pages list --site recipes
node $CLI pages create --site recipes --slug bohdan-test --template landing --title "Bohdan Test"
node $CLI pages delete --site recipes --page /bohdan-test

# Templates
node $CLI templates list --site recipes
node $CLI templates create --site demo --key my-template --label "My Template"
node $CLI templates delete --site demo --key my-template

# Single page content (nested fields tree)
node $CLI page get --site recipes --page / --env-file demo/.env -o page.json
node $CLI page put --site recipes --page /demo --file page.json --env-file demo/.env
node $CLI page post --site recipes --page /demo --file page.json --env-file demo/.env

# Build write payload (content + auth) without sending
node $CLI payload --file page.json --env-file demo/.env -o payload.json
```

## When to use PUT vs POST

| Method | CLI | Behavior |
| ------ | --- | -------- |
| PUT | `page put` | Merge — update meta, upsert fields by `id`, keep fields not in body |
| POST | `page post` | Replace — delete all fields, insert from `content.fields` |

Create a **new page row** with `pages create`, not `page post`.

## Programmatic use

```javascript
import { createCmsClient, loadConfig, formatJson } from './scripts/cms-api.mjs'

const client = createCmsClient(loadConfig(process.env))
const pages = await client.listPages('recipes')
const content = await client.getPage('recipes', '/demo')
await client.writePage('recipes', '/demo', content, 'merge')
console.log(formatJson(pages))
```

## Errors

API returns `{ "error": "message" }`. Common statuses: `401` bad password, `403` not in `site_members`, `404` unknown site/page/template, `409` duplicate slug or template in use.

## Out of scope

Globals, Storage image uploads, changing `template_id` on existing pages, Vue `TEMPLATE_MAP` registration.
