// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['./modules/localize-cms-images'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      /** Future CI webhook stub — not called in v1. */
      cmsPublishWebhookUrl: process.env.CMS_PUBLISH_WEBHOOK_URL ?? '',
    },
  },

  nitro: {
    output: {
      publicDir: 'dist',
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/demo'],
    },
  },

  routeRules: {
    '/**': {
      prerender: true,
    },
  },
})
