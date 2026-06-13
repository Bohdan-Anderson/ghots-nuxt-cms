# Example: blog with posts list

A simple blog page: page title + intro, then a repeatable list of posts (title, excerpt, body). Editors add/remove posts from the sidebar.

Not a full blog engine — no tags, pagination, or dynamic routes. One CMS page (e.g. `/blog`) with an **array** of posts. Good for “latest news” or a small blog index.

## Structure

```text
Page (template: blog)
├── title          plain_text   (page-level)
├── intro          richtext     (page-level)
└── slice: post-list
    └── posts      array
        ├── title      plain_text
        ├── excerpt    plain_text
        └── body       richtext
```

## 1. Template schema (DB)

```sql
insert into templates (key, label, field_schema)
values (
  'blog',
  'Blog index',
  '[
    {"name":"title","type":"plain_text","default":"Blog"},
    {"name":"intro","type":"richtext","default":"Latest updates."}
  ]'::jsonb
);
```

## 2. Slice registry

```ts
// app/slices/registry.ts — add to SLICE_DEFINITIONS / SLICE_COMPONENTS
postList: {
  key: 'post-list',
  label: 'Post list',
  fieldSchema: [
    {
      name: 'posts',
      type: 'array',
      children: [
        { name: 'title', type: 'plain_text', default: 'Untitled' },
        { name: 'excerpt', type: 'plain_text', default: '' },
        { name: 'body', type: 'richtext', default: '' },
      ],
    },
  ],
},
```

## 3. Slice component

```vue
<!-- app/slices/PostListSlice.vue -->
<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{ fields: FieldRow[]; sliceId: string }>()

const posts = computed(() =>
  resolveArrayItems(props.fields, 'posts', props.sliceId),
)

function postField(itemFields: FieldRow[], name: string): FieldRow | undefined {
  return itemFields.find((row) => row.name === name)
}
</script>

<template>
  <section class="post-list">
    <article
      v-for="(itemFields, index) in posts"
      :key="itemFields[0]?.parent_id ?? index"
      class="post-card"
    >
      <h3>{{ postField(itemFields, 'title')?.value }}</h3>
      <p class="excerpt">{{ postField(itemFields, 'excerpt')?.value }}</p>
      <CmsRichText
        v-if="postField(itemFields, 'body')"
        :field="postField(itemFields, 'body')!"
      />
    </article>
  </section>
</template>
```

## 4. Blog template

```vue
<!-- app/templates/BlogPage.vue -->
<script setup lang="ts">
import type { FieldRow, PageSliceRow } from '~/types/cms'
import { resolveSliceComponent } from '~/slices/registry'

defineProps<{
  pageFields: FieldRow[]
  slices: PageSliceRow[]
  fieldsBySliceId: Record<string, FieldRow[]>
}>()
</script>

<template>
  <main>
    <h1 :data-name="'title'">
      {{ resolveField(pageFields, 'title')?.value }}
    </h1>
    <CmsRichText
      v-if="resolveField(pageFields, 'intro')"
      :field="resolveField(pageFields, 'intro')!"
      data-name="intro"
    />

    <component
      v-for="slice in slices"
      :key="slice.id"
      :is="resolveSliceComponent(slice.slice_type_key)"
      :slice-id="slice.id"
      :fields="fieldsBySliceId[slice.id] ?? []"
    />
  </main>
</template>
```

## 5. Create the page

In Supabase, create a page with slug `/blog` and template `blog`. Log in, open `/blog`, use the sidebar to **add slice → Post list**, then **add items** under `posts` for each blog entry.

## 6. Editor workflow

1. Edit page title and intro from the content tree or by clicking on page.
2. Under **Post list → posts**, click **Add item** for each post.
3. Expand an item, click **title** / **excerpt** / **body** to open the modal.
4. Reorder or remove items from the sidebar.

## Variations

| Goal                    | Change                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| Featured image per post | Add `{ name: 'cover', type: 'image' }` to array children; render with `CmsImage` |
| Link-only posts         | Replace `body` with `{ name: 'url', type: 'link' }`                              |
| Separate URL per post   | Use multiple CMS pages instead of one array — better for long-running blogs      |

## Related

- [Field types § Array](../field-types.md#array)
- [Slices](../slices.md)
- [Templates](../templates.md)
