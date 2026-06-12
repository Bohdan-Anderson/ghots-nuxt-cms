<script setup lang="ts">
const {
  content,
  status,
  templateComponent,
  patchField,
  loggedIn,
} = useCmsPage()
</script>

<template>
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
      :fields-by-parent-and-name="content.fieldsByParentAndName"
    />
  </PageEditorProvider>

  <div v-else>
    <p>Unknown template.</p>
  </div>
</template>
