# Globals

**Globals** are shared content regions — site name in the nav, footer blurb, social links. Defined once in code, edited like any other fields, available on every page.

## 1. Register a global

```ts
// app/globals/registry.ts
import type { GlobalDefinition } from '~/types/cms'

const GLOBALS = {
  site: {
    key: 'site',
    label: 'Site settings',
    fieldSchema: [
      { name: 'nav_label', type: 'plain_text', default: 'My Site' },
      { name: 'footer_text', type: 'plain_text', default: '© 2026' },
    ],
  },
}

export function getGlobalDefinition(key: string) {
  return GLOBALS[key] ?? null
}

export function listGlobalDefinitions() {
  return Object.values(GLOBALS)
}
```

Export from `app/cms/registries.ts`.

## 2. Load in a layout or page

```vue
<script setup lang="ts">
const { data: site } = useGlobalData('site')

const navLabel = computed(
  () => resolveGlobalField(site.value?.fields ?? [], 'nav_label')?.value ?? 'Site',
)
</script>

<template>
  <header>
    <strong>{{ navLabel }}</strong>
  </header>
</template>
```

`useGlobalData` and `resolveGlobalField` come from the CMS layer.

## 3. Guest vs editor

| Audience | Behavior |
| -------- | -------- |
| Logged-in editor | Live Supabase — changes show immediately |
| Guest | Values from last **`nuxt generate`** — update guests via [Publishing](./publishing.md) |

Globals are prerendered into the payload like page content.

## 4. Database

The first logged-in load seeds a `globals` row and field rows from your schema if they do not exist. You rarely insert globals manually.

## When to use globals vs page fields

| Use global | Use page field |
| ---------- | -------------- |
| Nav label, logo alt, footer | Page title, hero on one URL |
| Same on every page | Specific to one slug |

For repeating page sections, use [slices](./slices.md) instead.

## Next

[Editing UX](./editing.md) — how editors change global fields in the sidebar
