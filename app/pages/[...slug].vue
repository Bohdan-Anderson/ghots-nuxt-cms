<script setup lang="ts">
const {
  route,
  content,
  status,
  pageList,
  templateComponent,
  patchField,
  loggedIn,
} = useGhostPage()
</script>

<template>
  <nav>
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
    />
  </PageEditorProvider>

  <div v-else>
    <p>Unknown template.</p>
  </div>
</template>
