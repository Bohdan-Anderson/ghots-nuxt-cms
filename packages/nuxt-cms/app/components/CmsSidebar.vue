<script setup lang="ts">
const { isOpen, activeTab, toggle } = useCmsPanel()
</script>

<template>
  <button
    type="button"
    class="cms-sidebar-toggle"
    aria-label="Toggle CMS panel"
    @click="toggle"
  >
    CMS
  </button>

  <aside
    class="cms-sidebar"
    :class="{ 'cms-sidebar--open': isOpen }"
  >
    <div class="cms-sidebar-tabs">
      <button
        type="button"
        :aria-pressed="activeTab === 'contents'"
        @click="activeTab = 'contents'"
      >
        Content
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'pages'"
        @click="activeTab = 'pages'"
      >
        Pages
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'meta'"
        @click="activeTab = 'meta'"
      >
        Meta
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'publish'"
        @click="activeTab = 'publish'"
      >
        Publish
      </button>
    </div>

    <CmsSidebarContentsTab v-show="activeTab === 'contents'" />
    <CmsSidebarPagesTab v-show="activeTab === 'pages'" />
    <CmsSidebarMetaTab v-show="activeTab === 'meta'" />
    <div
      v-show="activeTab === 'publish'"
      class="cms-sidebar-body"
    >
      <CmsPublishPanel />
    </div>
  </aside>
</template>
