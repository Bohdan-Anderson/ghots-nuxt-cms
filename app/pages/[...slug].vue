<script lang="ts">
const data = {
  '/': {
    list: true,
    title: 'Home',
    description: 'Home page',
  },
  '/about': {
    list: true,
    title: 'About',
    description: 'About page',
  },
  '/contact': {
    list: true,
    title: 'Contact',
    description: 'Contact page',
  },
  '/404': {
    list: false,
    title: '404',
    description: '404 page',
  },
} as const

function isKeyOfData(key: string): key is keyof typeof data {
  return key in data
}
</script>

<script setup lang="ts">
const route = useRoute()

/**
 * Fetches page content. Runs at build time during `nuxt generate` and on the server for SSR.
 */
function fetchPageData(
  path: string,
): Promise<{ title: string; description: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(isKeyOfData(path) ? data[path] : data['/404'])
    }, 1000)
  })
}

// Blocks render until data resolves (prerender, SSR, and client navigation)
const { data: content, status } = await useAsyncData(
  () => `page:${route.path}`,
  () => fetchPageData(route.path),
)
</script>

<template>
  <nav>
    <!-- for each key in data, create a NuxtLink -->
    <NuxtLink
      v-for="[key, value] in Object.entries(data).filter(
        ([key, value]) => value.list,
      )"
      :key="key"
      :to="key"
      :class="{ 'router-link-active': route.path === key }"
    >
      {{ value.title }}
    </NuxtLink>
  </nav>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else>
    <h1>{{ content?.title }}</h1>
    <p>{{ content?.description }}</p>
  </div>
</template>
