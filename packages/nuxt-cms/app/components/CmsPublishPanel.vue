<script setup lang="ts">
const { publishCommand, hasWebhookStub } = usePublish()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Copies the publish command to the clipboard for local or CI use.
 */
async function copyCommand() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(publishCommand)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<template>
  <section
    class="cms-publish-panel"
    aria-label="Publish"
  >
    <h2 class="cms-publish-panel-title">Publish</h2>
    <p class="cms-publish-panel-lead">
      Guests see the last published build. Edits you save are live for editors
      only until you rebuild and deploy.
    </p>
    <p class="cms-publish-panel-step">
      Run locally or in CI, then deploy <code>dist/</code>:
    </p>
    <div class="cms-publish-panel-command">
      <code>{{ publishCommand }}</code>
      <button
        type="button"
        @click="copyCommand"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <p class="cms-publish-panel-note">
      Build needs Supabase reachable with <code>VITE_SUPABASE_*</code> in
      <code>.env</code>.
    </p>
    <p
      v-if="hasWebhookStub"
      class="cms-publish-panel-future"
    >
      Webhook URL is configured for a future CI trigger (not wired yet).
    </p>
  </section>
</template>
