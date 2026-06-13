# Authentication

## Provider

**Supabase Auth** with email and password (`signInWithPassword`).

## Configuration

Environment variables (see [Development](./development.md)):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Mapped in `demo/nuxt.config.ts` → `runtimeConfig.public`.

## Code map

| File                                               | Role                                        |
| -------------------------------------------------- | ------------------------------------------- |
| `packages/nuxt-cms/app/composables/useSupabase.ts` | `createClient()` singleton                  |
| `packages/nuxt-cms/app/composables/useAuth.ts`     | `user`, `loggedIn`, `signIn`, `signOut`     |
| `packages/nuxt-cms/app/plugins/supabase.client.ts` | `getSession()` on load; `onAuthStateChange` |
| `packages/nuxt-cms/app/pages/login.vue`            | Login form; logout when session exists      |

## Session state

- Stored in the Supabase client (browser persistence).
- Mirrored in Nuxt **`useState('auth-user')`** for reactivity.
- **`loggedIn`** is `computed(() => !!user.value)`.

The plugin is **client-only** (`.client.ts`): there is no cookie-based SSR session in this repo.

## Login page

`/login`:

- Email + password → `signIn` → redirect to `/`.
- **Log out** when already authenticated.

## Effect on page data

Auth controls **whether static payload is reused**, not whether routes are reachable.

### Page content (`page:${slug}`)

```ts
getCachedData(key, nuxtApp) {
  if (loggedIn.value) return undefined
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}
```

| State                              | Behavior                                                   |
| ---------------------------------- | ---------------------------------------------------------- |
| Logged out + payload exists        | Use prerender cache; **no** `usePageContent` Supabase call |
| Logged out + no payload (e.g. dev) | Fetch from Supabase                                        |
| Logged in                          | Always fetch Supabase; can **seed** empty fields           |

`watch(loggedIn, () => refresh())` in `useCmsPage()` refetches page content when the session changes.

### Navigation (`page-list`)

`usePageListData()` uses the same `getCachedData` + `loggedIn` bypass as page content. On a successful static deploy, guests should not call Supabase for nav.

## Editor-only behavior

When logged in:

1. **`CmsSidebar`** in `demo/app/app.vue` — toggleable left panel (field list + page list). See [CMS sidebar](./cms-sidebar.md).
2. `PageEditorProvider` `:enabled="loggedIn"` — pointer cursor and click delegation.
3. `FieldEditModal` — edit field values (from page clicks or sidebar).
4. `seedFieldsFromSchema` on first visit if the page has zero `fields` rows.

## Database permissions

RLS (see [Database](./database.md)):

- **SELECT** on `templates`, `pages`, `fields` — `anon` and `authenticated`
- **INSERT/UPDATE/DELETE** on `pages` and `fields` — **`authenticated` only**

## Security reminders

- The anon key is visible in the browser bundle.
- Do not put private data in fields unless RLS enforces access.
- Prerendered HTML in `dist/` is world-readable.
