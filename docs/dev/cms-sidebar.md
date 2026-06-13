# CMS sidebar (logged-in)

When **`loggedIn`** is true, a fixed **left overlay** is always available: toggle with the **CMS** button. Four tabs — **Content**, **Pages**, **Meta**, and **Publish** (deployment instructions).

Guests never see the sidebar (`v-if="loggedIn"` in `demo/app/app.vue`).

## Components and composables

| File                                                         | Role                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `packages/nuxt-cms/app/components/CmsSidebar.vue`            | Toggle, tab routing                                                       |
| `packages/nuxt-cms/app/components/CmsSidebarContentsTab.vue` | Field tree, slices, add slice                                             |
| `packages/nuxt-cms/app/components/CmsSidebarPagesTab.vue`    | Page links, create page form                                              |
| `packages/nuxt-cms/app/components/CmsSidebarMetaTab.vue`     | Meta form, delete page                                                    |
| `packages/nuxt-cms/app/components/CmsPublishPanel.vue`       | Publish instructions + copy command (Publish tab)                         |
| `packages/nuxt-cms/app/composables/usePublish.ts`            | Publish command constant + optional webhook stub config                   |
| `packages/nuxt-cms/app/composables/useCmsPanel.ts`           | Shared `isOpen`, `activeTab`, `pageContent`, `toggle`, `applyPageContent` |
| `demo/app/app.vue`                                           | Renders `<CmsSidebar v-if="loggedIn" />` above `<NuxtPage />`             |
| `demo/app/pages/[...slug].vue`                               | Site nav + syncs current page data into `useCmsPanel` via `useCmsPage()`  |

## Publish tab

- Explains **draft vs published**: guests see last `dist/` build; editor saves are live in Supabase only.
- **Copy** button for `npm run publish:static` (alias for `nuxt generate`).
- Optional **`CMS_PUBLISH_WEBHOOK_URL`** — stub for future CI; not called in v1. See [Publish workflow](./publish.md).

## Tabs

### Content

- **Page fields** — nested tree from template schema (sections as labels, `plain_text` as buttons with truncated preview).
- **Slices** — one block per `page_slices` row: label from code registry, field tree inside, ↑/↓ reorder, × remove (confirm), title click scrolls to `[data-slice-id]` on canvas.
- **Add slice** — pick registered slice type, inserts instance + seeds fields (`usePageSlices` / `useCmsPageActions`).
- Field click: scroll/highlight on page + **`usePageEditor().open(field)`** for `plain_text` (same modal as `[data-name]` clicks).

### Pages

- Lists all rows from **`usePageListData()`** (`slug`, `title`), same source as the top nav.
- **Create page** — slug, title, template picker (`useTemplatesData`); unique slug enforced; navigates to new page on success.

### Meta

- Edits `pages` meta columns: title, meta_title, meta_description, og_image, noindex (slug read-only).
- Saves via **`usePageMeta`**; panel store + `<head>` update without full navigation.
- **Delete page** — removes the current page (cascades slices/fields); home `/` cannot be deleted.

## Syncing page data (`[...slug].vue` → panel)

The sidebar lives in **`demo/app/app.vue`**, not under the page route, so the catch-all page **pushes** loaded content into shared state via `useCmsPage()`:

```ts
watchEffect(() => {
  const data = content.value
  const currentSlug = slug.value
  if (data?.page.slug === currentSlug) {
    applyPageContent(data)
  } else if (data) {
    applyPageContent(null)
  }
})
```

### Why the slug check?

`useAsyncData` can still hold the **previous page** in `content` until the new `page:${slug}` fetch finishes. Syncing without checking `data.page.slug === currentSlug` would show the wrong fields in the sidebar after navigation.

### Why not clear on `onUnmounted`?

Nuxt **Suspense** (from `await useAsyncData` in page setup) can **remount** the page component on the same URL. `onUnmounted` ran after a successful load and called `applyPageContent(null)`, wiping the panel while still on e.g. `/about`.

Panel state is cleared when leaving CMS UI instead:

```ts
// demo/app/app.vue — when navigating to login
watch(
  () => route.path,
  (path) => {
    if (path === '/login') applyPageContent(null)
  },
)
```

### Refetch behavior

- Do **not** add an extra `watch(slug) → refresh()` on mount (`prev` is `undefined` on first run and caused a redundant refetch / remount).
- Slug changes are handled by `useAsyncData` **`watch: [slug]`** on the dynamic key `` `page:${slug}` ``.
- While `content` is briefly `undefined` during refetch, the panel is **not** cleared (only stale _other-page_ data clears via the `else if (data)` branch).

After a field save, `patchField` updates the panel store; sidebar and on-page preview stay in sync without a full refresh.

## Styling

Panel styles live in **`packages/nuxt-cms/app/assets/cms-panel.css`**, registered in the CMS layer `nuxt.config.ts`, so CSS is in the main bundle when the sidebar mounts client-side on static builds.

## Limitations (current)

- Logged-in users still see **duplicate** page links in the top nav and the **Pages** tab (intentional for now).

## Related

- [Modal editing](./inline-editing.md) — shared `usePageEditor` / `FieldEditModal`
- [Authentication](./authentication.md) — when the sidebar appears
- [Routing and pages](./routing-and-pages.md) — catch-all and `useAsyncData` keys
