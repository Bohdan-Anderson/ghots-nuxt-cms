<script setup lang="ts">

const {
  route,
  content,
  status,
  pageList,
  templateComponent,
  patchField,
  loggedIn,
} = useCmsPage()

const { data: siteGlobal } = useGlobalData('site')

const siteNavLabel = computed(
  () =>
    resolveGlobalField(siteGlobal.value?.fields ?? [], 'nav_label')?.value ??
    'Site',
)

useHead(() => {
  const page = content.value?.page
  if (!page) return {}

  const title = page.meta_title ?? page.title ?? page.slug
  const meta: { name?: string; property?: string; content: string }[] = []

  if (page.meta_description) {
    meta.push({ name: 'description', content: page.meta_description })
  }
  if (page.og_image) {
    meta.push({ property: 'og:image', content: page.og_image })
  }
  if (page.noindex) {
    meta.push({ name: 'robots', content: 'noindex' })
  }

  return { title, meta }
})
</script>

<template>
  <nav>
    <strong>{{ siteNavLabel }}</strong>
    <NuxtLink
      v-for="page in pageList"
      :key="page.slug"
      :to="page.slug"
      :class="{ 'router-link-active': route.path === page.slug }"
    >
      {{ page.title ?? page.slug }}
    </NuxtLink>
    <NuxtLink to="/login">Login</NuxtLink>
  </nav>

  <div v-if="status === 'pending'">Loading...</div>

  <div v-else-if="!content">
    <h1>404</h1>
    <p>Page not found.</p>
  </div>

  <PageEditorProvider
    v-else-if="templateComponent"
    :enabled="loggedIn"
    :fields="content.fields"
    :fields-by-id="content.fieldsById"
    :fields-by-name="content.fieldsByName"
    @field-updated="patchField"
  >
    <component
      :is="templateComponent"
      :fields="content.fields"
      :page-fields="content.pageFields"
      :slices="content.slices"
      :fields-by-slice-id="content.fieldsBySliceId"
    />
  </PageEditorProvider>

  <div v-else>
    <p>Unknown template.</p>
  </div>
</template>
