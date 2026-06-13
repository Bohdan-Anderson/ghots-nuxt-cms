# Package extraction — boundary audit

Phase 7 plan for extracting **ghots-cms** into a reusable Nuxt layer (`ghots-nuxt-cms`). This document is the boundary audit: what moves into the package vs what stays in each consumer project.

See also [vision.md](./vision.md) § Portability and [todo.md](../../todo.md) Phase 7.

---

## Package vs consumer

| Layer                | Responsibility                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ghots-nuxt-cms`** | Editor UI, field-type system, Supabase composables, auth plugin, static-first defaults, image localization module, DB migrations (schema + RLS) |
| **Consumer project** | Templates, slice components + schemas, global region definitions, site layout/chrome, prerender route list, demo seed data                      |

---

## File inventory

### Package (`packages/nuxt-cms/`)

| Path                                                                            | Notes                                                       |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `packages/nuxt-cms/app/components/Cms*.vue`                                     | Sidebar, publish panel, field render helpers                |
| `packages/nuxt-cms/app/components/FieldEditModal.vue`, `PageEditorProvider.vue` | Modal + on-page click delegation                            |
| `packages/nuxt-cms/app/components/field-edit/*`                                 | Per-type modal editors                                      |
| `packages/nuxt-cms/app/composables/*`                                           | All except consumer `useTemplate.ts`                        |
| `packages/nuxt-cms/app/fields/registry.ts`, `schemaLookup.ts`                   | Field-type registry; schema lookup uses injected registries |
| `packages/nuxt-cms/app/types/cms.ts`, `fieldValues.ts`                          | Shared types                                                |
| `packages/nuxt-cms/app/utils/slug.ts`, `markdownToHtml.ts`, `sanitizeHtml.ts`   | Utilities                                                   |
| `packages/nuxt-cms/app/assets/cms-panel.css`                                    | Editor chrome styles                                        |
| `packages/nuxt-cms/app/plugins/supabase.client.ts`                              | Session restore                                             |
| `packages/nuxt-cms/app/pages/login.vue`                                         | Auth page (optional override in consumer)                   |
| `modules/nuxt-cms.ts`                                                           | Module entry: aliases, runtimeConfig, auto-imports          |
| `modules/localize-cms-images.ts`                                                | Prerender image localization                                |
| `server/utils/localizeCmsImages.ts`                                             | Nitro hook helper                                           |
| `supabase/migrations/*.sql`                                                     | Schema + RLS (generic)                                      |

### Consumer (`demo/` — reference app)

| Path                                                   | Notes                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `demo/app/templates/*.vue`                             | Page layout SFCs                                                          |
| `demo/app/composables/useTemplate.ts`                  | `TEMPLATE_MAP` → DB `templates.key`                                       |
| `demo/app/slices/*.vue`, `demo/app/slices/registry.ts` | Slice components + field schemas                                          |
| `demo/app/globals/registry.ts`                         | Global region definitions                                                 |
| `demo/app/cms/registries.ts`                           | **Required** — re-exports consumer registries for `#cms/registries` alias |
| `demo/app/pages/[...slug].vue`                         | Site nav, global chrome, wires `useCmsPage()`                             |
| `demo/nuxt.config.ts`                                  | `extends: ['../packages/nuxt-cms']`, site `prerender.routes`              |
| `demo/e2e/`                                            | Playwright specs for reference app                                        |
| `demo/supabase/`                                       | Migration copy for local dev                                              |

---

## Registry coupling (resolved)

Generic CMS code must **not** import `~/slices/registry` or `~/globals/registry` directly. Instead:

1. Consumer defines `app/cms/registries.ts` exporting template/slice/global resolvers.
2. `ghots-nuxt-cms` module sets alias `#cms/registries` → consumer file.
3. Package code imports from `#cms/registries`.

**Files that previously coupled to site registries:**

- `fields/schemaLookup.ts` → `#cms/registries`
- `composables/buildContentTree.ts` → `#cms/registries`
- `composables/usePageSlices.ts` → `#cms/registries`
- `composables/useGlobal.ts` → `#cms/registries`
- `components/CmsSidebar.vue` → `#cms/registries`

---

## SQL boundary

| Migration                                            | Package           | Consumer seed              |
| ---------------------------------------------------- | ----------------- | -------------------------- |
| `001`–`005` schema + RLS                             | ✅                | —                          |
| Home `/` baseline in `001`                           | ✅ (minimal demo) | Reference app may re-seed  |
| `/demo`, slice-demo template, `site` global in `002` | —                 | Reference app demo content |

For a fresh consumer: apply package migrations, then add own templates/pages via SQL or sidebar UI.

---

## Nuxt config split

**Package defaults** (`packages/nuxt-cms/nuxt.config.ts`):

- `runtimeConfig.public.supabaseUrl`, `supabaseAnonKey`, `cmsPublishWebhookUrl`
- `nitro.output.publicDir: 'dist'`
- `routeRules['/**'].prerender: true`
- Module: `ghots-nuxt-cms`

**Consumer overrides**:

- `nitro.prerender.routes` — site-specific URLs
- Optional: disable/replace login page, custom `app.vue` chrome

---

## Rename map (package)

| Reference app (legacy) | Package name |
| ---------------------- | ------------ |
| `useGhostPage`         | `useCmsPage` |

Other composable names (`useCmsPanel`, `usePageContent`, …) stay as-is.

---

## Consumer checklist

1. `npm install ghots-nuxt-cms` (or `extends: './packages/nuxt-cms'` during development)
2. Apply Supabase migrations from package
3. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Create `app/cms/registries.ts`
5. Add at least one template (`useTemplate.ts` + Vue SFC + DB row)
6. Optionally register slices/globals
7. Add `[...slug].vue` (or use reference app as template)
8. Configure `prerender.routes` for static pages
9. `npm run generate` → deploy `dist/`

Target: **&lt; 30 min** from empty Nuxt app to one editable page (Phase 7 validate).

---

## Open items

- [ ] Publish `ghots-nuxt-cms` to npm — package README, LICENSE, metadata, and `.npmignore` are ready; run `npm publish` from `packages/nuxt-cms/` after `npm login`
- [x] Add `repository` URL to `package.json` — [github.com/Bohdan-Anderson/ghots-nuxt-cms](https://github.com/Bohdan-Anderson/ghots-nuxt-cms)
- [ ] Rename project before public publish if desired (Ghost trademark — see vision.md; `ghots-nuxt-cms` is the current scoped name)
- [ ] Split demo seeds into reference-only migration
- [ ] CI smoke test: `examples/minimal/` installs package from npm and passes checklist
- [x] Update `docs/dev/directory-structure.md` for package + demo layout
- [x] Self-contained package README with install quickstart
- [x] Document required `CMS_SITE_KEY` / `cmsSiteKey` in getting started
