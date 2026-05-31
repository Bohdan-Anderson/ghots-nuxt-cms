# Slices

**Slices** are reusable page sections — hero, CTA, team grid, FAQ block. Editors add, remove, and reorder them on a page; you define the types in code.

Same slice type can appear multiple times on one page.

## 1. Register a slice type

```ts
// app/slices/registry.ts
import type { Component } from 'vue'
import type { SliceTypeDefinition } from '~/types/cms'
import HeroSlice from '~/slices/HeroSlice.vue'

const SLICE_COMPONENTS: Record<string, Component> = {
  hero: HeroSlice,
}

const SLICE_DEFINITIONS: Record<string, SliceTypeDefinition> = {
  hero: {
    key: 'hero',
    label: 'Hero',
    fieldSchema: [
      { name: 'headline', type: 'plain_text', default: 'Hello' },
      { name: 'subhead', type: 'plain_text', default: '' },
    ],
  },
}

export function resolveSliceComponent(key: string) {
  return SLICE_COMPONENTS[key] ?? null
}

export function getSliceDefinition(key: string) {
  return SLICE_DEFINITIONS[key] ?? null
}

export function listSliceDefinitions() {
  return Object.values(SLICE_DEFINITIONS)
}
```

Export these from `app/cms/registries.ts`.

## 2. Slice Vue component

Each instance gets its own `fields` array and a stable `sliceId`:

```vue
<!-- app/slices/HeroSlice.vue -->
<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  fields: FieldRow[]
  sliceId: string
}>()

function field(name: string) {
  return resolveField(props.fields, name, undefined, props.sliceId)
}
</script>

<template>
  <section class="hero">
    <h2 :data-name="field('headline')?.name">{{ field('headline')?.value }}</h2>
    <p :data-name="field('subhead')?.name">{{ field('subhead')?.value }}</p>
  </section>
</template>
```

Pass `sliceId` as the fourth argument to `resolveField` so names are scoped to this instance.

## 3. Render slices in a template

```vue
<component
  v-for="slice in slices"
  :key="slice.id"
  :is="resolveSliceComponent(slice.slice_type_key)"
  :slice-id="slice.id"
  :fields="fieldsBySliceId[slice.id] ?? []"
/>
```

## 4. Editor workflow

Logged-in editors use the sidebar **Content** tab:

- **Add slice** — pick a type from your registry
- **Reorder** — move sections up/down
- **Remove** — delete an instance (fields cascade in DB)

Editors cannot invent new slice types — only you can, in code.

## 5. Field schema inside slices

Same field types as templates. Nested **arrays** work here (team members, FAQ items):

```ts
{
  key: 'faq',
  label: 'FAQ',
  fieldSchema: [
    { name: 'heading', type: 'plain_text', default: 'Questions' },
    {
      name: 'items',
      type: 'array',
      children: [
        { name: 'question', type: 'plain_text', default: '' },
        { name: 'answer', type: 'richtext', default: '' },
      ],
    },
  ],
}
```

Arrays are edited from the sidebar (add/remove items), not on the page canvas. See [Field types § Array](./field-types.md#array).

## Design guidelines

| Do | Avoid |
| -- | ----- |
| One slice = one visual section | Whole page in one slice |
| Stable `key` strings (`hero`, not `HeroV2`) | Renaming keys after content exists |
| Sensible defaults in `fieldSchema` | Empty schemas with no defaults |

## Next

- [Field types](./field-types.md)
- [Blog example](./examples/blog.md) — posts list with arrays
