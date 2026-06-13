# Contributor & internal documentation

Consumers should start at the [main docs index](../README.md). For template markup, see **[DOM markup](../dom-markup.md)**.

## Product & architecture

| Document                                                    | Description                                  |
| ----------------------------------------------------------- | -------------------------------------------- |
| [Vision](./vision.md)                                       | Product goals, v1 scope, validation criteria |
| [Architecture](./architecture.md)                           | System overview, request flows               |
| [Content model](./content-model.md)                         | Pages, templates, sections, DOM markup       |
| [ADR 003 — DOM-first model](./adr-003-dom-first-content-model.md) | Wide columns, lazy ensure, no slices   |
| [Package extraction](./package-extraction.md)               | Layer boundary audit                         |

## Implementation

| Document                                        | Description                                 |
| ----------------------------------------------- | ------------------------------------------- |
| [Directory structure](./directory-structure.md) | Repo layout (`demo/`, `packages/nuxt-cms/`) |
| [Routing and pages](./routing-and-pages.md)     | Catch-all, slugs, login                     |
| [Static generation](./static-generation.md)     | Prerender, payload caching                  |
| [Authentication](./authentication.md)           | Supabase auth internals                     |
| [Database](./database.md)                       | Tables, RLS, migrations (detailed)          |
| [Field types (internal)](./field-types.md)      | Serialization, registry implementation      |
| [Modal editing](./inline-editing.md)            | Click delegation, components                |
| [CMS sidebar](./cms-sidebar.md)                 | Panel state, tabs                           |
| [Publish workflow (internal)](./publish.md)     | Implementation notes                        |
| [npm publish checklist](./npm-publish.md)       | First release of `ghots-nuxt-cms`           |

## Repo development

| Document                               | Description                    |
| -------------------------------------- | ------------------------------ |
| [Development](./development.md)        | Env, scripts, local workflows  |
| [E2E testing](./e2e.md)                | Playwright, DB reset, CI notes |
| [Templates (internal)](./templates.md) | Original template guide        |

## Layout

```text
docs/           ← consumer guides (getting started, templates, …)
docs/dev/       ← this folder
docs/examples/  ← consumer examples
```
