export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  extends: ['../../packages/nuxt-cms'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      cmsSiteKey: process.env.CMS_SITE_KEY ?? 'minimal',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
