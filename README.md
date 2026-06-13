# ghots-nuxt-cms

Static-first Nuxt CMS backed by Supabase: prerendered pages for visitors, modal editing for authenticated users.

**Repository:** [github.com/Bohdan-Anderson/ghots-nuxt-cms](https://github.com/Bohdan-Anderson/ghots-nuxt-cms)

## Marking up editable content

Templates declare CMS fields with HTML attributes — no separate schema file required:

| Attribute | Purpose |
| --------- | ------- |
| `data-name` | Field key within its parent (`title`, `hero1`, `item_0`) |
| `data-type` | Node kind: `page`, `section`, `array`, or a leaf type (`plain_text`, `richtext`, `link`, `image`) |
| `data-id` | Stable UUID from the `fields` table (empty until an editor first loads the page) |
| `data-global` | On a wrapper only — scopes children to a shared global region |

```vue
<article data-type="page" :data-id="pageId">
  <h1
    data-name="title"
    data-type="plain_text"
    :data-id="titleField.id"
  >
    {{ cmsColumnValue(titleField, 'plain_text') }}
  </h1>
</article>
```

Resolve rows with `useCmsField(fieldsByParentAndName, parentId, name)`. Helper components (`CmsRichText`, `CmsLink`, `CmsImage`) set the same attributes automatically.

Full reference: **[docs/dom-markup.md](./docs/dom-markup.md)**

## Documentation

**[docs/README.md](./docs/README.md)** — consumer guides: install, templates, slices, field types, publish, examples.

**[docs/dev/](./docs/dev/)** — architecture and contributor docs.

Online: [github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs)

## Repository layout

| Path                                         | Purpose                        |
| -------------------------------------------- | ------------------------------ |
| [`packages/nuxt-cms/`](./packages/nuxt-cms/) | CMS Nuxt layer                 |
| [`demo/`](./demo/)                           | Reference demo site + E2E      |
| [`examples/minimal/`](./examples/minimal/)   | Minimal install smoke-test app |
| [`docs/`](./docs/)                           | Documentation                  |

## Quick start (demo)

```bash
npm install
cp demo/.env.example demo/.env   # Supabase keys
npm run dev                      # http://localhost:3000
```

Static preview: `npm run static` → http://localhost:8000

## Publish the npm package

The CMS layer is published as **`ghots-nuxt-cms`**. See [docs/dev/npm-publish.md](./docs/dev/npm-publish.md) for the release checklist.

```bash
cd packages/nuxt-cms
npm pack --dry-run   # inspect tarball
npm publish
```

## Scripts

| Command               | Description                |
| --------------------- | -------------------------- |
| `npm run dev`         | Demo dev server            |
| `npm run dev:minimal` | Minimal example dev server |
| `npm run generate`    | Static site → `demo/dist/` |
| `npm run static`      | Generate + serve locally   |
| `npm run test:unit`   | Vitest (package)           |
| `npm run test:e2e`    | Playwright (demo)          |
