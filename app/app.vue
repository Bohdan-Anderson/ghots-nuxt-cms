<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useAuth()
const { setPageContent } = useCmsPanel()

/** Clear panel when leaving CMS pages (e.g. login); avoid onUnmounted — page can remount under Suspense. */
watch(
  () => route.path,
  (path) => {
    if (path === '/login') {
      setPageContent(null)
    }
  },
)
</script>

<template>
  <CmsSidebar v-if="loggedIn" />
  <NuxtPage />
</template>
