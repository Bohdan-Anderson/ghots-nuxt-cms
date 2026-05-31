<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useAuth()
const { applyPageContent } = useCmsPanel()

watch(
  () => route.path,
  (path) => {
    if (path === '/login') {
      applyPageContent(null)
    }
  },
)
</script>

<template>
  <CmsSidebar v-if="loggedIn" />
  <NuxtPage />
</template>
