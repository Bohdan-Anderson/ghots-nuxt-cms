# CMS sidebar (logged-in)

When **`loggedIn`** is true, a fixed **left overlay** is always available: toggle with the **CMS** button, then use two tabs — **Page contents** and **Pages**.

Guests never see the sidebar (`v-if="loggedIn"` in `app.vue`).

## Components and composables

| File | Role |
| ---- | ---- |
| `app/components/CmsSidebar.vue` | Toggle, tabs, field tree, page links |
| `app/composables/useCmsPanel.ts` | Shared `isOpen`, `activeTab`, `pageContent`, `toggle`, `setPageContent` |
| `app/app.vue` | Renders `<CmsSidebar v-if="loggedIn" />` above `<NuxtPage />` |
| `app/pages/[...slug].vue` | Syncs current page data into `useCmsPanel` |

## Tabs

### Page contents

- Lists fields for the **current CMS page** in schema order (sections as labels, `plain_text` as buttons with a truncated preview).
- Clicking a **`plain_text`** row calls **`usePageEditor().open(field)`** — same modal as clicking `[data-name]` on the page.
- If there is no synced content (e.g. on `/login`), shows: “Open a page to see fields.”

### Pages

- Lists all rows from **`usePageList()`** (`slug`, `title`), same source as the top nav.
- **`NuxtLink`** to each slug; active route highlighted with `router-link-active`.
- Fetched once via `useAsyncData('cms-panel-page-list', …)` inside `CmsSidebar`.

## Syncing page data (`[...slug].vue` → panel)

The sidebar lives in **`app.vue`**, not under the page route, so the catch-all page **pushes** loaded content into shared state:

```ts
watchEffect(() => {
  const data = content.value
  const currentSlug = slug.value
  if (data?.page.slug === currentSlug) {
    setPageContent(data)
  } else if (data) {
    setPageContent(null)
  }
})
```

### Why the slug check?

`useAsyncData` can still hold the **previous page** in `content` until the new `page:${slug}` fetch finishes. Syncing without checking `data.page.slug === currentSlug` would show the wrong fields in the sidebar after navigation.

### Why not clear on `onUnmounted`?

Nuxt **Suspense** (from `await useAsyncData` in page setup) can **remount** the page component on the same URL. `onUnmounted` ran after a successful load and called `setPageContent(null)`, wiping the panel while still on e.g. `/about`.

Panel state is cleared when leaving CMS UI instead:

```ts
// app.vue — when navigating to login
watch(() => route.path, (path) => {
  if (path === '/login') setPageContent(null)
})
```

### Refetch behavior

- Do **not** add an extra `watch(slug) → refresh()` on mount (`prev` is `undefined` on first run and caused a redundant refetch / remount).
- Slug changes are handled by `useAsyncData` **`watch: [slug]`** on the dynamic key `` `page:${slug}` ``.
- While `content` is briefly `undefined` during refetch, the panel is **not** cleared (only stale *other-page* data clears via the `else if (data)` branch).

After a field save, `onFieldUpdated` patches `content`; the same object is in `pageContent`, so the sidebar preview updates without a full refresh.

## Styling

Minimal scoped CSS in `CmsSidebar.vue`: fixed panel (~`16rem`), slide via `transform: translateX`, plain tab buttons, no transitions or design system.

## Limitations (current)

- No create/delete page UI in the sidebar.
- Only **`plain_text`** fields are editable from the panel (same as inline clicks).
- Logged-in users still see **duplicate** page links in the top nav and the **Pages** tab (intentional for now).

## Related

- [Modal editing](./inline-editing.md) — shared `usePageEditor` / `FieldEditModal`
- [Authentication](./authentication.md) — when the sidebar appears
- [Routing and pages](./routing-and-pages.md) — catch-all and `useAsyncData` keys
