/** npm script editors run locally or in CI to rebuild static guest content. */
export const PUBLISH_STATIC_COMMAND = 'npm run publish:static'

/**
 * Publish workflow helpers for the CMS sidebar (v1: manual generate + deploy).
 */
export function usePublish() {
  const config = useRuntimeConfig()
  const webhookUrl = computed(
    () => config.public.cmsPublishWebhookUrl?.trim() ?? '',
  )
  const hasWebhookStub = computed(() => webhookUrl.value.length > 0)

  return {
    publishCommand: PUBLISH_STATIC_COMMAND,
    webhookUrl,
    hasWebhookStub,
  }
}
