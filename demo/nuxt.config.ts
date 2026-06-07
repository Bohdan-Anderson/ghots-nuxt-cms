// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  extends: ['../packages/nuxt-cms'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      cmsSiteKey: process.env.CMS_SITE_KEY ?? 'demo',
      /** Future CI webhook stub — not called in v1. */
      cmsPublishWebhookUrl: process.env.CMS_PUBLISH_WEBHOOK_URL ?? '',
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/demo'],
    },
  },
})
