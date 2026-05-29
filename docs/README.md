# ghots-cms documentation

A static-first Nuxt CMS: page content lives in Supabase, public visitors get prerendered HTML and cached payloads, and authenticated editors load live data and edit fields in a modal.

## How data loads (summary)

| Audience | Page content (`page:/slug`) | Nav (`page-list`) |
| -------- | ----------------------------- | ----------------- |
| Guest on **`npm run static`** | Prerendered HTML + `_payload.json` (no Supabase refetch if payload exists) | **Still fetches Supabase** on each load |
| Guest on **`npm run dev`** | Supabase every time (no static payload) | Supabase |
| Logged-in editor | Supabase (`getCachedData` bypassed) | Supabase |

Details: [Static generation](./static-generation.md), [Authentication](./authentication.md).

## Guides

| Document | Description |
| -------- | ----------- |
| [Vision](./vision.md) | Product goals, concepts, v1 scope, validation criteria |
| [Architecture](./architecture.md) | System overview, request flows, major decisions |
| [Directory structure](./directory-structure.md) | Where code lives and what each area does |
| [Routing and pages](./routing-and-pages.md) | Catch-all routes, slugs, login |
| [Static generation](./static-generation.md) | `nuxt generate`, prerender, payload caching |
| [Authentication](./authentication.md) | Supabase auth and fresh content for editors |
| [Database](./database.md) | Tables, RLS, migrations |
| [Content model](./content-model.md) | Pages, templates, fields, seeding |
| [Templates](./templates.md) | Vue page templates and field binding |
| [Modal editing](./inline-editing.md) | Click-to-edit modal flow and components |
| [CMS sidebar](./cms-sidebar.md) | Logged-in left panel, tabs, and page sync |
| [Publish workflow](./publish.md) | Draft vs guest, `publish:static`, deploy |
| [Development](./development.md) | Setup, env vars, scripts |
| [E2E testing](./e2e.md) | Playwright setup, test coverage, DB reset |

## Related

- [Supabase setup](../supabase/README.md) — migration and manual test checklist
