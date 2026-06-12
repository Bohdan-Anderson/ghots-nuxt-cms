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

const { data: siteGlobal, refresh: refreshGlobal } = useGlobalData('site')

const siteNavLabel = computed(
  () =>
    cmsColumnValue(
      resolveGlobalField(siteGlobal.value?.fields ?? [], 'nav_label') ??
        emptyFieldRow('nav_label'),
      'plain_text',
    ) || 'Site',
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

function onGlobalFieldUpdated() {
  refreshGlobal()
}
</script>

<template>
  <GlobalEditorRegion
    :enabled="loggedIn"
    :global-content="siteGlobal"
    @field-updated="onGlobalFieldUpdated"
  >
    <nav
      data-global="site"
      :data-id="siteGlobal?.global.id ?? ''"
    >
      <strong
        data-name="nav_label"
        data-type="plain_text"
        :data-id="resolveGlobalField(siteGlobal?.fields ?? [], 'nav_label')?.id ?? ''"
      >{{ siteNavLabel }}</strong>
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
  </GlobalEditorRegion>

  <div v-if="status === 'pending'">Loading...</div>

  <div v-else-if="!content">
    <h1>404</h1>
    <p>Page not found.</p>
  </div>

  <PageEditorProvider
    v-else-if="templateComponent"
    :enabled="loggedIn"
    :fields-by-id="content.fieldsById"
    :fields-by-parent-and-name="content.fieldsByParentAndName"
    @field-updated="patchField"
  >
    <component
      :is="templateComponent"
      :page-id="content.page.id"
      :fields="content.fields"
      :fields-by-parent-and-name="content.fieldsByParentAndName"
    />
  </PageEditorProvider>

  <div v-else>
    <p>Unknown template.</p>
  </div>
</template>
