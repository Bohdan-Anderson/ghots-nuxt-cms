# ghots-nuxt-cms

Add live-editable content to a static Nuxt site. You define templates and slices in Vue; editors change copy on the deployed site; guests get fast prerendered HTML.

```bash
npm install ghots-nuxt-cms @supabase/supabase-js
```

See **[Getting started](./getting-started.md)** for the full setup.

Full docs online: [github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs)

## How it works

| Who                  | What they see                                        |
| -------------------- | ---------------------------------------------------- |
| **Guest**            | Last published static build — no live database calls |
| **Logged-in editor** | Live content from Supabase; sidebar + modal to edit  |
| **You (developer)**  | Templates, slices, and field schemas in code         |

**Publish** rebuilds the static site so guests catch up with editor changes.

## Start here

New project → follow **[Getting started](./getting-started.md)** end to end.

Already have a static Nuxt site → **[Adopting an existing site](./adopting-an-existing-site.md)**.

## Guides

| Guide                           | When to read                             |
| ------------------------------- | ---------------------------------------- |
| [Supabase setup](./supabase.md) | Connect your project (high level)        |
| [Templates](./templates.md)     | Page layouts and page-level fields       |
| [Slices](./slices.md)           | Reusable page sections                   |
| [Field types](./field-types.md) | Text, links, rich text, images, arrays   |
| [Globals](./globals.md)         | Shared nav, footer, site settings        |
| [Publishing](./publishing.md)   | Draft vs guest, generate, deploy         |
| [Editing UX](./editing.md)      | What editors see (sidebar, modal, login) |

## Examples

Practical patterns — self-contained snippets, no repo required:

| Example                                    | Shows                                  |
| ------------------------------------------ | -------------------------------------- |
| [Blog with posts list](./examples/blog.md) | Arrays + text fields for a simple blog |

## Reference

This repo also ships a working **[demo](../demo/)** site, a **[minimal example](../examples/minimal/)**, and **[contributor docs](./dev/README.md)** for architecture and internals.
